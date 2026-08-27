<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class FeeAdjustment extends Model
{
    use HasFactory, BelongsToSchool, SoftDeletes;

    protected $table = 'fee_adjustments';

    protected $fillable = [
        'school_id',
        'student_id',
        'fee_invoice_id',
        'fee_vote_head_id',
        'type',
        'amount',
        'reason',
        'documentation_reference',
        'status',
        'approved_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(FeeInvoice::class, 'fee_invoice_id');
    }

    public function voteHead(): BelongsTo
    {
        return $this->belongsTo(FeeVoteHead::class, 'fee_vote_head_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}