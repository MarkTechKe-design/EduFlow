<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
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
        'middle_name',
        'last_name',
        'photo',
        'gender',
        'date_of_birth',
        'dob',
        'admission_date',
        'admission_type',
        'blood_group',
        'religion',
        'guardian_name',
        'guardian_phone',
        'guardian_relation',
        'nationality',
        'birth_certificate_no',
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
        'date_of_birth' => 'date:Y-m-d',
        'dob' => 'date:Y-m-d',
        'admission_date' => 'date:Y-m-d',
    ];

    protected $appends = ['full_name'];

    public function getFullNameAttribute(): string
    {
        $parts = array_filter([$this->first_name, $this->middle_name, $this->last_name]);
        return implode(' ', $parts);
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function class(): BelongsTo
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(StudentDocument::class, 'student_id');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(StudentEnrollment::class, 'student_id')->orderByDesc('id');
    }

    public function currentEnrollment(): HasOne
    {
        return $this->hasOne(StudentEnrollment::class, 'student_id')
            ->where('status', 'active')
            ->latestOfMany();
    }

    public function studentGuardians(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(StudentGuardian::class, 'student_id')->orderBy('emergency_priority');
    }

    public function guardians(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Guardian::class, 'student_guardians', 'student_id', 'guardian_id')
            ->withPivot([
                'relationship_type',
                'is_primary',
                'has_legal_custody',
                'receives_sms_notifications',
                'receives_report_cards',
                'emergency_priority',
            ])
            ->withTimestamps();
    }

    public function medicalProfile(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(StudentMedicalProfile::class, 'student_id');
    }
}