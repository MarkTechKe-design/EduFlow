<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdjudicationRubricItem extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'rubric_id',
        'criterion_name',
        'max_score',
        'display_order',
        'description',
    ];

    protected $casts = [
        'max_score'     => 'decimal:2',
        'display_order' => 'integer',
    ];

    public function rubric(): BelongsTo
    {
        return $this->belongsTo(AdjudicationRubric::class, 'rubric_id');
    }
}