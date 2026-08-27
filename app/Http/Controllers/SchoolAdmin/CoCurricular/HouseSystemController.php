<?php

namespace App\Http\Controllers\SchoolAdmin\CoCurricular;

use App\Http\Controllers\Controller;
use App\Models\ActivityHouse;
use App\Models\HousePointLog;
use App\Models\HousePointRule;
use App\Models\Staff;
use App\Models\Student;
use App\Services\CoCurricularService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HouseSystemController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = $request->user()->school_id;

        $houses = CoCurricularService::recalculateHouseStandings($schoolId);
        $pointLogs = HousePointLog::where('school_id', $schoolId)
            ->with(['house:id,name,color_code', 'student:id,first_name,last_name,admission_no', 'awardedByUser:id,name'])
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $rules = HousePointRule::where('school_id', $schoolId)->where('is_active', true)->get();
        $staff = Staff::where('school_id', $schoolId)->where('status', 'active')->get(['id', 'first_name', 'last_name']);
        $students = Student::where('school_id', $schoolId)->where('status', 'active')->get(['id', 'first_name', 'last_name', 'admission_no']);

        return Inertia::render('SchoolAdmin/CoCurricular/Houses/Index', [
            'houses'    => $houses,
            'pointLogs' => $pointLogs,
            'rules'     => $rules,
            'staff'     => $staff,
            'students'  => $students,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user && $user->can('activities.manage'), 403);
        $schoolId = $user->school_id;

        $validated = $request->validate([
            'name'               => 'required|string|max:100',
            'code'               => 'nullable|string|max:30',
            'color_code'         => 'required|string|max:30',
            'motto'              => 'nullable|string|max:255',
            'patron_id'          => 'nullable|exists:staff,id',
            'captain_student_id' => 'nullable|exists:students,id',
        ]);

        $validated['school_id'] = $schoolId;
        $validated['is_active'] = true;

        ActivityHouse::create($validated);

        return redirect()->back()->with('success', 'House registered.');
    }

    public function awardPoints(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless($user && ($user->can('activities.manage') || $user->can('activities.results')), 403);
        $schoolId = $user->school_id;

        $validated = $request->validate([
            'house_id'      => 'required|exists:activity_houses,id',
            'position_rank' => 'required|string|max:30',
            'reason'        => 'required|string|max:255',
            'student_id'    => 'nullable|exists:students,id',
        ]);

        CoCurricularService::awardHousePoints(
            $schoolId,
            $validated['house_id'],
            $validated['position_rank'],
            $validated['reason'],
            null,
            null,
            $validated['student_id'] ?? null,
            $user->id
        );

        return redirect()->back()->with('success', 'House points awarded & standings synchronized.');
    }
}