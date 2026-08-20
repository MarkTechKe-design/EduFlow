<?php

namespace App\Policies\Concerns;

use App\Models\School;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

trait ChecksOperationsTenant
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
            && (! method_exists($record, 'trashed') || ! $record->trashed())
            && (int) $user->school_id === (int) $record->school_id;
    }

    protected function ownsRelatedRecord(User $user, string $modelClass, int $recordId): bool
    {
        if (! $this->hasTenantContext($user)) {
            return false;
        }

        $query = $modelClass::withoutGlobalScopes()
            ->whereKey($recordId)
            ->where('school_id', $user->school_id);

        if (in_array(SoftDeletes::class, class_uses_recursive($modelClass), true)) {
            $query->whereNull((new $modelClass)->getDeletedAtColumn());
        }

        return $query->exists();
    }

    protected function ownsOptionalRelatedRecord(User $user, string $modelClass, mixed $recordId): bool
    {
        return $recordId === null
            || $this->ownsRelatedRecord($user, $modelClass, (int) $recordId);
    }
}
