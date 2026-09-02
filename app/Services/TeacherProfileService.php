<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\LeaveRequest;
use App\Models\SchoolClass;
use App\Models\Staff;
use App\Models\Subject;
use App\Models\TeacherAssignment;
use App\Models\Timetable;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TeacherProfileService
{
    /**
     * Build comprehensive 360° teacher record aggregated strictly from authoritative modules.
     */
    public static function getTeacher360Profile(int $staffId, int $schoolId, array $filters = []): array
    {
        // 1. Staff Baseline & Roles (Tenant-isolated)
        $staff = Staff::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('id', $staffId)
            ->with([
                'department:id,name',
                'designation:id,name',
                'user' => fn ($q) => $q->withoutGlobalScopes()->with('roles:id,name'),
            ])
            ->firstOrFail();

        // Time Filters Resolution
        $year = (int) ($filters['year'] ?? today()->year);
        $academicContext = AcademicTermService::resolveContext($filters['date'] ?? null, $schoolId);
        $selectedTerm = $filters['term'] ?? null;
        $selectedWeek = isset($filters['week_number']) ? (int) $filters['week_number'] : null;

        // 2. Attendance History & Statistics
        $attendanceQuery = Attendance::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('attendable_type', Staff::class)
            ->where('attendable_id', $staffId);

        if (!empty($filters['date'])) {
            $attendanceQuery->whereDate('date', $filters['date']);
        } elseif (!empty($filters['start_date']) && !empty($filters['end_date'])) {
            $attendanceQuery->whereBetween('date', [$filters['start_date'], $filters['end_date']]);
        } else {
            // Default to current academic year
            $attendanceQuery->whereYear('date', $year);
        }

        $allAttendances = $attendanceQuery->orderByDesc('date')->get();

        $attendanceStats = [
            'total'          => $allAttendances->count(),
            'present'        => $allAttendances->where('status', 'present')->count(),
            'absent'         => $allAttendances->where('status', 'absent')->count(),
            'half_day'       => $allAttendances->where('status', 'half_day')->count(),
            'approved_leave' => $allAttendances->where('status', 'on_leave')->count(),
            'official_duty'  => $allAttendances->where('status', 'official_duty')->count(),
        ];

        $attendanceLog = $allAttendances->map(function ($item) use ($schoolId) {
            $ctx = AcademicTermService::resolveContext($item->date, $schoolId);
            return [
                'id'          => $item->id,
                'date'        => is_string($item->date) ? $item->date : Carbon::parse($item->date)->toDateString(),
                'term'        => $ctx['term'],
                'week_number' => $ctx['week_number'],
                'status'      => $item->status,
                'time_in'     => $item->time_in,
                'time_out'    => $item->time_out,
                'remarks'     => $item->remarks,
            ];
        });

        // Filter attendance log if specific term/week requested
        if ($selectedTerm) {
            $attendanceLog = $attendanceLog->where('term', $selectedTerm)->values();
        }
        if ($selectedWeek) {
            $attendanceLog = $attendanceLog->where('week_number', $selectedWeek)->values();
        }

        // 3. Leave Management History (Authoritative Source)
        $leaves = LeaveRequest::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('staff_id', $staffId)
            ->with(['leaveType:id,name,code,policy_category'])
            ->orderByDesc('start_date')
            ->get()
            ->map(function ($lr) {
                return [
                    'id'              => $lr->id,
                    'leave_type'      => $lr->leaveType?->name ?? 'General Leave',
                    'policy_category' => $lr->leaveType?->policy_category ?? 'general',
                    'start_date'      => Carbon::parse($lr->start_date)->toDateString(),
                    'end_date'        => Carbon::parse($lr->end_date)->toDateString(),
                    'days'            => $lr->days,
                    'status'          => $lr->status, // pending, approved, rejected
                    'reason'          => $lr->reason,
                    'approval_note'   => $lr->approval_note,
                    'actioned_at'     => $lr->actioned_at ? Carbon::parse($lr->actioned_at)->toDateTimeString() : null,
                ];
            });

        // 4. Teacher on Duty (TOD) & Stand-In History
        $rosters = DB::table('teacher_duty_assignments as tda')
            ->join('teacher_duty_rosters as tdr', 'tdr.id', '=', 'tda.duty_roster_id')
            ->leftJoin('staff as repl_staff', 'repl_staff.id', '=', 'tda.replacement_staff_id')
            ->leftJoin('users as changed_user', 'changed_user.id', '=', 'tda.replacement_changed_by')
            ->where('tda.school_id', $schoolId)
            ->where(function ($q) use ($staffId) {
                $q->where('tda.staff_id', $staffId)
                  ->orWhere('tda.replacement_staff_id', $staffId);
            })
            ->select([
                'tda.id as assignment_id',
                'tdr.academic_year_id',
                'tdr.term',
                'tdr.week_number',
                'tdr.start_date as week_start',
                'tdr.end_date as week_end',
                'tda.duty_station',
                'tda.day_of_week',
                'tda.shift',
                'tda.effective_date',
                'tda.staff_id as primary_staff_id',
                'tda.replacement_staff_id',
                'tda.replacement_reason',
                'tda.replacement_at',
                DB::raw("CONCAT(repl_staff.first_name, ' ', repl_staff.last_name) as replacement_teacher_name"),
                'changed_user.name as changed_by_name',
            ])
            ->orderByDesc('tdr.start_date')
            ->get();

        $dutyHistory = $rosters->map(function ($d) use ($staffId) {
            $isStandIn = ((int)$d->replacement_staff_id === $staffId);
            return [
                'assignment_id'            => $d->assignment_id,
                'term'                     => $d->term,
                'week_number'              => $d->week_number,
                'week_start'               => $d->week_start,
                'week_end'                 => $d->week_end,
                'duty_station'             => $d->duty_station,
                'day_of_week'              => $d->day_of_week,
                'shift'                    => $d->shift,
                'effective_date'           => $d->effective_date,
                'is_stand_in'              => $isStandIn,
                'replacement_teacher_name' => $d->replacement_teacher_name,
                'replacement_reason'       => $d->replacement_reason,
                'changed_by'               => $d->changed_by_name,
                'changed_at'               => $d->replacement_at,
            ];
        });

        // 5. Timetable Lessons
        $timetables = Timetable::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('teacher_id', $staffId)
            ->with([
                'schoolClass:id,name',
                'section:id,name',
                'subject:id,name,code',
            ])
            ->orderByRaw("FIELD(day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')")
            ->orderBy('start_time')
            ->get()
            ->map(function ($t) {
                return [
                    'id'          => $t->id,
                    'day_of_week' => ucfirst($t->day_of_week),
                    'start_time'  => substr($t->start_time, 0, 5),
                    'end_time'    => substr($t->end_time, 0, 5),
                    'class_name'  => $t->schoolClass?->name ?? 'N/A',
                    'section'     => $t->section?->name,
                    'subject'     => $t->subject?->name ?? 'N/A',
                    'room'        => $t->room,
                ];
            });

        // 6. Classes & Subjects Assigned
        $headClasses = SchoolClass::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('class_teacher_id', $staffId)
            ->get(['id', 'name']);

        $teachingClasses = $timetables->pluck('class_name')->unique()->values();
        $teachingSubjects = $timetables->pluck('subject')->unique()->values();

        // 7. Official Duty Occurrences from Attendance
        $officialDuties = $allAttendances
            ->where('status', 'official_duty')
            ->map(function ($item) {
                return [
                    'date'    => is_string($item->date) ? $item->date : Carbon::parse($item->date)->toDateString(),
                    'remarks' => $item->remarks ?? 'Official School Assignment',
                ];
            })
            ->values();

        // 8. Staff Roles
        $roles = $staff->user?->roles?->pluck('name')->all() ?? [];
        if ($headClasses->isNotEmpty()) {
            $roles[] = 'Class Teacher';
        }
        if ($dutyHistory->isNotEmpty()) {
            $roles[] = 'Teacher on Duty';
        }

        return [
            'staff' => [
                'id'          => $staff->id,
                'name'        => "{$staff->first_name} {$staff->last_name}",
                'emp_id'      => $staff->emp_id,
                'department'  => $staff->department?->name ?? 'Academics',
                'designation' => $staff->designation?->name ?? 'Teacher',
                'phone'       => $staff->phone,
                'email'       => $staff->email,
                'status'      => $staff->status,
                'roles'       => array_values(array_unique($roles)),
            ],
            'academic_context' => $academicContext,
            'attendance_stats' => $attendanceStats,
            'attendance_log'   => $attendanceLog,
            'leaves'           => $leaves,
            'duty_history'     => $dutyHistory,
            'timetables'       => $timetables,
            'classes_taught'   => $teachingClasses,
            'subjects_taught'  => $teachingSubjects,
            'class_teacher_of' => $headClasses->pluck('name')->all(),
            'official_duties'  => $officialDuties,
        ];
    }
}