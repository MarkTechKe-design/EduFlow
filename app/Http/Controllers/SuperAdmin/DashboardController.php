<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\AdmissionInquiry;
use App\Models\Coupon;
use App\Models\Package;
use App\Models\School;
use App\Models\SchoolSubscription;
use App\Models\Staff;
use App\Models\Student;
use App\Models\SubscriptionPayment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class DashboardController extends Controller
{
    public function index()
    {
        $now = Carbon::now();

        /* -- Core KPI Cards -- */
        $totalSchools   = School::count();
        $activeSchools  = School::where('status', 'active')->count();
        $suspended      = School::where('status', 'suspended')->count();
        $totalUsers     = User::count();
        $totalStudents  = Student::count();
        $totalStaff     = Staff::count();

        $activeSubscriptions = SchoolSubscription::where('status', 'active')->count();
        $trialSubscriptions  = SchoolSubscription::where('is_trial', true)
            ->where('status', 'active')->count();

        // Financial Metrics (SaaS MRR & ARR)
        $totalRevenue = (float) SubscriptionPayment::where('status', 'completed')->sum('amount');
        if ($totalRevenue === 0.0) {
            $totalRevenue = (float) SchoolSubscription::sum('amount_paid');
        }

        $revenueThisMonth = (float) SubscriptionPayment::where('status', 'completed')
            ->whereMonth('paid_at', $now->month)
            ->whereYear('paid_at', $now->year)
            ->sum('amount');
        if ($revenueThisMonth === 0.0) {
            $revenueThisMonth = (float) SchoolSubscription::whereMonth('created_at', $now->month)
                ->whereYear('created_at', $now->year)
                ->sum('amount_paid');
        }

        $totalPackages = Package::where('is_active', true)->count();
        $totalCoupons  = Coupon::where('is_active', true)->count();

        /* -- School Growth (last 12 months) -- */
        $schoolGrowth = [];
        for ($i = 11; $i >= 0; $i--) {
            $d = $now->copy()->subMonths($i);
            $schoolGrowth[] = [
                'month'   => $d->format('M y'),
                'schools' => School::whereYear('created_at', $d->year)
                    ->whereMonth('created_at', $d->month)->count(),
                'users'   => User::whereYear('created_at', $d->year)
                    ->whereMonth('created_at', $d->month)->count(),
            ];
        }

        /* -- Revenue Trend (last 6 months) -- */
        $revenueTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $d = $now->copy()->subMonths($i);
            $rev = (float) SubscriptionPayment::where('status', 'completed')
                ->whereYear('paid_at', $d->year)
                ->whereMonth('paid_at', $d->month)
                ->sum('amount');
            if ($rev === 0.0) {
                $rev = (float) SchoolSubscription::whereYear('created_at', $d->year)
                    ->whereMonth('created_at', $d->month)->sum('amount_paid');
            }
            $revenueTrend[] = [
                'month'   => $d->format('M y'),
                'revenue' => $rev,
            ];
        }

        /* -- Package Distribution -- */
        $packageDistribution = SchoolSubscription::with('package:id,name')
            ->select('package_id', DB::raw('count(*) as count'))
            ->groupBy('package_id')
            ->get()
            ->map(fn ($row) => [
                'name'  => $row->package?->name ?? 'Unknown',
                'value' => $row->count,
            ]);

        /* -- Recent Schools -- */
        $recentSchools = School::with('latestSubscription.package')
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn ($s) => [
                'id'         => $s->id,
                'name'       => $s->name,
                'code'       => $s->slug,
                'plan'       => $s->latestSubscription?->package?->name ?? 'Standard Campus',
                'status'     => $s->status,
                'email'      => $s->email,
                'city'       => $s->city,
                'created_at' => $s->created_at->diffForHumans(),
            ]);

        /* -- Expiring Subscriptions (next 30 days) -- */
        $expiringSubscriptions = SchoolSubscription::with('school:id,name', 'package:id,name')
            ->where('status', 'active')
            ->whereBetween('end_date', [$now->toDateString(), $now->copy()->addDays(30)->toDateString()])
            ->orderBy('end_date')
            ->limit(5)
            ->get()
            ->map(fn ($sub) => [
                'id'        => $sub->id,
                'school'    => $sub->school?->name ?? 'Unknown School',
                'package'   => $sub->package?->name ?? 'SaaS Tier',
                'end_date'  => $sub->end_date ? Carbon::parse($sub->end_date)->format('M d, Y') : 'N/A',
                'days_left' => $sub->end_date ? (int) $now->diffInDays($sub->end_date, false) : 0,
            ]);

        /* -- Recent Activity Logs -- */
        $recentActivity = Activity::with('causer:id,name')
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn ($activity) => [
                'id'          => $activity->id,
                'action'      => $activity->description,
                'user_name'   => $activity->causer?->name,
                'school_name' => data_get($activity->properties, 'school_name'),
                'created_at'  => $activity->created_at?->diffForHumans(),
            ])
            ->values();

        return Inertia::render('SuperAdmin/Dashboard', [
            'totalSchools'          => $totalSchools,
            'activeSchools'         => $activeSchools,
            'trialSchools'          => $trialSubscriptions,
            'suspendedSchools'      => $suspended,
            'totalUsers'            => $totalUsers,
            'totalRevenue'          => $totalRevenue,
            'revenueThisMonth'      => $revenueThisMonth,
            'revenueTrend'          => $revenueTrend,
            'expiringSubscriptions' => $expiringSubscriptions,
            'packageDistribution'   => $packageDistribution,
            'growthChart'           => $schoolGrowth,
            'recentSchools'         => $recentSchools,
            'recentAuditLogs'       => $recentActivity,
        ]);
    }
}