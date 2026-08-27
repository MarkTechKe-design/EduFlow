<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ActivityFixture extends Model
{
    use HasFactory, BelongsToSchool, SoftDeletes;

    protected $fillable = [
        'school_id',
        'event_id',
        'team_a_id',
        'team_b_id',
        'team_a_custom_name',
        'team_b_custom_name',
        'scheduled_at',
        'venue',
        'stage',
        'team_a_score',
        'team_b_score',
        'winner_team_id',
        'outcome',
        'referee_name',
        'match_report',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'team_a_score' => 'integer',
        'team_b_score' => 'integer',
    ];

    public function event(): BelongsTo
    {
        return $this->belongsTo(CocurricularEvent::class, 'event_id');
    }

    public function teamA(): BelongsTo
    {
        return $this->belongsTo(ActivityTeam::class, 'team_a_id');
    }

    public function teamB(): BelongsTo
    {
        return $this->belongsTo(ActivityTeam::class, 'team_b_id');
    }

    public function winnerTeam(): BelongsTo
    {
        return $this->belongsTo(ActivityTeam::class, 'winner_team_id');
    }
}