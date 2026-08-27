<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VisitorLog extends Model
{
    use BelongsToSchool;

    protected $fillable = [
        'school_id',
        'name',
        'phone',
        'id_number',
        'vehicle_reg',
        'badge_number',
        'category',
        'target_type',
        'student_id',
        'relationship_to_student',
        'purpose',
        'person_to_meet',
        'staff_id',
        'department_id',
        'time_in',
        'time_out',
        'remarks',
    ];

    protected $casts = [
        'time_in'  => 'datetime',
        'time_out' => 'datetime',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'staff_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id');
    }
}