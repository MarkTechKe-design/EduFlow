<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Staff;
use App\Models\Subject;
use App\Models\Timetable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TimetableController extends Controller
{
    private array $days = ['monday','tuesday','wednesday','thursday','friday','saturday'];

    private array $defaultSlots = [
        ['start' => '07:30', 'end' => '08:15'],
        ['start' => '08:15', 'end' => '09:00'],
        ['start' => '09:00', 'end' => '09:45'],
        ['start' => '09:45', 'end' => '10:30'],
        ['start' => '10:30', 'end' => '10:45'],
        ['start' => '10:45', 'end' => '11:30'],
        ['start' => '11:30', 'end' => '12:15'],
        ['start' => '12:15', 'end' => '13:00'],
    ];

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Timetable::class);
        $schoolId = $this->getSchoolId();

        $classId = $request->class_id;
        $sectionId = $request->section_id;

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
            $grid[$p->day_of_week][$p->start_time] = $p;
        }

        return Inertia::render('SchoolAdmin/Timetable/Index', [
            'classes' => SchoolClass::orderBy('numeric_name')->get(['id', 'name']),
            'sections' => Section::orderBy('name')->get(['id', 'class_id', 'name']),
            'subjects' => $classId ? Subject::where('class_id', $classId)->orderBy('name')->get(['id', 'name', 'code']) : collect(),
            'teachers' => Staff::where('status', 'active')->orderBy('first_name')->get(['id', 'first_name', 'last_name']),
            'periods' => $periods,
            'grid' => $grid,
            'days' => $this->days,
            'defaultSlots' => $this->defaultSlots,
            'filters' => ['class_id' => $classId, 'section_id' => $sectionId],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', Timetable::class);

        $data = $request->validate([
            'class_id' => 'required|integer',
            'section_id' => 'nullable|integer',
            'subject_id' => 'required|integer',
            'teacher_id' => 'nullable|integer',
            'day_of_week' => 'required|in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'room' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:200',
        ]);

        $schoolId = $this->getSchoolId();
        $this->assertRelatedOwnership($data, $schoolId);

        if (! empty($data['teacher_id'])) {
            $conflict = Timetable::where('school_id', $schoolId)
                ->where('teacher_id', $data['teacher_id'])
                ->where('day_of_week', $data['day_of_week'])
                ->where('start_time', $data['start_time'])
                ->exists();

            if ($conflict) {
                return back()->withErrors(['teacher_id' => 'This teacher already has a class at this time.']);
            }
        }

        Timetable::updateOrCreate(
            [
                'school_id' => $schoolId,
                'class_id' => $data['class_id'],
                'section_id' => $data['section_id'] ?? null,
                'day_of_week' => $data['day_of_week'],
                'start_time' => $data['start_time'],
            ],
            array_merge($data, ['school_id' => $schoolId])
        );

        return back()->with('success', 'Period saved.');
    }

    public function destroy(Timetable $timetable): RedirectResponse
    {
        $this->authorize('delete', $timetable);
        $timetable->delete();

        return back()->with('success', 'Period removed.');
    }

    public function teacherSchedule(Request $request): Response
    {
        $this->authorize('teacherSchedule', Timetable::class);
        $schoolId = $this->getSchoolId();
        $teacherId = $request->teacher_id;

        if ($teacherId) {
            abort_unless(Staff::withoutGlobalScopes()->whereKey($teacherId)->where('school_id', $schoolId)->exists(), 404);
        }

        $periods = collect();
        if ($teacherId) {
            $periods = Timetable::with(['schoolClass:id,name', 'section:id,name', 'subject:id,name'])
                ->where('teacher_id', $teacherId)
                ->get();
        }

        $grid = [];
        foreach ($periods as $p) {
            $grid[$p->day_of_week][$p->start_time] = $p;
        }

        return Inertia::render('SchoolAdmin/Timetable/TeacherSchedule', [
            'teachers' => Staff::where('status', 'active')->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'emp_id']),
            'periods' => $periods,
            'grid' => $grid,
            'days' => $this->days,
            'defaultSlots' => $this->defaultSlots,
            'filters' => ['teacher_id' => $teacherId],
        ]);
    }

    private function assertRelatedOwnership(array $data, int $schoolId): void
    {
        abort_unless(SchoolClass::withoutGlobalScopes()->whereKey($data['class_id'])->where('school_id', $schoolId)->exists(), 404);

        if (! empty($data['section_id'])) {
            abort_unless(Section::withoutGlobalScopes()->whereKey($data['section_id'])->where('school_id', $schoolId)->where('class_id', $data['class_id'])->exists(), 404);
        }

        abort_unless(Subject::withoutGlobalScopes()->whereKey($data['subject_id'])->where('school_id', $schoolId)->where('class_id', $data['class_id'])->exists(), 404);

        if (! empty($data['teacher_id'])) {
            abort_unless(Staff::withoutGlobalScopes()->whereKey($data['teacher_id'])->where('school_id', $schoolId)->exists(), 404);
        }
    }
}