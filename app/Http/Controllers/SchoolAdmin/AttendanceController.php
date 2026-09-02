<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Services\TeacherProfileService;
use App\Services\AcademicTermService;
use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Attendance;
use App\Models\Department;
use App\Models\Holiday;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Staff;
use App\Models\Student;
use App\Models\TeacherDutyAssignment;
use App\Models\TeacherDutyRoster;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    /**
     * Student Attendance — Daily roll-call register.
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', [Attendance::class, [
            'class_id' => $request->class_id,
            'section_id' => $request->section_id,
        ]]);

        $sid = $this->getSchoolId();
        $date = $request->input('date', today()->toDateString());
        $session = $request->input('session', 'morning');
        $classId = $request->input('class_id');
        $sectionId = $request->input('section_id');

        $classes = SchoolClass::where('school_id', $sid)->orderBy('name')->get(['id', 'name']);
        $sections = Section::where('school_id', $sid)->orderBy('name')->get(['id', 'class_id', 'name']);

        $students = collect();
        $existing = collect();
        $stats = [
            'total' => 0,
            'present' => 0,
            'absent' => 0,
            'late' => 0,
            'excused' => 0,
        ];

        if ($classId) {
            $students = Student::where('school_id', $sid)
                ->where('class_id', $classId)
                ->when($sectionId, fn ($q) => $q->where('section_id', $sectionId))
                ->where('status', 'active')
                ->with('section:id,name')
                ->orderBy('first_name')
                ->get(['id', 'first_name', 'last_name', 'admission_no', 'roll_no', 'gender', 'section_id', 'guardian_phone']);

            $existingRecords = Attendance::where([
                'school_id' => $sid,
                'date' => $date,
                'attendable_type' => Student::class,
            ])
            ->whereIn('attendable_id', $students->pluck('id'))
            ->get(['attendable_id', 'status', 'time_in', 'remarks', 'notification_sent']);

            $existing = $existingRecords->keyBy('attendable_id');

            $stats['total'] = $students->count();
            $stats['present'] = $existingRecords->where('status', 'present')->count();
            $stats['absent'] = $existingRecords->where('status', 'absent')->count();
            $stats['late'] = $existingRecords->where('status', 'late')->count();
            $stats['excused'] = $existingRecords->whereIn('status', ['half_day', 'on_leave', 'official_duty'])->count();
        }

        return Inertia::render('SchoolAdmin/Attendance/Index', [
            'classes' => $classes,
            'sections' => $sections,
            'students' => $students,
            'existing' => $existing,
            'stats' => $stats,
            'filters' => [
                'date' => $date,
                'session' => $session,
                'class_id' => $classId ? (int) $classId : null,
                'section_id' => $sectionId ? (int) $sectionId : null,
            ],
        ]);
    }

    /**
     * Bulk upsert student attendance for a class & date.
     */
    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'date' => 'required|date',
            'session' => 'nullable|string|max:30',
            'class_id' => 'required|integer',
            'records' => 'required|array|min:1',
            'records.*.student_id' => 'required|integer',
            'records.*.status' => 'required|string',
            'records.*.time_in' => 'nullable|string',
            'records.*.remarks' => 'nullable|string|max:255',
        ]);

        $this->authorize('markStudent', [Attendance::class, [
            'class_id' => $data['class_id'],
            'records' => $data['records'],
        ]]);

        $sid = $this->getSchoolId();
        $activeYear = AcademicYear::where('school_id', $sid)->where('is_current', true)->first();

        DB::transaction(function () use ($data, $sid, $activeYear) {
            foreach ($data['records'] as $record) {
                $status = in_array($record['status'], ['present', 'absent', 'late', 'half_day'])
                    ? $record['status']
                    : ($record['status'] === 'excused' ? 'half_day' : 'present');

                Attendance::updateOrCreate(
                    [
                        'school_id' => $sid,
                        'date' => $data['date'],
                        'session' => $data['session'] ?? 'morning',
                        'attendable_type' => Student::class,
                        'attendable_id' => $record['student_id'],
                    ],
                    [
                        'academic_year_id' => $activeYear?->id,
                        'status' => $status,
                        'time_in' => !empty($record['time_in']) ? $record['time_in'] : null,
                        'remarks' => $record['remarks'] ?? null,
                        'marked_by' => auth()->id(),
                    ]
                );
            }
        });

        return back()->with('success', 'Student attendance saved successfully for ' . Carbon::parse($data['date'])->format('d M Y') . '.');
    }

    /**
     * Staff attendance — daily mark page.
     */
    public function staffIndex(Request $request): Response
    {
        $this->authorize('viewAny', [Attendance::class, [
            'department_id' => $request->department_id,
        ]]);

        $sid = $this->getSchoolId();
        $date = $request->input('date', today()->toDateString());
        $deptId = $request->input('department_id');

                // Handle explicit Term/Week filter selection vs Date selection
        if ($request->filled('term') && $request->filled('week_number') && !$request->filled('date')) {
            $reqYear = (int) ($request->input('year') ?: today()->year);
            $reqTerm = (string) $request->input('term');
            $reqWeek = (int) $request->input('week_number');
            $resolvedRange = AcademicTermService::resolveWeekDateRange($reqYear, $reqTerm, $reqWeek, $sid);
            $date = $resolvedRange['mid_date'];
        }

        // Authoritative Kenyan Term & Academic Week Resolution (School Config + MoE Default)
        $academicContext = AcademicTermService::resolveContext($date, $sid);
        $term = $academicContext['term'];
        $weekNumber = $academicContext['week_number'];
        $weekStart = $academicContext['week_start'];
        $weekEnd = $academicContext['week_end'];
        $academicYearName = $academicContext['academic_year_name'];

        $weekDays = [
            ['day' => 'Mon', 'date' => Carbon::parse($weekStart)->toDateString()],
            ['day' => 'Tue', 'date' => Carbon::parse($weekStart)->addDays(1)->toDateString()],
            ['day' => 'Wed', 'date' => Carbon::parse($weekStart)->addDays(2)->toDateString()],
            ['day' => 'Thu', 'date' => Carbon::parse($weekStart)->addDays(3)->toDateString()],
            ['day' => 'Fri', 'date' => Carbon::parse($weekStart)->addDays(4)->toDateString()],
        ];

        $staff = Staff::where('school_id', $sid)
            ->where('status', 'active')
            ->when($deptId, fn ($q) => $q->where('department_id', $deptId))
            ->with(['department:id,name', 'designation:id,name'])
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'emp_id', 'department_id', 'designation_id', 'phone']);

        $staffIds = $staff->pluck('id');

        // Single day attendance for current date
        $existing = Attendance::where([
            'school_id' => $sid,
            'date' => $date,
            'attendable_type' => Staff::class,
        ])
        ->whereIn('attendable_id', $staffIds)
        ->get(['attendable_id', 'status', 'time_in', 'time_out', 'remarks'])
        ->keyBy('attendable_id');

        // Weekly attendance matrix for Wide View
        $weeklyRaw = Attendance::where('school_id', $sid)
            ->where('attendable_type', Staff::class)
            ->whereIn('attendable_id', $staffIds)
            ->whereBetween('date', [$weekStart, $weekEnd])
            ->get(['attendable_id', 'date', 'status', 'time_in', 'time_out', 'remarks']);

        $weeklyRecords = [];
        foreach ($weeklyRaw as $item) {
            $dateKey = is_string($item->date) ? $item->date : Carbon::parse($item->date)->toDateString();
            $weeklyRecords[$item->attendable_id][$dateKey] = [
                'status' => $item->status,
                'time_in' => $item->time_in,
                'time_out' => $item->time_out,
                'remarks' => $item->remarks,
            ];
        }

        $activeLeaves = LeaveRequest::where('school_id', $sid)
            ->where('status', 'approved')
            ->whereDate('start_date', '<=', $date)
            ->whereDate('end_date', '>=', $date)
            ->with('leaveType:id,name,code')
            ->get(['id', 'staff_id', 'leave_type_id', 'start_date', 'end_date'])
            ->keyBy('staff_id');

        $leaveTypes = LeaveType::where('school_id', $sid)
            ->where('is_active', true)
            ->get(['id', 'name', 'code', 'is_paid']);

        $departments = Department::where('school_id', $sid)->get(['id', 'name']);

        $stats = [
            'total' => $staff->count(),
            'present' => $existing->where('status', 'present')->count(),
            'absent' => $existing->where('status', 'absent')->count(),
            'on_leave' => $existing->where('status', 'on_leave')->count(),
            'official_duty' => $existing->where('status', 'official_duty')->count(),
            'half_day' => $existing->where('status', 'half_day')->count(),
        ];

        return Inertia::render('SchoolAdmin/Attendance/StaffIndex', [
            'academicContext' => $academicContext,
            'staffList' => $staff,
            'existing' => $existing,
            'weeklyRecords' => $weeklyRecords,
            'weekDays' => $weekDays,
            'academicPeriod' => [
                'academic_year' => $academicYearName,
                'term' => $term,
                'week_number' => $weekNumber,
                'week_start' => $weekStart,
                'week_end' => $weekEnd,
            ],
            'activeLeaves' => $activeLeaves,
            'leaveTypes' => $leaveTypes,
            'departments' => $departments,
            'stats' => $stats,
            'filters' => [
                'date' => $date,
                'department_id' => $deptId ? (int) $deptId : null,
                'term' => $term,
                'week_number' => $weekNumber,
            ],
        ]);
    }

    /**
     * Batch store staff attendance records.
     */
    public function staffStore(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'date' => 'required|date',
            'records' => 'required|array|min:1',
            'records.*.staff_id' => 'required|exists:staff,id',
            'records.*.status' => 'required|in:present,absent,late,on_leave,official_duty,half_day',
            'records.*.time_in' => 'nullable|string',
            'records.*.time_out' => 'nullable|string',
            'records.*.remarks' => 'nullable|string|max:500',
        ]);

        $this->authorize('markStaff', [Attendance::class, ['records' => $data['records']]]);

        $sid = $this->getSchoolId();
        $activeYear = AcademicYear::where('school_id', $sid)->where('is_current', true)->first();

        DB::transaction(function () use ($data, $sid, $activeYear) {
            foreach ($data['records'] as $record) {
                Attendance::updateOrCreate(
                    [
                        'school_id' => $sid,
                        'date' => $data['date'],
                        'session' => 'full_day',
                        'attendable_type' => Staff::class,
                        'attendable_id' => $record['staff_id'],
                    ],
                    [
                        'academic_year_id' => $activeYear?->id,
                        'status' => $record['status'],
                        'time_in' => !empty($record['time_in']) ? $record['time_in'] : null,
                        'time_out' => !empty($record['time_out']) ? $record['time_out'] : null,
                        'remarks' => $record['remarks'] ?? null,
                        'marked_by' => auth()->id(),
                    ]
                );
            }
        });

        return back()->with('success', 'Staff attendance updated successfully for ' . Carbon::parse($data['date'])->format('d M Y') . '.');
    }

    /**
     * Smart Approved Leave Application with Calendar Holidays Exclusion
     */
    public function applyStaffLeave(Request $request): RedirectResponse
    {
        $sid = $this->getSchoolId();

        $validated = $request->validate([
            'staff_id' => 'required|exists:staff,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'nullable|string|max:500',
            'overwrite_conflicts' => 'boolean',
        ]);

        abort_unless(Staff::where('id', $validated['staff_id'])->where('school_id', $sid)->exists(), 403);
        abort_unless(LeaveType::where('id', $validated['leave_type_id'])->where('school_id', $sid)->exists(), 403);

        $start = Carbon::parse($validated['start_date']);
        $end = Carbon::parse($validated['end_date']);

        $holidays = Holiday::where('school_id', $sid)
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('date', [$start->toDateString(), $end->toDateString()])
                  ->orWhere(function ($sq) use ($start, $end) {
                      $sq->whereNotNull('end_date')
                         ->where('date', '<=', $end->toDateString())
                         ->where('end_date', '>=', $start->toDateString());
                  });
            })->get();

        $holidayDates = collect();
        foreach ($holidays as $h) {
            $hStart = Carbon::parse($h->date);
            $hEnd = $h->end_date ? Carbon::parse($h->end_date) : $hStart;
            for ($d = $hStart->copy(); $d->lte($hEnd); $d->addDay()) {
                $holidayDates->push($d->toDateString());
            }
        }
        $holidayDates = $holidayDates->unique();

        $applicableDates = [];
        for ($curr = $start->copy(); $curr->lte($end); $curr->addDay()) {
            if ($curr->isWeekend() || $holidayDates->contains($curr->toDateString())) {
                continue;
            }
            $applicableDates[] = $curr->toDateString();
        }

        if (empty($applicableDates)) {
            return back()->with('error', 'No applicable school days found within the selected date range (all dates are weekends or school holidays).');
        }

        $activeYear = AcademicYear::where('school_id', $sid)->where('is_current', true)->first();
        $leaveType = LeaveType::find($validated['leave_type_id']);

        DB::transaction(function () use ($sid, $validated, $applicableDates, $leaveType, $activeYear) {
            LeaveRequest::create([
                'school_id' => $sid,
                'staff_id' => $validated['staff_id'],
                'leave_type_id' => $validated['leave_type_id'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'days' => count($applicableDates),
                'reason' => $validated['reason'] ?? 'Approved leave marked via Daily Attendance',
                'status' => 'approved',
                'approved_by' => auth()->id(),
                'actioned_at' => now(),
            ]);

            foreach ($applicableDates as $dateStr) {
                Attendance::updateOrCreate(
                    [
                        'school_id' => $sid,
                        'date' => $dateStr,
                        'session' => 'full_day',
                        'attendable_type' => Staff::class,
                        'attendable_id' => $validated['staff_id'],
                    ],
                    [
                        'academic_year_id' => $activeYear?->id,
                        'status' => 'on_leave',
                        'time_in' => null,
                        'time_out' => null,
                        'remarks' => 'Approved Leave: ' . ($leaveType->name ?? 'Staff Leave') . ($validated['reason'] ? ' - ' . $validated['reason'] : ''),
                        'marked_by' => auth()->id(),
                    ]
                );
            }
        });

        return back()->with('success', sprintf('Approved leave recorded for %d school day(s) from %s to %s.', count($applicableDates), $start->format('d M'), $end->format('d M Y')));
    }

    /**
     * Assign Official Duty Across Date Range with Replacement Tracking
     */
    public function assignStaffDuty(Request $request): RedirectResponse
    {
        $sid = $this->getSchoolId();

        $validated = $request->validate([
            'staff_id' => 'required|exists:staff,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'duty_type' => 'required|string|max:100',
            'custom_duty_notes' => 'nullable|string|max:255',
            'replacement_staff_id' => 'nullable|exists:staff,id',
            'notes' => 'nullable|string|max:500',
        ]);

        abort_unless(Staff::where('id', $validated['staff_id'])->where('school_id', $sid)->exists(), 403);
        if (!empty($validated['replacement_staff_id'])) {
            abort_unless(Staff::where('id', $validated['replacement_staff_id'])->where('school_id', $sid)->exists(), 403);
        }

        if ($validated['duty_type'] === 'Other' && empty(trim((string)($validated['custom_duty_notes'] ?? '')))) {
            return back()->with('error', 'Please provide a brief description for the Other duty category.');
        }

        $start = Carbon::parse($validated['start_date']);
        $end = Carbon::parse($validated['end_date']);

        $dutyLabel = $validated['duty_type'] === 'Other' ? trim($validated['custom_duty_notes']) : $validated['duty_type'];

        $replacementStaff = !empty($validated['replacement_staff_id'])
            ? Staff::find($validated['replacement_staff_id'])
            : null;

        $remarks = 'Official Duty: ' . $dutyLabel;
        if ($replacementStaff) {
            $remarks .= ' [Stand-in: ' . $replacementStaff->first_name . ' ' . $replacementStaff->last_name . ']';
        }
        if (!empty($validated['notes'])) {
            $remarks .= ' - ' . $validated['notes'];
        }

        $activeYear = AcademicYear::where('school_id', $sid)->where('is_current', true)->first();
        $count = 0;

        DB::transaction(function () use ($sid, $start, $end, $validated, $remarks, $activeYear, &$count) {
            for ($curr = $start->copy(); $curr->lte($end); $curr->addDay()) {
                if ($curr->isWeekend()) {
                    continue;
                }
                $dateStr = $curr->toDateString();

                Attendance::updateOrCreate(
                    [
                        'school_id' => $sid,
                        'date' => $dateStr,
                        'session' => 'full_day',
                        'attendable_type' => Staff::class,
                        'attendable_id' => $validated['staff_id'],
                    ],
                    [
                        'academic_year_id' => $activeYear?->id,
                        'status' => 'official_duty',
                        'time_in' => '07:30',
                        'time_out' => '17:00',
                        'remarks' => $remarks,
                        'marked_by' => auth()->id(),
                    ]
                );
                $count++;
            }
        });

        return back()->with('success', sprintf('Official Duty recorded for %d school day(s) for %s.', $count, $dutyLabel));
    }

    /**
     * Weekly Teacher on Duty (TOD) Roster
     */
    public function dutyRosterIndex(Request $request): Response
    {
        $this->authorize('viewAny', [Attendance::class]);

        $sid = $this->getSchoolId();
                $resolvedDate = $request->input('week_start') ?: today()->toDateString();
        $academicContext = AcademicTermService::resolveContext($resolvedDate, $sid);

        $weekStart = $academicContext['week_start'];
        $weekEnd = $academicContext['week_end'];
        $academicYearName = $academicContext['academic_year_name'];
        $academicYear = AcademicYear::find($academicContext['academic_year_id']);

        $selectedTerm = $request->input('term', $academicContext['term']);
        $selectedWeekNum = (int) $request->input('week_number', $academicContext['week_number']);

        $rosters = TeacherDutyRoster::where('school_id', $sid)
            ->whereDate('start_date', '<=', $weekEnd)
            ->whereDate('end_date', '>=', $weekStart)
            ->with([
                'assignments.assignedStaff:id,first_name,last_name,emp_id,phone',
                'assignments.replacementStaff:id,first_name,last_name,emp_id,phone',
                'assignments.replacementChangedBy:id,name',
            ])
            ->get();

        $staff = Staff::where('school_id', $sid)
            ->where('status', 'active')
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'emp_id', 'phone']);

        $dutyStations = [
            'Main Gate & Assembly',
            'Dining Hall & Kitchen',
            'Academic Blocks & Labs',
            'Sports Field & Compound',
            'Dormitories & Boarding',
            'Library & Study Halls',
        ];

        $terms = ['Term 1', 'Term 2', 'Term 3'];

        return Inertia::render('SchoolAdmin/Attendance/DutyRoster', [
            'weekStart' => $weekStart,
            'weekEnd' => $weekEnd,
            'academicPeriod' => [
                'academic_year' => $academicYearName,
                'academic_year_id' => $academicYear?->id,
                'term' => $selectedTerm,
                'week_number' => $selectedWeekNum,
            ],
            'availableTerms' => $terms,
            'rosters' => $rosters,
            'staffList' => $staff,
            'dutyStations' => $dutyStations,
        ]);
    }

    /**
     * Store new or updated weekly TOD roster
     */
    public function dutyRosterStore(Request $request): RedirectResponse
    {
        $this->authorize('markStaff', [Attendance::class, []]);

        $sid = $this->getSchoolId();

        $validated = $request->validate([
            'title' => 'required|string|max:200',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'term' => 'nullable|string|max:50',
            'week_number' => 'nullable|integer|min:1|max:52',
            'academic_year_id' => 'nullable|exists:academic_years,id',
            'assignments' => 'required|array|min:1',
            'assignments.*.staff_id' => 'required|exists:staff,id',
            'assignments.*.duty_station' => 'required|string|max:150',
            'assignments.*.day_of_week' => 'required|string|max:30',
            'assignments.*.shift' => 'required|in:morning,afternoon,full_day',
            'assignments.*.instructions' => 'nullable|string|max:500',
        ]);

        DB::transaction(function () use ($sid, $validated) {
            $roster = TeacherDutyRoster::create([
                'school_id' => $sid,
                'title' => $validated['title'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'term' => $validated['term'] ?? 'Term 1',
                'week_number' => $validated['week_number'] ?? null,
                'academic_year_id' => $validated['academic_year_id'] ?? null,
                'is_active' => true,
                'created_by' => auth()->id(),
            ]);

            foreach ($validated['assignments'] as $asgn) {
                TeacherDutyAssignment::create([
                    'school_id' => $sid,
                    'duty_roster_id' => $roster->id,
                    'staff_id' => $asgn['staff_id'],
                    'duty_station' => $asgn['duty_station'],
                    'day_of_week' => $asgn['day_of_week'],
                    'shift' => $asgn['shift'],
                    'instructions' => $asgn['instructions'] ?? null,
                    'created_by' => auth()->id(),
                ]);
            }
        });

        return back()->with('success', 'Weekly duty roster created successfully.');
    }

    /**
     * Assign a stand-in / replacement teacher without overwriting original assignment.
     */
    public function dutyRosterStandIn(Request $request): RedirectResponse
    {
        $this->authorize('markStaff', [Attendance::class, []]);

        $sid = $this->getSchoolId();

        $validated = $request->validate([
            'assignment_id' => 'required|exists:teacher_duty_assignments,id',
            'replacement_staff_id' => 'nullable|exists:staff,id',
            'replacement_reason' => 'nullable|string|max:500',
            'replacement_scope' => 'nullable|in:full_week,single_day,custom_hours',
            'replacement_time_window' => 'nullable|string|max:100',
        ]);

        $assignment = TeacherDutyAssignment::where('id', $validated['assignment_id'])
            ->where('school_id', $sid)
            ->firstOrFail();

        $assignment->update([
            'replacement_staff_id' => $validated['replacement_staff_id'] ?: null,
            'replacement_reason' => $validated['replacement_reason'] ?: null,
            'replacement_scope' => $validated['replacement_scope'] ?? 'full_week',
            'replacement_time_window' => $validated['replacement_time_window'] ?: null,
            'replacement_changed_by' => auth()->id(),
            'replacement_at' => now(),
        ]);

        return back()->with('success', 'Stand-in teacher assignment updated successfully.');
    }

    /**
     * Copy recurring duty schedule from the previous active week.
     */
    public function duplicatePreviousDutyRoster(Request $request): RedirectResponse
    {
        $this->authorize('markStaff', [Attendance::class, []]);

        $sid = $this->getSchoolId();

        $validated = $request->validate([
            'target_week_start' => 'required|date',
        ]);

        $targetStart = Carbon::parse($validated['target_week_start'])->startOfWeek(Carbon::MONDAY)->toDateString();
        $targetEnd = Carbon::parse($targetStart)->endOfWeek(Carbon::FRIDAY)->toDateString();

        $previousStart = Carbon::parse($targetStart)->subWeek()->toDateString();
        $previousEnd = Carbon::parse($targetEnd)->subWeek()->toDateString();

        $previousRoster = TeacherDutyRoster::where('school_id', $sid)
            ->whereDate('start_date', '<=', $previousEnd)
            ->whereDate('end_date', '>=', $previousStart)
            ->with('assignments')
            ->first();

        if (!$previousRoster || $previousRoster->assignments->isEmpty()) {
            return back()->withErrors(['message' => 'No existing duty roster found for the previous week to copy from.']);
        }

        $existingCurrent = TeacherDutyRoster::where('school_id', $sid)
            ->whereDate('start_date', '<=', $targetEnd)
            ->whereDate('end_date', '>=', $targetStart)
            ->first();

        if ($existingCurrent) {
            return back()->withErrors(['message' => 'A duty roster already exists for the selected target week.']);
        }

        DB::transaction(function () use ($sid, $previousRoster, $targetStart, $targetEnd) {
            $newRoster = TeacherDutyRoster::create([
                'school_id' => $sid,
                'title' => "Teacher Duty Roster ({$targetStart})",
                'start_date' => $targetStart,
                'end_date' => $targetEnd,
                'term' => $previousRoster->term,
                'week_number' => $previousRoster->week_number ? ($previousRoster->week_number + 1) : null,
                'academic_year_id' => $previousRoster->academic_year_id,
                'is_active' => true,
                'created_by' => auth()->id(),
            ]);

            foreach ($previousRoster->assignments as $asgn) {
                TeacherDutyAssignment::create([
                    'school_id' => $sid,
                    'duty_roster_id' => $newRoster->id,
                    'staff_id' => $asgn->staff_id,
                    'duty_station' => $asgn->duty_station,
                    'day_of_week' => $asgn->day_of_week,
                    'shift' => $asgn->shift,
                    'instructions' => $asgn->instructions,
                    'replacement_staff_id' => null,
                    'replacement_reason' => null,
                    'replacement_scope' => 'full_week',
                    'replacement_time_window' => null,
                    'replacement_changed_by' => null,
                    'replacement_at' => null,
                    'created_by' => auth()->id(),
                ]);
            }
        });

        return back()->with('success', "Recurring schedule cloned successfully for week {$targetStart} ({$previousRoster->assignments->count()} station assignments).");
    }

    public function dutyRosterExportCsv(Request $request)
    {
        $this->authorize('export', [Attendance::class]);

        $sid = $this->getSchoolId();
        $weekStart = $request->input('week_start')
            ? Carbon::parse($request->input('week_start'))->startOfWeek(Carbon::MONDAY)->toDateString()
            : Carbon::now()->startOfWeek(Carbon::MONDAY)->toDateString();
        $weekEnd = Carbon::parse($weekStart)->endOfWeek(Carbon::FRIDAY)->toDateString();

        $assignments = TeacherDutyAssignment::where('school_id', $sid)
            ->whereHas('roster', fn ($q) => $q->whereDate('start_date', '<=', $weekEnd)->whereDate('end_date', '>=', $weekStart))
            ->with(['roster.academicYear', 'assignedStaff', 'replacementStaff'])
            ->get();

        $activeRoster = $assignments->first()?->roster;
        $term = $activeRoster?->term ?? 'Term 1';
        $weekNum = $activeRoster?->week_number ?? '1';
        $academicYearName = $activeRoster?->academicYear?->name ?? Carbon::now()->format('Y');

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="teacher_duty_roster_' . $weekStart . '.csv"',
        ];

        $callback = function () use ($assignments, $weekStart, $weekEnd, $academicYearName, $term, $weekNum) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Teacher Duty Roster', "Academic Year: {$academicYearName}", "Term: {$term}", "Week: {$weekNum}", "Period: {$weekStart} to {$weekEnd}"]);
            fputcsv($handle, ['Academic Year', 'Term', 'Week', 'Day of Week', 'Duty Station', 'Assigned Teacher', 'Staff ID', 'Shift', 'Stand-in / Replacement', 'Stand-in Scope', 'Time Window / Hours', 'Replacement Reason', 'Notes']);

            foreach ($assignments as $a) {
                $orig = $a->assignedStaff ? ($a->assignedStaff->first_name . ' ' . $a->assignedStaff->last_name) : 'N/A';
                $rep = $a->replacementStaff ? ($a->replacementStaff->first_name . ' ' . $a->replacementStaff->last_name) : 'None';

                fputcsv($handle, [
                    $academicYearName,
                    $term,
                    "Week {$weekNum}",
                    $a->day_of_week,
                    $a->duty_station,
                    $orig,
                    $a->assignedStaff?->emp_id ?? 'N/A',
                    ucfirst(str_replace('_', ' ', $a->shift)),
                    $rep,
                    $a->replacement_scope ? ucfirst(str_replace('_', ' ', $a->replacement_scope)) : 'N/A',
                    $a->replacement_time_window ?? 'N/A',
                    $a->replacement_reason ?? 'None',
                    $a->instructions ?? 'None',
                ]);
            }

            fclose($handle);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Get 360° Teacher Profile aggregating attendance, leave, TOD, and timetables.
     */
    public function staffProfile(Request $request, int $staffId)
    {
        $sid = $this->getSchoolId();
        $filters = [
            'date'        => $request->input('date'),
            'term'        => $request->input('term'),
            'week_number' => $request->input('week_number'),
            'year'        => $request->input('year'),
        ];

        $profile = TeacherProfileService::getTeacher360Profile($staffId, $sid, $filters);

        if ($request->wantsJson() || $request->header('X-Inertia-Partial-Data')) {
            return response()->json($profile);
        }

        return Inertia::render('SchoolAdmin/Attendance/TeacherProfile', [
            'profile' => $profile,
            'filters' => $filters,
        ]);
    }
}
