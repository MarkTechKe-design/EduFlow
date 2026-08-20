<?php

namespace App\Policies;

use App\Models\SchoolSetting;
use App\Models\User;
use App\Policies\Concerns\ChecksPlatformAdministrationTenant;

class SchoolSettingPolicy
{
    use ChecksPlatformAdministrationTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('settings.view');
    }

    public function edit(User $user): bool
    {
        return $this->hasTenantContext($user) && $user->can('settings.edit');
    }
}
