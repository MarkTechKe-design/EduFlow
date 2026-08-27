<?php

namespace App\Http\Controllers\SchoolAdmin\CoCurricular;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\CocurricularEvent;
use App\Models\EventParticipant;
use App\Models\Student;
use App\Models\StudentAchievement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AcademicCompetitionController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = $request->user()->school_id;

        $academicActivities = Activity::where('school_id', $schoolId)
            ->whereHas('category', fn ($q) => $q->where('name', 'like', '%academic%')->orWhere('name', 'like', '%stem%'))
            ->get(['id', 'name']);

        $events = CocurricularEvent::where('school_id', $schoolId)
            ->whereIn('activity_id', $academicActivities->pluck('id'))
            ->with(['activity:id,name', 'participants.student:id,first_name,last_name,admission_no'])
            ->latest('start_date')
            ->paginate(15)
            ->withQueryString();

        $students = Student::where('school_id', $schoolId)->where('status', 'active')->get(['id', 'first_name', 'last_name', 'admission_no']);

        return Inertia::render('SchoolAdmin/CoCurricular/Academic/Index', [
            'events'     => $events,
            'activities' => $academicActivities,
            'students'   => $students,
        ]);
    }
}