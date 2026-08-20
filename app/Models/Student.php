<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, BelongsToSchool, SoftDeletes;

    protected $fillable = [
        'school_id',
        'user_id',
        'class_id',
        'section_id',
        'guardian_id',
        'admission_no',
        'nemis_upi',
        'assessment_no',
        'roll_no',
        'first_name',
        'last_name',
        'photo',
        'gender',
        'date_of_birth',
        'dob',
        'admission_date',
        'blood_group',
        'religion',
        'guardian_name',
        'guardian_phone',
        'guardian_relation',
        'nationality',
        'phone',
        'email',
        'address',
        'emergency_contact',
        'medical_info',
        'previous_school',
        'category',
        'status',
    ];

    protected $casts = [
        'date_of_birth'  => 'date',
        'dob'            => 'date',
        'admission_date' => 'date',
    ];

    protected $appends = ['full_name'];

    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function class(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class, 'section_id');
    }

    public function guardian(): BelongsTo
    {
        return $this->belongsTo(Guardian::class, 'guardian_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(StudentDocument::class, 'student_id');
    }
}