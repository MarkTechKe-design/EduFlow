<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SchoolClub extends Model
{
    use HasFactory, BelongsToSchool, SoftDeletes;

    protected $fillable = [
        'school_id',
        'category_id',
        'name',
        'code',
        'motto',
        'patron_id',
        'assistant_patron_id',
        'meeting_schedule',
        'meeting_venue',
        'objectives',
        'constitution_path',
        'status',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ActivityCategory::class, 'category_id');
    }

    public function patron(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'patron_id');
    }

    public function assistantPatron(): BelongsTo
    {
        return $this->belongsTo(Staff::class, 'assistant_patron_id');
    }

    public function memberships(): HasMany
    {
        return $this->hasMany(ClubMembership::class, 'club_id');
    }
}