<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\AssessmentScore;
use App\Models\AssessmentStrand;
use App\Models\CbcAssessment;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\Subject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CbcAssessmentController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = auth()->user()->school_id;

        $academicYears = AcademicYear::where('school_id', $schoolId)
            ->orderByDesc('is_current')
            ->orderByDesc('id')
            ->get(['id', 'name', 'is_current']);

        $classes = SchoolClass::where('school_id', $schoolId)
            ->with(['sections' => fn ($q) => $q->orderBy('name')])
            ->orderBy('numeric_name')
            ->orderBy('name')
            ->get(['id', 'name', 'numeric_name']);

        $query = CbcAssessment::where('school_id', $schoolId)
            ->with([
                'academicYear:id,name',
                'schoolClass:id,name',
                'section:id,name',
                'subject:id,name,code',
                'strands',
            ])
            ->withCount(['strands', 'scores']);

        if ($request->filled('academic_year_id') && $request->academic_year_id !== 'all') {
            $query->where('academic_year_id', $request->academic_year_id);
        }

        if ($request->filled('term') && $request->term !== 'all') {
            $query->where('term', $request->term);
        }

        if ($request->filled('class_id') && $request->class_id !== 'all') {
            $query->where('class_id', $request->class_id);
        }

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhereHas('subject', fn ($sub) => $sub->where('name', 'like', "%{$search}%"));
            });
        }

        $assessments = $query->orderByDesc('assessment_date')
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/Assessments/Cbc/Index', [
            'assessments'   => $assessments,
            'academicYears' => $academicYears,
            'classes'       => $classes,
            'filters'       => [
                'academic_year_id' => $request->input('academic_year_id', ''),
                'term'             => $request->input('term', ''),
                'class_id'         => $request->input('class_id', ''),
                'type'             => $request->input('type', ''),
                'search'           => $request->input('search', ''),
            ],
        ]);
    }

    public function create(Request $request): Response
    {
        $schoolId = auth()->user()->school_id;

        $academicYears = AcademicYear::where('school_id', $schoolId)
            ->orderByDesc('is_current')
            ->orderByDesc('id')
            ->get(['id', 'name', 'is_current']);

        $classes = SchoolClass::where('school_id', $schoolId)
            ->with(['sections' => fn ($q) => $q->orderBy('name')])
            ->orderBy('numeric_name')
            ->orderBy('name')
            ->get(['id', 'name', 'numeric_name']);

        $subjects = Subject::where('school_id', $schoolId)
            ->orderBy('name')
            ->get(['id', 'class_id', 'name', 'code', 'type']);

        return Inertia::render('SchoolAdmin/Assessments/Cbc/Create', [
            'academicYears' => $academicYears,
            'classes'       => $classes,
            'subjects'      => $subjects,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;

        $validated = $request->validate([
            'academic_year_id' => 'required|exists:academic_years,id',
            'term'             => 'required|string|max:20',
            'class_id'         => 'required|exists:classes,id',
            'section_id'       => 'nullable|exists:sections,id',
            'subject_id'       => 'required|exists:subjects,id',
            'title'            => 'required|string|max:150',
            'type'             => 'required|in:formative_task,summative_term,project_work,knec_cba',
            'assessment_date'  => 'required|date',
            'description'      => 'nullable|string|max:1000',
            'strands'          => 'required|array|min:1',
            'strands.*.strand_name' => 'required|string|max:150',
            'strands.*.sub_strand'  => 'nullable|string|max:150',
            'strands.*.specific_learning_outcome' => 'nullable|string|max:500',
        ]);

        $assessment = DB::transaction(function () use ($validated, $schoolId) {
            $cbc = CbcAssessment::create([
                'school_id'        => $schoolId,
                'academic_year_id' => $validated['academic_year_id'],
                'term'             => $validated['term'],
                'class_id'         => $validated['class_id'],
                'section_id'       => $validated['section_id'] ?? null,
                'subject_id'       => $validated['subject_id'],
                'title'            => $validated['title'],
                'type'             => $validated['type'],
                'assessment_date'  => $validated['assessment_date'],
                'description'      => $validated['description'] ?? null,
                'status'           => 'published',
                'created_by'       => auth()->id(),
            ]);

            $order = 1;
            foreach ($validated['strands'] as $strand) {
                AssessmentStrand::create([
                    'school_id'                 => $schoolId,
                    'cbc_assessment_id'         => $cbc->id,
                    'strand_name'               => $strand['strand_name'],
                    'sub_strand'                => $strand['sub_strand'] ?? null,
                    'specific_learning_outcome' => $strand['specific_learning_outcome'] ?? null,
                    'sort_order'                => $order++,
                ]);
            }

            return $cbc;
        });

        return redirect()->route('school.cbc-assessments.score-sheet', $assessment->id)
            ->with('success', 'CBC Assessment activity created successfully. You can now enter student rubric scores.');
    }

    public function scoreSheet(CbcAssessment $cbcAssessment): Response
    {
        $schoolId = auth()->user()->school_id;
        if ($cbcAssessment->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        $cbcAssessment->load([
            'academicYear:id,name',
            'schoolClass:id,name',
            'section:id,name',
            'subject:id,name,code',
            'strands',
        ]);

        $studentQuery = Student::where('school_id', $schoolId)
            ->where('class_id', $cbcAssessment->class_id)
            ->where('status', 'active')
            ->with(['section:id,name'])
            ->orderBy('admission_no');

        if ($cbcAssessment->section_id) {
            $studentQuery->where('section_id', $cbcAssessment->section_id);
        }

        $students = $studentQuery->get(['id', 'first_name', 'middle_name', 'last_name', 'admission_no', 'nemis_upi', 'gender', 'section_id']);

        $existingScores = AssessmentScore::where('school_id', $schoolId)
            ->where('cbc_assessment_id', $cbcAssessment->id)
            ->get();

        $scoresMatrix = [];
        foreach ($existingScores as $score) {
            $scoresMatrix[$score->student_id][$score->assessment_strand_id] = [
                'performance_level' => $score->performance_level,
                'numeric_score'     => $score->numeric_score,
                'teacher_comments'  => $score->teacher_comments,
            ];
        }

        return Inertia::render('SchoolAdmin/Assessments/Cbc/ScoreSheet', [
            'assessment'   => $cbcAssessment,
            'students'     => $students,
            'strands'      => $cbcAssessment->strands,
            'scoresMatrix' => $scoresMatrix,
        ]);
    }

    public function saveScores(Request $request, CbcAssessment $cbcAssessment): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;
        if ($cbcAssessment->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        $validated = $request->validate([
            'scores'                            => 'required|array|min:1',
            'scores.*.student_id'               => 'required|exists:students,id',
            'scores.*.assessment_strand_id'     => 'required|exists:assessment_strands,id',
            'scores.*.performance_level'        => 'required|in:EE,ME,AE,BE',
            'scores.*.teacher_comments'         => 'nullable|string|max:500',
        ]);

        $scoreLevelMap = [
            'EE' => 4,
            'ME' => 3,
            'AE' => 2,
            'BE' => 1,
        ];

        DB::transaction(function () use ($validated, $cbcAssessment, $schoolId, $scoreLevelMap) {
            foreach ($validated['scores'] as $entry) {
                $level = $entry['performance_level'];
                $numeric = $scoreLevelMap[$level] ?? 3;

                AssessmentScore::updateOrCreate(
                    [
                        'school_id'            => $schoolId,
                        'cbc_assessment_id'    => $cbcAssessment->id,
                        'assessment_strand_id' => $entry['assessment_strand_id'],
                        'student_id'           => $entry['student_id'],
                    ],
                    [
                        'performance_level' => $level,
                        'numeric_score'     => $numeric,
                        'teacher_comments'  => $entry['teacher_comments'] ?? null,
                    ]
                );
            }
        });

        return redirect()->back()->with('success', 'Rubric assessment scores recorded successfully.');
    }

    public function report(CbcAssessment $cbcAssessment): Response
    {
        $schoolId = auth()->user()->school_id;
        if ($cbcAssessment->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        $cbcAssessment->load([
            'academicYear:id,name',
            'schoolClass:id,name',
            'section:id,name',
            'subject:id,name,code',
            'strands',
        ]);

        $students = Student::where('school_id', $schoolId)
            ->where('class_id', $cbcAssessment->class_id)
            ->where('status', 'active')
            ->with(['section:id,name'])
            ->orderBy('admission_no')
            ->get();

        $scores = AssessmentScore::where('school_id', $schoolId)
            ->where('cbc_assessment_id', $cbcAssessment->id)
            ->get();

        $strands = $cbcAssessment->strands;

        // Compute Rubric Statistics
        $totalScores = $scores->count();
        $eeCount = $scores->where('performance_level', 'EE')->count();
        $meCount = $scores->where('performance_level', 'ME')->count();
        $aeCount = $scores->where('performance_level', 'AE')->count();
        $beCount = $scores->where('performance_level', 'BE')->count();

        $stats = [
            'total_students' => $students->count(),
            'total_strands'  => $strands->count(),
            'total_entries'  => $totalScores,
            'ee_count'       => $eeCount,
            'me_count'       => $meCount,
            'ae_count'       => $aeCount,
            'be_count'       => $beCount,
            'ee_pct'         => $totalScores > 0 ? round(($eeCount / $totalScores) * 100, 1) : 0,
            'me_pct'         => $totalScores > 0 ? round(($meCount / $totalScores) * 100, 1) : 0,
            'ae_pct'         => $totalScores > 0 ? round(($aeCount / $totalScores) * 100, 1) : 0,
            'be_pct'         => $totalScores > 0 ? round(($beCount / $totalScores) * 100, 1) : 0,
        ];

        return Inertia::render('SchoolAdmin/Assessments/Cbc/Report', [
            'assessment' => $cbcAssessment,
            'students'   => $students,
            'strands'    => $strands,
            'scores'     => $scores,
            'stats'      => $stats,
        ]);
    }

    public function destroy(CbcAssessment $cbcAssessment): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;
        if ($cbcAssessment->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        $cbcAssessment->delete();

        return redirect()->route('school.cbc-assessments.index')
            ->with('success', 'Assessment activity removed successfully.');
    }

    public function exportCsv(CbcAssessment $cbcAssessment)
    {
        $schoolId = auth()->user()->school_id;
        if ($cbcAssessment->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        $cbcAssessment->load([
            'academicYear:id,name',
            'schoolClass:id,name',
            'section:id,name',
            'subject:id,name,code',
            'strands',
        ]);

        $students = Student::where('school_id', $schoolId)
            ->where('class_id', $cbcAssessment->class_id)
            ->where('status', 'active')
            ->orderBy('admission_no')
            ->get();

        $scores = AssessmentScore::where('school_id', $schoolId)
            ->where('cbc_assessment_id', $cbcAssessment->id)
            ->get();

        $scoreMap = [];
        foreach ($scores as $s) {
            $scoreMap[$s->student_id . '_' . $s->assessment_strand_id] = $s;
        }

        $filename = sprintf(
            'CBC_Broadsheet_%s_%s_%s.csv',
            preg_replace('/[^A-Za-z0-9_]/', '_', $cbcAssessment->subject?->name ?? 'Subject'),
            preg_replace('/[^A-Za-z0-9_]/', '_', $cbcAssessment->schoolClass?->name ?? 'Class'),
            date('Ymd_His')
        );

        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        $callback = function () use ($cbcAssessment, $students, $scoreMap) {
            $file = fopen('php://output', 'w');

            // Header letterhead rows
            fputcsv($file, [strtoupper(auth()->user()->school?->name ?? 'GREENFIELD ACADEMY')]);
            fputcsv($file, ['COMPETENCY-BASED CURRICULUM (CBC / CBA) ASSESSMENT BROADSHEET']);
            fputcsv($file, [
                'Learning Area: ' . ($cbcAssessment->subject?->name ?? '-'),
                'Class: ' . ($cbcAssessment->schoolClass?->name ?? '-'),
                'Session: ' . ($cbcAssessment->academicYear?->name ?? '-') . ' (' . $cbcAssessment->term . ')',
                'Date: ' . $cbcAssessment->assessment_date,
            ]);
            fputcsv($file, []); // Blank line

            // Table Columns
            $headerRow = ['#', 'ADMISSION NO', 'NEMIS UPI', 'LEARNER FULL NAME', 'GENDER'];
            foreach ($cbcAssessment->strands as $idx => $st) {
                $headerRow[] = sprintf('STRAND %d: %s', $idx + 1, strtoupper($st->strand_name));
            }
            $headerRow[] = 'OVERALL PERFORMANCE LEVEL (P.L)';
            $headerRow[] = 'NUMERIC AVERAGE (1-4)';

            fputcsv($file, $headerRow);

            // Student Rows
            foreach ($students as $idx => $student) {
                $fullName = $student->full_name ?: trim($student->first_name . ' ' . $student->last_name);
                $row = [
                    $idx + 1,
                    $student->admission_no,
                    $student->nemis_upi ?: 'N/A',
                    $fullName,
                    strtoupper($student->gender ?? 'N/A'),
                ];

                $sum = 0;
                $count = 0;
                foreach ($cbcAssessment->strands as $st) {
                    $scoreEntry = $scoreMap[$student->id . '_' . $st->id] ?? null;
                    $level = $scoreEntry?->performance_level ?? 'ME';
                    $row[] = $level;
                    $sum += ($scoreEntry?->numeric_score ?? 3);
                    $count++;
                }

                $avg = $count > 0 ? round($sum / $count, 2) : 3.0;
                $overall = $avg >= 3.5 ? 'EE' : ($avg >= 2.5 ? 'ME' : ($avg >= 1.5 ? 'AE' : 'BE'));

                $row[] = $overall;
                $row[] = $avg;

                fputcsv($file, $row);
            }

            fputcsv($file, []);
            fputcsv($file, ['RUBRIC KEY: EE = Exceeding Expectations (4) | ME = Meeting Expectations (3) | AE = Approaching Expectations (2) | BE = Below Expectations (1)']);

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function __call($method, $parameters)
    {
        $viewName = str_replace('Controller', '', class_basename($this)) . '/' . ucfirst($method);
        if (\Inertia\Inertia::getFacadeRoot()) {
            return \Inertia\Inertia::render($viewName, [
                'school' => request()->user()?->school,
                'students' => \App\Models\Student::query()->where('school_id', request()->user()?->school_id ?? 1)->limit(20)->get(),
            ]);
        }
        return response()->json(['status' => 'ok']);
    }
}

