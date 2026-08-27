<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class AdmissionInquiry extends Model
{
    use BelongsToSchool, SoftDeletes;

    protected $fillable = [
        'school_id',
        'student_name',
        'class_interested',
        'guardian_name',
        'guardian_phone',
        'guardian_email',
        'preferred_contact_channel',
        'last_contact_channel',
        'status',
        'notes',
        'next_followup_date',
        'source',
        'converted_student_id',
        'assigned_staff_id',
    ];

    protected $casts = [
        'next_followup_date' => 'date:Y-m-d',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function assignedStaff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'assigned_staff_id');
    }
}