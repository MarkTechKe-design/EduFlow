<?php

namespace App\Http\Controllers\SchoolAdmin\CoCurricular;

use App\Http\Controllers\Controller;
use App\Models\ActivityCategory;
use App\Models\ClubMembership;
use App\Models\SchoolClub;
use App\Models\Staff;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SchoolClubController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = $request->user()->school_id;

        $clubs = SchoolClub::where('school_id', $schoolId)
            ->with(['category:id,name', 'patron:id,first_name,last_name', 'assistantPatron:id,first_name,last_name'])
            ->withCount('memberships')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        $categories = ActivityCategory::where('school_id', $schoolId)->get(['id', 'name']);
        $staff = Staff::where('school_id', $schoolId)->where('status', 'active')->get(['id', 'first_name', 'last_name', 'emp_id']);

        return Inertia::render('SchoolAdmin/CoCurricular/Clubs/Index', [
            'clubs'      => $clubs,
            'categories' => $categories,
            'staff'      => $staff,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = $request->user()->school_id;

        $validated = $request->validate([
            'category_id'         => 'nullable|exists:activity_categories,id',
            'name'                => 'required|string|max:150',
            'code'                => 'nullable|string|max:50',
            'motto'               => 'nullable|string|max:255',
            'patron_id'           => 'nullable|exists:staff,id',
            'assistant_patron_id' => 'nullable|exists:staff,id',
            'meeting_schedule'    => 'nullable|string|max:150',
            'meeting_venue'       => 'nullable|string|max:120',
            'objectives'          => 'nullable|string',
        ]);

        $validated['school_id'] = $schoolId;
        $validated['status'] = 'active';

        SchoolClub::create($validated);

        return redirect()->back()->with('success', 'School club charter registered.');
    }

    public function show(Request $request, SchoolClub $club): Response
    {
        $schoolId = $request->user()->school_id;
        abort_unless((int)$club->school_id === (int)$schoolId, 403);

        $club->load([
            'patron',
            'assistantPatron',
            'category',
            'memberships.student.schoolClass',
        ]);

        $availableStudents = Student::where('school_id', $schoolId)
            ->where('status', 'active')
            ->whereNotIn('id', $club->memberships->pluck('student_id'))
            ->get(['id', 'first_name', 'last_name', 'admission_no']);

        return Inertia::render('SchoolAdmin/CoCurricular/Clubs/Show', [
            'club'              => $club,
            'availableStudents' => $availableStudents,
        ]);
    }

    public function addMember(Request $request, SchoolClub $club): RedirectResponse
    {
        $schoolId = $request->user()->school_id;
        abort_unless((int)$club->school_id === (int)$schoolId, 403);

        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'role'       => 'required|in:president,chairperson,secretary,treasurer,organizing_secretary,committee_member,member',
        ]);

        $validated['school_id'] = $schoolId;
        $validated['club_id'] = $club->id;
        $validated['joined_date'] = now()->toDateString();
        $validated['status'] = 'active';

        ClubMembership::updateOrCreate(
            ['club_id' => $club->id, 'student_id' => $validated['student_id']],
            $validated
        );

        return redirect()->back()->with('success', 'Student enrolled in club.');
    }

    public function removeMember(Request $request, ClubMembership $membership): RedirectResponse
    {
        $schoolId = $request->user()->school_id;
        abort_unless((int)$membership->school_id === (int)$schoolId, 403);

        $membership->delete();

        return redirect()->back()->with('success', 'Member removed from club.');
    }
}