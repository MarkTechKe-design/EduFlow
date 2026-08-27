<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MeasurableResult extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'event_participant_id',
        'activity_id',
        'student_id',
        'event_round',
        'metric_type',
        'time_recorded_seconds',
        'distance_recorded_meters',
        'height_recorded_meters',
        'points_score',
        'final_position',
        'is_personal_best',
        'is_season_best',
        'is_school_record',
        'is_competition_record',
        'remarks',
        'recorded_date',
    ];

    protected $casts = [
        'time_recorded_seconds'    => 'decimal:3',
        'distance_recorded_meters' => 'decimal:3',
        'height_recorded_meters'   => 'decimal:3',
        'points_score'             => 'decimal:2',
        'final_position'           => 'integer',
        'is_personal_best'         => 'boolean',
        'is_season_best'           => 'boolean',
        'is_school_record'         => 'boolean',
        'is_competition_record'    => 'boolean',
        'recorded_date'            => 'date',
    ];

    public function participant(): BelongsTo
    {
        return $this->belongsTo(EventParticipant::class, 'event_participant_id');
    }

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class, 'activity_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
}