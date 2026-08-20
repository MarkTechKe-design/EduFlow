<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Package extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'badge',
        'slug',
        'description',
        'price_monthly',
        'price_yearly',
        'trial_days',
        'max_students',
        'max_staff',
        'storage_gb',
        'sort_order',
        'is_active',
        'is_popular',
        'is_public',
        'features',
        'limits',
    ];

    protected $casts = [
        'features'      => 'array',
        'limits'        => 'array',
        'is_active'     => 'boolean',
        'is_popular'    => 'boolean',
        'is_public'     => 'boolean',
        'trial_days'    => 'integer',
        'sort_order'    => 'integer',
        'max_students'  => 'integer',
        'max_staff'     => 'integer',
        'storage_gb'    => 'integer',
        'price_monthly' => 'decimal:2',
        'price_yearly'  => 'decimal:2',
    ];

    public function modules(): HasMany
    {
        return $this->hasMany(PackageModule::class);
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(SchoolSubscription::class);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_active', true)
            ->where('is_public', true)
            ->orderBy('sort_order', 'asc')
            ->orderBy('price_monthly', 'asc');
    }
}