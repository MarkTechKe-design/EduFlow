<?php

namespace App\Policies;

use App\Models\Timetable;
use App\Models\User;
use App\Policies\Concerns\ChecksAcademicTenant;

class TimetablePolicy
{
    use ChecksAcademicTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('timetable.view');
    }

    public function create(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('timetable.manage');
    }

    public function delete(User $user, Timetable $timetable): bool
    {
        return $this->ownsTenantRecord($user, $timetable)
            && $user->can('timetable.manage');
    }

    public function teacherSchedule(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('timetable.view');
    }
}
