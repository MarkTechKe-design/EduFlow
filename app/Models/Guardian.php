<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Guardian extends Model
{
    use HasFactory, BelongsToSchool, SoftDeletes;

    protected $table = 'guardians';

    protected $fillable = [
        'school_id',
        'user_id',
        'name',
        'relation',
        'phone',
        'email',
        'occupation',
        'address',
        'photo',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class, 'school_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function studentGuardians(): HasMany
    {
        return $this->hasMany(StudentGuardian::class, 'guardian_id');
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'student_guardians', 'guardian_id', 'student_id')
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
}