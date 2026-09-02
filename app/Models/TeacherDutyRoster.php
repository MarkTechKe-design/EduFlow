<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TeacherDutyRoster extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'academic_year_id',
        'term',
        'week_number',
        'title',
        'start_date',
        'end_date',
        'is_active',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'start_date' => 'date:Y-m-d',
        'end_date'   => 'date:Y-m-d',
        'is_active'  => 'boolean',
    ];

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(TeacherDutyAssignment::class, 'duty_roster_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}