<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerformanceScore extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'adjudication_id',
        'rubric_item_id',
        'awarded_score',
        'item_comment',
    ];

    protected $casts = [
        'awarded_score' => 'decimal:2',
    ];

    public function adjudication(): BelongsTo
    {
        return $this->belongsTo(PerformanceAdjudication::class, 'adjudication_id');
    }

    public function rubricItem(): BelongsTo
    {
        return $this->belongsTo(AdjudicationRubricItem::class, 'rubric_item_id');
    }
}