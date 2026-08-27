<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudentMedicalProfile extends Model
{
    use HasFactory, BelongsToSchool, SoftDeletes;

    protected $table = 'student_medical_profiles';

    protected $fillable = [
        'school_id',
        'student_id',
        'blood_group',
        'allergies',
        'chronic_conditions',
        'emergency_medication',
        'dietary_restrictions',
        'sha_nhif_no',
        'preferred_hospital',
        'doctor_name',
        'doctor_phone',
        'special_instructions',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
}