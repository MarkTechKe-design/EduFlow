<?php

namespace App\Providers;

use App\Http\Controllers\SchoolAdmin\ReportController;
use App\Models\Announcement;
use App\Models\Asset;
use App\Models\AssetMaintenanceLog;
use App\Models\Attendance;
use App\Models\Book;
use App\Models\BookIssue;
use App\Models\BookReservation;
use App\Models\EmailTemplate;
use App\Models\Exam;
use App\Models\FeeCategory;
use App\Models\FeePayment;
use App\Models\FeeStructure;
use App\Models\GradeScale;
use App\Models\Holiday;
use App\Models\Hostel;
use App\Models\HostelAllocation;
use App\Models\HostelRoom;
use App\Models\InventoryCategory;
use App\Models\InventoryIssue;
use App\Models\InventoryItem;
use App\Models\InventoryPurchase;
use App\Models\Message;
use App\Models\PlatformSetting;
use App\Models\Payroll;
use App\Models\SalaryStructure;
use App\Models\School;
use App\Models\SchoolSetting;
use App\Models\Staff;
use App\Models\StaffDocument;
use App\Models\Student;
use App\Models\StudentDocument;
use App\Models\Timetable;
use App\Models\TransportRoute;
use App\Models\User;
use App\Models\Vehicle;
use App\Policies\AnnouncementPolicy;
use App\Policies\AssetMaintenanceLogPolicy;
use App\Policies\AssetPolicy;
use App\Policies\AttendancePolicy;
use App\Policies\BookIssuePolicy;
use App\Policies\BookPolicy;
use App\Policies\BookReservationPolicy;
use App\Policies\EmailTemplatePolicy;
use App\Policies\ExamPolicy;
use App\Policies\FeeCategoryPolicy;
use App\Policies\FeePaymentPolicy;
use App\Policies\FeeStructurePolicy;
use App\Policies\FinanceReportPolicy;
use App\Policies\GradeScalePolicy;
use App\Policies\HolidayPolicy;
use App\Policies\HostelAllocationPolicy;
use App\Policies\HostelPolicy;
use App\Policies\HostelRoomPolicy;
use App\Policies\InventoryCategoryPolicy;
use App\Policies\InventoryIssuePolicy;
use App\Policies\InventoryItemPolicy;
use App\Policies\InventoryPurchasePolicy;
use App\Policies\MessagePolicy;
use App\Policies\PlatformSettingPolicy;
use App\Policies\PayrollPolicy;
use App\Policies\SalaryStructurePolicy;
use App\Policies\SchoolPolicy;
use App\Policies\SchoolSettingPolicy;
use App\Policies\StaffDocumentPolicy;
use App\Policies\StaffPolicy;
use App\Policies\StudentDocumentPolicy;
use App\Policies\StudentPolicy;
use App\Policies\TimetablePolicy;
use App\Policies\TransportRoutePolicy;
use App\Policies\UserPolicy;
use App\Policies\VehiclePolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void {}

    public function boot(): void
    {
        if (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https') {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }
        RateLimiter::for('login', fn (Request $request) => Limit::perMinute(10)
            ->by(Str::lower((string) $request->input('email')).'|'.($request->ip() ?? 'unknown')));
        RateLimiter::for('register', fn (Request $request) => Limit::perMinute(5)
            ->by($request->ip() ?? 'unknown'));
        RateLimiter::for('password-reset-request', fn (Request $request) => Limit::perMinute(5)
            ->by(Str::lower((string) $request->input('email')).'|'.($request->ip() ?? 'unknown')));
        RateLimiter::for('password-reset-submit', fn (Request $request) => Limit::perMinute(5)
            ->by(Str::lower((string) $request->input('email')).'|'.($request->ip() ?? 'unknown')));
        RateLimiter::for('public-admission', function (Request $request) {
            $school = $request->route('school');
            $schoolKey = is_object($school) && method_exists($school, 'getKey')
                ? $school->getKey()
                : (is_scalar($school) && (string)$school !== '' ? (string)$school : 'unknown');

            return Limit::perMinute(5)->by($schoolKey . '|' . ($request->ip() ?? 'unknown'));
        });

        Gate::policy(Student::class, StudentPolicy::class);
        Gate::policy(StudentDocument::class, StudentDocumentPolicy::class);
        Gate::policy(Staff::class, StaffPolicy::class);
        Gate::policy(StaffDocument::class, StaffDocumentPolicy::class);
        Gate::policy(FeePayment::class, FeePaymentPolicy::class);
        Gate::policy(Vehicle::class, VehiclePolicy::class);
        Gate::policy(TransportRoute::class, TransportRoutePolicy::class);
        Gate::policy(Announcement::class, AnnouncementPolicy::class);
        Gate::policy(Message::class, MessagePolicy::class);
        Gate::policy(EmailTemplate::class, EmailTemplatePolicy::class);
        Gate::policy(Attendance::class, AttendancePolicy::class);
        Gate::policy(Hostel::class, HostelPolicy::class);
        Gate::policy(HostelRoom::class, HostelRoomPolicy::class);
        Gate::policy(HostelAllocation::class, HostelAllocationPolicy::class);
        Gate::policy(Book::class, BookPolicy::class);
        Gate::policy(BookIssue::class, BookIssuePolicy::class);
        Gate::policy(BookReservation::class, BookReservationPolicy::class);
        Gate::policy(InventoryCategory::class, InventoryCategoryPolicy::class);
        Gate::policy(InventoryItem::class, InventoryItemPolicy::class);
        Gate::policy(InventoryPurchase::class, InventoryPurchasePolicy::class);
        Gate::policy(InventoryIssue::class, InventoryIssuePolicy::class);
        Gate::policy(Asset::class, AssetPolicy::class);
        Gate::policy(AssetMaintenanceLog::class, AssetMaintenanceLogPolicy::class);
        Gate::policy(Timetable::class, TimetablePolicy::class);
        Gate::policy(Exam::class, ExamPolicy::class);
        Gate::policy(GradeScale::class, GradeScalePolicy::class);
        Gate::policy(FeeCategory::class, FeeCategoryPolicy::class);
        Gate::policy(FeeStructure::class, FeeStructurePolicy::class);
        Gate::policy(Payroll::class, PayrollPolicy::class);
        Gate::policy(SalaryStructure::class, SalaryStructurePolicy::class);
        Gate::policy(ReportController::class, FinanceReportPolicy::class);
        Gate::policy(Holiday::class, HolidayPolicy::class);
        Gate::policy(PlatformSetting::class, PlatformSettingPolicy::class);
        Gate::policy(School::class, SchoolPolicy::class);
        Gate::policy(SchoolSetting::class, SchoolSettingPolicy::class);
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(\App\Models\WebsitePage::class, \App\Policies\WebsitePagePolicy::class);
    }
}
