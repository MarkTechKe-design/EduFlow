<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Syllabus extends Model
{
    use BelongsToSchool, SoftDeletes;

    protected $table = 'syllabi';

    protected $fillable = [
        'school_id',
        'class_id',
        'subject_id',
        'teacher_id',
        'academic_year',
        'term',
        'curriculum_type',
        'title',
        'file',
        'topics',
        'strands',
        'completion_percent',
        'total_lessons_planned',
        'total_lessons_taught',
        'status',
        'reviewed_by',
        'reviewed_at',
        'reviewer_feedback',
    ];

    protected $casts = [
        'topics'                => 'array',
        'strands'               => 'array',
        'completion_percent'    => 'decimal:2',
        'total_lessons_planned' => 'integer',
        'total_lessons_taught'  => 'integer',
        'reviewed_at'           => 'datetime',
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

    public function recalculateCompletion(): void
    {
        $strands = $this->strands ?? [];

        if (empty($strands)) {
            $topics = $this->topics ?? [];
            if (empty($topics)) {
                $this->completion_percent = 0;
                $this->total_lessons_planned = 0;
                $this->total_lessons_taught = 0;
                return;
            }

            $covered = collect($topics)->where('covered', true)->count();
            $this->completion_percent = round(($covered / count($topics)) * 100, 2);
            return;
        }

        $totalSubStrands = 0;
        $coveredSubStrands = 0;
        $plannedLessons = 0;
        $taughtLessons = 0;

        foreach ($strands as $strand) {
            $subStrands = $strand['sub_strands'] ?? [];
            foreach ($subStrands as $sub) {
                $totalSubStrands++;
                if (!empty($sub['covered'])) {
                    $coveredSubStrands++;
                }
                $plannedLessons += (int)($sub['lessons_planned'] ?? 0);
                $taughtLessons  += (int)($sub['lessons_taught'] ?? 0);
            }
        }

        $this->total_lessons_planned = $plannedLessons;
        $this->total_lessons_taught  = $taughtLessons;

        if ($totalSubStrands > 0) {
            $this->completion_percent = round(($coveredSubStrands / $totalSubStrands) * 100, 2);
        } else {
            $this->completion_percent = 0;
        }

        if ($this->completion_percent >= 100) {
            $this->status = 'completed';
        } elseif ($this->completion_percent > 0 && $this->status !== 'approved') {
            $this->status = 'in_progress';
        }
    }
}