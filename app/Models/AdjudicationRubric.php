<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class AdjudicationRubric extends Model
{
    use HasFactory, BelongsToSchool, SoftDeletes;

    protected $fillable = [
        'school_id',
        'activity_id',
        'name',
        'code',
        'total_max_score',
        'description',
        'is_active',
    ];

    protected $casts = [
        'total_max_score' => 'decimal:2',
        'is_active'       => 'boolean',
    ];

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class, 'activity_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(AdjudicationRubricItem::class, 'rubric_id')->orderBy('display_order');
    }

    public function adjudications(): HasMany
    {
        return $this->hasMany(PerformanceAdjudication::class, 'rubric_id');
    }
}