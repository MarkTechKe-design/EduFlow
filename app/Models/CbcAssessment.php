<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class CbcAssessment extends Model
{
    use HasFactory, BelongsToSchool, SoftDeletes;

    protected $table = 'cbc_assessments';

    protected $fillable = [
        'school_id',
        'academic_year_id',
        'term',
        'class_id',
        'section_id',
        'subject_id',
        'title',
        'type',
        'assessment_date',
        'description',
        'status',
        'created_by',
    ];

    protected $casts = [
        'assessment_date' => 'date:Y-m-d',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'section_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function strands(): HasMany
    {
        return $this->hasMany(AssessmentStrand::class, 'cbc_assessment_id')->orderBy('sort_order');
    }

    public function scores(): HasMany
    {
        return $this->hasMany(AssessmentScore::class, 'cbc_assessment_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}