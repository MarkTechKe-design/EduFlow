<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeacherDutyAssignment extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'duty_roster_id',
        'staff_id',
        'duty_station',
        'day_of_week',
        'shift',
        'effective_date',
        'instructions',
        'replacement_staff_id',
        'replacement_reason',
        'replacement_scope',
        'replacement_time_window',
        'replacement_changed_by',
        'replacement_at',
        'created_by',
    ];

    protected $casts = [
        'effective_date' => 'date:Y-m-d',
        'replacement_at' => 'datetime',
    ];

    public function roster(): BelongsTo
    {
        return $this->belongsTo(TeacherDutyRoster::class, 'duty_roster_id');
    }

    public function assignedStaff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }

    public function replacementStaff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'replacement_staff_id');
    }

    public function replacementChangedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'replacement_changed_by');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}