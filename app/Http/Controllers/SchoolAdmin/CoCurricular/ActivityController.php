<?php

namespace App\Http\Controllers\SchoolAdmin\CoCurricular;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use App\Models\ActivityCategory;
use App\Models\ActivityHouse;
use App\Models\ActivityTeam;
use App\Models\CocurricularEvent;
use App\Models\SchoolClub;
use App\Models\Staff;
use App\Models\StudentAchievement;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityController extends Controller
{
    public function dashboard(Request $request): Response
    {
        $schoolId = $request->user()->school_id;

        $stats = [
            'total_activities'    => Activity::where('school_id', $schoolId)->where('is_active', true)->count(),
            'active_teams'        => ActivityTeam::where('school_id', $schoolId)->where('status', 'active')->count(),
            'registered_clubs'    => SchoolClub::where('school_id', $schoolId)->where('status', 'active')->count(),
            'upcoming_events'     => CocurricularEvent::where('school_id', $schoolId)->where('start_date', '>=', now()->toDateString())->count(),
            'total_achievements'  => StudentAchievement::where('school_id', $schoolId)->count(),
        ];

        $houses = ActivityHouse::where('school_id', $schoolId)
            ->where('is_active', true)
            ->orderByDesc('total_points')
            ->take(6)
            ->get();

        $upcomingEvents = CocurricularEvent::where('school_id', $schoolId)
            ->with(['activity:id,name,type', 'category:id,name'])
            ->where('start_date', '>=', now()->toDateString())
            ->orderBy('start_date')
            ->take(5)
            ->get();

        $recentAchievements = StudentAchievement::where('school_id', $schoolId)
            ->with(['student:id,first_name,last_name,admission_no', 'activity:id,name'])
            ->latest('awarded_date')
            ->take(5)
            ->get();

        $categories = ActivityCategory::where('school_id', $schoolId)
            ->withCount(['activities', 'clubs'])
            ->orderBy('display_order')
            ->get();

        return Inertia::render('SchoolAdmin/CoCurricular/Dashboard', [
            'stats'              => $stats,
            'houses'             => $houses,
            'upcomingEvents'     => $upcomingEvents,
            'recentAchievements' => $recentAchievements,
            'categories'         => $categories,
        ]);
    }

    public function index(Request $request): Response
    {
        $schoolId = $request->user()->school_id;

        $query = Activity::where('school_id', $schoolId)
            ->with(['category:id,name', 'headCoach:id,first_name,last_name', 'patron:id,first_name,last_name'])
            ->withCount(['teams', 'events']);

        if ($request->filled('category_id') && $request->category_id !== 'all') {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $activities = $query->orderBy('name')->paginate(15)->withQueryString();
        $categories = ActivityCategory::where('school_id', $schoolId)->where('is_active', true)->orderBy('name')->get();
        $staff = Staff::where('school_id', $schoolId)->where('status', 'active')->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'emp_id']);

        return Inertia::render('SchoolAdmin/CoCurricular/Activities/Index', [
            'activities' => $activities,
            'categories' => $categories,
            'staff'      => $staff,
            'filters'    => [
                'category_id' => $request->input('category_id', 'all'),
                'type'        => $request->input('type', 'all'),
                'search'      => $request->input('search', ''),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = $request->user()->school_id;

        $validated = $request->validate([
            'category_id'      => 'required|exists:activity_categories,id',
            'name'             => 'required|string|max:150',
            'code'             => 'nullable|string|max:50',
            'type'             => 'required|in:individual_measurable,team_fixture,performance_adjudicated,club_society',
            'gender_scope'     => 'required|in:boys,girls,mixed,open',
            'age_group'        => 'required|in:under_12,under_14,under_16,under_19,open',
            'max_participants' => 'nullable|integer|min:1',
            'patron_id'        => 'nullable|exists:staff,id',
            'head_coach_id'    => 'nullable|exists:staff,id',
            'rules'            => 'nullable|string',
        ]);

        $validated['school_id'] = $schoolId;
        $validated['is_active'] = true;

        Activity::create($validated);

        return redirect()->back()->with('success', 'Co-curricular activity created successfully.');
    }

    public function update(Request $request, Activity $activity): RedirectResponse
    {
        $schoolId = $request->user()->school_id;
        abort_unless((int)$activity->school_id === (int)$schoolId, 403);

        $validated = $request->validate([
            'category_id'      => 'required|exists:activity_categories,id',
            'name'             => 'required|string|max:150',
            'code'             => 'nullable|string|max:50',
            'type'             => 'required|in:individual_measurable,team_fixture,performance_adjudicated,club_society',
            'gender_scope'     => 'required|in:boys,girls,mixed,open',
            'age_group'        => 'required|in:under_12,under_14,under_16,under_19,open',
            'max_participants' => 'nullable|integer|min:1',
            'patron_id'        => 'nullable|exists:staff,id',
            'head_coach_id'    => 'nullable|exists:staff,id',
            'rules'            => 'nullable|string',
            'is_active'        => 'boolean',
        ]);

        $activity->update($validated);

        return redirect()->back()->with('success', 'Activity updated successfully.');
    }

    public function destroy(Request $request, Activity $activity): RedirectResponse
    {
        $schoolId = $request->user()->school_id;
        abort_unless((int)$activity->school_id === (int)$schoolId, 403);

        $activity->delete();

        return redirect()->back()->with('success', 'Activity deleted successfully.');
    }

    public function categories(Request $request): Response
    {
        $schoolId = $request->user()->school_id;

        $categories = ActivityCategory::where('school_id', $schoolId)
            ->withCount('activities')
            ->orderBy('display_order')
            ->get();

        return Inertia::render('SchoolAdmin/CoCurricular/Activities/Categories', [
            'categories' => $categories,
        ]);
    }

    public function storeCategory(Request $request): RedirectResponse
    {
        $schoolId = $request->user()->school_id;

        $validated = $request->validate([
            'name'          => 'required|string|max:120',
            'code'          => 'nullable|string|max:50',
            'icon'          => 'nullable|string|max:50',
            'description'   => 'nullable|string|max:255',
            'display_order' => 'nullable|integer',
        ]);

        $validated['school_id'] = $schoolId;
        $validated['is_active'] = true;

        ActivityCategory::create($validated);

        return redirect()->back()->with('success', 'Activity category registered.');
    }

    public function updateCategory(Request $request, ActivityCategory $category): RedirectResponse
    {
        $schoolId = $request->user()->school_id;
        abort_unless((int)$category->school_id === (int)$schoolId, 403);

        $validated = $request->validate([
            'name'          => 'required|string|max:120',
            'code'          => 'nullable|string|max:50',
            'icon'          => 'nullable|string|max:50',
            'description'   => 'nullable|string|max:255',
            'display_order' => 'nullable|integer',
            'is_active'     => 'boolean',
        ]);

        $category->update($validated);

        return redirect()->back()->with('success', 'Category updated successfully.');
    }

    public function destroyCategory(Request $request, ActivityCategory $category): RedirectResponse
    {
        $schoolId = $request->user()->school_id;
        abort_unless((int)$category->school_id === (int)$schoolId, 403);

        if ($category->activities()->exists()) {
            return redirect()->back()->withErrors(['error' => 'Cannot delete category linked to active activities.']);
        }

        $category->delete();

        return redirect()->back()->with('success', 'Category deleted successfully.');
    }
}