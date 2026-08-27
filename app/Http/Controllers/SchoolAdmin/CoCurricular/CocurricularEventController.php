<?php

namespace App\Http\Controllers\SchoolAdmin\CoCurricular;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Activity;
use App\Models\ActivityCategory;
use App\Models\CocurricularEvent;
use App\Models\NationalCocurricularCalendar;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CocurricularEventController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = $request->user()->school_id;

        $query = CocurricularEvent::where('school_id', $schoolId)
            ->with(['activity:id,name,type', 'category:id,name'])
            ->withCount(['participants', 'fixtures']);

        if ($request->filled('level') && $request->level !== 'all') {
            $query->where('competition_level', $request->level);
        }

        $events = $query->orderByDesc('start_date')->paginate(15)->withQueryString();
        $activities = Activity::where('school_id', $schoolId)->get(['id', 'name']);
        $categories = ActivityCategory::where('school_id', $schoolId)->get(['id', 'name']);
        $academicYears = AcademicYear::where('school_id', $schoolId)->orderByDesc('id')->get(['id', 'name']);

        return Inertia::render('SchoolAdmin/CoCurricular/Events/Index', [
            'events'        => $events,
            'activities'    => $activities,
            'categories'    => $categories,
            'academicYears' => $academicYears,
            'filters'       => [
                'level' => $request->input('level', 'all'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = $request->user()->school_id;

        $validated = $request->validate([
            'activity_id'           => 'nullable|exists:activities,id',
            'category_id'           => 'nullable|exists:activity_categories,id',
            'academic_year_id'      => 'nullable|exists:academic_years,id',
            'term'                  => 'required|string|max:30',
            'title'                 => 'required|string|max:200',
            'event_type'            => 'required|string|max:40',
            'competition_level'     => 'required|string|max:40',
            'start_date'            => 'required|date',
            'end_date'              => 'nullable|date|after_or_equal:start_date',
            'venue'                 => 'nullable|string|max:150',
            'host_organization'     => 'nullable|string|max:150',
            'registration_deadline' => 'nullable|date',
            'notes'                 => 'nullable|string',
        ]);

        $validated['school_id'] = $schoolId;
        $validated['status'] = 'scheduled';

        CocurricularEvent::create($validated);

        return redirect()->back()->with('success', 'Co-curricular event created.');
    }

    public function nationalCalendar(Request $request): Response
    {
        $academicYear = $request->input('academic_year', '2026');
        $term = $request->input('term', 'Term 1');

        $calendar = NationalCocurricularCalendar::where('academic_year', $academicYear)
            ->where('term', $term)
            ->orderBy('start_date')
            ->get();

        return Inertia::render('SchoolAdmin/CoCurricular/Events/NationalCalendar', [
            'calendar'     => $calendar,
            'academicYear' => $academicYear,
            'term'         => $term,
        ]);
    }
}