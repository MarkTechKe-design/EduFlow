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

        /* ?? KPI Cards ?? */
        $totalSchools   = School::count();
        $activeSchools  = School::where('status', 'active')->count();
        $suspended      = School::where('status', 'suspended')->count();
        $totalUsers     = User::count();
        $totalStudents  = Student::count();
        $totalStaff     = Staff::count();

        $activeSubscriptions = SchoolSubscription::where('status', 'active')->count();
        $trialSubscriptions  = SchoolSubscription::where('is_trial', true)
            ->where('status', 'active')->count();

        $totalRevenue      = SchoolSubscription::sum('amount_paid');
        $revenueThisMonth  = SchoolSubscription::whereMonth('created_at', $now->month)
            ->whereYear('created_at', $now->year)
            ->sum('amount_paid');

        $totalPackages = Package::where('is_active', true)->count();
        $totalCoupons  = Coupon::where('is_active', true)->count();

        /* ?? School Growth (last 12 months) ?? */
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

        /* ?? Revenue Trend (last 6 months) ?? */
        $revenueTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $d = $now->copy()->subMonths($i);
            $revenueTrend[] = [
                'month'   => $d->format('M y'),
                'revenue' => (float) SchoolSubscription::whereYear('created_at', $d->year)
                    ->whereMonth('created_at', $d->month)->sum('amount_paid'),
            ];
        }

        /* ?? School Status Distribution ?? */
        $statusDistribution = School::select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        /* ?? Package Distribution ?? */
        $packageDistribution = SchoolSubscription::with('package:id,name')
            ->select('package_id', DB::raw('count(*) as count'))
            ->groupBy('package_id')
            ->get()
            ->map(fn ($row) => [
                'name'  => $row->package?->name ?? 'Unknown',
                'value' => $row->count,
            ]);

        /* ?? Top Schools by Students ?? */
        $topSchools = School::withCount('users')
            ->with(['academicYears' => fn ($q) => $q->where('is_current', true)])
            ->select('schools.*')
            ->addSelect(DB::raw('(SELECT COUNT(*) FROM students WHERE students.school_id = schools.id AND students.deleted_at IS NULL) as students_count'))
            ->orderByDesc('students_count')
            ->limit(5)
            ->get()
            ->map(fn ($s) => [
                'id'       => $s->id,
                'name'     => $s->name,
                'status'   => $s->status,
                'students' => $s->students_count,
                'users'    => $s->users_count,
            ]);

        /* ?? Recent Schools ?? */
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

        /* ?? Expiring Subscriptions (next 30 days) ?? */
        $expiringSubscriptions = SchoolSubscription::with('school:id,name', 'package:id,name')
            ->where('status', 'active')
            ->whereBetween('end_date', [$now->toDateString(), $now->copy()->addDays(30)->toDateString()])
            ->orderBy('end_date')
            ->limit(5)
            ->get()
            ->map(fn ($sub) => [
                'id'          => $sub->id,
                'school'      => $sub->school?->name,
                'package'     => $sub->package?->name,
                'end_date'    => $sub->end_date?->format('d M Y'),
                'days_left'   => $now->diffInDays($sub->end_date, false),
            ]);

        /* ?? Recent Users ?? */
        $recentUsers = User::leftJoin('schools', 'users.school_id', '=', 'schools.id')
            ->latest('users.created_at')
            ->limit(6)
            ->get(['users.id', 'users.name', 'users.email', 'users.created_at', 'schools.name as school_name'])
            ->map(fn ($u) => [
                'id'         => $u->id,
                'name'       => $u->name,
                'email'      => $u->email,
                'school'     => $u->school_name ?? 'Platform',
                'created_at' => $u->created_at->diffForHumans(),
            ]);

        $platformMetrics = [
            ['category' => 'Academic', 'label' => 'Students', 'value' => \App\Models\Student::withoutGlobalScopes()->count()],
            ['category' => 'Academic', 'label' => 'Staff', 'value' => \App\Models\Staff::withoutGlobalScopes()->count()],
            ['category' => 'Academic', 'label' => 'Attendance records', 'value' => \App\Models\Attendance::withoutGlobalScopes()->count()],
            ['category' => 'Academic', 'label' => 'Exams', 'value' => \App\Models\Exam::withoutGlobalScopes()->count()],
            ['category' => 'Academic', 'label' => 'Marks', 'value' => \App\Models\Mark::withoutGlobalScopes()->count()],
            ['category' => 'Learning', 'label' => 'Homework', 'value' => \App\Models\Homework::withoutGlobalScopes()->count()],
            ['category' => 'Admissions', 'label' => 'Admission inquiries', 'value' => AdmissionInquiry::withoutGlobalScopes()->count()],
            ['category' => 'Finance', 'label' => 'Fee payments', 'value' => \App\Models\FeePayment::withoutGlobalScopes()->count()],
            ['category' => 'Finance', 'label' => 'Payroll records', 'value' => \App\Models\Payroll::withoutGlobalScopes()->count()],
            ['category' => 'Billing', 'label' => 'Subscription payments', 'value' => \App\Models\SubscriptionPayment::count()],
            ['category' => 'Library', 'label' => 'Books', 'value' => \App\Models\Book::withoutGlobalScopes()->count()],
            ['category' => 'Library', 'label' => 'Book issues', 'value' => \App\Models\BookIssue::withoutGlobalScopes()->count()],
            ['category' => 'Inventory', 'label' => 'Inventory items', 'value' => \App\Models\InventoryItem::withoutGlobalScopes()->count()],
            ['category' => 'Inventory', 'label' => 'Inventory issues', 'value' => \App\Models\InventoryIssue::withoutGlobalScopes()->count()],
            ['category' => 'Transport', 'label' => 'Vehicles', 'value' => \App\Models\Vehicle::withoutGlobalScopes()->count()],
            ['category' => 'Transport', 'label' => 'Routes', 'value' => \App\Models\TransportRoute::withoutGlobalScopes()->count()],
            ['category' => 'Hostel', 'label' => 'Hostels', 'value' => \App\Models\Hostel::withoutGlobalScopes()->count()],
            ['category' => 'Hostel', 'label' => 'Allocations', 'value' => \App\Models\HostelAllocation::withoutGlobalScopes()->count()],
            ['category' => 'Communication', 'label' => 'Announcements', 'value' => \App\Models\Announcement::withoutGlobalScopes()->count()],
            ['category' => 'Communication', 'label' => 'Messages', 'value' => \App\Models\Message::withoutGlobalScopes()->count()],
            ['category' => 'Website', 'label' => 'Published pages', 'value' => \App\Models\WebsitePage::withoutGlobalScopes()->where('status', 'published')->count()],
            ['category' => 'Website', 'label' => 'Website leads', 'value' => \App\Models\WebsiteLead::withoutGlobalScopes()->count()],
        ];

        $attention = [
            ['label' => 'Admission inquiries awaiting follow-up', 'value' => AdmissionInquiry::withoutGlobalScopes()->whereIn('status', ['new', 'follow_up'])->count()],
            ['label' => 'Fee payments pending or overdue', 'value' => \App\Models\FeePayment::withoutGlobalScopes()->whereIn('status', ['pending', 'partial', 'overdue'])->count()],
            ['label' => 'Homework submissions awaiting review', 'value' => \App\Models\HomeworkSubmission::withoutGlobalScopes()->where('status', 'submitted')->count()],
            ['label' => 'Overdue library issues', 'value' => \App\Models\BookIssue::withoutGlobalScopes()->where('status', 'overdue')->count()],
            ['label' => 'Leave requests awaiting approval', 'value' => \App\Models\LeaveRequest::withoutGlobalScopes()->where('status', 'pending')->count()],
            ['label' => 'Subscriptions expiring in 30 days', 'value' => $expiringSubscriptions->count()],
        ];
        $recentActivity = Activity::with('causer:id,name')
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn ($activity) => [
                'id' => $activity->id,
                'action' => $activity->description,
                'user_name' => $activity->causer?->name,
                'school_name' => data_get($activity->properties, 'school_name'),
                'created_at' => $activity->created_at?->diffForHumans(),
            ])
            ->values();

        $platformHealth = [
            ['label' => 'Queue monitoring', 'status' => 'Not configured'],
            ['label' => 'Scheduler monitoring', 'status' => 'Not configured'],
            ['label' => 'Backup monitoring', 'status' => 'Not configured'],
            ['label' => 'SSL monitoring', 'status' => 'Not configured'],
            ['label' => 'Storage telemetry', 'status' => 'Not configured'],
        ];
        return Inertia::render('SuperAdmin/Dashboard', [
            'totalSchools'     => $totalSchools,
            'activeSchools'    => $activeSchools,
            'trialSchools'     => $trialSubscriptions,
            'suspendedSchools' => $suspended,
            'totalUsers'       => $totalUsers,
            'growthChart'      => $schoolGrowth,
            'recentSchools'    => $recentSchools,
            'recentAuditLogs'  => $recentActivity,
        ]);
    }
}
