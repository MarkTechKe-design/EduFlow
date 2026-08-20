<?php

namespace App\Support\Authorization;

use App\Models\User;

final class LandingRouteResolver
{
    public function resolve(User $user): string
    {
        if (RoleCatalog::isPlatform($user)) return 'super-admin.dashboard';
        if ($user->hasRole('parent')) return 'parent.dashboard';
        if ($user->hasRole('student')) return 'student.dashboard';
        if ($user->hasAnyRole(['school-admin', 'principal', 'teacher', 'accountant'])) return 'school.reports.dashboard';
        if ($user->can('library.view')) return 'school.library.books.index';
        if ($user->can('inventory.view')) return 'school.inventory.items';
        if ($user->can('hostel.view')) return 'school.hostel.index';
        if ($user->can('transport.view')) return 'school.transport.routes';
        if ($user->can('students.view')) return 'school.students.index';

        return 'dashboard';
    }
}
