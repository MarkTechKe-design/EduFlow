<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LessonPlan extends Model
{
    use BelongsToSchool, SoftDeletes;

    protected $fillable = [
        'school_id',
        'class_id',
        'subject_id',
        'teacher_id',
        'term',
        'title',
        'strand',
        'sub_strand',
        'objectives',
        'core_competencies',
        'values_addressed',
        'pcis',
        'content',
        'teaching_methods',
        'resources',
        'week_start',
        'lesson_duration_mins',
        'status',
        'reviewer_feedback',
        'reviewed_by',
        'reviewed_at',
        'teacher_reflection',
    ];

    protected $casts = [
        'core_competencies' => 'array',
        'values_addressed'  => 'array',
        'week_start'        => 'date:Y-m-d',
        'reviewed_at'       => 'datetime',
        'lesson_duration_mins' => 'integer',
    ];

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'teacher_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}