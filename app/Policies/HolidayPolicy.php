<?php

namespace App\Policies;

use App\Models\Holiday;
use App\Models\User;
use App\Policies\Concerns\ChecksPlatformAdministrationTenant;

class HolidayPolicy
{
    use ChecksPlatformAdministrationTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('settings.view');
    }

    public function view(User $user, Holiday $holiday): bool
    {
        return $this->ownsTenantRecord($user, $holiday) && $user->can('settings.view');
    }

    public function create(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('settings.edit');
    }

    public function update(User $user, Holiday $holiday): bool
    {
        return $this->ownsTenantRecord($user, $holiday) && $user->can('settings.edit');
    }

    public function delete(User $user, Holiday $holiday): bool
    {
        return $this->ownsTenantRecord($user, $holiday) && $user->can('settings.edit');
    }
}
