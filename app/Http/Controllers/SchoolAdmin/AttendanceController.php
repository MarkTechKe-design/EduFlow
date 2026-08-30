<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Jobs\SendSmsBlast;
use App\Models\AcademicYear;
use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use App\Models\Section;
use App\Models\Staff;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    /**
     * Student Attendance Roll-Call Register
     */
    public function index(Request $request): Response
    {
        $sid       = $this->getSchoolId();
        $date      = $request->input('date', Carbon::today()->toDateString());
        $session   = $request->input('session', 'morning');
        $classId   = $request->input('class_id');
        $sectionId = $request->input('section_id');

        $students = collect();
        $existing = collect();

                if ($classId) {
            $studentCols = ['id', 'first_name', 'last_name', 'roll_no', 'section_id', 'gender', 'guardian_phone'];
            if (\Illuminate\Support\Facades\Schema::hasColumn('students', 'admission_no')) {
                $studentCols[] = 'admission_no';
            } elseif (\Illuminate\Support\Facades\Schema::hasColumn('students', 'admission_number')) {
                $studentCols[] = 'admission_number';
            }

            $orderCol = \Illuminate\Support\Facades\Schema::hasColumn('students', 'admission_no') 
                ? 'admission_no' 
                : (\Illuminate\Support\Facades\Schema::hasColumn('students', 'roll_no') ? 'roll_no' : 'first_name');

            $students = Student::withoutGlobalScopes()
                ->where('school_id', $sid)
                ->where('status', 'active')
                ->where('class_id', $classId)
                ->when($sectionId, fn ($q) => $q->where('section_id', $sectionId))
                ->with('section:id,name')
                ->orderBy($orderCol)
                ->get($studentCols);

            $existing = Attendance::where([
                'school_id'       => $sid,
                'date'            => $date,
                'session'         => $session,
                'attendable_type' => Student::class,
            ])
            ->whereIn('attendable_id', $students->pluck('id'))
            ->get(['attendable_id', 'status', 'remarks', 'time_in', 'notification_sent'])
            ->keyBy('attendable_id');
        }

        // Compute real-time stats for the class
        $stats = [
            'total'    => $students->count(),
            'present'  => $existing->where('status', 'present')->count(),
            'absent'   => $existing->where('status', 'absent')->count(),
            'late'     => $existing->where('status', 'late')->count(),
            'excused'  => $existing->whereIn('status', ['excused', 'official_activity'])->count(),
        ];

        return Inertia::render('SchoolAdmin/Attendance/Index', [
            'classes'  => SchoolClass::where('school_id', $sid)->orderBy('numeric_name')->get(['id', 'name']),
            'sections' => Section::where('school_id', $sid)->orderBy('name')->get(['id', 'class_id', 'name']),
            'students' => $students,
            'existing' => $existing,
            'stats'    => $stats,
            'filters'  => [
                'date'       => $date,
                'session'    => $session,
                'class_id'   => $classId ? (int)$classId : null,
                'section_id' => $sectionId ? (int)$sectionId : null,
            ],
        ]);
    }

    /**
     * Store Student Attendance Batch
     */
    public function store(Request $request): RedirectResponse
    {
        $sid = $this->getSchoolId();

        abort_unless(
            SchoolClass::whereKey($request->input('class_id'))->where('school_id', $sid)->exists(),
            403
        );

        foreach ((array) $request->input('records', []) as $record) {
            abort_unless(
                Student::withoutGlobalScopes()
                    ->whereKey($record['student_id'] ?? null)
                    ->where('school_id', $sid)
                    ->where('class_id', $request->input('class_id'))
                    ->exists(),
                403
            );
        }

        $data = $request->validate([
            'date'                  => 'required|date',
            'session'               => 'required|in:morning,afternoon,evening_dorm',
            'class_id'              => 'required|integer',
            'send_absence_sms'      => 'boolean',
            'records'               => 'required|array|min:1',
            'records.*.student_id'  => 'required|integer',
            'records.*.status'      => 'required|in:present,absent,late,excused,official_activity',
            'records.*.remarks'     => 'nullable|string|max:255',
            'records.*.time_in'     => 'nullable|string|max:10',
        ]);

        $activeYear = AcademicYear::where('school_id', $sid)->where('is_active', true)->first();
        $absentPhones = [];

        DB::transaction(function () use ($data, $sid, $activeYear, &$absentPhones) {
            foreach ($data['records'] as $r) {
                $att = Attendance::updateOrCreate(
                    [
                        'school_id'       => $sid,
                        'date'            => $data['date'],
                        'session'         => $data['session'],
                        'attendable_type' => Student::class,
                        'attendable_id'   => $r['student_id'],
                    ],
                    [
                        'academic_year_id' => $activeYear?->id,
                        'status'           => $r['status'],
                        'time_in'          => $r['time_in'] ?? null,
                        'remarks'          => $r['remarks'] ?? null,
                        'marked_by'        => auth()->id(),
                    ]
                );

                // Collect guardian phone for unexcused morning absences
                if ($r['status'] === 'absent' && !empty($data['send_absence_sms']) && !$att->notification_sent) {
                    $student = Student::withoutGlobalScopes()->find($r['student_id']);
                    if ($student && !empty($student->guardian_phone)) {
                        $absentPhones[] = [
                            'phone'   => $student->guardian_phone,
                            'student' => "{$student->first_name} {$student->last_name}",
                            'adm'     => $student->admission_no ?? $student->admission_number ?? $student->roll_no ?? 'N/A',
                            'att_id'  => $att->id,
                        ];
                    }
                }
            }
        });

        // Dispatch instant alert SMS to parents of unexcused absent learners
        if (!empty($absentPhones)) {
            $settings = SchoolSetting::allFor($sid);
            $schoolName = $settings['school_name'] ?? 'EduFlow Academy';
            $dateFormatted = Carbon::parse($data['date'])->format('d M Y');

            foreach ($absentPhones as $item) {
                $msg = "Dear Parent, your child {$item['student']} (Adm: {$item['adm']}) was marked ABSENT for the {$data['session']} roll-call on {$dateFormatted} at {$schoolName}. Please contact the school if this is unverified.";
                SendSmsBlast::dispatch([$item['phone']], $msg, $sid);
                Attendance::where('id', $item['att_id'])->update(['notification_sent' => true]);
            }
        }

        return back()->with('success', 'Class roll-call successfully recorded for ' . Carbon::parse($data['date'])->format('d M Y') . '.');
    }

    /**
     * Single Student Attendance History
     */
    public function studentCalendar(Request $request, Student $student): Response
    {
        $sid = $this->getSchoolId();
        $month = $request->input('month', Carbon::today()->format('Y-m'));
        [$year, $mon] = explode('-', $month);

        $records = Attendance::where([
            'school_id'       => $sid,
            'attendable_type' => Student::class,
            'attendable_id'   => $student->id,
        ])
        ->whereYear('date', $year)
        ->whereMonth('date', $mon)
        ->get(['date', 'session', 'status', 'remarks', 'time_in'])
        ->groupBy(fn ($r) => Carbon::parse($r->date)->toDateString());

        $student->load(['schoolClass:id,name', 'section:id,name']);

        return Inertia::render('SchoolAdmin/Attendance/StudentCalendar', [
            'student' => $student,
            'records' => $records,
            'month'   => $month,
        ]);
    }

    /**
     * Staff Daily Attendance & Duty Clock-in
     */
    public function staffIndex(Request $request): Response
    {
        $sid          = $this->getSchoolId();
        $date         = $request->input('date', Carbon::today()->toDateString());
        $departmentId = $request->input('department_id');

        $staff = Staff::where('school_id', $sid)
            ->where('status', 'active')
            ->when($departmentId, fn ($q) => $q->where('department_id', $departmentId))
            ->with(['department:id,name', 'designation:id,name'])
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'emp_id', 'department_id', 'designation_id', 'phone']);

        $existing = Attendance::where([
            'school_id'       => $sid,
            'date'            => $date,
            'attendable_type' => Staff::class,
        ])
        ->whereIn('attendable_id', $staff->pluck('id'))
        ->get(['attendable_id', 'status', 'time_in', 'time_out', 'remarks'])
        ->keyBy('attendable_id');

        // Check active approved leaves for cross-referencing
        $activeLeaves = LeaveRequest::where('school_id', $sid)
            ->where('status', 'approved')
            ->whereDate('start_date', '<=', $date)
            ->whereDate('end_date', '>=', $date)
            ->with('leaveType:id,name,code')
            ->get()
            ->keyBy('staff_id');

        $stats = [
            'total'     => $staff->count(),
            'present'   => $existing->where('status', 'present')->count(),
            'absent'    => $existing->where('status', 'absent')->count(),
            'late'      => $existing->where('status', 'late')->count(),
            'on_leave'  => $activeLeaves->count(),
        ];

        return Inertia::render('SchoolAdmin/Attendance/StaffIndex', [
            'staffList'    => $staff,
            'existing'     => $existing,
            'activeLeaves' => $activeLeaves,
            'stats'        => $stats,
            'departments'  => \App\Models\Department::where('school_id', $sid)->orderBy('name')->get(['id', 'name']),
            'filters'      => [
                'date'          => $date,
                'department_id' => $departmentId ? (int)$departmentId : null,
            ],
        ]);
    }

    /**
     * Store Staff Attendance Batch
     */
    public function staffStore(Request $request): RedirectResponse
    {
        $sid = $this->getSchoolId();

        foreach ((array) $request->input('records', []) as $record) {
            abort_unless(
                Staff::whereKey($record['staff_id'] ?? null)->where('school_id', $sid)->exists(),
                403
            );
        }

        $data = $request->validate([
            'date'                => 'required|date',
            'records'             => 'required|array|min:1',
            'records.*.staff_id'  => 'required|integer',
            'records.*.status'    => 'required|in:present,absent,late,on_leave,official_duty,half_day',
            'records.*.time_in'   => 'nullable|string|max:10',
            'records.*.time_out'  => 'nullable|string|max:10',
            'records.*.remarks'   => 'nullable|string|max:255',
        ]);

        $activeYear = AcademicYear::where('school_id', $sid)->where('is_active', true)->first();

        DB::transaction(function () use ($data, $sid, $activeYear) {
            foreach ($data['records'] as $r) {
                Attendance::updateOrCreate(
                    [
                        'school_id'       => $sid,
                        'date'            => $data['date'],
                        'session'         => 'full_day',
                        'attendable_type' => Staff::class,
                        'attendable_id'   => $r['staff_id'],
                    ],
                    [
                        'academic_year_id' => $activeYear?->id,
                        'status'           => $r['status'],
                        'time_in'          => $r['time_in'] ?? null,
                        'time_out'         => $r['time_out'] ?? null,
                        'remarks'          => $r['remarks'] ?? null,
                        'marked_by'        => auth()->id(),
                    ]
                );
            }
        });

        return back()->with('success', 'Staff attendance roster saved for ' . Carbon::parse($data['date'])->format('d M Y') . '.');
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
