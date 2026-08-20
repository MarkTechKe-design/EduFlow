<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, HasRoles, SoftDeletes, \Illuminate\Auth\MustVerifyEmail;

    protected static function booted(): void
    {
        static::addGlobalScope('tenant_user', function (Builder $builder): void {
            if (! auth()->guard()->hasUser()) {
                return;
            }

            $authUser = auth()->user();

            if ($authUser?->school_id && ! $authUser->hasRole('super-admin')) {
                $builder->where($builder->getModel()->qualifyColumn('school_id'), $authUser->school_id);
            }
        });
    }

    protected $fillable = [
        'school_id',
        'name',
        'email',
        'phone',
        'avatar',
        'status',
        'password',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at'     => 'datetime',
            'password'          => 'hashed',
        ];
    }

    public function school(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(\App\Models\School::class);
    }
}