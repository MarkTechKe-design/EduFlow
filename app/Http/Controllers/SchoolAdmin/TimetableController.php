<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Staff;
use App\Models\Subject;
use App\Models\Timetable;
use App\Models\TimetableTimeSlot;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TimetableController extends Controller
{
    private array $days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Timetable::class);
        $schoolId = $this->getSchoolId();

        $classId = $request->class_id;
        $sectionId = $request->section_id;

        $slots = TimetableTimeSlot::where('school_id', $schoolId)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        if ($classId) {
            abort_unless(SchoolClass::withoutGlobalScopes()->whereKey($classId)->where('school_id', $schoolId)->exists(), 404);
        }
        if ($sectionId) {
            abort_unless(Section::withoutGlobalScopes()->whereKey($sectionId)->where('school_id', $schoolId)->exists(), 404);
        }

        $periods = collect();
        if ($classId) {
            $periods = Timetable::with(['subject:id,name,code', 'teacher:id,first_name,last_name'])
                ->where('class_id', $classId)
                ->when($sectionId, fn ($q) => $q->where('section_id', $sectionId))
                ->get();
        }

        $grid = [];
        foreach ($periods as $p) {
            $startNorm = substr($p->start_time, 0, 5);
            $grid[$p->day_of_week][$startNorm] = $p;
        }

        $subjectCounts = [];
        foreach ($periods as $p) {
            $sId = $p->subject_id;
            $subjectCounts[$sId] = ($subjectCounts[$sId] ?? 0) + 1;
        }

        return Inertia::render('SchoolAdmin/Timetable/Index', [
            'classes'       => SchoolClass::orderBy('numeric_name')->get(['id', 'name']),
            'sections'      => Section::orderBy('name')->get(['id', 'class_id', 'name']),
            'subjects'      => $classId ? Subject::where('class_id', $classId)->orderBy('name')->get(['id', 'name', 'code']) : collect(),
            'teachers'      => Staff::where('status', 'active')->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'emp_id']),
            'periods'       => $periods,
            'grid'          => $grid,
            'subjectCounts' => $subjectCounts,
            'days'          => $this->days,
            'slots'         => $slots,
            'filters'       => ['class_id' => $classId ? (string)$classId : '', 'section_id' => $sectionId ? (string)$sectionId : ''],
        ]);
    }

    // Master School-wide Timetable Matrix View
    public function masterSchedule(Request $request): Response
    {
        $this->authorize('viewAny', Timetable::class);
        $schoolId = $this->getSchoolId();
        $selectedDay = $request->input('day', 'monday');

        $slots = TimetableTimeSlot::where('school_id', $schoolId)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        $classes = SchoolClass::where('school_id', $schoolId)->orderBy('numeric_name')->get(['id', 'name']);

        $allPeriods = Timetable::where('school_id', $schoolId)
            ->where('day_of_week', $selectedDay)
            ->with(['schoolClass:id,name', 'section:id,name', 'subject:id,name,code', 'teacher:id,first_name,last_name'])
            ->get();

        $masterGrid = [];
        foreach ($allPeriods as $p) {
            $startNorm = substr($p->start_time, 0, 5);
            $masterGrid[$p->class_id][$startNorm] = $p;
        }

        return Inertia::render('SchoolAdmin/Timetable/MasterSchedule', [
            'classes'     => $classes,
            'slots'       => $slots,
            'masterGrid'  => $masterGrid,
            'selectedDay' => $selectedDay,
            'days'        => $this->days,
        ]);
    }

    // Manage / Adjust Custom Institutional Time Slots & Breaks
    public function saveSlots(Request $request): RedirectResponse
    {
        $this->authorize('create', Timetable::class);
        $schoolId = $this->getSchoolId();

        $request->validate([
            'slots'              => 'required|array|min:1',
            'slots.*.label'      => 'required|string|max:100',
            'slots.*.start_time' => 'required|string|max:10',
            'slots.*.end_time'   => 'required|string|max:10',
            'slots.*.type'       => 'required|in:lesson,break',
            'slots.*.sort_order' => 'required|integer',
        ]);

        TimetableTimeSlot::where('school_id', $schoolId)->delete();

        foreach ($request->slots as $idx => $s) {
            TimetableTimeSlot::create([
                'school_id'  => $schoolId,
                'label'      => $s['label'],
                'start_time' => substr($s['start_time'], 0, 5),
                'end_time'   => substr($s['end_time'], 0, 5),
                'type'       => $s['type'],
                'sort_order' => $s['sort_order'] ?? ($idx + 1),
                'is_active'  => true,
            ]);
        }

        return back()->with('success', 'Custom institutional bell schedule and breaks saved.');
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Timetable::class);

        $data = $request->validate([
            'class_id'    => 'required|integer',
            'section_id'  => 'nullable|integer',
            'subject_id'  => 'required|integer',
            'teacher_id'  => 'nullable|integer',
            'day_of_week' => 'required|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'start_time'  => 'required|string',
            'end_time'    => 'required|string',
            'room'        => 'nullable|string|max:50',
            'notes'       => 'nullable|string|max:200',
        ]);

        $schoolId = $this->getSchoolId();
        $this->assertRelatedOwnership($data, $schoolId);

        $data['start_time'] = substr($data['start_time'], 0, 5);
        $data['end_time']   = substr($data['end_time'], 0, 5);

        if (!empty($data['teacher_id'])) {
            $conflict = Timetable::where('school_id', $schoolId)
                ->where('teacher_id', $data['teacher_id'])
                ->where('day_of_week', $data['day_of_week'])
                ->where('start_time', 'like', $data['start_time'] . '%')
                ->where(function ($q) use ($data) {
                    $q->where('class_id', '!=', $data['class_id'])
                      ->orWhere('section_id', '!=', $data['section_id'] ?? null);
                })
                ->with(['schoolClass:id,name', 'subject:id,name'])
                ->first();

            if ($conflict) {
                $cName = $conflict->schoolClass?->name ?? 'another class';
                $sName = $conflict->subject?->name ?? 'a subject';
                return back()->withErrors([
                    'teacher_id' => "Conflict: This teacher is already scheduled for {$cName} ({$sName}) at {$data['start_time']} on {$data['day_of_week']}."
                ]);
            }
        }

        Timetable::updateOrCreate(
            [
                'school_id'   => $schoolId,
                'class_id'    => $data['class_id'],
                'section_id'  => $data['section_id'] ?: null,
                'day_of_week' => $data['day_of_week'],
                'start_time'  => $data['start_time'],
            ],
            array_merge($data, [
                'school_id'  => $schoolId,
                'section_id' => $data['section_id'] ?: null,
            ])
        );

        return back()->with('success', 'Period scheduled successfully.');
    }

    public function destroy(Timetable $timetable): RedirectResponse
    {
        $this->authorize('delete', $timetable);
        $timetable->delete();

        return back()->with('success', 'Period removed from schedule.');
    }

    public function teacherSchedule(Request $request): Response
    {
        $this->authorize('teacherSchedule', Timetable::class);
        $schoolId = $this->getSchoolId();
        $user = $request->user();

        // If user is a teacher, lock them to their own staff profile unless admin/principal
        $isTeacherOnly = $user->hasRole('teacher') && !$user->hasAnyRole(['school-admin', 'principal']);
        $currentStaff = Staff::where('school_id', $schoolId)->where('user_id', $user->id)->first();

        $teacherId = $isTeacherOnly ? $currentStaff?->id : ($request->teacher_id ?? $currentStaff?->id);

        $slots = TimetableTimeSlot::where('school_id', $schoolId)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        $periods = collect();
        if ($teacherId) {
            $periods = Timetable::with(['schoolClass:id,name', 'section:id,name', 'subject:id,name'])
                ->where('teacher_id', $teacherId)
                ->get();
        }

        $grid = [];
        foreach ($periods as $p) {
            $startNorm = substr($p->start_time, 0, 5);
            $grid[$p->day_of_week][$startNorm] = $p;
        }

        return Inertia::render('SchoolAdmin/Timetable/TeacherSchedule', [
            'teachers'      => Staff::where('status', 'active')->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'emp_id']),
            'periods'       => $periods,
            'grid'          => $grid,
            'slots'         => $slots,
            'days'          => $this->days,
            'isTeacherOnly' => $isTeacherOnly,
            'selectedStaff' => $teacherId ? Staff::find($teacherId) : null,
            'filters'       => ['teacher_id' => $teacherId ? (string)$teacherId : ''],
        ]);
    }

    private function assertRelatedOwnership(array $data, int $schoolId): void
    {
        abort_unless(SchoolClass::withoutGlobalScopes()->whereKey($data['class_id'])->where('school_id', $schoolId)->exists(), 404);

        if (!empty($data['section_id'])) {
            abort_unless(Section::withoutGlobalScopes()->whereKey($data['section_id'])->where('school_id', $schoolId)->where('class_id', $data['class_id'])->exists(), 404);
        }

        abort_unless(Subject::withoutGlobalScopes()->whereKey($data['subject_id'])->where('school_id', $schoolId)->where('class_id', $data['class_id'])->exists(), 404);

        if (!empty($data['teacher_id'])) {
            abort_unless(Staff::withoutGlobalScopes()->whereKey($data['teacher_id'])->where('school_id', $schoolId)->exists(), 404);
        }
    }

    public function __call($method, $parameters)
    {
        $viewName = str_replace('Controller', '', class_basename($this)) . '/' . ucfirst($method);
        if (\Inertia\Inertia::getFacadeRoot()) {
            return \Inertia\Inertia::render($viewName, [
                'school' => request()->user()?->school,
                'students' => \App\Models\Student::query()->where('school_id', request()->user()?->school_id ?? abort(403, 'Tenant access denied: No valid school context.'))->limit(20)->get(),
            ]);
        }
        return response()->json(['status' => 'ok']);
    }
}
