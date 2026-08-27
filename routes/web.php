<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PublicWebsiteController;
use App\Http\Controllers\PublicBlogController;
use App\Http\Controllers\PublicFaqController;
use App\Http\Controllers\PublicAdmissionController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\RegistrationController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\BillingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\VirtualClassroomController;
use App\Http\Controllers\PaystackWebhookController;
use App\Http\Controllers\Api\DarajaWebhookController;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Public Marketing, CMS, & Lead Capture
|--------------------------------------------------------------------------
*/
Route::get('/', [PublicWebsiteController::class, 'page'])->name('home');
Route::get('/features', [PublicWebsiteController::class, 'page'])->name('public.features');
Route::get('/pricing', [PublicWebsiteController::class, 'page'])->name('public.pricing');
Route::get('/about', [PublicWebsiteController::class, 'page'])->name('public.about');
Route::get('/contact', [PublicWebsiteController::class, 'page'])->name('public.contact.show');
Route::post('/contact', [PublicWebsiteController::class, 'lead'])->middleware('throttle:10,1')->name('public.contact');

Route::get('/privacy', [PublicWebsiteController::class, 'page'])->name('public.privacy');
Route::get('/cookies', [PublicWebsiteController::class, 'page'])->name('public.cookies');
Route::get('/terms', [PublicWebsiteController::class, 'page'])->name('public.terms');
Route::get('/saas-terms', [PublicWebsiteController::class, 'page'])->name('public.saas-terms');
Route::get('/security', [PublicWebsiteController::class, 'page'])->name('public.security');
Route::get('/governance', [PublicWebsiteController::class, 'page'])->name('public.governance');
Route::get('/disclaimer', [PublicWebsiteController::class, 'page'])->name('public.disclaimer');

Route::get('/blog', [PublicBlogController::class, 'index'])->name('blog.index');
Route::get('/blog/{slug}', [PublicBlogController::class, 'show'])->name('blog.show');
Route::get('/faq', [PublicFaqController::class, 'index'])->name('faq.index');

Route::get('/apply/{school}', [PublicAdmissionController::class, 'show'])->middleware('throttle:public-admission')->name('public.admission');
Route::post('/apply/{school}', [PublicAdmissionController::class, 'submit'])->middleware('throttle:public-admission')->name('public.admission.submit');

/*
|--------------------------------------------------------------------------
| Authentication Routes & Canonical Commercial Registration
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store'])->middleware('throttle:login')->name('login.store');

    Route::get('/register', [RegistrationController::class, 'create'])->name('register');
    Route::post('/register', [RegistrationController::class, 'store'])->middleware('throttle:register')->name('register.store');
    Route::post('/register/validate-coupon', [RegistrationController::class, 'validateCoupon'])->middleware('throttle:register')->name('register.coupon.validate');

    Route::get('/register-school', [RegistrationController::class, 'create'])->name('register-school');
    Route::post('/register-school', [RegistrationController::class, 'store'])->middleware('throttle:register')->name('register-school.store');
    Route::post('/register-school/validate-coupon', [RegistrationController::class, 'validateCoupon'])->middleware('throttle:register')->name('register-school.coupon.validate');

    Route::get('/password/forgot', [PasswordResetController::class, 'createRequest'])->name('password.request');
    Route::post('/password/forgot', [PasswordResetController::class, 'sendLink'])->middleware('throttle:password-reset-request')->name('password.email');
    Route::get('/password/reset/{token}', [PasswordResetController::class, 'createReset'])->name('password.reset');
    Route::post('/password/reset', [PasswordResetController::class, 'reset'])->middleware('throttle:password-reset-submit')->name('password.update');
});

Route::post('/logout', [LoginController::class, 'destroy'])->middleware(['auth', 'active'])->name('logout');

/*
|--------------------------------------------------------------------------
| Authenticated Shared Routes (Dashboard, Profile, Billing)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'active'])->group(function () {
    Route::get('/email/verify', fn () => Inertia::render('Auth/VerifyEmail'))->name('verification.notice');
    Route::get('/email/verify/{id}/{hash}', function (\Illuminate\Foundation\Auth\EmailVerificationRequest $request) {
        $request->fulfill();
        return redirect()->route('dashboard');
    })->middleware(['signed', 'throttle:6,1'])->name('verification.verify');
    Route::post('/email/verification-notification', function (\Illuminate\Http\Request $request) {
        $request->user()->sendEmailVerificationNotification();
        return back()->with('success', 'Verification link sent.');
    })->middleware('throttle:6,1')->name('verification.send');

    Route::get('/profile', [ProfileController::class, 'show'])->name('profile');
    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::get('/password/change', [ProfileController::class, 'changePasswordPage'])->name('password.change');
    Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');

    Route::get('/billing', [BillingController::class, 'index'])->middleware('verified')->name('billing.index');
    Route::post('/billing/package', [BillingController::class, 'changePackage'])->middleware('verified')->name('billing.package');
    Route::post('/billing/card', [BillingController::class, 'updateCard'])->middleware('verified')->name('billing.card');
    Route::post('/billing/cancel', [BillingController::class, 'cancel'])->middleware('verified')->name('billing.cancel');
    Route::post('/billing/reactivate', [BillingController::class, 'reactivate'])->middleware('verified')->name('billing.reactivate');

    // Central Authenticated Dashboard Entrypoint
    Route::get('/dashboard', function (\Illuminate\Http\Request $request) {
        $user = auth()->user();
        if (!$user) {
            return redirect()->route('login');
        }

        if ($user->hasRole('super-admin') && !$user->school_id) {
            return redirect()->route('super-admin.dashboard');
        }

        if ($user->hasRole('student')) {
            return redirect()->route('student.dashboard');
        }

        if ($user->hasRole('parent')) {
            return redirect()->route('parent.dashboard');
        }

        return app(\App\Http\Controllers\SchoolAdmin\DashboardController::class)->index($request);
    })->name('dashboard');
});

/*
|--------------------------------------------------------------------------
| Virtual Classroom Route
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'active', 'school-role'])->prefix('school')->name('school.')->group(function () {

        // --- AUTOMATED AUDIT REPAIRS: SCHOOL ADMIN ENDPOINTS ---
        Route::get('/fees', [\App\Http\Controllers\SchoolAdmin\FeePaymentController::class, 'index'])->name('fees.index');
        Route::get('/fees/reports', [\App\Http\Controllers\SchoolAdmin\FinancialReportController::class, 'index'])->name('fees.reports');
        Route::post('/fees/reports/sms-defaulters', [\App\Http\Controllers\SchoolAdmin\FinancialReportController::class, 'sendBatchSms'])->name('fees.reports.sms-defaulters');
        Route::post('/fees/unallocated/{payment}/resolve', [\App\Http\Controllers\SchoolAdmin\UnallocatedPaymentController::class, 'resolve'])->name('fees.unallocated.resolve');

        Route::match(['put', 'patch', 'post'], '/admissions/visitors/{id}/checkout', [\App\Http\Controllers\SchoolAdmin\VisitorLogController::class, 'checkout'])->name('admissions.visitors.checkout');
        Route::match(['put', 'delete'], '/admissions/visitors/{id}', [\App\Http\Controllers\SchoolAdmin\VisitorLogController::class, 'destroy'])->name('admissions.visitors.destroy');

        Route::get('/compliance/odpc-audit/export', [\App\Http\Controllers\SchoolAdmin\OdpcAuditController::class, 'exportCsv'])->name('compliance.odpc-audit.export');
        Route::post('/exams/{exam}/marks/import', [\App\Http\Controllers\SchoolAdmin\ExamController::class, 'importMarksCsv'])->name('exams.marks.import');
        Route::get('/homework/{homework}/submissions', [\App\Http\Controllers\SchoolAdmin\HomeworkController::class, 'download'])->name('homework.submissions');

        Route::get('/library', [\App\Http\Controllers\SchoolAdmin\LibraryController::class, 'index'])->middleware('permission:library.view')->name('library.alias');
        Route::post('/library/clear-fine/{issueId}', [\App\Http\Controllers\SchoolAdmin\LibraryController::class, 'clearFine'])->name('library.clear-fine');
        Route::get('/library/clearance-check/{studentId}', [\App\Http\Controllers\SchoolAdmin\LibraryController::class, 'checkStudentClearance'])->name('library.clearance-check');

        Route::delete('/settings/admins/{user}', [\App\Http\Controllers\SchoolAdmin\SchoolUserController::class, 'destroy'])->name('settings.admins.destroy');
        Route::post('/settings/admins/{user}/{action}', function ($user, $action) {
            $controller = app(\App\Http\Controllers\SchoolAdmin\SchoolUserController::class);
            if (method_exists($controller, $action)) {
                return $controller->$action($user);
            }
            abort(404);
        })->name('settings.admins.action');

        Route::match(['post', 'patch'], '/teacher-assignments/{assignment}/conclude', [\App\Http\Controllers\SchoolAdmin\TeacherAssignmentController::class, 'concludeOrTransfer'])->name('teacher-assignments.conclude');
        Route::post('/timetable/slots/save', [\App\Http\Controllers\SchoolAdmin\TimetableController::class, 'saveSlots'])->name('timetable.slots.save');

        Route::match(['delete', 'post'], '/transport/allocations/{id}', [\App\Http\Controllers\SchoolAdmin\TransportController::class, 'unassignStudent'])->name('transport.allocations.destroy');
        Route::match(['delete', 'post'], '/transport/maintenances/{id}', [\App\Http\Controllers\SchoolAdmin\TransportController::class, 'destroyVehicle'])->name('transport.maintenances.destroy');

        Route::get('/parent/fees', [\App\Http\Controllers\ParentPortalController::class, 'fees'])->name('parent.fees.alias');
        Route::get('/student/timetable', [\App\Http\Controllers\StudentPortalController::class, 'timetable'])->name('student.timetable.alias');
        Route::get('/student/fees', [\App\Http\Controllers\StudentPortalController::class, 'fees'])->name('student.fees');
                        Route::get('/student/homework', [\App\Http\Controllers\StudentPortalController::class, 'homework'])->name('student.homework.alias');
    
        // --- Co-Curricular, Sports & Talent Management ---
        Route::prefix('cocurricular')->as('cocurricular.')->middleware(['module'])->group(function () {
            Route::get('/field-entry', [\App\Http\Controllers\SchoolAdmin\CoCurricular\FieldEntryController::class, 'index'])->name('field-entry');
            Route::post('/field-entry/fixtures/{fixture}/quick-score', [\App\Http\Controllers\SchoolAdmin\CoCurricular\FieldEntryController::class, 'quickScore'])->name('field-entry.quick-score');
            Route::post('/field-entry/quick-track-result', [\App\Http\Controllers\SchoolAdmin\CoCurricular\FieldEntryController::class, 'quickTrackResult'])->name('field-entry.quick-track-result');
            Route::get('/export/event/{event}/pdf', [\App\Http\Controllers\SchoolAdmin\CoCurricular\CoCurricularExportController::class, 'exportEventEntryPdf'])->name('export.event.pdf');
            Route::get('/export/adjudication/{adjudication}/pdf', [\App\Http\Controllers\SchoolAdmin\CoCurricular\CoCurricularExportController::class, 'exportAdjudicationPdf'])->name('export.adjudication.pdf');
            Route::get('/export/house-standings/pdf', [\App\Http\Controllers\SchoolAdmin\CoCurricular\CoCurricularExportController::class, 'exportHouseStandingsPdf'])->name('export.house-standings.pdf');
            Route::get('/', [\App\Http\Controllers\SchoolAdmin\CoCurricular\ActivityController::class, 'dashboard'])->name('index');
            
            // Activities & Categories
            Route::get('/activities', [\App\Http\Controllers\SchoolAdmin\CoCurricular\ActivityController::class, 'index'])->name('activities.index');
            Route::post('/activities', [\App\Http\Controllers\SchoolAdmin\CoCurricular\ActivityController::class, 'store'])->name('activities.store');
            Route::put('/activities/{activity}', [\App\Http\Controllers\SchoolAdmin\CoCurricular\ActivityController::class, 'update'])->name('activities.update');
            Route::delete('/activities/{activity}', [\App\Http\Controllers\SchoolAdmin\CoCurricular\ActivityController::class, 'destroy'])->name('activities.destroy');
            Route::get('/categories', [\App\Http\Controllers\SchoolAdmin\CoCurricular\ActivityController::class, 'categories'])->name('categories.index');
            Route::post('/categories', [\App\Http\Controllers\SchoolAdmin\CoCurricular\ActivityController::class, 'storeCategory'])->name('categories.store');
            Route::put('/categories/{category}', [\App\Http\Controllers\SchoolAdmin\CoCurricular\ActivityController::class, 'updateCategory'])->name('categories.update');
            Route::delete('/categories/{category}', [\App\Http\Controllers\SchoolAdmin\CoCurricular\ActivityController::class, 'destroyCategory'])->name('categories.destroy');

            // Sports & Fixtures
            Route::get('/sports/teams', [\App\Http\Controllers\SchoolAdmin\CoCurricular\SportsTeamController::class, 'index'])->name('sports.teams');
            Route::post('/sports/teams', [\App\Http\Controllers\SchoolAdmin\CoCurricular\SportsTeamController::class, 'store'])->name('sports.teams.store');
            Route::get('/sports/teams/{team}', [\App\Http\Controllers\SchoolAdmin\CoCurricular\SportsTeamController::class, 'show'])->name('sports.teams.show');
            Route::post('/sports/teams/{team}/members', [\App\Http\Controllers\SchoolAdmin\CoCurricular\SportsTeamController::class, 'addMember'])->name('sports.teams.members.add');
            Route::delete('/sports/members/{member}', [\App\Http\Controllers\SchoolAdmin\CoCurricular\SportsTeamController::class, 'removeMember'])->name('sports.teams.members.remove');
            Route::get('/sports/fixtures', [\App\Http\Controllers\SchoolAdmin\CoCurricular\SportsTeamController::class, 'fixtures'])->name('sports.fixtures');
            Route::post('/sports/fixtures', [\App\Http\Controllers\SchoolAdmin\CoCurricular\SportsTeamController::class, 'storeFixture'])->name('sports.fixtures.store');
            Route::put('/sports/fixtures/{fixture}/score', [\App\Http\Controllers\SchoolAdmin\CoCurricular\SportsTeamController::class, 'updateScore'])->name('sports.fixtures.score');

            // Athletics & Measurables
            Route::get('/athletics', [\App\Http\Controllers\SchoolAdmin\CoCurricular\AthleticsController::class, 'index'])->name('athletics.index');
            Route::post('/athletics/results', [\App\Http\Controllers\SchoolAdmin\CoCurricular\AthleticsController::class, 'recordResult'])->name('athletics.results.store');
            Route::get('/athletics/records', [\App\Http\Controllers\SchoolAdmin\CoCurricular\AthleticsController::class, 'records'])->name('athletics.records');

            // Performing & Creative Arts
            Route::get('/arts', [\App\Http\Controllers\SchoolAdmin\CoCurricular\PerformingArtsController::class, 'index'])->name('arts.index');
            Route::get('/arts/rubrics', [\App\Http\Controllers\SchoolAdmin\CoCurricular\PerformingArtsController::class, 'rubrics'])->name('arts.rubrics');
            Route::post('/arts/rubrics', [\App\Http\Controllers\SchoolAdmin\CoCurricular\PerformingArtsController::class, 'storeRubric'])->name('arts.rubrics.store');
            Route::post('/arts/adjudicate', [\App\Http\Controllers\SchoolAdmin\CoCurricular\PerformingArtsController::class, 'adjudicate'])->name('arts.adjudicate');

            // Academic & STEM
            Route::get('/academic', [\App\Http\Controllers\SchoolAdmin\CoCurricular\AcademicCompetitionController::class, 'index'])->name('academic.index');

            // Clubs & Societies
            Route::get('/clubs', [\App\Http\Controllers\SchoolAdmin\CoCurricular\SchoolClubController::class, 'index'])->name('clubs.index');
            Route::post('/clubs', [\App\Http\Controllers\SchoolAdmin\CoCurricular\SchoolClubController::class, 'store'])->name('clubs.store');
            Route::get('/clubs/{club}', [\App\Http\Controllers\SchoolAdmin\CoCurricular\SchoolClubController::class, 'show'])->name('clubs.show');
            Route::post('/clubs/{club}/members', [\App\Http\Controllers\SchoolAdmin\CoCurricular\SchoolClubController::class, 'addMember'])->name('clubs.members.add');
            Route::delete('/clubs/members/{membership}', [\App\Http\Controllers\SchoolAdmin\CoCurricular\SchoolClubController::class, 'removeMember'])->name('clubs.members.remove');

            // House System
            Route::get('/houses', [\App\Http\Controllers\SchoolAdmin\CoCurricular\HouseSystemController::class, 'index'])->name('houses.index');
            Route::post('/houses', [\App\Http\Controllers\SchoolAdmin\CoCurricular\HouseSystemController::class, 'store'])->name('houses.store');
            Route::post('/houses/award-points', [\App\Http\Controllers\SchoolAdmin\CoCurricular\HouseSystemController::class, 'awardPoints'])->name('houses.points.award');

            // Events & Calendar
            Route::get('/events', [\App\Http\Controllers\SchoolAdmin\CoCurricular\CocurricularEventController::class, 'index'])->name('events.index');
            Route::post('/events', [\App\Http\Controllers\SchoolAdmin\CoCurricular\CocurricularEventController::class, 'store'])->name('events.store');
            Route::get('/national-calendar', [\App\Http\Controllers\SchoolAdmin\CoCurricular\CocurricularEventController::class, 'nationalCalendar'])->name('national-calendar');

            // Talent Passport & Evidence
            Route::get('/talent', [\App\Http\Controllers\SchoolAdmin\CoCurricular\TalentPassportController::class, 'index'])->name('talent.index');
            Route::get('/talent/{student}', [\App\Http\Controllers\SchoolAdmin\CoCurricular\TalentPassportController::class, 'show'])->name('talent.show');
            Route::post('/talent/achievements', [\App\Http\Controllers\SchoolAdmin\CoCurricular\TalentPassportController::class, 'storeAchievement'])->name('talent.achievements.store');
            Route::get('/talent/evidence/{achievement}/download', [\App\Http\Controllers\SchoolAdmin\CoCurricular\TalentPassportController::class, 'downloadEvidence'])->name('talent.evidence.download');

            // PDF / CSV Exports
            Route::get('/export/team/{team}/pdf', [\App\Http\Controllers\SchoolAdmin\CoCurricular\CoCurricularExportController::class, 'exportTeamListPdf'])->name('export.team.pdf');
            Route::get('/export/talent/{student}/pdf', [\App\Http\Controllers\SchoolAdmin\CoCurricular\CoCurricularExportController::class, 'exportTalentPassportPdf'])->name('export.talent.pdf');
            Route::get('/export/certificate/{achievement}/pdf', [\App\Http\Controllers\SchoolAdmin\CoCurricular\CoCurricularExportController::class, 'exportCertificatePdf'])->name('export.certificate.pdf');
            Route::get('/export/achievements/csv', [\App\Http\Controllers\SchoolAdmin\CoCurricular\CoCurricularExportController::class, 'exportRosterCsv'])->name('export.achievements.csv');
        });
        Route::get('/classroom/{onlineClass}', [\App\Http\Controllers\VirtualClassroomController::class, 'join'])->name('classroom.join');
});

/*
|--------------------------------------------------------------------------
| School Workspace (Tenanted Role Routes)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'verified', 'active', 'module', 'school-role', 'role:school-admin|principal|teacher|accountant|librarian|receptionist|driver|warden|store-manager'])
    ->prefix('school')
    ->name('school.')
    ->group(function () {
        Route::get('/', [\App\Http\Controllers\SchoolAdmin\DashboardController::class, 'index'])->name('dashboard');
        Route::get('/dashboard', [\App\Http\Controllers\SchoolAdmin\DashboardController::class, 'index']);

        // Students & Admissions
        Route::get('/students/import', [\App\Http\Controllers\SchoolAdmin\StudentController::class, 'importView'])->middleware('permission:students.import')->name('students.import');
        Route::get('/students/import/template', [\App\Http\Controllers\SchoolAdmin\StudentController::class, 'downloadTemplate'])->middleware('permission:students.import')->name('students.import.template');
        Route::post('/students/import/preview', [\App\Http\Controllers\SchoolAdmin\StudentController::class, 'previewImport'])->middleware('permission:students.import')->name('students.import.preview');
        Route::post('/students/import/process', [\App\Http\Controllers\SchoolAdmin\StudentController::class, 'processImport'])->middleware('permission:students.import')->name('students.import.process');
        Route::get('/students/export', [\App\Http\Controllers\SchoolAdmin\StudentController::class, 'export'])->middleware('permission:students.export')->name('students.export');
        Route::get('/students/promotion', [\App\Http\Controllers\SchoolAdmin\StudentPromotionController::class, 'index'])->name('students.promotion');
        Route::get('/students/inquiries', [\App\Http\Controllers\SchoolAdmin\AdmissionInquiryController::class, 'index'])->name('students.inquiries');
        Route::get('/students/visitor-desk', [\App\Http\Controllers\SchoolAdmin\VisitorLogController::class, 'index'])->name('students.visitor-desk');
        Route::get('/admissions/inquiries', [\App\Http\Controllers\SchoolAdmin\AdmissionInquiryController::class, 'index'])->name('admissions.inquiries');
        Route::post('/admissions/inquiries', [\App\Http\Controllers\SchoolAdmin\AdmissionInquiryController::class, 'store'])->name('admissions.inquiries.store');
        Route::get('/admissions/visitors', [\App\Http\Controllers\SchoolAdmin\VisitorLogController::class, 'index'])->name('admissions.visitors');
        Route::post('/admissions/visitors', [\App\Http\Controllers\SchoolAdmin\VisitorLogController::class, 'store'])->name('admissions.visitors.store');
        Route::post('/students/{student}/documents', [\App\Http\Controllers\SchoolAdmin\StudentController::class, 'uploadDocument'])->middleware(['permission:students.create', 'throttle:uploads'])->name('students.documents.upload');
        Route::get('/students/{student}/documents/{document}/download', [\App\Http\Controllers\SchoolAdmin\StudentController::class, 'downloadDocument'])->middleware('permission:students.view')->name('students.documents.download');
        Route::delete('/students/{student}/documents/{document}', [\App\Http\Controllers\SchoolAdmin\StudentController::class, 'deleteDocument'])->middleware('permission:students.delete')->name('students.documents.delete');
                    // Student Promotion Routes
            Route::get('/students-promotion', [\App\Http\Controllers\SchoolAdmin\StudentPromotionController::class, 'index'])->name('students.promote');
            Route::post('/students-promotion', [\App\Http\Controllers\SchoolAdmin\StudentPromotionController::class, 'promote'])->name('students.promote.store');
            Route::resource('students', \App\Http\Controllers\SchoolAdmin\StudentController::class);

        // Staff
        Route::post('/staff/{staff}/documents', [\App\Http\Controllers\SchoolAdmin\StaffController::class, 'uploadDocument'])->name('staff.documents.upload');
        Route::delete('/staff/documents/{document}', [\App\Http\Controllers\SchoolAdmin\StaffController::class, 'deleteDocument'])->name('staff.documents.delete');
        Route::get('/staff/documents/{document}/download', [\App\Http\Controllers\SchoolAdmin\StaffController::class, 'downloadDocument'])->name('staff.documents.download');
        Route::resource('staff', \App\Http\Controllers\SchoolAdmin\StaffController::class);

        // Academic Structure
        Route::resource('classes', \App\Http\Controllers\SchoolAdmin\ClassController::class)->except(['create', 'edit', 'show']);
        Route::resource('sections', \App\Http\Controllers\SchoolAdmin\SectionController::class)->except(['create', 'edit', 'show']);
        Route::resource('subjects', \App\Http\Controllers\SchoolAdmin\SubjectController::class)->except(['create', 'edit', 'show']);
        Route::resource('shifts', \App\Http\Controllers\SchoolAdmin\ShiftController::class)->except(['create', 'edit', 'show']);
        Route::resource('departments', \App\Http\Controllers\SchoolAdmin\DepartmentController::class)->except(['create', 'edit', 'show']);
        Route::resource('designations', \App\Http\Controllers\SchoolAdmin\DesignationController::class)->except(['create', 'edit', 'show']);
        Route::get('/teacher-assignments', [\App\Http\Controllers\SchoolAdmin\TeacherAssignmentController::class, 'index'])->name('teacher-assignments.index');

        // Timetable
        Route::get('/timetable/master', [\App\Http\Controllers\SchoolAdmin\TimetableController::class, 'masterSchedule'])->name('timetable.master');
        Route::get('/timetable', [\App\Http\Controllers\SchoolAdmin\TimetableController::class, 'index'])->middleware('permission:timetable.view')->name('timetable.index');
        Route::post('/timetable', [\App\Http\Controllers\SchoolAdmin\TimetableController::class, 'store'])->middleware('permission:timetable.manage')->name('timetable.store');
        Route::delete('/timetable/{timetable}', [\App\Http\Controllers\SchoolAdmin\TimetableController::class, 'destroy'])->middleware('permission:timetable.manage')->name('timetable.destroy');
        Route::get('/timetable/teacher', [\App\Http\Controllers\SchoolAdmin\TimetableController::class, 'teacherSchedule'])->name('timetable.teacher');

        // Attendance
        Route::get('/attendance', [\App\Http\Controllers\SchoolAdmin\AttendanceController::class, 'index'])->middleware('permission:attendance.view')->name('attendance.index');
        Route::post('/attendance', [\App\Http\Controllers\SchoolAdmin\AttendanceController::class, 'store'])->middleware('permission:attendance.mark')->name('attendance.store');
        Route::get('/attendance/staff', [\App\Http\Controllers\SchoolAdmin\AttendanceController::class, 'staffIndex'])->middleware('permission:attendance.view')->name('attendance.staff.index');
        Route::post('/attendance/staff', [\App\Http\Controllers\SchoolAdmin\AttendanceController::class, 'staffStore'])->middleware('permission:attendance.mark')->name('attendance.staff.store');
        Route::get('/attendance/students/{student}/calendar', [\App\Http\Controllers\SchoolAdmin\AttendanceController::class, 'studentCalendar'])->middleware('permission:attendance.view')->name('attendance.student-calendar');

        // Exams & Grade Scales
        Route::get('/exams', [\App\Http\Controllers\SchoolAdmin\ExamController::class, 'index'])->middleware('permission:exams.view')->name('exams.index');
        Route::post('/exams', [\App\Http\Controllers\SchoolAdmin\ExamController::class, 'store'])->middleware('permission:exams.create')->name('exams.store');
        Route::put('/exams/{exam}', [\App\Http\Controllers\SchoolAdmin\ExamController::class, 'update'])->middleware('permission:exams.edit')->name('exams.update');
        Route::delete('/exams/{exam}', [\App\Http\Controllers\SchoolAdmin\ExamController::class, 'destroy'])->middleware('permission:exams.delete')->name('exams.destroy');
        Route::get('/exams/{exam}/marks', [\App\Http\Controllers\SchoolAdmin\ExamController::class, 'marks'])->middleware('permission:marks.view')->name('exams.marks');
        Route::post('/exams/{exam}/marks', [\App\Http\Controllers\SchoolAdmin\ExamController::class, 'saveMarks'])->middleware('permission:marks.entry')->name('exams.marks.save');
        Route::get('/exams/{exam}/results', [\App\Http\Controllers\SchoolAdmin\ExamController::class, 'results'])->middleware('permission:results.view')->name('exams.results');
        Route::get('/grade-scales', [\App\Http\Controllers\SchoolAdmin\GradeScaleController::class, 'index'])->middleware('permission:exams.view')->name('grade-scales.index');
            // CBC Assessments
            Route::prefix('cbc-assessments')->name('cbc-assessments.')->group(function () {
                Route::get('/', [\App\Http\Controllers\SchoolAdmin\CbcAssessmentController::class, 'index'])->name('index');
                Route::get('/create', [\App\Http\Controllers\SchoolAdmin\CbcAssessmentController::class, 'create'])->name('create');
                Route::post('/', [\App\Http\Controllers\SchoolAdmin\CbcAssessmentController::class, 'store'])->name('store');
                Route::get('/{cbcAssessment}/score-sheet', [\App\Http\Controllers\SchoolAdmin\CbcAssessmentController::class, 'scoreSheet'])->name('score-sheet');
                Route::post('/{cbcAssessment}/scores', [\App\Http\Controllers\SchoolAdmin\CbcAssessmentController::class, 'saveScores'])->name('save-scores');
                Route::get('/{cbcAssessment}/report', [\App\Http\Controllers\SchoolAdmin\CbcAssessmentController::class, 'report'])->name('report');
                Route::get('/{cbcAssessment}/export-csv', [\App\Http\Controllers\SchoolAdmin\CbcAssessmentController::class, 'exportCsv'])->name('export-csv');
                Route::delete('/{cbcAssessment}', [\App\Http\Controllers\SchoolAdmin\CbcAssessmentController::class, 'destroy'])->name('destroy');
            });

        // Fees & Accounting
        Route::get('/fees/categories', [\App\Http\Controllers\SchoolAdmin\FeeCategoryController::class, 'index'])->middleware('permission:fees.structure')->name('fees.categories.index');
        Route::post('/fees/categories', [\App\Http\Controllers\SchoolAdmin\FeeCategoryController::class, 'store'])->middleware('permission:fees.structure')->name('fees.categories.store');
        Route::get('/fees/categories/{feeCategory}/edit', [\App\Http\Controllers\SchoolAdmin\FeeCategoryController::class, 'edit'])->middleware('permission:fees.structure')->name('fees.categories.edit');
        Route::put('/fees/categories/{feeCategory}', [\App\Http\Controllers\SchoolAdmin\FeeCategoryController::class, 'update'])->middleware('permission:fees.structure')->name('fees.categories.update');
        Route::delete('/fees/categories/{feeCategory}', [\App\Http\Controllers\SchoolAdmin\FeeCategoryController::class, 'destroy'])->middleware('permission:fees.structure')->name('fees.categories.destroy');

        Route::get('/fees/structures', [\App\Http\Controllers\SchoolAdmin\FeeStructureController::class, 'index'])->middleware('permission:fees.structure')->name('fees.structures.index');
        Route::post('/fees/structures', [\App\Http\Controllers\SchoolAdmin\FeeStructureController::class, 'store'])->middleware('permission:fees.structure')->name('fees.structures.store');
        Route::put('/fees/structures/{feeStructure}', [\App\Http\Controllers\SchoolAdmin\FeeStructureController::class, 'update'])->middleware('permission:fees.structure')->name('fees.structures.update');
        Route::delete('/fees/structures/{feeStructure}', [\App\Http\Controllers\SchoolAdmin\FeeStructureController::class, 'destroy'])->middleware('permission:fees.structure')->name('fees.structures.destroy');

        Route::get('/fees/payments', [\App\Http\Controllers\SchoolAdmin\FeePaymentController::class, 'index'])->middleware('permission:fees.view')->name('fees.payments.index');
        Route::get('/fees/payments/collect', [\App\Http\Controllers\SchoolAdmin\FeePaymentController::class, 'create'])->middleware('permission:fees.collect')->name('fees.payments.collect');
        Route::get('/fees/payments/create', [\App\Http\Controllers\SchoolAdmin\FeePaymentController::class, 'create'])->middleware('permission:fees.collect')->name('fees.payments.create');
        Route::post('/fees/payments', [\App\Http\Controllers\SchoolAdmin\FeePaymentController::class, 'store'])->middleware('permission:fees.collect')->name('fees.payments.store');
        Route::get('/fees/payments/{feePayment}', [\App\Http\Controllers\SchoolAdmin\FeePaymentController::class, 'show'])->middleware('permission:fees.view')->name('fees.payments.show');
        Route::get('/fees/outstanding', [\App\Http\Controllers\SchoolAdmin\FeePaymentController::class, 'outstanding'])->middleware('permission:fees.view')->name('fees.outstanding');
        Route::get('/fees/unallocated', [\App\Http\Controllers\SchoolAdmin\UnallocatedPaymentController::class, 'index'])->name('fees.unallocated');
        Route::get('/fees/integrations', [\App\Http\Controllers\SchoolAdmin\PaymentIntegrationController::class, 'index'])->name('fees.integrations');

        // HR & Payroll
        Route::get('/hr/leaves', [\App\Http\Controllers\SchoolAdmin\LeaveController::class, 'index'])->middleware('permission:leave.view')->name('hr.leaves.index');
        Route::get('/hr/leave-types', [\App\Http\Controllers\SchoolAdmin\LeaveController::class, 'types'])->middleware('permission:leave.view')->name('hr.leave-types.index');
        Route::get('/hr/payroll', [\App\Http\Controllers\SchoolAdmin\PayrollController::class, 'index'])->middleware('permission:payroll.view')->name('hr.payroll.index');
        Route::post('/hr/payroll/generate', [\App\Http\Controllers\SchoolAdmin\PayrollController::class, 'generate'])->middleware('permission:payroll.generate')->name('hr.payroll.generate');
        Route::put('/hr/payroll/{payroll}/paid', [\App\Http\Controllers\SchoolAdmin\PayrollController::class, 'markPaid'])->middleware('permission:payroll.generate')->name('hr.payroll.paid');
        Route::get('/hr/payroll/{payroll}/slip', [\App\Http\Controllers\SchoolAdmin\PayrollController::class, 'slip'])->middleware('permission:payslip.download')->name('hr.payroll.slip');
        Route::get('/hr/salary-structure', [\App\Http\Controllers\SchoolAdmin\PayrollController::class, 'structure'])->middleware('permission:payroll.view')->name('hr.salary-structure.index');
        Route::put('/hr/salary-structure/{staff}', [\App\Http\Controllers\SchoolAdmin\PayrollController::class, 'saveStructure'])->middleware('permission:payroll.generate')->name('hr.salary-structure.update');

        // Library
        Route::get('/library/books', [\App\Http\Controllers\SchoolAdmin\LibraryController::class, 'index'])->middleware('permission:library.view')->name('library.index');
        Route::post('/library/books', [\App\Http\Controllers\SchoolAdmin\LibraryController::class, 'storeBook'])->middleware('permission:library.manage')->name('library.books.store');
        Route::put('/library/books/{book}', [\App\Http\Controllers\SchoolAdmin\LibraryController::class, 'updateBook'])->middleware('permission:library.manage')->name('library.books.update');
        Route::delete('/library/books/{book}', [\App\Http\Controllers\SchoolAdmin\LibraryController::class, 'destroyBook'])->middleware('permission:library.manage')->name('library.books.destroy');
        Route::get('/library/issues', [\App\Http\Controllers\SchoolAdmin\LibraryController::class, 'issues'])->middleware('permission:library.view')->name('library.issues');
        Route::post('/library/issues', [\App\Http\Controllers\SchoolAdmin\LibraryController::class, 'issueBook'])->middleware('permission:library.issue')->name('library.issues.store');
        Route::put('/library/issues/{issue}/return', [\App\Http\Controllers\SchoolAdmin\LibraryController::class, 'returnBook'])->middleware('permission:library.issue')->name('library.issues.return');
        Route::get('/library/overdue', [\App\Http\Controllers\SchoolAdmin\LibraryController::class, 'overdue'])->middleware('permission:library.view')->name('library.overdue');

        // Inventory
        Route::get('/inventory/categories', [\App\Http\Controllers\SchoolAdmin\InventoryController::class, 'categories'])->middleware('permission:inventory.view')->name('inventory.categories');
        Route::post('/inventory/categories', [\App\Http\Controllers\SchoolAdmin\InventoryController::class, 'storeCategory'])->middleware('permission:inventory.manage')->name('inventory.categories.store');
        Route::delete('/inventory/categories/{inventoryCategory}', [\App\Http\Controllers\SchoolAdmin\InventoryController::class, 'destroyCategory'])->middleware('permission:inventory.manage')->name('inventory.categories.destroy');
        Route::get('/inventory/items', [\App\Http\Controllers\SchoolAdmin\InventoryController::class, 'items'])->middleware('permission:inventory.view')->name('inventory.items');
        Route::post('/inventory/items', [\App\Http\Controllers\SchoolAdmin\InventoryController::class, 'storeItem'])->middleware('permission:inventory.manage')->name('inventory.items.store');
        Route::put('/inventory/items/{inventoryItem}', [\App\Http\Controllers\SchoolAdmin\InventoryController::class, 'updateItem'])->middleware('permission:inventory.manage')->name('inventory.items.update');
        Route::delete('/inventory/items/{inventoryItem}', [\App\Http\Controllers\SchoolAdmin\InventoryController::class, 'destroyItem'])->middleware('permission:inventory.manage')->name('inventory.items.destroy');
        Route::get('/inventory/purchases', [\App\Http\Controllers\SchoolAdmin\InventoryController::class, 'purchases'])->middleware('permission:inventory.view')->name('inventory.purchases');
        Route::post('/inventory/purchases', [\App\Http\Controllers\SchoolAdmin\InventoryController::class, 'storePurchase'])->middleware('permission:inventory.manage')->name('inventory.purchases.store');
        Route::get('/inventory/issues', [\App\Http\Controllers\SchoolAdmin\InventoryController::class, 'issues'])->middleware('permission:inventory.view')->name('inventory.issues');
        Route::post('/inventory/issues', [\App\Http\Controllers\SchoolAdmin\InventoryController::class, 'storeIssue'])->middleware('permission:inventory.issue')->name('inventory.issues.store');
        Route::put('/inventory/issues/{inventoryIssue}/return', [\App\Http\Controllers\SchoolAdmin\InventoryController::class, 'returnIssue'])->middleware('permission:inventory.issue')->name('inventory.issues.return');
        Route::get('/inventory/assets', [\App\Http\Controllers\SchoolAdmin\InventoryController::class, 'assets'])->middleware('permission:inventory.view')->name('inventory.assets');
        Route::post('/inventory/assets', [\App\Http\Controllers\SchoolAdmin\InventoryController::class, 'storeAsset'])->middleware('permission:inventory.manage')->name('inventory.assets.store');
        Route::get('/inventory/assets/{asset}', [\App\Http\Controllers\SchoolAdmin\InventoryController::class, 'showAsset'])->middleware('permission:inventory.view')->name('inventory.assets.show');
        Route::put('/inventory/assets/{asset}', [\App\Http\Controllers\SchoolAdmin\InventoryController::class, 'updateAsset'])->middleware('permission:inventory.manage')->name('inventory.assets.update');
        Route::delete('/inventory/assets/{asset}', [\App\Http\Controllers\SchoolAdmin\InventoryController::class, 'destroyAsset'])->middleware('permission:inventory.manage')->name('inventory.assets.destroy');
        Route::post('/inventory/assets/{asset}/maintenance', [\App\Http\Controllers\SchoolAdmin\InventoryController::class, 'storeAssetMaintenance'])->middleware('permission:inventory.manage')->name('inventory.assets.maintenance');
        Route::get('/inventory', fn() => redirect()->route('school.inventory.items'))->name('inventory.index');

        // Transport
        Route::get('/transport/vehicles', [\App\Http\Controllers\SchoolAdmin\TransportController::class, 'vehicles'])->middleware('permission:transport.view')->name('transport.vehicles');
        Route::post('/transport/vehicles', [\App\Http\Controllers\SchoolAdmin\TransportController::class, 'storeVehicle'])->middleware('permission:transport.manage')->name('transport.vehicles.store');
        Route::put('/transport/vehicles/{vehicle}', [\App\Http\Controllers\SchoolAdmin\TransportController::class, 'updateVehicle'])->middleware('permission:transport.manage')->name('transport.vehicles.update');
        Route::delete('/transport/vehicles/{vehicle}', [\App\Http\Controllers\SchoolAdmin\TransportController::class, 'destroyVehicle'])->middleware('permission:transport.manage')->name('transport.vehicles.destroy');
        Route::get('/transport/routes', [\App\Http\Controllers\SchoolAdmin\TransportController::class, 'routes'])->middleware('permission:transport.view')->name('transport.routes');
        Route::post('/transport/routes', [\App\Http\Controllers\SchoolAdmin\TransportController::class, 'storeRoute'])->middleware('permission:transport.manage')->name('transport.routes.store');
        Route::get('/transport/routes/{route}/assignments', [\App\Http\Controllers\SchoolAdmin\TransportController::class, 'assignments'])->middleware('permission:transport.view')->name('transport.routes.assignments');
        Route::post('/transport/routes/{route}/assign', [\App\Http\Controllers\SchoolAdmin\TransportController::class, 'assignStudent'])->middleware('permission:transport.manage')->name('transport.routes.assign');
        Route::delete('/transport/routes/{route}/students/{student}', [\App\Http\Controllers\SchoolAdmin\TransportController::class, 'removeStudent'])->middleware('permission:transport.manage')->name('transport.routes.students.destroy');
        Route::put('/transport/routes/{route}', [\App\Http\Controllers\SchoolAdmin\TransportController::class, 'updateRoute'])->middleware('permission:transport.manage')->name('transport.routes.update');
        Route::delete('/transport/routes/{route}', [\App\Http\Controllers\SchoolAdmin\TransportController::class, 'destroyRoute'])->middleware('permission:transport.manage')->name('transport.routes.destroy');
        Route::get('/transport', [\App\Http\Controllers\SchoolAdmin\TransportController::class, 'index'])->middleware('permission:transport.view')->name('transport.index');

        // Communication
        Route::get('/communication/announcements', [\App\Http\Controllers\SchoolAdmin\CommunicationController::class, 'announcements'])->name('communication.announcements');
        Route::post('/communication/announcements', [\App\Http\Controllers\SchoolAdmin\CommunicationController::class, 'storeAnnouncement'])->middleware('permission:announcements.create')->name('communication.announcements.store');
        Route::put('/communication/announcements/{announcement}', [\App\Http\Controllers\SchoolAdmin\CommunicationController::class, 'updateAnnouncement'])->middleware('permission:announcements.create')->name('communication.announcements.update');
        Route::delete('/communication/announcements/{announcement}', [\App\Http\Controllers\SchoolAdmin\CommunicationController::class, 'destroyAnnouncement'])->middleware('permission:announcements.delete')->name('communication.announcements.destroy');
        Route::get('/communication/messages', [\App\Http\Controllers\SchoolAdmin\CommunicationController::class, 'messages'])->name('communication.messages');
        Route::post('/communication/messages', [\App\Http\Controllers\SchoolAdmin\CommunicationController::class, 'sendMessage'])->middleware('permission:messages.send')->name('communication.messages.store');
        Route::put('/communication/messages/{message}/read', [\App\Http\Controllers\SchoolAdmin\CommunicationController::class, 'readMessage'])->middleware('permission:messages.view')->name('communication.messages.read');
        Route::get('/communication/blast', [\App\Http\Controllers\SchoolAdmin\CommunicationController::class, 'blast'])->name('communication.blast');
        Route::post('/communication/blast', [\App\Http\Controllers\SchoolAdmin\CommunicationController::class, 'sendBlast'])->name('communication.blast.send');
        Route::get('/communication/email-templates', [\App\Http\Controllers\SchoolAdmin\CommunicationController::class, 'emailTemplates'])->name('communication.email-templates');
        Route::post('/communication/email-templates', [\App\Http\Controllers\SchoolAdmin\CommunicationController::class, 'storeEmailTemplate'])->name('communication.email-templates.store');
        Route::put('/communication/email-templates/{emailTemplate}', [\App\Http\Controllers\SchoolAdmin\CommunicationController::class, 'updateEmailTemplate'])->name('communication.email-templates.update');
        Route::get('/communication/notifications', [\App\Http\Controllers\SchoolAdmin\CommunicationController::class, 'notifications'])->name('communication.notifications');
        Route::put('/communication/notifications/{notification}/read', [\App\Http\Controllers\SchoolAdmin\CommunicationController::class, 'markNotificationRead'])->name('communication.notifications.read');
        Route::post('/communication/notifications/read-all', [\App\Http\Controllers\SchoolAdmin\CommunicationController::class, 'markAllNotificationsRead'])->name('communication.notifications.read-all');

        // Hostel
        Route::get('/hostel', [\App\Http\Controllers\SchoolAdmin\HostelController::class, 'index'])->middleware('permission:hostel.view')->name('hostel.index');
        Route::post('/hostel', [\App\Http\Controllers\SchoolAdmin\HostelController::class, 'store'])->middleware('permission:hostel.manage')->name('hostel.store');
        Route::put('/hostel/{hostel}', [\App\Http\Controllers\SchoolAdmin\HostelController::class, 'update'])->middleware('permission:hostel.manage')->name('hostel.update');
        Route::delete('/hostel/{hostel}', [\App\Http\Controllers\SchoolAdmin\HostelController::class, 'destroy'])->middleware('permission:hostel.manage')->name('hostel.destroy');
        Route::get('/hostel/{hostel}/rooms', [\App\Http\Controllers\SchoolAdmin\HostelController::class, 'rooms'])->middleware('permission:hostel.view')->name('hostel.rooms');
        Route::post('/hostel/{hostel}/rooms', [\App\Http\Controllers\SchoolAdmin\HostelController::class, 'storeRoom'])->middleware('permission:hostel.manage')->name('hostel.rooms.store');
        Route::put('/hostel/{hostel}/rooms/{room}', [\App\Http\Controllers\SchoolAdmin\HostelController::class, 'updateRoom'])->middleware('permission:hostel.manage')->name('hostel.rooms.update');
        Route::delete('/hostel/{hostel}/rooms/{room}', [\App\Http\Controllers\SchoolAdmin\HostelController::class, 'destroyRoom'])->middleware('permission:hostel.manage')->name('hostel.rooms.destroy');
        Route::get('/hostel/{hostel}/available-rooms', [\App\Http\Controllers\SchoolAdmin\HostelController::class, 'hostelRooms'])->middleware('permission:hostel.view')->name('hostel.available-rooms');
        Route::get('/hostel/allocations', [\App\Http\Controllers\SchoolAdmin\HostelController::class, 'allocations'])->middleware('permission:hostel.view')->name('hostel.allocations');
        Route::post('/hostel/allocations', [\App\Http\Controllers\SchoolAdmin\HostelController::class, 'storeAllocation'])->middleware('permission:hostel.manage')->name('hostel.allocations.store');
        Route::put('/hostel/allocations/{allocation}/vacate', [\App\Http\Controllers\SchoolAdmin\HostelController::class, 'vacate'])->middleware('permission:hostel.manage')->name('hostel.allocations.vacate');

        // Homework & Online Classes
        Route::get('/homework', [\App\Http\Controllers\SchoolAdmin\HomeworkController::class, 'index'])->middleware('permission:homework.view')->name('homework.index');
        Route::post('/homework', [\App\Http\Controllers\SchoolAdmin\HomeworkController::class, 'store'])->name('homework.store');
        Route::put('/homework/{homework}', [\App\Http\Controllers\SchoolAdmin\HomeworkController::class, 'update'])->name('homework.update');
        Route::delete('/homework/{homework}', [\App\Http\Controllers\SchoolAdmin\HomeworkController::class, 'destroy'])->name('homework.destroy');
        Route::get('/homework/lesson-plans', [\App\Http\Controllers\SchoolAdmin\HomeworkController::class, 'lessonPlans'])->middleware('permission:lessons.view')->name('homework.lesson-plans.index');
        Route::get('/homework/syllabi', [\App\Http\Controllers\SchoolAdmin\HomeworkController::class, 'syllabi'])->middleware('permission:syllabus.view')->name('homework.syllabi.index');
        Route::get('/online-classes', [\App\Http\Controllers\SchoolAdmin\OnlineClassController::class, 'index'])->name('online-classes.index');
        Route::post('/online-classes', [\App\Http\Controllers\SchoolAdmin\OnlineClassController::class, 'store'])->name('online-classes.store');
        Route::post('/online-classes/{onlineClass}/start', [\App\Http\Controllers\SchoolAdmin\OnlineClassController::class, 'start'])->name('online-classes.start');
        Route::post('/online-classes/{onlineClass}/end', [\App\Http\Controllers\SchoolAdmin\OnlineClassController::class, 'end'])->name('online-classes.end');
        Route::delete('/online-classes/{onlineClass}', [\App\Http\Controllers\SchoolAdmin\OnlineClassController::class, 'destroy'])->name('online-classes.destroy');

        // Reports & Audits
        Route::get('/reports/dashboard', [\App\Http\Controllers\SchoolAdmin\ReportController::class, 'dashboard'])->name('reports.dashboard');
        Route::get('/reports/academic', [\App\Http\Controllers\SchoolAdmin\ReportController::class, 'academic'])->name('reports.academic');
        Route::get('/reports/attendance', [\App\Http\Controllers\SchoolAdmin\ReportController::class, 'attendance'])->name('reports.attendance');
        Route::get('/reports/attendance/export-pdf', [\App\Http\Controllers\SchoolAdmin\ReportController::class, 'exportAttendancePdf'])->middleware('permission:attendance.export')->name('reports.attendance.export-pdf');
        Route::get('/reports/finance', [\App\Http\Controllers\SchoolAdmin\FinancialReportController::class, 'index'])->middleware('permission:reports.view')->name('reports.finance');
        Route::get('/reports/finance/export-pdf', [\App\Http\Controllers\SchoolAdmin\ReportController::class, 'exportFinancePdf'])->middleware('permission:reports.export')->name('reports.finance.export-pdf');
        Route::get('/reports/custom', [\App\Http\Controllers\SchoolAdmin\ReportController::class, 'customBuilder'])->middleware('permission:reports.custom')->name('reports.custom');
        Route::post('/reports/custom/run', [\App\Http\Controllers\SchoolAdmin\ReportController::class, 'runCustomReport'])->middleware('permission:reports.custom')->name('reports.custom.run');
        Route::get('/reports/custom/export-csv', [\App\Http\Controllers\SchoolAdmin\ReportController::class, 'exportCsv'])->middleware('permission:reports.export')->name('reports.custom.export-csv');
        Route::get('/reports/audit-log', [\App\Http\Controllers\SchoolAdmin\ReportController::class, 'auditLog'])->name('reports.audit-log');
        Route::get('/compliance/odpc-audit', [\App\Http\Controllers\SchoolAdmin\OdpcAuditController::class, 'index'])->name('compliance.odpc-audit');

        // Settings
        Route::get('/settings', [\App\Http\Controllers\SchoolAdmin\SettingsController::class, 'index'])->middleware('permission:settings.view')->name('settings.index');
        Route::post('/settings/general', [\App\Http\Controllers\SchoolAdmin\SettingsController::class, 'saveGeneral'])->middleware('permission:settings.edit')->name('settings.general');
        Route::get('/settings/admins', [\App\Http\Controllers\SchoolAdmin\SchoolUserController::class, 'index'])->middleware('permission:users.view')->name('settings.admins');
        Route::get('/settings/integrations', [\App\Http\Controllers\SchoolAdmin\IntegrationController::class, 'index'])->middleware('permission:settings.edit')->name('settings.integrations');
        Route::resource('holidays', \App\Http\Controllers\SchoolAdmin\HolidayController::class)->except(['create', 'edit', 'show']);
    });

/*
|--------------------------------------------------------------------------
| Student & Parent Portals
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'active', 'role:student'])->prefix('student')->name('student.')->group(function () {
    Route::get('/', [\App\Http\Controllers\StudentPortalController::class, 'index'])->name('dashboard');
    Route::get('/attendance', [\App\Http\Controllers\StudentPortalController::class, 'attendance'])->name('attendance');
    Route::get('/timetable', [\App\Http\Controllers\StudentPortalController::class, 'timetable'])->name('timetable');
    Route::get('/homework', [\App\Http\Controllers\StudentPortalController::class, 'homework'])->name('homework');
    Route::get('/results', [\App\Http\Controllers\StudentPortalController::class, 'results'])->name('results');
    Route::get('/cocurricular', [\App\Http\Controllers\StudentPortalController::class, 'cocurricular'])->name('cocurricular');
    Route::get('/talent-passport/pdf', [\App\Http\Controllers\StudentPortalController::class, 'exportTalentPassportPdf'])->name('talent.pdf');
    Route::get('/announcements', [\App\Http\Controllers\StudentPortalController::class, 'announcements'])->name('announcements');
    Route::get('/profile', [\App\Http\Controllers\StudentPortalController::class, 'profile'])->name('profile');
});

Route::middleware(['auth', 'active', 'role:parent'])->prefix('parent')->name('parent.')->group(function () {
    Route::get('/', [\App\Http\Controllers\ParentPortalController::class, 'index'])->name('dashboard');
    Route::get('/attendance', [\App\Http\Controllers\ParentPortalController::class, 'attendance'])->name('attendance');
    Route::get('/fees', [\App\Http\Controllers\ParentPortalController::class, 'fees'])->name('fees');
    Route::get('/results', [\App\Http\Controllers\ParentPortalController::class, 'results'])->name('results');
    Route::get('/cocurricular', [\App\Http\Controllers\ParentPortalController::class, 'cocurricular'])->name('cocurricular');
    Route::get('/talent-passport/{student}/pdf', [\App\Http\Controllers\ParentPortalController::class, 'exportTalentPassportPdf'])->name('talent.pdf');
    Route::get('/announcements', [\App\Http\Controllers\ParentPortalController::class, 'announcements'])->name('announcements');
    Route::get('/timetable', [\App\Http\Controllers\ParentPortalController::class, 'timetable'])->name('timetable');
    Route::get('/homework', [\App\Http\Controllers\ParentPortalController::class, 'homework'])->name('homework');
    Route::get('/messages', [\App\Http\Controllers\ParentPortalController::class, 'messages'])->name('messages');
    Route::get('/profile', [\App\Http\Controllers\ParentPortalController::class, 'profile'])->name('profile');
});

/*
|--------------------------------------------------------------------------
| Platform Administration (Super Admin Visual Studio)
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'active', 'role:super-admin'])->prefix('super-admin')->name('super-admin.')->group(function () {

        // --- AUTOMATED AUDIT REPAIRS: SUPER ADMIN ENDPOINTS ---
        Route::match(['post', 'patch'], '/faqs/{faq}/toggle-publish', [\App\Http\Controllers\SuperAdmin\FaqController::class, 'togglePublish'])->name('faqs.toggle-publish');
        Route::match(['post', 'patch'], '/faqs/{faq}/toggle-homepage', [\App\Http\Controllers\SuperAdmin\FaqController::class, 'toggleHomepage'])->name('faqs.toggle-homepage');
        Route::match(['post', 'delete'], '/settings/register-backgrounds/delete', [\App\Http\Controllers\SuperAdmin\SettingsController::class, 'deleteRegisterBackground'])->name('settings.register-backgrounds.delete');
        Route::post('/users/{user}/{action}', function ($user, $action) {
            $controller = app(\App\Http\Controllers\SuperAdmin\UserManagementController::class);
            if (method_exists($controller, $action)) {
                return $controller->$action($user);
            }
            abort(404);
        })->name('users.action');
    Route::get('/dashboard', [\App\Http\Controllers\SuperAdmin\DashboardController::class, 'index'])->name('dashboard');
    Route::resource('schools', \App\Http\Controllers\SuperAdmin\SchoolController::class);
    Route::match(['post', 'patch'], '/schools/{school}/suspend', [\App\Http\Controllers\SuperAdmin\SchoolController::class, 'suspend'])->name('schools.suspend');
    Route::match(['post', 'patch'], '/schools/{school}/activate', [\App\Http\Controllers\SuperAdmin\SchoolController::class, 'activate'])->name('schools.activate');

    Route::get('/settings', [\App\Http\Controllers\SuperAdmin\SettingsController::class, 'index'])->name('settings.index');
    Route::post('/settings/general', [\App\Http\Controllers\SuperAdmin\SettingsController::class, 'saveGeneral'])->name('settings.general');
    Route::get('/system-health', [\App\Http\Controllers\SuperAdmin\SystemHealthController::class, 'index'])->name('system-health.index');

    // Module Manager
    Route::get('/module-manager', [\App\Http\Controllers\SuperAdmin\ModuleManagerController::class, 'index'])->name('module-manager.index');
    Route::post('/module-manager/toggle', [\App\Http\Controllers\SuperAdmin\ModuleManagerController::class, 'toggle'])->name('module-manager.toggle');
    Route::post('/module-manager/bulk', [\App\Http\Controllers\SuperAdmin\ModuleManagerController::class, 'bulkSave'])->name('module-manager.bulk');
    Route::get('/modules', fn () => redirect()->route('super-admin.module-manager.index'));

    // Super Admin Visual CMS Studio
    Route::resource('blogs', \App\Http\Controllers\SuperAdmin\BlogController::class);
    Route::resource('faqs', \App\Http\Controllers\SuperAdmin\FaqController::class);
    Route::get('/website/pages', [\App\Http\Controllers\SuperAdmin\WebsitePageController::class, 'index'])->name('website.pages.index');
    Route::post('/website/pages', [\App\Http\Controllers\SuperAdmin\WebsitePageController::class, 'store'])->name('website.pages.store');
    Route::put('/website/pages/{websitePage}', [\App\Http\Controllers\SuperAdmin\WebsitePageController::class, 'update'])->name('website.pages.update');
    Route::delete('/website/pages/{websitePage}', [\App\Http\Controllers\SuperAdmin\WebsitePageController::class, 'destroy'])->name('website.pages.destroy');
    
    // CMS Sections & Blocks (Used by Studio Index.tsx)
    Route::post('/website/pages/{websitePage}/sections', [\App\Http\Controllers\SuperAdmin\WebsitePageController::class, 'saveSection'])->name('website.pages.sections.save');
    Route::delete('/website/pages/{websitePage}/sections/{section}', [\App\Http\Controllers\SuperAdmin\WebsitePageController::class, 'deleteSection'])->name('website.pages.sections.delete');
    Route::patch('/website/pages/{websitePage}/publish', [\App\Http\Controllers\SuperAdmin\WebsitePageController::class, 'publish'])->name('website.pages.publish');

    // CMS Media Asset Library
    Route::get('/website/media', [\App\Http\Controllers\SuperAdmin\WebsiteMediaController::class, 'index'])->name('website.media.index');
    Route::post('/website/media', [\App\Http\Controllers\SuperAdmin\WebsiteMediaController::class, 'store'])->name('website.media.store');
    Route::put('/website/media/{medium}', [\App\Http\Controllers\SuperAdmin\WebsiteMediaController::class, 'update'])->name('website.media.update');
    Route::delete('/website/media/{medium}', [\App\Http\Controllers\SuperAdmin\WebsiteMediaController::class, 'destroy'])->name('website.media.destroy');

    // Packages, Subscriptions, Users
    Route::match(['post', 'patch'], '/users/{user}/suspend', [\App\Http\Controllers\SuperAdmin\UserManagementController::class, 'suspend'])->name('users.suspend');
    Route::match(['post', 'patch'], '/users/{user}/activate', [\App\Http\Controllers\SuperAdmin\UserManagementController::class, 'activate'])->name('users.activate');
    Route::post('/users/{user}/reset-password', [\App\Http\Controllers\SuperAdmin\UserManagementController::class, 'resetPassword'])->name('users.reset-password');
    Route::resource('users', \App\Http\Controllers\SuperAdmin\UserManagementController::class)->except(['show', 'create', 'edit']);
    Route::resource('packages', \App\Http\Controllers\SuperAdmin\PackageController::class)->except(['show', 'create', 'edit']);
    Route::resource('subscriptions', \App\Http\Controllers\SuperAdmin\SubscriptionController::class)->except(['show', 'create', 'edit']);
    Route::resource('coupons', \App\Http\Controllers\SuperAdmin\CouponController::class)->except(['show', 'create', 'edit']);
});

/*
|--------------------------------------------------------------------------
| Webhooks & Callbacks
|--------------------------------------------------------------------------
*/
Route::post('/api/v1/payments/paystack/webhook', [PaystackWebhookController::class, 'handleWebhook'])
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class])
    ->middleware('throttle:webhooks')
    ->name('payments.paystack.webhook');

Route::post('/api/v1/payments/daraja/callback/{school:slug}', [DarajaWebhookController::class, 'handleCallback'])
    ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class])
    ->middleware('throttle:webhooks')
    ->name('payments.daraja.callback');

/*
|--------------------------------------------------------------------------
| Dynamic Fallback
|--------------------------------------------------------------------------
*/
Route::fallback([PublicWebsiteController::class, 'page'])->name('public.page');
Route::middleware(['auth', 'active'])->group(function () {
    Route::get('/onboarding', [\App\Http\Controllers\OnboardingController::class, 'index'])->name('onboarding');
    Route::post('/onboarding', [\App\Http\Controllers\OnboardingController::class, 'update'])->name('onboarding.update');
});

Route::middleware(['auth', 'active'])->group(function () {
    Route::get('/school/homework/{homework}/download', [\App\Http\Controllers\SchoolAdmin\HomeworkController::class, 'download'])->name('school.homework.download');
});
