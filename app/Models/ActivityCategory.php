<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ActivityCategory extends Model
{
    use HasFactory, BelongsToSchool, SoftDeletes;

    protected $fillable = [
        'school_id',
        'name',
        'code',
        'icon',
        'description',
        'display_order',
        'is_active',
    ];

    protected $casts = [
        'display_order' => 'integer',
        'is_active'     => 'boolean',
    ];

    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class, 'category_id')->orderBy('name');
    }

    public function events(): HasMany
    {
        return $this->hasMany(CocurricularEvent::class, 'category_id');
    }

    public function clubs(): HasMany
    {
        return $this->hasMany(SchoolClub::class, 'category_id');
    }
}