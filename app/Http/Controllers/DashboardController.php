<?php

namespace App\Http\Controllers;

use App\Models\FeePayment;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Timetable;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response|\Illuminate\Http\RedirectResponse
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        if ($user->hasRole('super-admin') && ! $user->school_id) {
            return redirect()->route('super-admin.dashboard');
        }

        if ($user->hasRole('student')) {
            return redirect()->route('student.dashboard');
        }

        if ($user->hasRole('parent')) {
            return redirect()->route('parent.dashboard');
        }

        $schoolId = $user->school_id;

        // TEACHER WORKSPACE
        if ($user->hasRole('teacher') && ! $user->hasAnyRole(['school-admin', 'principal'])) {
            $assignedClassesCount = 3;
            $pendingMarkingCount = 4;
            $todayLessonsCount = 3;
            $todaySchedule = [
                ['period' => 1, 'class' => 'Grade 7 CBC', 'subject' => 'Integrated Science', 'time' => '08:30 - 09:15', 'room' => 'Lab 1'],
                ['period' => 2, 'class' => 'Grade 8 CBC', 'subject' => 'Mathematics', 'time' => '09:20 - 10:05', 'room' => 'Room 4A'],
                ['period' => 4, 'class' => 'Grade 9 CBC', 'subject' => 'Agriculture & Nutrition', 'time' => '11:15 - 12:00', 'room' => 'Field Area'],
            ];

            return Inertia::render('Teacher/Dashboard', [
                'assignedClassesCount' => $assignedClassesCount,
                'pendingMarkingCount'  => $pendingMarkingCount,
                'todayLessonsCount'    => $todayLessonsCount,
                'todaySchedule'        => $todaySchedule,
            ]);
        }

        // SCHOOL ADMIN / PRINCIPAL / OPERATIONS HUB
        $studentCount = 150;
        $staffCount = 18;
        $attendanceTodayPercentage = 94.5;
        $termFeeCollection = [
            'total_billed'    => 2850000,
            'total_collected' => 2415000,
            'balance'         => 435000,
            'rate'            => 84.7,
        ];
        $dailyAttendanceChart = [
            ['day' => 'Mon', 'present' => 145, 'absent' => 5],
            ['day' => 'Tue', 'present' => 148, 'absent' => 2],
            ['day' => 'Wed', 'present' => 142, 'absent' => 8],
            ['day' => 'Thu', 'present' => 146, 'absent' => 4],
            ['day' => 'Fri', 'present' => 147, 'absent' => 3],
        ];
        $recentPayments = [
            ['id' => 101, 'receipt_number' => 'REC-00841', 'student_name' => 'Brian Kipchumba', 'amount' => 35000, 'method' => 'M-PESA', 'created_at' => '10 mins ago'],
            ['id' => 102, 'receipt_number' => 'REC-00840', 'student_name' => 'Faith Mwangi', 'amount' => 28000, 'method' => 'BANK', 'created_at' => '1 hour ago'],
            ['id' => 103, 'receipt_number' => 'REC-00839', 'student_name' => 'Emmanuel Ochieng', 'amount' => 15000, 'method' => 'M-PESA', 'created_at' => '3 hours ago'],
        ];

        $pendingApprovals = [
            [
                'id' => '1',
                'title' => 'CBC Assessment Rubric Verification',
                'description' => 'Grade 7 Term 2 Integrated Science strands submitted for validation.',
                'action_url' => route('school.exams.index'),
                'action_label' => 'Review Rubrics',
                'severity' => 'warning',
            ],
            [
                'id' => '2',
                'title' => 'Pending Student Admission Applications',
                'description' => '3 new portal registrations pending document clearance.',
                'action_url' => route('school.students.index'),
                'action_label' => 'View Admissions',
                'severity' => 'info',
            ],
        ];

        return Inertia::render('Dashboard', [
            'studentCount'              => $studentCount,
            'staffCount'                => $staffCount,
            'attendanceTodayPercentage' => $attendanceTodayPercentage,
            'termFeeCollection'         => $termFeeCollection,
            'dailyAttendanceChart'      => $dailyAttendanceChart,
            'recentPayments'            => $recentPayments,
            'pendingApprovals'          => $pendingApprovals,
            'schoolAnnouncements'       => [],
        ]);
    }
}