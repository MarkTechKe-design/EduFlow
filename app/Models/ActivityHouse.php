<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ActivityHouse extends Model
{
    use HasFactory, BelongsToSchool, SoftDeletes;

    protected $fillable = [
        'school_id',
        'name',
        'code',
        'color_code',
        'motto',
        'patron_id',
        'captain_student_id',
        'total_points',
        'is_active',
    ];

    protected $casts = [
        'total_points' => 'decimal:2',
        'is_active'    => 'boolean',
    ];

    public function patron(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'patron_id');
    }

    public function captain(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'captain_student_id');
    }

    public function pointLogs(): HasMany
    {
        return $this->hasMany(HousePointLog::class, 'house_id')->latest();
    }

    public function teams(): HasMany
    {
        return $this->hasMany(ActivityTeam::class, 'house_id');
    }
}