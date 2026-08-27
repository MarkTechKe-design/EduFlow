<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeeStructureItem extends Model
{
    use HasFactory, BelongsToSchool;

    protected $table = 'fee_structure_items';

    protected $fillable = [
        'school_id',
        'fee_structure_id',
        'fee_vote_head_id',
        'amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function feeStructure(): BelongsTo
    {
        return $this->belongsTo(FeeStructure::class, 'fee_structure_id');
    }

    public function voteHead(): BelongsTo
    {
        return $this->belongsTo(FeeVoteHead::class, 'fee_vote_head_id');
    }
}