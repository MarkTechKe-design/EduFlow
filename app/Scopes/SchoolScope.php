<?php

namespace App\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class SchoolScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        if (! auth()->check()) {
            $builder->where($model->getQualifiedKeyName(), 0);

            return;
        }

        $user = auth()->user();

        // Only the platform Super Admin has global tenant visibility.
        if ($user->hasRole('super-admin')) {
            return;
        }

        if (! $user->school_id) {
            $builder->where($model->getQualifiedKeyName(), 0);

            return;
        }

        $builder->where($model->getTable() . '.school_id', $user->school_id);
    }
}
