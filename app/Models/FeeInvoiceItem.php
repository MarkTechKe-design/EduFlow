<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeeInvoiceItem extends Model
{
    use HasFactory, BelongsToSchool;

    protected $table = 'fee_invoice_items';

    protected $fillable = [
        'school_id',
        'fee_invoice_id',
        'fee_vote_head_id',
        'amount',
        'paid_amount',
        'waiver_amount',
        'balance',
    ];

    protected $casts = [
        'amount'        => 'decimal:2',
        'paid_amount'   => 'decimal:2',
        'waiver_amount' => 'decimal:2',
        'balance'       => 'decimal:2',
    ];

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(FeeInvoice::class, 'fee_invoice_id');
    }

    public function voteHead(): BelongsTo
    {
        return $this->belongsTo(FeeVoteHead::class, 'fee_vote_head_id');
    }
}