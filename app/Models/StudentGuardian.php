<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class StudentGuardian extends Model
{
    use HasFactory, BelongsToSchool, SoftDeletes;

    protected $table = 'student_guardians';

    protected $fillable = [
        'school_id',
        'student_id',
        'guardian_id',
        'relationship_type',
        'is_primary',
        'has_legal_custody',
        'receives_sms_notifications',
        'receives_report_cards',
        'emergency_priority',
    ];

    protected $casts = [
        'is_primary'                 => 'boolean',
        'has_legal_custody'          => 'boolean',
        'receives_sms_notifications' => 'boolean',
        'receives_report_cards'      => 'boolean',
        'emergency_priority'         => 'integer',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function guardian(): BelongsTo
    {
        return $this->belongsTo(Guardian::class, 'guardian_id');
    }
}