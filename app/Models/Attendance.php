<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Attendance extends Model
{
    use BelongsToSchool;

    protected $fillable = [
        'school_id',
        'academic_year_id',
        'date',
        'session',
        'attendable_type',
        'attendable_id',
        'status',
        'time_in',
        'time_out',
        'remarks',
        'marked_by',
        'notification_sent',
    ];

    protected $casts = [
        'date'              => 'date:Y-m-d',
        'notification_sent' => 'boolean',
    ];

    public function attendable(): MorphTo
    {
        return $this->morphTo();
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function markedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'marked_by');
    }
}