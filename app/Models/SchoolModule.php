<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SchoolModule extends Model
{
    protected $fillable = ['school_id', 'module_slug', 'is_enabled'];

    protected $casts = [
        'is_enabled' => 'boolean',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }
}