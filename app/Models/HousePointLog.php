<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HousePointLog extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'house_id',
        'cocurricular_event_id',
        'activity_id',
        'student_id',
        'points',
        'reason',
        'awarded_by',
    ];

    protected $casts = [
        'points' => 'decimal:2',
    ];

    public function house(): BelongsTo
    {
        return $this->belongsTo(ActivityHouse::class, 'house_id');
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(CocurricularEvent::class, 'cocurricular_event_id');
    }

    public function activity(): BelongsTo
    {
        return $this->belongsTo(Activity::class, 'activity_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function awardedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'awarded_by');
    }
}