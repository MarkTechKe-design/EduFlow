<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ActivityTeam extends Model
{
    use HasFactory, BelongsToSchool, SoftDeletes;

    protected $fillable = [
        'school_id',
        'activity_id',
        'house_id',
        'academic_year_id',
        'name',
        'age_group',
        'gender',
        'coach_id',
        'assistant_coach_id',
        'captain_student_id',
        'vice_captain_student_id',
        'status',
    ];

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class, 'activity_id');
    }

    public function house(): BelongsTo
    {
        return $this->belongsTo(ActivityHouse::class, 'house_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    public function coach(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'coach_id');
    }

    public function assistantCoach(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'assistant_coach_id');
    }

    public function captain(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'captain_student_id');
    }

    public function viceCaptain(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'vice_captain_student_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(ActivityTeamMember::class, 'team_id');
    }

    public function homeFixtures(): HasMany
    {
        return $this->hasMany(ActivityFixture::class, 'team_a_id');
    }

    public function awayFixtures(): HasMany
    {
        return $this->hasMany(ActivityFixture::class, 'team_b_id');
    }
}