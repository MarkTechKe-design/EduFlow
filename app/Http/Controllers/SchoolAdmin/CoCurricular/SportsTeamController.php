<?php

namespace App\Http\Controllers\SchoolAdmin\CoCurricular;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Activity;
use App\Models\ActivityFixture;
use App\Models\ActivityHouse;
use App\Models\ActivityTeam;
use App\Models\ActivityTeamMember;
use App\Models\CocurricularEvent;
use App\Models\Staff;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SportsTeamController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = $request->user()->school_id;

        $query = ActivityTeam::where('school_id', $schoolId)
            ->with(['activity:id,name,type', 'house:id,name,color_code', 'coach:id,first_name,last_name', 'captain:id,first_name,last_name,admission_no'])
            ->withCount('members');

        if ($request->filled('activity_id') && $request->activity_id !== 'all') {
            $query->where('activity_id', $request->activity_id);
        }

        if ($request->filled('gender') && $request->gender !== 'all') {
            $query->where('gender', $request->gender);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $teams = $query->orderBy('name')->paginate(15)->withQueryString();
        $activities = Activity::where('school_id', $schoolId)->where('is_active', true)->get(['id', 'name', 'type']);
        $houses = ActivityHouse::where('school_id', $schoolId)->where('is_active', true)->get(['id', 'name', 'color_code']);
        $staff = Staff::where('school_id', $schoolId)->where('status', 'active')->get(['id', 'first_name', 'last_name', 'emp_id']);
        $students = Student::where('school_id', $schoolId)->where('status', 'active')->get(['id', 'first_name', 'last_name', 'admission_no']);
        $academicYears = AcademicYear::where('school_id', $schoolId)->orderByDesc('id')->get(['id', 'name']);

        return Inertia::render('SchoolAdmin/CoCurricular/Sports/Teams', [
            'teams'         => $teams,
            'activities'    => $activities,
            'houses'        => $houses,
            'staff'         => $staff,
            'students'      => $students,
            'academicYears' => $academicYears,
            'filters'       => [
                'activity_id' => $request->input('activity_id', 'all'),
                'gender'      => $request->input('gender', 'all'),
                'search'      => $request->input('search', ''),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = $request->user()->school_id;

        $validated = $request->validate([
            'activity_id'             => 'required|exists:activities,id',
            'house_id'                => 'nullable|exists:activity_houses,id',
            'academic_year_id'        => 'nullable|exists:academic_years,id',
            'name'                    => 'required|string|max:150',
            'age_group'               => 'required|string|max:30',
            'gender'                  => 'required|string|max:30',
            'coach_id'                => 'nullable|exists:staff,id',
            'assistant_coach_id'      => 'nullable|exists:staff,id',
            'captain_student_id'      => 'nullable|exists:students,id',
            'vice_captain_student_id' => 'nullable|exists:students,id',
        ]);

        $validated['school_id'] = $schoolId;
        $validated['status'] = 'active';

        ActivityTeam::create($validated);

        return redirect()->back()->with('success', 'Sports squad / team established.');
    }

    public function show(Request $request, ActivityTeam $team): Response
    {
        $schoolId = $request->user()->school_id;
        abort_unless((int)$team->school_id === (int)$schoolId, 403);

        $team->load([
            'activity',
            'house',
            'coach',
            'assistantCoach',
            'captain',
            'viceCaptain',
            'members.student.schoolClass',
        ]);

        $availableStudents = Student::where('school_id', $schoolId)
            ->where('status', 'active')
            ->whereNotIn('id', $team->members->pluck('student_id'))
            ->get(['id', 'first_name', 'last_name', 'admission_no']);

        return Inertia::render('SchoolAdmin/CoCurricular/Sports/TeamShow', [
            'team'              => $team,
            'availableStudents' => $availableStudents,
        ]);
    }

    public function addMember(Request $request, ActivityTeam $team): RedirectResponse
    {
        $schoolId = $request->user()->school_id;
        abort_unless((int)$team->school_id === (int)$schoolId, 403);

        $validated = $request->validate([
            'student_id'    => 'required|exists:students,id',
            'role'          => 'required|in:captain,vice_captain,starter,reserve,member',
            'jersey_number' => 'nullable|string|max:20',
            'position_name' => 'nullable|string|max:60',
        ]);

        $validated['school_id'] = $schoolId;
        $validated['team_id'] = $team->id;
        $validated['joined_date'] = now()->toDateString();
        $validated['status'] = 'active';

        ActivityTeamMember::updateOrCreate(
            ['team_id' => $team->id, 'student_id' => $validated['student_id']],
            $validated
        );

        return redirect()->back()->with('success', 'Player added to team roster.');
    }

    public function removeMember(Request $request, ActivityTeamMember $member): RedirectResponse
    {
        $schoolId = $request->user()->school_id;
        abort_unless((int)$member->school_id === (int)$schoolId, 403);

        $member->delete();

        return redirect()->back()->with('success', 'Player removed from team.');
    }

    public function fixtures(Request $request): Response
    {
        $schoolId = $request->user()->school_id;

        $fixtures = ActivityFixture::where('school_id', $schoolId)
            ->with(['event:id,title', 'teamA:id,name', 'teamB:id,name', 'winnerTeam:id,name'])
            ->orderBy('scheduled_at')
            ->paginate(20)
            ->withQueryString();

        $events = CocurricularEvent::where('school_id', $schoolId)->get(['id', 'title']);
        $teams = ActivityTeam::where('school_id', $schoolId)->where('status', 'active')->get(['id', 'name']);

        return Inertia::render('SchoolAdmin/CoCurricular/Sports/Fixtures', [
            'fixtures' => $fixtures,
            'events'   => $events,
            'teams'    => $teams,
        ]);
    }

    public function storeFixture(Request $request): RedirectResponse
    {
        $schoolId = $request->user()->school_id;

        $validated = $request->validate([
            'event_id'           => 'required|exists:cocurricular_events,id',
            'team_a_id'          => 'nullable|exists:activity_teams,id',
            'team_b_id'          => 'nullable|exists:activity_teams,id',
            'team_a_custom_name' => 'nullable|string|max:120',
            'team_b_custom_name' => 'nullable|string|max:120',
            'scheduled_at'       => 'required|date',
            'venue'              => 'nullable|string|max:120',
            'stage'              => 'required|string|max:40',
            'referee_name'       => 'nullable|string|max:120',
        ]);

        $validated['school_id'] = $schoolId;

        ActivityFixture::create($validated);

        return redirect()->back()->with('success', 'Fixture scheduled.');
    }

    public function updateScore(Request $request, ActivityFixture $fixture): RedirectResponse
    {
        $schoolId = $request->user()->school_id;
        abort_unless((int)$fixture->school_id === (int)$schoolId, 403);

        $validated = $request->validate([
            'team_a_score'   => 'required|integer|min:0',
            'team_b_score'   => 'required|integer|min:0',
            'outcome'        => 'required|in:team_a_win,team_b_win,draw,postponed,abandoned',
            'winner_team_id' => 'nullable|exists:activity_teams,id',
            'match_report'   => 'nullable|string',
        ]);

        $fixture->update($validated);

        return redirect()->back()->with('success', 'Match score and outcome recorded.');
    }
}