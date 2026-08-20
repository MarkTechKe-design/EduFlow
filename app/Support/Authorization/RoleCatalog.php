<?php

namespace App\Support\Authorization;

use App\Models\User;

final class RoleCatalog
{
    public const PLATFORM_ROLE = 'super-admin';

    public const SCHOOL_ROLES = [
        'school-admin',
        'principal',
        'teacher',
        'accountant',
        'librarian',
        'receptionist',
        'driver',
        'warden',
        'store-manager',
    ];

    public const PORTAL_ROLES = ['student', 'parent'];

    public static function all(): array
    {
        return [self::PLATFORM_ROLE, ...self::SCHOOL_ROLES, ...self::PORTAL_ROLES];
    }

    public static function isPlatform(User $user): bool
    {
        return $user->hasRole(self::PLATFORM_ROLE);
    }

    public static function hasSchoolRole(User $user): bool
    {
        return $user->hasAnyRole(self::SCHOOL_ROLES);
    }

    public static function hasPortalRole(User $user): bool
    {
        return $user->hasAnyRole(self::PORTAL_ROLES);
    }

    public static function context(User $user): string
    {
        if (self::isPlatform($user)) return 'platform';
        if (self::hasPortalRole($user)) return 'portal';
        return 'school';
    }

    public static function dashboardProfile(User $user): string
    {
        if (self::isPlatform($user)) return self::PLATFORM_ROLE;
        if ($user->hasRole('parent')) return 'parent';
        if ($user->hasRole('student')) return 'student';
        if ($user->hasRole('school-admin') || $user->hasRole('principal')) return 'school-admin';
        if ($user->hasRole('teacher')) return 'teacher';
        if ($user->hasRole('accountant')) return 'accountant';
        return 'school';
    }
}
