<?php

namespace App\Http\Controllers\SchoolAdmin\CoCurricular;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\AdjudicationRubric;
use App\Models\AdjudicationRubricItem;
use App\Models\CocurricularEvent;
use App\Models\EventParticipant;
use App\Models\PerformanceAdjudication;
use App\Models\PerformanceScore;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PerformingArtsController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = $request->user()->school_id;

        $adjudications = PerformanceAdjudication::where('school_id', $schoolId)
            ->with(['participant.student:id,first_name,last_name,admission_no', 'participant.event:id,title', 'rubric:id,name'])
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $events = CocurricularEvent::where('school_id', $schoolId)->get(['id', 'title']);
        $activities = Activity::where('school_id', $schoolId)->where('type', 'performance_adjudicated')->get(['id', 'name']);
        $rubrics = AdjudicationRubric::where('school_id', $schoolId)->where('is_active', true)->with('items')->get();
        $students = Student::where('school_id', $schoolId)->where('status', 'active')->get(['id', 'first_name', 'last_name', 'admission_no']);

        return Inertia::render('SchoolAdmin/CoCurricular/Arts/Index', [
            'adjudications' => $adjudications,
            'events'        => $events,
            'activities'    => $activities,
            'rubrics'       => $rubrics,
            'students'      => $students,
        ]);
    }

    public function rubrics(Request $request): Response
    {
        $schoolId = $request->user()->school_id;

        $rubrics = AdjudicationRubric::where('school_id', $schoolId)
            ->with(['activity:id,name', 'items'])
            ->orderBy('name')
            ->get();

        $activities = Activity::where('school_id', $schoolId)->get(['id', 'name']);

        return Inertia::render('SchoolAdmin/CoCurricular/Arts/Rubrics', [
            'rubrics'    => $rubrics,
            'activities' => $activities,
        ]);
    }

    public function storeRubric(Request $request): RedirectResponse
    {
        $schoolId = $request->user()->school_id;

        $validated = $request->validate([
            'activity_id'             => 'nullable|exists:activities,id',
            'name'                    => 'required|string|max:150',
            'code'                    => 'nullable|string|max:50',
            'description'             => 'nullable|string',
            'items'                   => 'required|array|min:1',
            'items.*.criterion_name'  => 'required|string|max:150',
            'items.*.max_score'       => 'required|numeric|min:1',
        ]);

        $totalMax = array_sum(array_column($validated['items'], 'max_score'));

        $rubric = AdjudicationRubric::create([
            'school_id'       => $schoolId,
            'activity_id'     => $validated['activity_id'] ?? null,
            'name'            => $validated['name'],
            'code'            => $validated['code'] ?? null,
            'total_max_score' => $totalMax,
            'description'     => $validated['description'] ?? null,
            'is_active'       => true,
        ]);

        foreach ($validated['items'] as $index => $item) {
            AdjudicationRubricItem::create([
                'school_id'      => $schoolId,
                'rubric_id'      => $rubric->id,
                'criterion_name' => $item['criterion_name'],
                'max_score'      => $item['max_score'],
                'display_order'  => $index + 1,
            ]);
        }

        return redirect()->back()->with('success', 'Adjudication rubric configured.');
    }

    public function adjudicate(Request $request): RedirectResponse
    {
        $schoolId = $request->user()->school_id;

        $validated = $request->validate([
            'event_id'         => 'required|exists:cocurricular_events,id',
            'student_id'       => 'required|exists:students,id',
            'rubric_id'        => 'required|exists:adjudication_rubrics,id',
            'adjudicator_name' => 'required|string|max:120',
            'general_feedback' => 'nullable|string',
            'scores'           => 'required|array|min:1',
            'scores.*.rubric_item_id' => 'required|exists:adjudication_rubric_items,id',
            'scores.*.awarded_score'  => 'required|numeric|min:0',
            'scores.*.item_comment'   => 'nullable|string',
        ]);

        $participant = EventParticipant::firstOrCreate([
            'school_id'  => $schoolId,
            'event_id'   => $validated['event_id'],
            'student_id' => $validated['student_id'],
        ]);

        $totalScore = array_sum(array_column($validated['scores'], 'awarded_score'));

        $adjudication = PerformanceAdjudication::create([
            'school_id'            => $schoolId,
            'event_participant_id' => $participant->id,
            'rubric_id'            => $validated['rubric_id'],
            'adjudicator_name'     => $validated['adjudicator_name'],
            'total_awarded_score'  => $totalScore,
            'grade_attained'       => $totalScore >= 80 ? 'Distinction' : ($totalScore >= 60 ? 'Credit' : 'Pass'),
            'general_feedback'     => $validated['general_feedback'] ?? null,
            'status'               => 'submitted',
        ]);

        foreach ($validated['scores'] as $s) {
            PerformanceScore::create([
                'school_id'       => $schoolId,
                'adjudication_id' => $adjudication->id,
                'rubric_item_id'  => $s['rubric_item_id'],
                'awarded_score'   => $s['awarded_score'],
                'item_comment'    => $s['item_comment'] ?? null,
            ]);
        }

        return redirect()->back()->with('success', "Adjudication score ({$totalScore} pts) recorded successfully.");
    }
}