<?php

namespace App\Http\Controllers\SchoolAdmin\CoCurricular;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\ActivityHouse;
use App\Models\CocurricularEvent;
use App\Models\EventParticipant;
use App\Models\MeasurableResult;
use App\Models\Student;
use App\Services\CoCurricularService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AthleticsController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = $request->user()->school_id;

        $results = MeasurableResult::where('school_id', $schoolId)
            ->with(['student:id,first_name,last_name,admission_no', 'activity:id,name,type', 'participant.event:id,title'])
            ->latest('recorded_date')
            ->paginate(20)
            ->withQueryString();

        $events = CocurricularEvent::where('school_id', $schoolId)->orderByDesc('start_date')->get(['id', 'title']);
        $activities = Activity::where('school_id', $schoolId)->where('type', 'individual_measurable')->get(['id', 'name']);
        $students = Student::where('school_id', $schoolId)->where('status', 'active')->get(['id', 'first_name', 'last_name', 'admission_no']);
        $houses = ActivityHouse::where('school_id', $schoolId)->where('is_active', true)->get(['id', 'name']);

        return Inertia::render('SchoolAdmin/CoCurricular/Athletics/Index', [
            'results'    => $results,
            'events'     => $events,
            'activities' => $activities,
            'students'   => $students,
            'houses'     => $houses,
        ]);
    }

    public function recordResult(Request $request): RedirectResponse
    {
        $schoolId = $request->user()->school_id;

        $validated = $request->validate([
            'event_id'                 => 'required|exists:cocurricular_events,id',
            'activity_id'              => 'required|exists:activities,id',
            'student_id'               => 'required|exists:students,id',
            'house_id'                 => 'nullable|exists:activity_houses,id',
            'event_round'              => 'required|in:heats,quarter_final,semi_final,final',
            'metric_type'              => 'required|in:time,distance,height,points',
            'time_recorded_seconds'    => 'nullable|numeric|min:0',
            'distance_recorded_meters' => 'nullable|numeric|min:0',
            'height_recorded_meters'   => 'nullable|numeric|min:0',
            'points_score'             => 'nullable|numeric|min:0',
            'final_position'           => 'nullable|integer|min:1',
            'remarks'                  => 'nullable|string|max:255',
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
            'height_recorded_meters'   => $validated['height_recorded_meters'] ?? null,
            'points_score'             => $validated['points_score'] ?? null,
            'final_position'           => $validated['final_position'] ?? null,
            'remarks'                  => $validated['remarks'] ?? null,
            'recorded_date'            => now()->toDateString(),
        ]);

        CoCurricularService::evaluateAthleticsRecord($result);

        if (!empty($validated['award_house_points']) && !empty($validated['house_id']) && !empty($validated['final_position'])) {
            $rankStr = match ($validated['final_position']) {
                1 => '1st',
                2 => '2nd',
                3 => '3rd',
                default => 'participant',
            };

            CoCurricularService::awardHousePoints(
                $schoolId,
                $validated['house_id'],
                $rankStr,
                "Athletics position {$validated['final_position']} in event",
                $validated['event_id'],
                $validated['activity_id'],
                $validated['student_id'],
                $request->user()->id
            );
        }

        return redirect()->back()->with('success', 'Athletics result recorded & records evaluated.');
    }

    public function records(Request $request): Response
    {
        $schoolId = $request->user()->school_id;

        $schoolRecords = MeasurableResult::where('school_id', $schoolId)
            ->where('is_school_record', true)
            ->with(['student:id,first_name,last_name,admission_no', 'activity:id,name'])
            ->get();

        return Inertia::render('SchoolAdmin/CoCurricular/Athletics/Records', [
            'schoolRecords' => $schoolRecords,
        ]);
    }
}