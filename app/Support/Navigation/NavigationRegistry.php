<?php

namespace App\Support\Navigation;

use App\Models\User;
use App\Support\Authorization\ModuleAccessService;
use App\Support\Authorization\RoleCatalog;
use Illuminate\Support\Facades\Route;

final class NavigationRegistry
{
    public function __construct(private ModuleAccessService $modules) {}

    public function for(User $user): array
    {
        return collect($this->definitions())
            ->filter(fn (array $item): bool => $this->available($user, $item))
            ->map(fn (array $item): array => [
                'group' => $item['group'],
                'label' => $item['label'],
                'href'  => route($item['route']),
                'icon'  => $item['icon'],
            ])
            ->groupBy('group')
            ->map(fn ($items, $group): array => [
                'groupTitle' => $group,
                'items'      => $items->values()->all(),
            ])
            ->values()
            ->all();
    }

    private function available(User $user, array $item): bool
    {
        if (! Route::has($item['route'])) return false;
        if (($item['scope'] ?? null) === 'platform' && ! RoleCatalog::isPlatform($user)) return false;
        if (($item['scope'] ?? null) === 'school' && (! RoleCatalog::hasSchoolRole($user) || RoleCatalog::isPlatform($user))) return false;
        if (($item['scope'] ?? null) === 'portal' && ! RoleCatalog::hasPortalRole($user)) return false;

        if (! empty($item['roles']) && ! $user->hasAnyRole($item['roles'])) return false;
        if (! empty($item['permission']) && ! $user->can($item['permission'])) return false;
        if (! empty($item['module']) && ! $this->modules->isEnabledForUser($user, $item['module'])) return false;

        return true;
    }

    private function definitions(): array
    {
        return [
            // Platform Scope (Super Admin)
            ['group' => 'Platform Overview', 'label' => 'Command Center', 'route' => 'super-admin.dashboard', 'icon' => 'dashboard', 'scope' => 'platform', 'roles' => ['super-admin']],
            ['group' => 'Platform Overview', 'label' => 'Institutions & Tenants', 'route' => 'super-admin.schools.index', 'icon' => 'school', 'scope' => 'platform', 'roles' => ['super-admin'], 'permission' => 'schools.view'],
            ['group' => 'Platform Governance', 'label' => 'Platform Users', 'route' => 'super-admin.users.index', 'icon' => 'users', 'scope' => 'platform', 'roles' => ['super-admin'], 'permission' => 'users.view'],
            ['group' => 'SaaS Commercials', 'label' => 'SaaS Packages', 'route' => 'super-admin.packages.index', 'icon' => 'package', 'scope' => 'platform', 'roles' => ['super-admin']],
            ['group' => 'SaaS Commercials', 'label' => 'Subscriptions', 'route' => 'super-admin.subscriptions.index', 'icon' => 'credit-card', 'scope' => 'platform', 'roles' => ['super-admin']],
            ['group' => 'SaaS Commercials', 'label' => 'Coupons & Promotions', 'route' => 'super-admin.coupons.index', 'icon' => 'award', 'scope' => 'platform', 'roles' => ['super-admin']],
            ['group' => 'Platform Governance', 'label' => 'Feature Modules', 'route' => 'super-admin.module-manager.index', 'icon' => 'layers', 'scope' => 'platform', 'roles' => ['super-admin']],
            ['group' => 'Marketing & CMS', 'label' => 'Website Pages', 'route' => 'super-admin.website.pages.index', 'icon' => 'file-text', 'scope' => 'platform', 'roles' => ['super-admin'], 'permission' => 'website.view'],
            ['group' => 'Marketing & CMS', 'label' => 'Articles & Blog', 'route' => 'super-admin.blogs.index', 'icon' => 'newspaper', 'scope' => 'platform', 'roles' => ['super-admin']],
            ['group' => 'Marketing & CMS', 'label' => 'Public FAQs', 'route' => 'super-admin.faqs.index', 'icon' => 'help-circle', 'scope' => 'platform', 'roles' => ['super-admin']],
            ['group' => 'Marketing & CMS', 'label' => 'Website Media', 'route' => 'super-admin.website.media.index', 'icon' => 'image', 'scope' => 'platform', 'roles' => ['super-admin'], 'permission' => 'website.media'],
            ['group' => 'Platform Governance', 'label' => 'System Settings & Audit', 'route' => 'super-admin.settings.index', 'icon' => 'settings', 'scope' => 'platform', 'roles' => ['super-admin'], 'permission' => 'settings.view'],
            ['group' => 'Platform Operations', 'label' => 'System Health', 'route' => 'super-admin.system-health.index', 'icon' => 'shield-alert', 'scope' => 'platform', 'roles' => ['super-admin']],

            // School Scope (Admin, Teacher, Staff)
            ['group' => 'Overview', 'label' => 'Operations Dashboard', 'route' => 'school.reports.dashboard', 'icon' => 'dashboard', 'scope' => 'school', 'permission' => 'reports.view', 'module' => 'reports'],
            ['group' => 'Admissions & Staff', 'label' => 'Learners Directory', 'route' => 'school.students.index', 'icon' => 'users', 'scope' => 'school', 'permission' => 'students.view', 'module' => 'students'],
            ['group' => 'Admissions & Staff', 'label' => 'Classes & Grades', 'route' => 'school.classes.index', 'icon' => 'school', 'scope' => 'school', 'permission' => 'classes.view', 'module' => 'students'],
            ['group' => 'Admissions & Staff', 'label' => 'Streams & Sections', 'route' => 'school.sections.index', 'icon' => 'building', 'scope' => 'school', 'permission' => 'sections.view', 'module' => 'students'],
            ['group' => 'Admissions & Staff', 'label' => 'Staff Directory', 'route' => 'school.staff.index', 'icon' => 'users', 'scope' => 'school', 'permission' => 'staff.view', 'module' => 'staff'],
            ['group' => 'Admissions & Staff', 'label' => 'Daily Attendance', 'route' => 'school.attendance.index', 'icon' => 'calendar', 'scope' => 'school', 'permission' => 'attendance.view', 'module' => 'attendance'],
            ['group' => 'Academics', 'label' => 'Timetable', 'route' => 'school.timetable.index', 'icon' => 'calendar', 'scope' => 'school', 'permission' => 'timetable.view', 'module' => 'timetable'],
            ['group' => 'Academics', 'label' => 'Virtual Classrooms', 'route' => 'school.online-classes.index', 'icon' => 'video', 'scope' => 'school'],
            ['group' => 'Academics', 'label' => 'Exams & Academic Records', 'route' => 'school.exams.index', 'icon' => 'book-open', 'scope' => 'school', 'permission' => 'exams.view', 'module' => 'exams'],
            ['group' => 'Academics', 'label' => 'Academic Reports', 'route' => 'school.reports.academic', 'icon' => 'file-text', 'scope' => 'school', 'permission' => 'reports.view', 'module' => 'reports'],
            ['group' => 'Finance & People', 'label' => 'Fee Collection Ledger', 'route' => 'school.fees.payments.index', 'icon' => 'credit-card', 'scope' => 'school', 'permission' => 'fees.view', 'module' => 'fees'],
            ['group' => 'Finance & People', 'label' => 'Payroll', 'route' => 'school.hr.payroll.index', 'icon' => 'credit-card', 'scope' => 'school', 'permission' => 'payroll.view', 'module' => 'hr'],
            ['group' => 'Operations', 'label' => 'Library', 'route' => 'school.library.books.index', 'icon' => 'book-open', 'scope' => 'school', 'permission' => 'library.view', 'module' => 'library'],
            ['group' => 'Operations', 'label' => 'Transport', 'route' => 'school.transport.routes', 'icon' => 'bus', 'scope' => 'school', 'permission' => 'transport.view', 'module' => 'transport'],
            ['group' => 'Operations', 'label' => 'Hostel', 'route' => 'school.hostel.index', 'icon' => 'building', 'scope' => 'school', 'permission' => 'hostel.view', 'module' => 'hostel'],
            ['group' => 'Operations', 'label' => 'Inventory', 'route' => 'school.inventory.items', 'icon' => 'package', 'scope' => 'school', 'permission' => 'inventory.view', 'module' => 'inventory'],
            ['group' => 'Teaching & Communication', 'label' => 'Homework & Tasks', 'route' => 'school.homework.index', 'icon' => 'book-open', 'scope' => 'school', 'permission' => 'homework.view', 'module' => 'homework'],
            ['group' => 'Teaching & Communication', 'label' => 'Lesson Plans', 'route' => 'school.homework.lesson-plans.index', 'icon' => 'file-text', 'scope' => 'school', 'permission' => 'lessons.view', 'module' => 'homework'],
            ['group' => 'Teaching & Communication', 'label' => 'Curriculum Syllabi', 'route' => 'school.homework.syllabi.index', 'icon' => 'book-open', 'scope' => 'school', 'permission' => 'syllabus.view', 'module' => 'homework'],
            ['group' => 'Teaching & Communication', 'label' => 'Announcements', 'route' => 'school.communication.announcements', 'icon' => 'file-text', 'scope' => 'school', 'permission' => 'announcements.view', 'module' => 'communication'],
            ['group' => 'Teaching & Communication', 'label' => 'Messages', 'route' => 'school.communication.messages', 'icon' => 'users', 'scope' => 'school', 'permission' => 'messages.view', 'module' => 'communication'],
            ['group' => 'School Administration', 'label' => 'School Settings', 'route' => 'school.settings.index', 'icon' => 'settings', 'scope' => 'school', 'permission' => 'settings.view'],
            ['group' => 'School Administration', 'label' => 'School Users & Admins', 'route' => 'school.settings.admins', 'icon' => 'users', 'scope' => 'school', 'permission' => 'settings.view'],

            // Portal Scope (Parent)
            ['group' => 'Family Portal', 'label' => 'Children Overview', 'route' => 'parent.dashboard', 'icon' => 'dashboard', 'scope' => 'portal', 'roles' => ['parent'], 'module' => 'students'],
            ['group' => 'Family Portal', 'label' => 'Attendance Records', 'route' => 'parent.attendance', 'icon' => 'calendar', 'scope' => 'portal', 'roles' => ['parent'], 'module' => 'attendance'],
            ['group' => 'Family Portal', 'label' => 'Fee Statement & Pay', 'route' => 'parent.fees', 'icon' => 'credit-card', 'scope' => 'portal', 'roles' => ['parent'], 'module' => 'fees'],
            ['group' => 'Family Portal', 'label' => 'Results', 'route' => 'parent.results', 'icon' => 'book-open', 'scope' => 'portal', 'roles' => ['parent'], 'module' => 'exams'],
            ['group' => 'Family Portal', 'label' => 'School Notices', 'route' => 'parent.announcements', 'icon' => 'file-text', 'scope' => 'portal', 'roles' => ['parent'], 'module' => 'communication'],

            // Portal Scope (Student)
            ['group' => 'Learning Workspace', 'label' => 'Learning Cockpit', 'route' => 'student.dashboard', 'icon' => 'dashboard', 'scope' => 'portal', 'roles' => ['student'], 'module' => 'students'],
            ['group' => 'Learning Workspace', 'label' => 'Class Timetable', 'route' => 'student.timetable', 'icon' => 'calendar', 'scope' => 'portal', 'roles' => ['student'], 'module' => 'timetable'],
            ['group' => 'Learning Workspace', 'label' => 'Attendance', 'route' => 'student.attendance', 'icon' => 'calendar', 'scope' => 'portal', 'roles' => ['student'], 'module' => 'attendance'],
            ['group' => 'Learning Workspace', 'label' => 'Homework Tasks', 'route' => 'student.homework', 'icon' => 'book-open', 'scope' => 'portal', 'roles' => ['student'], 'module' => 'homework'],
            ['group' => 'Learning Workspace', 'label' => 'Published Marks', 'route' => 'student.results', 'icon' => 'file-text', 'scope' => 'portal', 'roles' => ['student'], 'module' => 'exams'],
            ['group' => 'Learning Workspace', 'label' => 'Virtual Classrooms', 'route' => 'school.online-classes.index', 'icon' => 'video', 'scope' => 'portal', 'roles' => ['student']],
            ['group' => 'Learning Workspace', 'label' => 'Fee Statement', 'route' => 'student.fees', 'icon' => 'credit-card', 'scope' => 'portal', 'roles' => ['student'], 'module' => 'fees'],
            ['group' => 'Learning Workspace', 'label' => 'Announcements', 'route' => 'student.announcements', 'icon' => 'file-text', 'scope' => 'portal', 'roles' => ['student'], 'module' => 'communication'],
        ];
    }
}