<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\OnlineClass;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class OnlineClassController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $schoolId = $user->school_id;

        $query = OnlineClass::where('school_id', $schoolId)
            ->with(['class:id,name', 'section:id,name', 'subject:id,name', 'teacher:id,name']);

        $canManage = $user->hasRole(['super-admin', 'school-admin', 'principal', 'teacher']);

        if ($user->hasRole('teacher')) {
            $query->where(function ($q) use ($user) {
                $q->where('teacher_id', $user->id)
                  ->orWhere('created_by', $user->id)
                  ->orWhereIn('meeting_type', ['staff', 'board', 'parent_general', 'parent_grade']);
            });
        } elseif ($user->hasRole('student')) {
            $student = Student::where('user_id', $user->id)->where('school_id', $schoolId)->first();
            if ($student) {
                $query->where(function ($q) {
                    $q->where('meeting_type', 'classroom')
                      ->orWhereNull('meeting_type');
                })
                ->where('class_id', $student->class_id)
                ->where(function ($q) use ($student) {
                    $q->whereNull('section_id')->orWhere('section_id', $student->section_id);
                });
            } else {
                $query->whereRaw('1 = 0');
            }
        } elseif ($user->hasRole(['parent', 'guardian'])) {
            $parentClassIds = Student::where('school_id', $schoolId)
                ->where(function ($q) use ($user) {
                    $q->where('parent_id', $user->id)
                      ->orWhere('guardian_id', $user->id)
                      ->orWhere('user_id', $user->id);
                })
                ->pluck('class_id')
                ->toArray();

            $query->where(function ($q) use ($parentClassIds) {
                $q->where('meeting_type', 'parent_general')
                  ->orWhere(function ($sub) use ($parentClassIds) {
                      $sub->where('meeting_type', 'parent_grade')->whereIn('class_id', $parentClassIds);
                  });
            });
        }

        if ($request->filled('meeting_type') && $request->input('meeting_type') !== 'all') {
            $query->where('meeting_type', $request->input('meeting_type'));
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        $classesList = SchoolClass::where('school_id', $schoolId)->orderBy('numeric_name')->get(['id', 'name']);
        $subjectsList = Subject::where('school_id', $schoolId)->orderBy('name')->get(['id', 'name']);
        $teachersList = User::where('school_id', $schoolId)->role('teacher')->get(['id', 'name']);

        $sessions = $query->orderBy('scheduled_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $metrics = [
            'total'     => (clone $query)->count(),
            'live'      => (clone $query)->where('status', 'live')->count(),
            'scheduled' => (clone $query)->where('status', 'scheduled')->count(),
            'completed' => (clone $query)->where('status', 'completed')->count(),
        ];

        return Inertia::render('SchoolAdmin/OnlineClasses/Index', [
            'sessions'   => $sessions,
            'classes'    => $classesList,
            'subjects'   => $subjectsList,
            'teachers'   => $teachersList,
            'metrics'    => $metrics,
            'can_manage' => $canManage,
            'filters'    => [
                'status'       => $request->input('status', 'all'),
                'meeting_type' => $request->input('meeting_type', 'all'),
                'class_id'     => $request->input('class_id', 'all'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user && $user->hasRole(['super-admin', 'school-admin', 'principal', 'teacher']), 403);

        $schoolId = $user->school_id;

        $meetingType = $request->input('meeting_type', 'classroom');

        $validated = $request->validate([
            'title'            => ['required', 'string', 'max:150'],
            'meeting_type'     => ['nullable', 'string', 'in:classroom,parent_grade,parent_general,staff,board'],
            'description'      => ['nullable', 'string', 'max:500'],
            'class_id'         => ['nullable'],
            'section_id'       => ['nullable'],
            'subject_id'       => ['nullable'],
            'teacher_id'       => ['nullable'],
            'platform'         => ['nullable', 'string'],
            'scheduled_at'     => ['required'],
            'duration_minutes' => ['required', 'integer', 'min:5', 'max:600'],
        ]);

        $validated['meeting_type'] = $meetingType;
        $validated['platform']     = $validated['platform'] ?? 'jitsi';
        $validated['school_id']    = $schoolId;
        $validated['created_by']   = $user->id;
        $validated['status']       = 'scheduled';
        $validated['teacher_id']   = !empty($validated['teacher_id']) ? $validated['teacher_id'] : $user->id;
        $validated['meeting_id']   = 'EduFlow_' . Str::random(12);
        $validated['room_token']   = Str::random(64);

        try {
            $validated['scheduled_at'] = Carbon::parse($validated['scheduled_at']);
        } catch (\Throwable $e) {
            $validated['scheduled_at'] = now();
        }

        $session = OnlineClass::create($validated);

        return redirect()->route('school.online-classes.index')
            ->with('success', "Session '{$session->title}' scheduled successfully.");
    }

    public function start(Request $request, OnlineClass $onlineClass): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user->hasRole(['super-admin', 'school-admin', 'principal', 'teacher']), 403);

        if ($onlineClass->school_id !== $user->school_id && !$user->hasRole('super-admin')) {
            abort(403);
        }

        $onlineClass->update([
            'status'     => 'live',
            'started_at' => now(),
        ]);

        return redirect()->route('school.classroom.join', $onlineClass->id);
    }

    public function end(Request $request, OnlineClass $onlineClass): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user->hasRole(['super-admin', 'school-admin', 'principal', 'teacher']), 403);

        if ($onlineClass->school_id !== $user->school_id && !$user->hasRole('super-admin')) {
            abort(403);
        }

        $onlineClass->update([
            'status'   => 'completed',
            'ended_at' => now(),
        ]);

        return redirect()->route('school.online-classes.index')->with('success', 'Session marked as completed.');
    }

    public function destroy(Request $request, OnlineClass $onlineClass): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user->hasRole(['super-admin', 'school-admin', 'principal', 'teacher']), 403);

        if ($onlineClass->school_id !== $user->school_id && !$user->hasRole('super-admin')) {
            abort(403);
        }

        $onlineClass->update(['status' => 'cancelled']);
        $onlineClass->delete();

        return redirect()->route('school.online-classes.index')->with('success', 'Session cancelled.');
    }
}