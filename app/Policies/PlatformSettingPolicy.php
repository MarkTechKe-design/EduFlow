<?php

namespace App\Policies;

use App\Models\PlatformSetting;
use App\Models\User;
use App\Policies\Concerns\ChecksPlatformAdministrationTenant;

class PlatformSettingPolicy
{
    use ChecksPlatformAdministrationTenant;

    public function viewAny(User $user): bool
    {
        return $this->hasPlatformContext($user) && $user->can('settings.view');
    }

    public function edit(User $user): bool
    {
        return $this->hasPlatformContext($user) && $user->can('settings.edit');
    }
}
