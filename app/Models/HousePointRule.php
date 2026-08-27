<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HousePointRule extends Model
{
    use HasFactory, BelongsToSchool;

    protected $fillable = [
        'school_id',
        'position_rank',
        'points',
        'rule_name',
        'is_active',
    ];

    protected $casts = [
        'points'    => 'decimal:2',
        'is_active' => 'boolean',
    ];
}