<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityTeamMember extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'team_id',
        'student_id',
        'role',
        'jersey_number',
        'position_name',
        'joined_date',
        'status',
    ];

    protected $casts = [
        'joined_date' => 'date',
    ];

    public function team(): BelongsTo
    {
        return $this->belongsTo(ActivityTeam::class, 'team_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }
}