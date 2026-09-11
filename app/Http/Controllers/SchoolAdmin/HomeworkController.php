<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Homework;
use App\Models\SchoolClass;
use App\Models\Staff;
use App\Models\Subject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class HomeworkController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = $request->user()->school_id;

        $query = Homework::where('school_id', $schoolId)
            ->with(['schoolClass:id,name', 'subject:id,name,code', 'teacher:id,first_name,last_name,emp_id']);

        if ($request->filled('class_id') && $request->class_id !== 'all') {
            $query->where('class_id', $request->class_id);
        }

        if ($request->filled('subject_id') && $request->subject_id !== 'all') {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->filled('task_type') && $request->task_type !== 'all') {
            $query->where('task_type', $request->task_type);
        }

        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', $search)
                  ->orWhere('description', 'like', $search);
            });
        }

        $homeworks = $query->latest()->paginate(15)->withQueryString();

        $classes = SchoolClass::where('school_id', $schoolId)->orderBy('numeric_name')->get(['id', 'name']);
        $subjects = Subject::where('school_id', $schoolId)->orderBy('name')->get(['id', 'name', 'code', 'class_id']);
        $teachers = Staff::where('school_id', $schoolId)->where('status', 'active')->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'emp_id']);

        $totalTasks = Homework::where('school_id', $schoolId)->count();
        $activeTasks = Homework::where('school_id', $schoolId)->where('due_date', '>=', now()->toDateString())->count();

        $stats = [
            'total_tasks'       => $totalTasks,
            'active_tasks'      => $activeTasks,
            'total_submissions' => 0,
            'pending_grading'   => 0,
        ];

        return Inertia::render('SchoolAdmin/Homework/Index', [
            'homeworks' => $homeworks,
            'classes'   => $classes,
            'subjects'  => $subjects,
            'teachers'  => $teachers,
            'stats'     => $stats,
            'filters'   => [
                'class_id'   => $request->input('class_id', ''),
                'subject_id' => $request->input('subject_id', ''),
                'task_type'  => $request->input('task_type', ''),
                'search'     => $request->input('search', ''),
            ],
        ]);
    }

    public function lessonPlans(Request $request): Response
    {
        $schoolId = $request->user()->school_id;

        $classes = SchoolClass::where('school_id', $schoolId)->orderBy('numeric_name')->get(['id', 'name']);
        $subjects = Subject::where('school_id', $schoolId)->orderBy('name')->get(['id', 'name', 'code', 'class_id']);
        $staff = Staff::where('school_id', $schoolId)->where('status', 'active')->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'emp_id']);

        $query = \App\Models\LessonPlan::with(['schoolClass:id,name', 'subject:id,name,code', 'teacher:id,first_name,last_name,emp_id', 'reviewer:id,name'])
            ->where('school_id', $schoolId);

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->filled('term') && $request->term !== 'all') {
            $query->where('term', $request->term);
        }

        $plansData = $query->latest('week_start')->paginate(15)->withQueryString();

        $allSchoolPlans = \App\Models\LessonPlan::where('school_id', $schoolId);
        if ($request->filled('term') && $request->term !== 'all') {
            $allSchoolPlans->where('term', $request->term);
        }

        $stats = [
            'total'     => (clone $allSchoolPlans)->count(),
            'approved'  => (clone $allSchoolPlans)->where('status', 'approved')->count(),
            'submitted' => (clone $allSchoolPlans)->where('status', 'submitted')->count(),
            'rejected'  => (clone $allSchoolPlans)->where('status', 'rejected')->count(),
        ];

        return Inertia::render('SchoolAdmin/Homework/LessonPlans', [
            'plans'    => $plansData,
            'classes'  => $classes,
            'subjects' => $subjects,
            'staff'    => $staff,
            'stats'    => $stats,
            'filters'  => [
                'status'     => $request->input('status', 'all'),
                'class_id'   => $request->input('class_id', ''),
                'subject_id' => $request->input('subject_id', ''),
                'term'       => $request->input('term', 'Term 2'),
            ],
        ]);
    }

    public function syllabi(Request $request): Response
    {
        $schoolId = $request->user()->school_id;

        $classes = SchoolClass::where('school_id', $schoolId)->orderBy('numeric_name')->get(['id', 'name']);
        $subjects = Subject::where('school_id', $schoolId)->orderBy('name')->get(['id', 'name', 'code', 'class_id']);

        $query = \App\Models\Syllabus::with([
            'schoolClass:id,name',
            'subject:id,name,code',
            'teacher:id,first_name,last_name,emp_id',
            'reviewer:id,name',
        ])->where('school_id', $schoolId);

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->filled('term') && $request->term !== 'all') {
            $query->where('term', $request->term);
        }

        if ($request->filled('academic_year') && $request->academic_year !== 'all') {
            $query->where('academic_year', $request->academic_year);
        }

        $syllabiData = $query->latest()->paginate(15)->withQueryString();

        $allSchoolSyllabi = \App\Models\Syllabus::where('school_id', $schoolId);
        if ($request->filled('term') && $request->term !== 'all') {
            $allSchoolSyllabi->where('term', $request->term);
        }
        if ($request->filled('academic_year') && $request->academic_year !== 'all') {
            $allSchoolSyllabi->where('academic_year', $request->academic_year);
        }

        $totalSyllabi = (clone $allSchoolSyllabi)->count();
        $completed = (clone $allSchoolSyllabi)->where('status', 'completed')->count();
        $inProgress = (clone $allSchoolSyllabi)->where('status', 'in_progress')->count();
        $avgProgress = $totalSyllabi > 0 ? round((float)(clone $allSchoolSyllabi)->avg('completion_percent'), 1) : 0;

        $stats = [
            'total_syllabi'    => $totalSyllabi,
            'completed'        => $completed,
            'in_progress'      => $inProgress,
            'average_progress' => $avgProgress,
        ];

        return Inertia::render('SchoolAdmin/Homework/Syllabi', [
            'syllabi'  => $syllabiData,
            'classes'  => $classes,
            'subjects' => $subjects,
            'stats'    => $stats,
            'filters'  => [
                'class_id'      => $request->input('class_id', ''),
                'subject_id'    => $request->input('subject_id', ''),
                'term'          => $request->input('term', 'Term 2'),
                'academic_year' => $request->input('academic_year', '2026'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = $request->user()->school_id;

        $data = $request->validate([
            'title'        => 'required|string|max:255',
            'description'  => 'required|string',
            'class_id'     => 'required|exists:classes,id',
            'subject_id'   => 'required|exists:subjects,id',
            'due_date'     => 'required|date',
            'total_points' => 'nullable|integer|min:1',
            'task_type'    => 'nullable|string|max:50',
            'attachment'   => 'nullable|file|max:10240',
        ]);

        if ($request->hasFile('attachment')) {
            $data['attachment'] = $request->file('attachment')->store('homework_attachments', 'private');
        }

        $data['school_id'] = $schoolId;
        $data['teacher_id'] = $request->user()->id;

        Homework::create($data);

        return redirect()->back()->with('success', 'Homework published successfully.');
    }

    public function update(Request $request, Homework $homework): RedirectResponse
    {
        $schoolId = $request->user()->school_id;
        abort_unless($homework->school_id === $schoolId, 403, 'Unauthorized tenant access.');

        $data = $request->validate([
            'title'        => 'required|string|max:255',
            'description'  => 'required|string',
            'class_id'     => 'required|exists:classes,id',
            'subject_id'   => 'required|exists:subjects,id',
            'due_date'     => 'required|date',
            'total_points' => 'nullable|integer|min:1',
            'task_type'    => 'nullable|string|max:50',
            'attachment'   => 'nullable|file|max:10240',
        ]);

        if ($request->hasFile('attachment')) {
            if ($homework->attachment) {
                Storage::disk('private')->delete($homework->attachment);
            }
            $data['attachment'] = $request->file('attachment')->store('homework_attachments', 'private');
        }

        $homework->update($data);

        return redirect()->back()->with('success', 'Homework updated successfully.');
    }

    public function destroy(Request $request, Homework $homework): RedirectResponse
    {
        $schoolId = $request->user()->school_id;
        abort_unless($homework->school_id === $schoolId, 403, 'Unauthorized tenant access.');

        if ($homework->attachment) {
            Storage::disk('private')->delete($homework->attachment);
        }

        $homework->delete();

        return redirect()->back()->with('success', 'Homework deleted successfully.');
    }

    public function download(Request $request, Homework $homework)
    {
        $user = $request->user();
        abort_unless($user && $user->school_id === $homework->school_id, 403, 'Unauthorized tenant access.');

        if (!$homework->attachment) {
            abort(404, 'Attachment not found.');
        }

        if (!Storage::disk('private')->exists($homework->attachment)) {
            abort(404, 'File not found in secure storage.');
        }

        return Storage::disk('private')->download($homework->attachment);
    }

    public function storeLessonPlan(Request $request)
    {
        $schoolId = $request->user()->school_id;
        $validated = $request->validate([
            'class_id'             => 'required|exists:classes,id',
            'subject_id'           => 'required|exists:subjects,id',
            'teacher_id'           => 'nullable|exists:staff,id',
            'title'                => 'required|string|max:255',
            'term'                 => 'required|string|max:20',
            'strand'               => 'nullable|string|max:255',
            'sub_strand'           => 'nullable|string|max:255',
            'objectives'           => 'nullable|string',
            'core_competencies'    => 'nullable|array',
            'values_addressed'     => 'nullable|array',
            'pcis'                 => 'nullable|string',
            'content'              => 'nullable|string',
            'teaching_methods'     => 'nullable|array',
            'resources'            => 'nullable|array',
            'week_start'           => 'required|date',
            'lesson_duration_mins' => 'nullable|integer|min:10|max:180',
        ]);

        \App\Models\LessonPlan::create(array_merge($validated, [
            'school_id' => $schoolId,
            'status'    => 'submitted',
        ]));

        return back()->with('success', 'Lesson plan submitted successfully.');
    }

    public function reviewLessonPlan(Request $request, \App\Models\LessonPlan $lessonPlan)
    {
        abort_if($lessonPlan->school_id !== $request->user()->school_id, 403);

        $validated = $request->validate([
            'status'            => 'required|in:approved,rejected',
            'reviewer_feedback' => 'nullable|string',
        ]);

        $lessonPlan->update([
            'status'            => $validated['status'],
            'reviewer_feedback' => $validated['reviewer_feedback'] ?? null,
            'reviewed_by'       => $request->user()->id,
            'reviewed_at'       => now(),
        ]);

        return back()->with('success', 'Lesson plan review updated.');
    }

    public function storeSyllabus(Request $request)
    {
        $schoolId = $request->user()->school_id;
        $validated = $request->validate([
            'class_id'              => 'required|exists:classes,id',
            'subject_id'            => 'required|exists:subjects,id',
            'teacher_id'            => 'nullable|exists:staff,id',
            'academic_year'         => 'required|string|max:20',
            'term'                  => 'required|string|max:20',
            'curriculum_type'       => 'required|string|max:30',
            'title'                 => 'required|string|max:255',
            'topics'                => 'nullable|array',
            'strands'               => 'nullable|array',
            'total_lessons_planned' => 'required|integer|min:1',
        ]);

        \App\Models\Syllabus::create(array_merge($validated, [
            'school_id'             => $schoolId,
            'completion_percent'    => 0,
            'total_lessons_taught'  => 0,
            'status'                => 'in_progress',
        ]));

        return back()->with('success', 'Course syllabus registered successfully.');
    }

    public function updateSyllabus(Request $request, \App\Models\Syllabus $syllabus)
    {
        abort_if($syllabus->school_id !== $request->user()->school_id, 403);

        $validated = $request->validate([
            'title'                 => 'sometimes|required|string|max:255',
            'total_lessons_planned' => 'sometimes|required|integer|min:1',
            'total_lessons_taught'  => 'sometimes|required|integer|min:0',
            'status'                => 'sometimes|required|in:in_progress,completed',
        ]);

        if (isset($validated['total_lessons_taught']) && isset($validated['total_lessons_planned'])) {
            $validated['completion_percent'] = round(($validated['total_lessons_taught'] / max(1, $validated['total_lessons_planned'])) * 100, 2);
        }

        $syllabus->update($validated);

        return back()->with('success', 'Syllabus progress updated.');
    }

    public function reviewSyllabus(Request $request, \App\Models\Syllabus $syllabus)
    {
        abort_if($syllabus->school_id !== $request->user()->school_id, 403);

        $validated = $request->validate([
            'reviewer_feedback' => 'required|string',
        ]);

        $syllabus->update([
            'reviewer_feedback' => $validated['reviewer_feedback'],
            'reviewed_by'       => $request->user()->id,
            'reviewed_at'       => now(),
        ]);

        return back()->with('success', 'Syllabus review recorded.');
    }

    public function gradeSubmission(Request $request, $submissionId)
    {
        $schoolId = $request->user()->school_id;
        $submission = \Illuminate\Support\Facades\DB::table('homework_submissions')
            ->where('id', $submissionId)
            ->where('school_id', $schoolId)
            ->first();

        abort_if(!$submission, 404);

        $validated = $request->validate([
            'marks'    => 'required|numeric|min:0',
            'feedback' => 'nullable|string',
        ]);

        \Illuminate\Support\Facades\DB::table('homework_submissions')
            ->where('id', $submissionId)
            ->update([
                'marks'      => $validated['marks'],
                'feedback'   => $validated['feedback'] ?? null,
                'status'     => 'graded',
                'updated_at' => now(),
            ]);

        return back()->with('success', 'Submission graded successfully.');
    }
}
