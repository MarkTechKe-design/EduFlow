<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EventParticipant extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'event_id',
        'student_id',
        'team_id',
        'house_id',
        'registration_number',
        'heat',
        'lane',
        'category_division',
        'disability_adaptation',
        'qualification_status',
        'qualification_level',
        'notes',
    ];

    protected $casts = [
        'lane' => 'integer',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(CocurricularEvent::class, 'event_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(ActivityTeam::class, 'team_id');
    }

    public function house(): BelongsTo
    {
        return $this->belongsTo(ActivityHouse::class, 'house_id');
    }

    public function measurableResults(): HasMany
    {
        return $this->hasMany(MeasurableResult::class, 'event_participant_id');
    }

    public function adjudications(): HasMany
    {
        return $this->hasMany(PerformanceAdjudication::class, 'event_participant_id');
    }
}