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

        $plansData = [
            'data'         => [],
            'current_page' => 1,
            'last_page'    => 1,
            'per_page'     => 15,
            'total'        => 0,
            'from'         => null,
            'to'           => null,
            'links'        => [],
        ];

        $stats = [
            'total'     => 0,
            'approved'  => 0,
            'submitted' => 0,
            'rejected'  => 0,
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

        $syllabiData = [
            'data'         => [],
            'current_page' => 1,
            'last_page'    => 1,
            'per_page'     => 15,
            'total'        => 0,
            'from'         => null,
            'to'           => null,
            'links'        => [],
        ];

        $stats = [
            'total_syllabi'    => 0,
            'completed'        => 0,
            'in_progress'      => 0,
            'average_progress' => 0,
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
}