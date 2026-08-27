<?php

namespace App\Support\Authorization;

use App\Models\School;
use App\Models\SchoolModule;
use App\Models\User;

final class ModuleAccessService
{
    public const MODULES = [
        'students', 'staff', 'attendance', 'timetable', 'exams',
        'fees', 'library', 'transport', 'hostel', 'inventory',
        'homework', 'communication', 'reports', 'hr', 'cocurricular',
    ];

    public function isEnabledForUser(User $user, string $module): bool
    {
        if (! in_array($module, self::MODULES, true)) return false;
        if (RoleCatalog::isPlatform($user)) return true;
        if (! $user->school_id) return false;

        $school = School::query()->find($user->school_id);
        if (! $school || $school->status !== 'active') {
            return false;
        }

        $override = SchoolModule::query()
            ->where('school_id', $user->school_id)
            ->where('module_slug', $module)
            ->value('is_enabled');

        return $override === null || (bool) $override;
    }

    public function enabledForSchool(int $schoolId): array
    {
        $overrides = SchoolModule::query()
            ->where('school_id', $schoolId)
            ->pluck('is_enabled', 'module_slug');

        return collect(self::MODULES)
            ->filter(fn (string $module): bool => ! array_key_exists($module, $overrides->all()) || (bool) $overrides[$module])
            ->values()
            ->all();
    }

    public function assertEnabledForUser(User $user, string $module): void
    {
        abort_unless($this->isEnabledForUser($user, $module), 403, 'This module is not enabled for the current school.');
    }
}