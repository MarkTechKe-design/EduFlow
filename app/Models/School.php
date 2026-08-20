<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class School extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'slug', 'logo', 'email', 'phone',
        'address', 'city', 'state', 'country',
        'timezone', 'currency', 'language',
        'settings', 'status', 'curriculum',
        'registration_number',
        'knec_code',
        'sub_county',
        'county', 'terms_accepted_at', 'onboarding_completed_at',
    ];

    protected $casts = [
        'settings' => 'array',
        'terms_accepted_at' => 'datetime',
        'onboarding_completed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (School $school) {
            if (empty($school->slug)) {
                $school->slug = Str::slug($school->name);
            }
        });
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function academicYears(): HasMany
    {
        return $this->hasMany(AcademicYear::class);
    }

    public function currentAcademicYear()
    {
        return $this->academicYears()->where('is_current', true)->first();
    }

    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo ? asset('storage/' . $this->logo) : null;
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function subscriptions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(SchoolSubscription::class);
    }

    public function latestSubscription(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(SchoolSubscription::class)->latestOfMany();
    }
}