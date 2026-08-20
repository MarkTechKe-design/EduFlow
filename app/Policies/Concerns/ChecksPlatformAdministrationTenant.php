<?php

namespace App\Policies\Concerns;

use App\Models\School;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

trait ChecksPlatformAdministrationTenant
{
    protected function hasTenantContext(User $user): bool
    {
        return $user->status === 'active'
            && $user->school_id !== null
            && ! $user->hasRole('super-admin')
            && School::query()
                ->whereKey($user->school_id)
                ->where('status', 'active')
                ->exists();
    }

    protected function ownsTenantRecord(User $user, Model $record): bool
    {
        return $this->hasTenantContext($user)
            && (int) $user->school_id === (int) $record->school_id;
    }

    protected function hasPlatformContext(User $user): bool
    {
        return $user->status === 'active'
            && $user->school_id === null
            && $user->hasRole('super-admin');
    }
}
