<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AssessmentStrand extends Model
{
    use HasFactory, BelongsToSchool;

    protected $table = 'assessment_strands';

    protected $fillable = [
        'school_id',
        'cbc_assessment_id',
        'strand_name',
        'sub_strand',
        'specific_learning_outcome',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(CbcAssessment::class, 'cbc_assessment_id');
    }

    public function scores(): HasMany
    {
        return $this->hasMany(AssessmentScore::class, 'assessment_strand_id');
    }
}