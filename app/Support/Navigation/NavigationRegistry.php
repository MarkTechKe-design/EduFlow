<?php

namespace App\Support\Navigation;

use App\Models\User;
use App\Support\Authorization\ModuleAccessService;
use Illuminate\Support\Facades\Route;

class NavigationRegistry
{
    /**
     * Get all navigation items filtered by user role and tenant context.
     */
    public function for(User $user): array
    {
        $allItems = $this->items();
        $userRoles = method_exists($user, 'getRoleNames') ? $user->getRoleNames()->toArray() : $user->roles()->pluck('name')->toArray();
        $isSuperAdmin = in_array('super-admin', $userRoles, true);
        $moduleAccess = app(ModuleAccessService::class);

        $filtered = array_filter($allItems, function ($item) use ($user, $userRoles, $isSuperAdmin, $moduleAccess) {
            if ($isSuperAdmin) {
                return ($item['scope'] ?? '') === 'platform';
            }

            if (($item['scope'] ?? '') === 'platform') {
                return false;
            }

            if (!empty($item['roles'])) {
                if (empty(array_intersect($userRoles, $item['roles']))) {
                    return false;
                }
            }

            $module = $this->moduleForItem($item);
            if ($module !== null && $user->school_id) {
                if (!$moduleAccess->isEnabledForUser($user, $module)) {
                    return false;
                }
            }

            return true;
        });

        $grouped = [];
        foreach ($filtered as $item) {
            $groupName = $item['group'] ?? 'General';
            if (!isset($grouped[$groupName])) {
                $grouped[$groupName] = [
                    'groupTitle' => $groupName,
                    'items'      => [],
                ];
            }

            $grouped[$groupName]['items'][] = [
                'label'  => $item['label'],
                'href'   => Route::has($item['route']) ? route($item['route']) : '#',
                'icon'   => $item['icon'] ?? 'circle',
                'active' => request()->routeIs($item['route'] . '*'),
            ];
        }

        return array_values($grouped);
    }

    private function moduleForItem(array $item): ?string
    {
        if (isset($item['module'])) {
            return $item['module'];
        }

        $routeName = $item['route'] ?? '';
        $map = [
            'school.students.' => 'students',
            'school.admissions.' => 'students',
            'school.attendance.' => 'attendance',
            'school.classes.' => 'timetable',
            'school.sections.' => 'timetable',
            'school.subjects.' => 'timetable',
            'school.teacher-assignments.' => 'timetable',
            'school.timetable.' => 'timetable',
            'school.holidays.' => 'timetable',
            'school.online-classes.' => 'homework',
            'school.homework.' => 'homework',
            'school.exams.' => 'exams',
            'school.grade-scales.' => 'exams',
            'school.cbc-assessments.' => 'exams',
            'school.fees.' => 'fees',
            'school.staff.' => 'staff',
            'school.departments.' => 'staff',
            'school.designations.' => 'staff',
            'school.hr.' => 'hr',
            'school.library.' => 'library',
            'school.transport.' => 'transport',
            'school.hostel.' => 'hostel',
            'school.inventory.' => 'inventory',
            'school.communication.' => 'communication',
            'school.reports.' => 'reports',
            'school.compliance.' => 'reports',
            'school.cocurricular.' => 'cocurricular',
            'student.cocurricular' => 'cocurricular',
            'parent.cocurricular' => 'cocurricular',
            'student.dashboard' => 'students',
            'student.attendance' => 'attendance',
            'student.timetable' => 'timetable',
            'student.results' => 'exams',
            'student.homework' => 'homework',
            'student.fees' => 'fees',
            'student.announcements' => 'communication',
            'parent.dashboard' => 'students',
            'parent.attendance' => 'attendance',
            'parent.results' => 'exams',
            'parent.fees' => 'fees',
            'parent.announcements' => 'communication',
        ];

        foreach ($map as $prefix => $module) {
            if ($routeName === $prefix || str_starts_with($routeName, $prefix)) {
                return $module;
            }
        }

        return null;
    }

    public function items(): array
    {
        return [
            // 1. CORE DASHBOARD
            ['group' => 'Overview', 'label' => 'Dashboard', 'route' => 'dashboard', 'icon' => 'layout-dashboard', 'scope' => 'all', 'roles' => ['school-admin', 'principal', 'teacher', 'accountant', 'librarian', 'receptionist', 'driver', 'warden', 'store-manager']],

            // 2. STUDENT MANAGEMENT & ADMISSIONS
            ['group' => 'Student Management', 'label' => 'All Students', 'route' => 'school.students.index', 'icon' => 'users', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'teacher', 'receptionist']],
            ['group' => 'Student Management', 'label' => 'Student Admission', 'route' => 'school.students.create', 'icon' => 'user-plus', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'receptionist']],
            ['group' => 'Student Management', 'label' => 'Bulk Student Import', 'route' => 'school.students.import', 'icon' => 'upload', 'scope' => 'school', 'roles' => ['school-admin', 'principal']],
            ['group' => 'Student Management', 'label' => 'Student Promotion', 'route' => 'school.students.promote', 'icon' => 'trending-up', 'scope' => 'school', 'roles' => ['school-admin', 'principal']],
            ['group' => 'Student Management', 'label' => 'Admission Inquiries', 'route' => 'school.admissions.inquiries', 'icon' => 'clipboard-list', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'receptionist']],
            ['group' => 'Student Management', 'label' => 'Visitor Front Desk', 'route' => 'school.admissions.visitors', 'icon' => 'user-check', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'receptionist']],

            // 3. ATTENDANCE REGISTER
            ['group' => 'Attendance', 'label' => 'Student Attendance', 'route' => 'school.attendance.index', 'icon' => 'calendar-check', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'teacher']],
            ['group' => 'Attendance', 'label' => 'Staff Attendance', 'route' => 'school.attendance.staff.index', 'icon' => 'user-check', 'scope' => 'school', 'roles' => ['school-admin', 'principal']],

            // 4. ACADEMIC ARCHITECTURE
            ['group' => 'Academic Operations', 'label' => 'Classes Master', 'route' => 'school.classes.index', 'icon' => 'school', 'scope' => 'school', 'roles' => ['school-admin', 'principal']],
            ['group' => 'Academic Operations', 'label' => 'Streams & Sections', 'route' => 'school.sections.index', 'icon' => 'layers', 'scope' => 'school', 'roles' => ['school-admin', 'principal']],
            ['group' => 'Academic Operations', 'label' => 'Subjects Directory', 'route' => 'school.subjects.index', 'icon' => 'book-open', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'teacher']],
            ['group' => 'Academic Operations', 'label' => 'Teacher Allocations', 'route' => 'school.teacher-assignments.index', 'icon' => 'user-cog', 'scope' => 'school', 'roles' => ['school-admin', 'principal']],
            ['group' => 'Academic Operations', 'label' => 'School Timetable', 'route' => 'school.timetable.index', 'icon' => 'clock', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'teacher']],
            ['group' => 'Academic Operations', 'label' => 'Academic Holidays', 'route' => 'school.holidays.index', 'icon' => 'calendar-days', 'scope' => 'school', 'roles' => ['school-admin', 'principal']],

            // 5. CURRICULUM & VIRTUAL CLASSROOM
            ['group' => 'Teaching & Learning', 'label' => 'Live Online Classes', 'route' => 'school.online-classes.index', 'icon' => 'video', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'teacher', 'student', 'parent', 'librarian', 'receptionist', 'store-manager', 'warden', 'driver']],
            ['group' => 'Teaching & Learning', 'label' => 'Homework & Tasks', 'route' => 'school.homework.index', 'icon' => 'file-text', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'teacher']],
            ['group' => 'Teaching & Learning', 'label' => 'Lesson Plans', 'route' => 'school.homework.lesson-plans.index', 'icon' => 'book-open', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'teacher']],
            ['group' => 'Teaching & Learning', 'label' => 'Syllabus Tracking', 'route' => 'school.homework.syllabi.index', 'icon' => 'clipboard-list', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'teacher']],

            // 6. EXAMINATIONS & CBC ASSESSMENTS
            ['group' => 'Examinations & Grading', 'label' => 'Exams Master', 'route' => 'school.exams.index', 'icon' => 'award', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'teacher']],
            ['group' => 'Examinations & Grading', 'label' => 'Grading Scales', 'route' => 'school.grade-scales.index', 'icon' => 'chart-column', 'scope' => 'school', 'roles' => ['school-admin', 'principal']],
            ['group' => 'Examinations & Grading', 'label' => 'CBC Assessments', 'route' => 'school.cbc-assessments.index', 'icon' => 'file-check', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'teacher']],

            // 7. FINANCE & FEES
            ['group' => 'Finance & Fees', 'label' => 'Fee Collection Ledger', 'route' => 'school.fees.payments.index', 'icon' => 'credit-card', 'scope' => 'school', 'roles' => ['school-admin', 'accountant', 'principal']],
            ['group' => 'Finance & Fees', 'label' => 'Collect Fee Payment', 'route' => 'school.fees.payments.create', 'icon' => 'dollar-sign', 'scope' => 'school', 'roles' => ['school-admin', 'accountant']],
            ['group' => 'Finance & Fees', 'label' => 'Fee Categories', 'route' => 'school.fees.categories.index', 'icon' => 'layers', 'scope' => 'school', 'roles' => ['school-admin', 'accountant', 'principal']],
            ['group' => 'Finance & Fees', 'label' => 'Fee Structures Master', 'route' => 'school.fees.structures.index', 'icon' => 'file-text', 'scope' => 'school', 'roles' => ['school-admin', 'accountant', 'principal']],
            ['group' => 'Finance & Fees', 'label' => 'Outstanding Balances', 'route' => 'school.fees.outstanding', 'icon' => 'credit-card', 'scope' => 'school', 'roles' => ['school-admin', 'accountant', 'principal']],
            ['group' => 'Finance & Fees', 'label' => 'Unallocated Queue', 'route' => 'school.fees.unallocated', 'icon' => 'alert-circle', 'scope' => 'school', 'roles' => ['school-admin', 'accountant', 'principal']],
            ['group' => 'Finance & Fees', 'label' => 'Financial Reports', 'route' => 'school.fees.reports', 'icon' => 'file-spreadsheet', 'scope' => 'school', 'roles' => ['school-admin', 'accountant', 'principal']],
            ['group' => 'Finance & Fees', 'label' => 'Payment Integrations', 'route' => 'school.fees.integrations', 'icon' => 'globe', 'scope' => 'school', 'roles' => ['school-admin', 'accountant', 'principal']],

            // 8. HUMAN RESOURCES & PAYROLL
            ['group' => 'Human Resources', 'label' => 'Staff Directory', 'route' => 'school.staff.index', 'icon' => 'briefcase', 'scope' => 'school', 'roles' => ['school-admin', 'principal']],
            ['group' => 'Human Resources', 'label' => 'Add Staff Member', 'route' => 'school.staff.create', 'icon' => 'user-plus', 'scope' => 'school', 'roles' => ['school-admin', 'principal']],
            ['group' => 'Human Resources', 'label' => 'Departments', 'route' => 'school.departments.index', 'icon' => 'building-2', 'scope' => 'school', 'roles' => ['school-admin', 'principal']],
            ['group' => 'Human Resources', 'label' => 'Designations', 'route' => 'school.designations.index', 'icon' => 'badge', 'scope' => 'school', 'roles' => ['school-admin', 'principal']],
            ['group' => 'Human Resources', 'label' => 'Leave Management', 'route' => 'school.hr.leaves.index', 'icon' => 'calendar-days', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'teacher', 'accountant', 'librarian', 'receptionist', 'driver', 'warden', 'store-manager']],
            ['group' => 'Human Resources', 'label' => 'Leave Policies', 'route' => 'school.hr.leave-types.index', 'icon' => 'sliders', 'scope' => 'school', 'roles' => ['school-admin', 'principal']],
            ['group' => 'Human Resources', 'label' => 'Staff Payroll', 'route' => 'school.hr.payroll.index', 'icon' => 'receipt', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'accountant']],
            ['group' => 'Human Resources', 'label' => 'Salary Structure', 'route' => 'school.hr.salary-structure.index', 'icon' => 'dollar-sign', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'accountant']],

            // 9. LOGISTICS, LIBRARY & ASSETS
            ['group' => 'Campus Logistics', 'label' => 'Library & Resources', 'route' => 'school.library.index', 'icon' => 'book-open', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'librarian', 'teacher']],
            ['group' => 'Campus Logistics', 'label' => 'Transport & Fleet', 'route' => 'school.transport.index', 'icon' => 'truck', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'driver', 'operations-manager']],
            ['group' => 'Campus Logistics', 'label' => 'Hostel & Boarding', 'route' => 'school.hostel.index', 'icon' => 'building', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'warden']],
            ['group' => 'Campus Logistics', 'label' => 'Stores & Asset Management', 'route' => 'school.inventory.index', 'icon' => 'package', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'store-manager']],

            // 10. COMMUNICATIONS HUB
            ['group' => 'Communications', 'label' => 'Notice Board', 'route' => 'school.communication.announcements', 'icon' => 'bell', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'teacher', 'receptionist']],
            ['group' => 'Communications', 'label' => 'Internal Messages', 'route' => 'school.communication.messages', 'icon' => 'message-square', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'teacher', 'accountant', 'librarian', 'receptionist', 'driver', 'warden', 'store-manager']],
            ['group' => 'Communications', 'label' => 'SMS & Email Blast', 'route' => 'school.communication.blast', 'icon' => 'send', 'scope' => 'school', 'roles' => ['school-admin', 'principal']],
            ['group' => 'Communications', 'label' => 'Email Templates', 'route' => 'school.communication.email-templates', 'icon' => 'file-text', 'scope' => 'school', 'roles' => ['school-admin', 'principal']],

            // 11. REPORTS, AUDITS & ODPC COMPLIANCE
            ['group' => 'Reports & Audits', 'label' => 'Analytics Dashboard', 'route' => 'school.reports.dashboard', 'icon' => 'chart-column', 'scope' => 'school', 'roles' => ['school-admin', 'principal']],
            ['group' => 'Reports & Audits', 'label' => 'Academic Reports', 'route' => 'school.reports.academic', 'icon' => 'award', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'teacher']],
            ['group' => 'Reports & Audits', 'label' => 'Attendance Analytics', 'route' => 'school.reports.attendance', 'icon' => 'calendar-check', 'scope' => 'school', 'roles' => ['school-admin', 'principal']],
            ['group' => 'Reports & Audits', 'label' => 'Custom Report Builder', 'route' => 'school.reports.custom', 'icon' => 'file-spreadsheet', 'scope' => 'school', 'roles' => ['school-admin', 'principal']],
            ['group' => 'Reports & Audits', 'label' => 'System Audit Log', 'route' => 'school.reports.audit-log', 'icon' => 'activity', 'scope' => 'school', 'roles' => ['school-admin', 'principal']],
            ['group' => 'Reports & Audits', 'label' => 'ODPC Data Protection', 'route' => 'school.compliance.odpc-audit', 'icon' => 'shield-check', 'scope' => 'school', 'roles' => ['school-admin', 'principal']],

            // 12. SCHOOL SETTINGS & SYSTEM CONFIG
            ['group' => 'Administration', 'label' => 'School Settings', 'route' => 'school.settings.index', 'icon' => 'settings', 'scope' => 'school', 'roles' => ['school-admin', 'principal']],
            ['group' => 'Administration', 'label' => 'Admin Users', 'route' => 'school.settings.admins', 'icon' => 'user-cog', 'scope' => 'school', 'roles' => ['school-admin']],
            ['group' => 'Administration', 'label' => 'SMS & SMTP Gateways', 'route' => 'school.settings.integrations', 'icon' => 'wrench', 'scope' => 'school', 'roles' => ['school-admin']],

            // 13. CO-CURRICULAR & TALENT MANAGEMENT
            ['group' => 'Co-Curricular & Talent', 'label' => 'Co-Curricular Hub', 'route' => 'school.cocurricular.index', 'icon' => 'trophy', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'teacher'], 'module' => 'cocurricular'],
            ['group' => 'Co-Curricular & Talent', 'label' => 'Pitchside Console', 'route' => 'school.cocurricular.field-entry', 'icon' => 'zap', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'teacher'], 'module' => 'cocurricular'],
            ['group' => 'Co-Curricular & Talent', 'label' => 'Sports & Teams', 'route' => 'school.cocurricular.sports.teams', 'icon' => 'shield', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'teacher'], 'module' => 'cocurricular'],
            ['group' => 'Co-Curricular & Talent', 'label' => 'Athletics & Records', 'route' => 'school.cocurricular.athletics.index', 'icon' => 'activity', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'teacher'], 'module' => 'cocurricular'],
            ['group' => 'Co-Curricular & Talent', 'label' => 'Performing Arts', 'route' => 'school.cocurricular.arts.index', 'icon' => 'music', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'teacher'], 'module' => 'cocurricular'],
            ['group' => 'Co-Curricular & Talent', 'label' => 'Academic Competitions', 'route' => 'school.cocurricular.academic.index', 'icon' => 'award', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'teacher'], 'module' => 'cocurricular'],
            ['group' => 'Co-Curricular & Talent', 'label' => 'Clubs & Societies', 'route' => 'school.cocurricular.clubs.index', 'icon' => 'users', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'teacher'], 'module' => 'cocurricular'],
            ['group' => 'Co-Curricular & Talent', 'label' => 'Events & Calendar', 'route' => 'school.cocurricular.events.index', 'icon' => 'calendar', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'teacher'], 'module' => 'cocurricular'],
            ['group' => 'Co-Curricular & Talent', 'label' => 'House Championships', 'route' => 'school.cocurricular.houses.index', 'icon' => 'flag', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'teacher'], 'module' => 'cocurricular'],
            ['group' => 'Co-Curricular & Talent', 'label' => 'Talent Passports', 'route' => 'school.cocurricular.talent.index', 'icon' => 'file-text', 'scope' => 'school', 'roles' => ['school-admin', 'principal', 'teacher'], 'module' => 'cocurricular'],

            // 14. PARENT PORTAL
            ['group' => 'Parent Portal', 'label' => 'My Dashboard', 'route' => 'parent.dashboard', 'icon' => 'layout-dashboard', 'scope' => 'portal', 'roles' => ['parent', 'guardian']],
            ['group' => 'Parent Portal', 'label' => 'Child Attendance', 'route' => 'parent.attendance', 'icon' => 'calendar-check', 'scope' => 'portal', 'roles' => ['parent', 'guardian']],
            ['group' => 'Parent Portal', 'label' => 'Report Cards & Exams', 'route' => 'parent.results', 'icon' => 'award', 'scope' => 'portal', 'roles' => ['parent', 'guardian']],
            ['group' => 'Parent Portal', 'label' => 'Fee Ledger Statement', 'route' => 'parent.fees', 'icon' => 'credit-card', 'scope' => 'portal', 'roles' => ['parent', 'guardian']],
            ['group' => 'Parent Portal', 'label' => 'Co-Curricular & Talent', 'route' => 'parent.cocurricular', 'icon' => 'trophy', 'scope' => 'portal', 'roles' => ['parent', 'guardian'], 'module' => 'cocurricular'],
            ['group' => 'Parent Portal', 'label' => 'School Notices', 'route' => 'parent.announcements', 'icon' => 'bell', 'scope' => 'portal', 'roles' => ['parent', 'guardian']],

            // 15. STUDENT COCKPIT
            ['group' => 'Learning Cockpit', 'label' => 'Student Dashboard', 'route' => 'student.dashboard', 'icon' => 'layout-dashboard', 'scope' => 'portal', 'roles' => ['student']],
            ['group' => 'Learning Cockpit', 'label' => 'My Attendance', 'route' => 'student.attendance', 'icon' => 'calendar-check', 'scope' => 'portal', 'roles' => ['student']],
            ['group' => 'Learning Cockpit', 'label' => 'Class Timetable', 'route' => 'student.timetable', 'icon' => 'clock', 'scope' => 'portal', 'roles' => ['student']],
            ['group' => 'Learning Cockpit', 'label' => 'Assignments & Tasks', 'route' => 'student.homework', 'icon' => 'book-open', 'scope' => 'portal', 'roles' => ['student']],
            ['group' => 'Learning Cockpit', 'label' => 'Exam Results', 'route' => 'student.results', 'icon' => 'award', 'scope' => 'portal', 'roles' => ['student']],
            ['group' => 'Learning Cockpit', 'label' => 'Fee Statement', 'route' => 'student.fees', 'icon' => 'credit-card', 'scope' => 'portal', 'roles' => ['student']],
            ['group' => 'Learning Cockpit', 'label' => 'Talent & Activities', 'route' => 'student.cocurricular', 'icon' => 'trophy', 'scope' => 'portal', 'roles' => ['student'], 'module' => 'cocurricular'],
            ['group' => 'Learning Cockpit', 'label' => 'Campus Notices', 'route' => 'student.announcements', 'icon' => 'bell', 'scope' => 'portal', 'roles' => ['student']],

            // 16. SUPER ADMIN PLATFORM CONSOLE
            ['group' => 'Platform Administration', 'label' => 'Platform Overview', 'route' => 'super-admin.dashboard', 'icon' => 'layout-dashboard', 'scope' => 'platform', 'roles' => ['super-admin']],
            ['group' => 'Platform Administration', 'label' => 'Schools Management', 'route' => 'super-admin.schools.index', 'icon' => 'school', 'scope' => 'platform', 'roles' => ['super-admin']],
            ['group' => 'Platform Administration', 'label' => 'Subscription Packages', 'route' => 'super-admin.packages.index', 'icon' => 'package', 'scope' => 'platform', 'roles' => ['super-admin']],
            ['group' => 'Platform Administration', 'label' => 'School Subscriptions', 'route' => 'super-admin.subscriptions.index', 'icon' => 'credit-card', 'scope' => 'platform', 'roles' => ['super-admin']],
            ['group' => 'Platform Administration', 'label' => 'Global Users', 'route' => 'super-admin.users.index', 'icon' => 'users', 'scope' => 'platform', 'roles' => ['super-admin']],
            ['group' => 'System & Operations', 'label' => 'Module Manager', 'route' => 'super-admin.module-manager.index', 'icon' => 'sliders', 'scope' => 'platform', 'roles' => ['super-admin']],
            ['group' => 'System & Operations', 'label' => 'System Health', 'route' => 'super-admin.system-health.index', 'icon' => 'activity', 'scope' => 'platform', 'roles' => ['super-admin']],
            ['group' => 'System & Operations', 'label' => 'Platform Settings', 'route' => 'super-admin.settings.index', 'icon' => 'settings', 'scope' => 'platform', 'roles' => ['super-admin']],
            ['group' => 'Content Management (CMS)', 'label' => 'Website Pages', 'route' => 'super-admin.website.pages.index', 'icon' => 'globe', 'scope' => 'platform', 'roles' => ['super-admin']],
            ['group' => 'Content Management (CMS)', 'label' => 'Media Library', 'route' => 'super-admin.website.media.index', 'icon' => 'image', 'scope' => 'platform', 'roles' => ['super-admin']],
            ['group' => 'Content Management (CMS)', 'label' => 'Blog Posts', 'route' => 'super-admin.blogs.index', 'icon' => 'file-text', 'scope' => 'platform', 'roles' => ['super-admin']],
            ['group' => 'Content Management (CMS)', 'label' => 'FAQs & Help Articles', 'route' => 'super-admin.faqs.index', 'icon' => 'circle-help', 'scope' => 'platform', 'roles' => ['super-admin']],
        ];
    }
}