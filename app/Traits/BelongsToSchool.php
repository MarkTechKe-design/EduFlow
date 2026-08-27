<?php

namespace App\Traits;

use App\Models\School;
use App\Scopes\SchoolScope;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Apply to every school-scoped model.
 * Automatically:
 *   - Adds a global WHERE school_id = ? scope (bypassed for super-admin)
 *   - Sets school_id on create from the authenticated user
 *   - Provides a ->school() relation
 */
trait BelongsToSchool
{
    public static function bootBelongsToSchool(): void
    {
        static::addGlobalScope(new SchoolScope());

        static::creating(function ($model) {
            if (auth()->check() && ! auth()->user()->hasRole('super-admin')) {
                abort_if(! auth()->user()->school_id, 403);

                $model->school_id = auth()->user()->school_id;
            }
        });
    }

    public function setAttribute($key, $value)
    {
        if ($key === 'school_id' && $this->exists) {
            return $this;
        }

        return parent::setAttribute($key, $value);
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    protected function serializeDate(\DateTimeInterface $date): string
    {
        return $date->format($date->format('H:i:s') === '00:00:00' ? 'Y-m-d' : 'Y-m-d H:i:s');
    }
}
