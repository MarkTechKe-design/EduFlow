<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\FeePayment;
use App\Models\School;
use App\Models\Staff;
use App\Models\Student;
use App\Services\CoCurricularService;
use App\Support\Authorization\ModuleAccessService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = $this->getSchoolId();
        $school = School::query()->findOrFail($schoolId);
        $user = $request->user();

        $activeEnrollment = Student::query()
            ->where('status', 'active')
            ->count();
        $staffCount = Staff::query()
            ->where('status', 'active')
            ->count();

        $attendance = Attendance::query()
            ->whereDate('date', today())
            ->where('attendable_type', Student::class)
            ->selectRaw('COUNT(*) as total, SUM(CASE WHEN status IN (\'present\', \'late\', \'half_day\') THEN 1 ELSE 0 END) as attended')
            ->first();
        $morningRollCallRate = (int) ($attendance?->total ?? 0) > 0
            ? round(((int) $attendance->attended / (int) $attendance->total) * 100, 1)
            : null;

        $termFeeCollections = (float) FeePayment::query()
            ->whereBetween('payment_date', [now()->startOfQuarter(), now()->endOfQuarter()])
            ->sum('amount_paid');
        $outstandingBalance = (float) FeePayment::query()
            ->selectRaw('COALESCE(SUM(amount_due + fine - discount - amount_paid), 0) as balance')
            ->value('balance');

        $students = Student::query()
            ->with(['class:id,name', 'section:id,name'])
            ->latest()
            ->limit(10)
            ->get();

        $metrics = [
            'activeEnrollment' => $activeEnrollment,
            'morningRollCallRate' => $morningRollCallRate,
            'termFeeCollections' => $termFeeCollections,
            'outstandingFeeBalance' => $outstandingBalance,
            'staffCount' => $staffCount,
            'curriculum' => $school->curriculum,
        ];

        // Module-gated Co-Curricular summary
        $cocurricularSummary = null;
        if ($user && app(ModuleAccessService::class)->isEnabledForUser($user, 'cocurricular')) {
            $cocurricularSummary = CoCurricularService::getSchoolDashboardSummary($schoolId);
        }

        return Inertia::render('Dashboard', [
            'school' => $school,
            'activeEnrollment' => $activeEnrollment,
            'morningRollCallRate' => $morningRollCallRate,
            'termFeeCollections' => $termFeeCollections,
            'outstandingFeeBalance' => $outstandingBalance,
            'curriculum' => $school->curriculum,
            'metrics' => $metrics,
            'cocurricularSummary' => $cocurricularSummary,
            'stats' => [
                'totalStudents' => $activeEnrollment,
                'totalStaff' => $staffCount,
                'feeCollectionRate' => null,
                'attendanceRate' => $morningRollCallRate,
                ...$metrics,
            ],
            'recentStudents' => $students,
        ]);
    }
}