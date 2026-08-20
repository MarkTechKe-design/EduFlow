<?php

namespace App\Policies\Concerns;

use App\Models\School;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

trait ChecksTransportCommunicationTenant
{
    protected function hasTenantContext(User $user): bool
    {
        return $user->school_id !== null
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

    protected function ownsRecord(User $user, string $modelClass, int $recordId): bool
    {
        return $this->hasTenantContext($user)
            && $modelClass::withoutGlobalScopes()
                ->whereKey($recordId)
                ->where('school_id', $user->school_id)
                ->exists();
    }

    protected function isNotUnmappedDriver(User $user): bool
    {
        return ! $user->hasRole('driver');
    }
}