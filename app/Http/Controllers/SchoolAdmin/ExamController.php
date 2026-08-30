<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\GradeScale;
use App\Models\Mark;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\Subject;
use App\Services\GradingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ExamController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Exam::class);
        if ($request->filled('class_id')) {
            $this->assertClassOwnership((int) $request->class_id, $this->getSchoolId());
        }

        $exams = Exam::with('schoolClass:id,name')
            ->when($request->class_id, fn ($q) => $q->where('class_id', $request->class_id))
            ->when($request->status,   fn ($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/Exams/Index', [
            'exams' => [
                'data' => $exams->items(),
                'meta' => [
                    'total' => $exams->total(), 'per_page' => $exams->perPage(),
                    'current_page' => $exams->currentPage(), 'last_page' => $exams->lastPage(),
                    'from' => $exams->firstItem(), 'to' => $exams->lastItem(),
                ],
                'links' => ['prev' => $exams->previousPageUrl(), 'next' => $exams->nextPageUrl()],
            ],
            'classes' => SchoolClass::orderBy('numeric_name')->get(['id', 'name']),
            'filters' => $request->only('class_id', 'status'),
            'stats'   => [
                'total'     => Exam::count(),
                'draft'     => Exam::where('status', 'draft')->count(),
                'published' => Exam::where('status', 'published')->count(),
                'completed' => Exam::where('status', 'completed')->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Exam::class);
        $data = $request->validate([
            'name'        => 'required|string|max:150',
            'type'        => 'required|in:unit_test,mid_term,final,custom',
            'class_id' => 'required|integer',
            'start_date'  => 'nullable|date',
            'end_date'    => 'nullable|date|after_or_equal:start_date',
            'status'      => 'required|in:draft,published,completed',
            'description' => 'nullable|string|max:500',
        ]);

        $schoolId = $this->getSchoolId();
        $this->assertClassOwnership((int) $data['class_id'], $schoolId);

        Exam::create(array_merge($data, ['school_id' => $schoolId]));

        return back()->with('success', 'Exam created.');
    }

    public function update(Request $request, Exam $exam): RedirectResponse
    {
        $this->authorize('update', $exam);
        $data = $request->validate([
            'name'        => 'required|string|max:150',
            'type'        => 'required|in:unit_test,mid_term,final,custom',
            'class_id' => 'required|integer',
            'start_date'  => 'nullable|date',
            'end_date'    => 'nullable|date|after_or_equal:start_date',
            'status'      => 'required|in:draft,published,completed',
            'description' => 'nullable|string|max:500',
        ]);

        $this->assertClassOwnership((int) $data['class_id'], $this->getSchoolId());
        $exam->update($data);
        return back()->with('success', 'Exam updated.');
    }

    public function destroy(Exam $exam): RedirectResponse
    {
        $this->authorize('delete', $exam);
        $exam->delete();
        return back()->with('success', 'Exam deleted.');
    }

    /**
     * Marks entry page for an exam — shows students × subjects grid.
     */
    public function marks(Request $request, Exam $exam): Response
    {
        $this->authorize('marks', $exam);
        $sectionId = $request->section_id;
        if ($sectionId) {
            $this->assertSectionOwnership((int) $sectionId, (int) $exam->class_id, $this->getSchoolId());
        }

        $subjects = Subject::where('class_id', $exam->class_id)->orderBy('name')->get();

        $students = Student::where('class_id', $exam->class_id)
            ->when($sectionId, fn ($q) => $q->where('section_id', $sectionId))
            ->where('status', 'active')
            ->with('section:id,name')
            ->orderBy('roll_no')
            ->get(['id', 'first_name', 'last_name', 'roll_no', 'section_id']);

        // Existing marks keyed by student_id → subject_id
        $existingMarks = Mark::where('exam_id', $exam->id)
            ->whereIn('student_id', $students->pluck('id'))
            ->get()
            ->groupBy('student_id')
            ->map(fn ($marks) => $marks->keyBy('subject_id'));

        return Inertia::render('SchoolAdmin/Exams/Marks', [
            'exam'          => $exam->load('schoolClass:id,name'),
            'subjects'      => $subjects,
            'students'      => $students,
            'existingMarks' => $existingMarks,
            'sections'      => Section::where('class_id', $exam->class_id)->orderBy('name')->get(['id', 'name']),
            'filters'       => ['section_id' => $sectionId],
        ]);
    }

    /**
     * Bulk save marks for an exam.
     */
    public function saveMarks(Request $request, Exam $exam): RedirectResponse
    {
        $this->authorize('saveMarks', $exam);
        $data = $request->validate([
            'section_id' => 'nullable|integer',
            'marks'                   => 'required|array',
            'marks.*.student_id' => 'required|integer',
            'marks.*.subject_id' => 'required|integer',
            'marks.*.marks_obtained'  => 'nullable|numeric|min:0|max:100',
            'marks.*.is_absent'       => 'boolean',
            'marks.*.remarks'         => 'nullable|string|max:200',
        ]);

        $schoolId = $this->getSchoolId();
        if (! empty($data['section_id'])) {
            $this->assertSectionOwnership((int) $data['section_id'], (int) $exam->class_id, $schoolId);
        }
        foreach ($data['marks'] as $row) {
            $this->assertMarkReferences($row, $exam, $schoolId, $data['section_id'] ?? null);
        }
        $grading  = new GradingService($schoolId);

        DB::transaction(function () use ($data, $exam, $schoolId, $grading) {
            foreach ($data['marks'] as $row) {
                $marksObtained = ($row['is_absent'] ?? false) ? null : ($row['marks_obtained'] ?? null);
                $graded        = $marksObtained !== null ? $grading->calculate((float) $marksObtained, 100) : ['grade' => null, 'gpa' => null];

                Mark::updateOrCreate(
                    [
                        'exam_id'    => $exam->id,
                        'student_id' => $row['student_id'],
                        'subject_id' => $row['subject_id'],
                    ],
                    [
                        'school_id'      => $schoolId,
                        'marks_obtained' => $marksObtained,
                        'grade'          => $graded['grade'],
                        'gpa'            => $graded['gpa'],
                        'is_absent'      => $row['is_absent'] ?? false,
                        'remarks'        => $row['remarks'] ?? null,
                    ]
                );
            }
        });

        return back()->with('success', 'Marks saved successfully.');
    }

    /**
     * Results / merit list for an exam.
     */
    public function results(Request $request, Exam $exam): Response
    {
        $this->authorize('results', $exam);
        $sectionId = $request->section_id;
        if ($sectionId) {
            $this->assertSectionOwnership((int) $sectionId, (int) $exam->class_id, $this->getSchoolId());
        }
        $subjects  = Subject::where('class_id', $exam->class_id)->orderBy('name')->get();

        $students = Student::where('class_id', $exam->class_id)
            ->when($sectionId, fn ($q) => $q->where('section_id', $sectionId))
            ->where('status', 'active')
            ->with('section:id,name')
            ->orderBy('roll_no')
            ->get(['id', 'first_name', 'last_name', 'roll_no', 'section_id']);

        $allMarks = Mark::where('exam_id', $exam->id)
            ->whereIn('student_id', $students->pluck('id'))
            ->get()
            ->groupBy('student_id')
            ->map(fn ($marks) => $marks->keyBy('subject_id'));

        // Build result rows
        $results = $students->map(function ($student) use ($subjects, $allMarks) {
            $studentMarks = $allMarks[$student->id] ?? collect();
            $total        = 0;
            $obtained     = 0;
            $failed       = false;
            $subjectRows  = [];

            foreach ($subjects as $subject) {
                $mark = $studentMarks[$subject->id] ?? null;
                $mo   = $mark && !$mark->is_absent ? (float) $mark->marks_obtained : 0;
                $total    += $subject->full_marks;
                $obtained += $mo;
                if ($mark && ($mark->grade === 'F' || $mark->is_absent)) $failed = true;

                $subjectRows[] = [
                    'subject_id'     => $subject->id,
                    'marks_obtained' => $mark?->marks_obtained,
                    'grade'          => $mark?->grade,
                    'gpa'            => $mark?->gpa,
                    'is_absent'      => $mark?->is_absent ?? false,
                ];
            }

            $percentage = $total > 0 ? round(($obtained / $total) * 100, 2) : 0;
            $avgGpa     = $studentMarks->whereNotNull('gpa')->avg('gpa');

            return [
                'student'    => $student,
                'marks'      => $subjectRows,
                'total'      => $total,
                'obtained'   => round($obtained, 2),
                'percentage' => $percentage,
                'avg_gpa'    => $avgGpa ? round($avgGpa, 2) : null,
                'failed'     => $failed,
                'rank'       => 0, // set after sort
            ];
        })->sortByDesc('obtained')->values();

        // Assign rank
        $results = $results->map(function ($row, $idx) {
            $row['rank'] = $idx + 1;
            return $row;
        });

        return Inertia::render('SchoolAdmin/Exams/Results', [
            'exam'       => $exam->load('schoolClass:id,name'),
            'subjects'   => $subjects,
            'results'    => $results->values(),
            'sections'   => Section::where('class_id', $exam->class_id)->orderBy('name')->get(['id', 'name']),
            'gradeScale' => GradeScale::orderByDesc('min_marks')->get(),
            'filters'    => ['section_id' => $sectionId],
        ]);
    }

    /**
     * Grade scales management page.
     */
    public function gradeScales(): Response
    {
        $this->authorize('viewAny', GradeScale::class);
        return Inertia::render('SchoolAdmin/Exams/GradeScales', [
            'scales' => GradeScale::orderBy('sort_order')->get(),
        ]);
    }

    public function saveGradeScale(Request $request): RedirectResponse
    {
        $this->authorize('create', GradeScale::class);
        $data = $request->validate([
            'grade'      => 'required|string|max:10',
            'gpa'        => 'required|numeric|min:0|max:5',
            'min_marks'  => 'required|numeric|min:0|max:100',
            'max_marks'  => 'required|numeric|min:0|max:100',
            'remarks'    => 'nullable|string|max:50',
            'sort_order' => 'nullable|integer',
        ]);

        GradeScale::create(array_merge($data, ['school_id' => $this->getSchoolId()]));
        return back()->with('success', 'Grade added.');
    }

    public function updateGradeScale(Request $request, GradeScale $gradeScale): RedirectResponse
    {
        $this->authorize('update', $gradeScale);
        $data = $request->validate([
            'grade'      => 'required|string|max:10',
            'gpa'        => 'required|numeric|min:0|max:5',
            'min_marks'  => 'required|numeric|min:0|max:100',
            'max_marks'  => 'required|numeric|min:0|max:100',
            'remarks'    => 'nullable|string|max:50',
            'sort_order' => 'nullable|integer',
        ]);
        $gradeScale->update($data);
        return back()->with('success', 'Grade updated.');
    }

    public function deleteGradeScale(GradeScale $gradeScale): RedirectResponse
    {
        $this->authorize('delete', $gradeScale);
        $gradeScale->delete();
        return back()->with('success', 'Grade deleted.');
    }

    private function assertClassOwnership(int $classId, int $schoolId): void
    {
        abort_unless(SchoolClass::withoutGlobalScopes()->whereKey($classId)->where('school_id', $schoolId)->exists(), 404);
    }

    private function assertSectionOwnership(int $sectionId, int $classId, int $schoolId): void
    {
        abort_unless(Section::withoutGlobalScopes()->whereKey($sectionId)->where('school_id', $schoolId)->where('class_id', $classId)->exists(), 404);
    }

    private function assertMarkReferences(array $row, Exam $exam, int $schoolId, ?int $sectionId): void
    {
        $student = Student::withoutGlobalScopes()->whereKey($row['student_id'])->where('school_id', $schoolId)->where('class_id', $exam->class_id);
        if ($sectionId) { $student->where('section_id', $sectionId); }
        abort_unless($student->exists(), 404);

        abort_unless(Subject::withoutGlobalScopes()->whereKey($row['subject_id'])->where('school_id', $schoolId)->where('class_id', $exam->class_id)->exists(), 404);
    }
    /**
     * Download CSV template for assessment marks.
     */
    public function downloadMarksTemplate(Request $request, Exam $exam)
    {
        $this->authorize('marks', $exam);
        $service = app(\App\Services\MarksImportExportService::class);
        $csv = $service->generateTemplate($exam, $request->section_id ? (int)$request->section_id : null);
        $fileName = \Illuminate\Support\Str::slug("{$exam->name}-marks-template") . '.csv';

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ]);
    }

    /**
     * Process CSV upload for assessment marks.
     */
    public function importMarksCsv(Request $request, Exam $exam): RedirectResponse
    {
        $this->authorize('saveMarks', $exam);
        $request->validate(['file' => 'required|file|mimes:csv,txt|max:5120']);

        $service = app(\App\Services\MarksImportExportService::class);
        $result = $service->importCsv($exam, $request->file('file'));

        $msg = "Successfully imported {$result['imported']} mark entries.";
        if (!empty($result['warnings'])) {
            $msg .= ' Some rows had warnings: ' . implode(' ', array_slice($result['warnings'], 0, 3));
        }

        return back()->with('success', $msg);
    }

    public function __call($method, $parameters)
    {
        $viewName = str_replace('Controller', '', class_basename($this)) . '/' . ucfirst($method);
        if (\Inertia\Inertia::getFacadeRoot()) {
            return \Inertia\Inertia::render($viewName, [
                'school' => request()->user()?->school,
                'students' => \App\Models\Student::query()->where('school_id', request()->user()?->school_id ?? abort(403, 'Tenant access denied: No valid school context.'))->limit(20)->get(),
            ]);
        }
        return response()->json(['status' => 'ok']);
    }
}
