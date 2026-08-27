<?php

namespace App\Http\Controllers\SchoolAdmin\CoCurricular;

use App\Events\CoCurricularScoreUpdated;
use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\ActivityFixture;
use App\Models\ActivityHouse;
use App\Models\ActivityTeam;
use App\Models\CocurricularEvent;
use App\Models\EventParticipant;
use App\Models\MeasurableResult;
use App\Models\Student;
use App\Services\CoCurricularService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FieldEntryController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = $request->user()->school_id;

        $liveFixtures = ActivityFixture::where('school_id', $schoolId)
            ->with(['event:id,title', 'teamA:id,name', 'teamB:id,name'])
            ->whereDate('scheduled_at', '>=', now()->subDays(1)->toDateString())
            ->orderBy('scheduled_at')
            ->take(15)
            ->get();

        $activeEvents = CocurricularEvent::where('school_id', $schoolId)
            ->with(['activity:id,name,type'])
            ->where('status', '!=', 'completed')
            ->orderByDesc('start_date')
            ->take(10)
            ->get();

        $trackActivities = Activity::where('school_id', $schoolId)
            ->where('type', 'individual_measurable')
            ->get(['id', 'name']);

        $houses = ActivityHouse::where('school_id', $schoolId)->where('is_active', true)->get(['id', 'name', 'color_code']);
        $students = Student::where('school_id', $schoolId)->where('status', 'active')->get(['id', 'first_name', 'last_name', 'admission_no']);

        return Inertia::render('SchoolAdmin/CoCurricular/FieldEntry', [
            'liveFixtures'    => $liveFixtures,
            'activeEvents'    => $activeEvents,
            'trackActivities' => $trackActivities,
            'houses'          => $houses,
            'students'        => $students,
            'schoolId'        => $schoolId,
        ]);
    }

    public function quickScore(Request $request, ActivityFixture $fixture): JsonResponse
    {
        $user = $request->user();
        abort_unless($user && ($user->can('activities.results') || $user->can('activities.manage')), 403);
        abort_unless((int)$fixture->school_id === (int)$user->school_id, 403);

        $validated = $request->validate([
            'team_a_score'   => 'required|integer|min:0',
            'team_b_score'   => 'required|integer|min:0',
            'outcome'        => 'required|in:team_a_win,team_b_win,draw,postponed,abandoned',
            'winner_team_id' => 'nullable|exists:activity_teams,id',
            'match_report'   => 'nullable|string',
        ]);

        $fixture->update($validated);

        $freshFixture = $fixture->fresh();

        // Broadcast real-time score update across pitchside subscribers
        event(new CoCurricularScoreUpdated($freshFixture));

        return response()->json([
            'success' => true,
            'message' => 'Match score saved and broadcast.',
            'fixture' => $freshFixture,
        ]);
    }

    public function quickTrackResult(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user && ($user->can('activities.results') || $user->can('activities.manage')), 403);
        $schoolId = $user->school_id;

        $validated = $request->validate([
            'event_id'                 => 'required|exists:cocurricular_events,id',
            'activity_id'              => 'required|exists:activities,id',
            'student_id'               => 'required|exists:students,id',
            'house_id'                 => 'nullable|exists:activity_houses,id',
            'event_round'              => 'required|in:heats,quarter_final,semi_final,final',
            'metric_type'              => 'required|in:time,distance,height,points',
            'time_recorded_seconds'    => 'nullable|numeric|min:0',
            'distance_recorded_meters' => 'nullable|numeric|min:0',
            'final_position'           => 'nullable|integer|min:1',
            'award_house_points'       => 'boolean',
        ]);

        $participant = EventParticipant::firstOrCreate(
            [
                'school_id'  => $schoolId,
                'event_id'   => $validated['event_id'],
                'student_id' => $validated['student_id'],
            ],
            [
                'house_id'             => $validated['house_id'] ?? null,
                'qualification_status' => 'qualified',
            ]
        );

        $result = MeasurableResult::create([
            'school_id'                => $schoolId,
            'event_participant_id'     => $participant->id,
            'activity_id'              => $validated['activity_id'],
            'student_id'               => $validated['student_id'],
            'event_round'              => $validated['event_round'],
            'metric_type'              => $validated['metric_type'],
            'time_recorded_seconds'    => $validated['time_recorded_seconds'] ?? null,
            'distance_recorded_meters' => $validated['distance_recorded_meters'] ?? null,
            'final_position'           => $validated['final_position'] ?? null,
            'recorded_date'            => now()->toDateString(),
        ]);

        CoCurricularService::evaluateAthleticsRecord($result);

        if (!empty($validated['award_house_points']) && !empty($validated['house_id']) && !empty($validated['final_position'])) {
            $rankStr = match ((int)$validated['final_position']) {
                1 => '1st',
                2 => '2nd',
                3 => '3rd',
                default => 'participant',
            };

            CoCurricularService::awardHousePoints(
                $schoolId,
                $validated['house_id'],
                $rankStr,
                "Track Position #{$validated['final_position']} Award",
                $validated['event_id'],
                $validated['activity_id'],
                $validated['student_id'],
                $user->id
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Track result verified & records evaluated.',
            'result'  => $result->fresh(),
        ]);
    }
}