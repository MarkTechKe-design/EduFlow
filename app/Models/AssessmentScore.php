<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssessmentScore extends Model
{
    use HasFactory, BelongsToSchool;

    protected $table = 'assessment_scores';

    protected $fillable = [
        'school_id',
        'cbc_assessment_id',
        'assessment_strand_id',
        'student_id',
        'performance_level',
        'numeric_score',
        'teacher_comments',
    ];

    protected $casts = [
        'numeric_score' => 'integer',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    public function assessment(): BelongsTo
    {
        return $this->belongsTo(CbcAssessment::class, 'cbc_assessment_id');
    }

    public function strand(): BelongsTo
    {
        return $this->belongsTo(AssessmentStrand::class, 'assessment_strand_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
}