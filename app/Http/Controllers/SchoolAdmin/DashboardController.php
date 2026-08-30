<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\FeePayment;
use App\Models\School;
use App\Models\Staff;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = $this->getSchoolId();
        $school = School::withoutGlobalScopes()->find($schoolId);

        // 1. Enrollment & Staff Metrics
        $studentCount = Student::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where(function ($q) {
                $q->where('status', 'active')->orWhereNull('status');
            })
            ->count();

        $staffCount = Staff::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where(function ($q) {
                $q->where('status', 'active')->orWhereNull('status');
            })
            ->count();

        // 2. Attendance & Today's Percentage
        $latestAttendanceDate = Attendance::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('attendable_type', Student::class)
            ->max('date') ?? today()->toDateString();

        $attRecord = Attendance::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('attendable_type', Student::class)
            ->whereDate('date', $latestAttendanceDate)
            ->selectRaw('COUNT(*) as total, SUM(CASE WHEN status IN (\'present\', \'late\', \'half_day\') THEN 1 ELSE 0 END) as attended')
            ->first();

        $attendanceTodayPercentage = ($attRecord && (int)$attRecord->total > 0)
            ? round(((int) $attRecord->attended / (int) $attRecord->total) * 100, 1)
            : 0.0;

        // 3. Term Fee Collections & Breakdown
        $termCollected = (float) FeePayment::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->sum('amount_paid');

        $structureSum = (float) DB::table('fee_structures')
            ->where('school_id', $schoolId)
            ->sum('amount');

        $totalBilled = $structureSum * $studentCount;
        $balance = max(0, $totalBilled - $termCollected);
        $rate = $totalBilled > 0 ? round(($termCollected / $totalBilled) * 100, 1) : 0.0;

        $termFeeCollection = [
            'total_billed'    => (float) $totalBilled,
            'total_collected' => (float) $termCollected,
            'balance'         => (float) $balance,
            'rate'            => (float) $rate,
        ];

        // 4. Co-Curricular Summary
        $teamsCount = Schema::hasTable('sports_teams')
            ? DB::table('sports_teams')->where('school_id', $schoolId)->count()
            : 0;
        $clubsCount = Schema::hasTable('clubs')
            ? DB::table('clubs')->where('school_id', $schoolId)->count()
            : 0;

                        $isCocurricularEnabled = \App\Models\SchoolModule::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('module_slug', 'cocurricular')
            ->where('is_enabled', true)
            ->exists();

        if (! $isCocurricularEnabled) {
            $cocurricularSummary = null;
        } else {
            $teamsCount = \Illuminate\Support\Facades\Schema::hasTable('teams')
                ? (int) \Illuminate\Support\Facades\DB::table('teams')->where('school_id', $schoolId)->count()
                : 0;

            $clubsCount = \Illuminate\Support\Facades\Schema::hasTable('clubs')
                ? (int) \Illuminate\Support\Facades\DB::table('clubs')->where('school_id', $schoolId)->count()
                : 0;

            $upcomingEventsCount = \Illuminate\Support\Facades\Schema::hasTable('school_events')
                ? (int) \Illuminate\Support\Facades\DB::table('school_events')->where('school_id', $schoolId)->where('start_date', '>=', now())->count()
                : 0;

            $leadingHouse = \Illuminate\Support\Facades\Schema::hasTable('houses')
                ? \Illuminate\Support\Facades\DB::table('houses')->where('school_id', $schoolId)->orderByDesc('points')->first(['name', 'points as total_points', 'color_hex'])
                : null;

            $achievementsCount = \Illuminate\Support\Facades\Schema::hasTable('student_achievements')
                ? (int) \Illuminate\Support\Facades\DB::table('student_achievements')->where('school_id', $schoolId)->count()
                : 0;

            $cocurricularSummary = [
                'active_teams_count'        => $teamsCount,
                'active_clubs_count'        => $clubsCount,
                'upcoming_events_count'     => $upcomingEventsCount,
                'leading_house'             => $leadingHouse ? (array) $leadingHouse : null,
                'recent_achievements_count' => $achievementsCount,
            ];
        }

        // 5. Daily Attendance Chart Series
        $dailyAttendanceChart = [];

        // 6. Recent Payments
        $recentPayments = FeePayment::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->with('student:id,first_name,last_name')
            ->latest('id')
            ->limit(5)
            ->get()
            ->map(function ($p) {
                return [
                    'id'             => $p->id,
                    'receipt_number' => $p->receipt_number ?? ('REC-00' . $p->id),
                    'student_name'   => $p->student ? ($p->student->first_name . ' ' . $p->student->last_name) : 'Learner',
                    'amount'         => (float) $p->amount_paid,
                    'method'         => strtoupper($p->payment_method ?? 'M-PESA'),
                    'created_at'     => $p->created_at ? $p->created_at->diffForHumans() : 'Just now',
                ];
            })
            ->toArray();

        // 7. Action Queue
        $pendingApprovals = [];

        return Inertia::render('Dashboard', [
            'studentCount'              => $studentCount,
            'staffCount'                => $staffCount,
            'attendanceTodayPercentage' => $attendanceTodayPercentage,
            'termFeeCollection'         => $termFeeCollection,
            'cocurricularSummary'       => $cocurricularSummary,
            'dailyAttendanceChart'      => $dailyAttendanceChart,
            'recentPayments'            => $recentPayments,
            'pendingApprovals'          => $pendingApprovals,
            'schoolAnnouncements'       => [],
        ]);
    }
}