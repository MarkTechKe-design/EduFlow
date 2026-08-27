<?php

namespace App\Http\Controllers\SchoolAdmin\CoCurricular;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\CocurricularEvent;
use App\Models\SchoolClass;
use App\Models\Staff;
use App\Models\Student;
use App\Models\StudentAchievement;
use App\Services\CoCurricularService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class TalentPassportController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = $request->user()->school_id;

        $query = Student::where('school_id', $schoolId)
            ->where('status', 'active')
            ->with(['schoolClass:id,name', 'section:id,name']);

        if ($request->filled('class_id') && $request->class_id !== 'all') {
            $query->where('class_id', $request->class_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('admission_no', 'like', "%{$search}%");
            });
        }

        $students = $query->orderBy('first_name')->paginate(20)->withQueryString();
        $classes = SchoolClass::where('school_id', $schoolId)->orderBy('numeric_name')->get(['id', 'name']);

        return Inertia::render('SchoolAdmin/CoCurricular/Talent/Index', [
            'students' => $students,
            'classes'  => $classes,
            'filters'  => [
                'class_id' => $request->input('class_id', 'all'),
                'search'   => $request->input('search', ''),
            ],
        ]);
    }

    public function show(Request $request, Student $student): Response
    {
        $schoolId = $request->user()->school_id;
        abort_unless((int)$student->school_id === (int)$schoolId, 403);

        $passport = CoCurricularService::getStudentTalentPassport($student->id, $schoolId);
        $activities = Activity::where('school_id', $schoolId)->get(['id', 'name']);
        $events = CocurricularEvent::where('school_id', $schoolId)->get(['id', 'title']);
        $staff = Staff::where('school_id', $schoolId)->where('status', 'active')->get(['id', 'first_name', 'last_name']);

        return Inertia::render('SchoolAdmin/CoCurricular/Talent/Passport', [
            'passport'   => $passport,
            'activities' => $activities,
            'events'     => $events,
            'staff'      => $staff,
        ]);
    }

    public function storeAchievement(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user && ($user->can('activities.certificates') || $user->can('activities.manage')), 403);
        $schoolId = $user->school_id;

        $validated = $request->validate([
            'student_id'            => 'required|exists:students,id',
            'activity_id'           => 'nullable|exists:activities,id',
            'cocurricular_event_id' => 'nullable|exists:cocurricular_events,id',
            'award_title'           => 'required|string|max:200',
            'award_type'            => 'required|string|max:40',
            'competition_level'     => 'required|string|max:40',
            'position_rank'         => 'nullable|string|max:30',
            'citation'              => 'nullable|string',
            'certificate_number'    => 'nullable|string|max:100',
            'verified_by'           => 'nullable|exists:staff,id',
            'awarded_date'          => 'required|date',
            'evidence_file'         => 'nullable|file|max:10240',
        ]);

        $filePath = null;
        if ($request->hasFile('evidence_file')) {
            $filePath = $request->file('evidence_file')->store('cocurricular_evidence', 'private');
        }

        StudentAchievement::create([
            'school_id'             => $schoolId,
            'student_id'            => $validated['student_id'],
            'activity_id'           => $validated['activity_id'] ?? null,
            'cocurricular_event_id' => $validated['cocurricular_event_id'] ?? null,
            'award_title'           => $validated['award_title'],
            'award_type'            => $validated['award_type'],
            'competition_level'     => $validated['competition_level'],
            'position_rank'         => $validated['position_rank'] ?? null,
            'citation'              => $validated['citation'] ?? null,
            'certificate_number'    => $validated['certificate_number'] ?? null,
            'evidence_file_path'    => $filePath,
            'verified_by'           => $validated['verified_by'] ?? null,
            'awarded_date'          => $validated['awarded_date'],
        ]);

        return redirect()->back()->with('success', 'Student achievement recorded.');
    }

    public function downloadEvidence(Request $request, StudentAchievement $achievement)
    {
        $schoolId = $request->user()->school_id;
        abort_unless((int)$achievement->school_id === (int)$schoolId, 403);

        if (!$achievement->evidence_file_path || !Storage::disk('private')->exists($achievement->evidence_file_path)) {
            abort(404, 'Evidence file not found.');
        }

        return Storage::disk('private')->download($achievement->evidence_file_path);
    }
}