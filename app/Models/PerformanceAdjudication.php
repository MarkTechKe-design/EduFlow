<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PerformanceAdjudication extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'event_participant_id',
        'rubric_id',
        'adjudicator_name',
        'total_awarded_score',
        'grade_attained',
        'general_feedback',
        'status',
    ];

    protected $casts = [
        'total_awarded_score' => 'decimal:2',
    ];

    public function participant(): BelongsTo
    {
        return $this->belongsTo(EventParticipant::class, 'event_participant_id');
    }

    public function rubric(): BelongsTo
    {
        return $this->belongsTo(AdjudicationRubric::class, 'rubric_id');
    }

    public function itemScores(): HasMany
    {
        return $this->hasMany(PerformanceScore::class, 'adjudication_id');
    }
}