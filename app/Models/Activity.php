<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Activity extends Model
{
    use HasFactory, BelongsToSchool, SoftDeletes;

    protected $fillable = [
        'school_id',
        'category_id',
        'name',
        'code',
        'type',
        'gender_scope',
        'age_group',
        'max_participants',
        'patron_id',
        'head_coach_id',
        'rules',
        'is_active',
    ];

    protected $casts = [
        'max_participants' => 'integer',
        'is_active'        => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ActivityCategory::class, 'category_id');
    }

    public function patron(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'patron_id');
    }

    public function headCoach(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'head_coach_id');
    }

    public function teams(): HasMany
    {
        return $this->hasMany(ActivityTeam::class, 'activity_id');
    }

    public function events(): HasMany
    {
        return $this->hasMany(CocurricularEvent::class, 'activity_id');
    }

    public function rubrics(): HasMany
    {
        return $this->hasMany(AdjudicationRubric::class, 'activity_id');
    }

    public function achievements(): HasMany
    {
        return $this->hasMany(StudentAchievement::class, 'activity_id');
    }
}