<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudentAchievement extends Model
{
    use HasFactory, BelongsToSchool, SoftDeletes;

    protected $fillable = [
        'school_id',
        'student_id',
        'activity_id',
        'cocurricular_event_id',
        'academic_year_id',
        'term',
        'award_title',
        'award_type',
        'competition_level',
        'position_rank',
        'citation',
        'certificate_number',
        'evidence_file_path',
        'verified_by',
        'awarded_date',
    ];

    protected $casts = [
        'awarded_date' => 'date',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class, 'activity_id');
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(CocurricularEvent::class, 'cocurricular_event_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'verified_by');
    }
}