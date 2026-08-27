<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FeePaymentAllocation extends Model
{
    use HasFactory, BelongsToSchool;

    protected $table = 'fee_payment_allocations';

    protected $fillable = [
        'school_id',
        'fee_payment_id',
        'fee_invoice_id',
        'fee_invoice_item_id',
        'fee_vote_head_id',
        'amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function feePayment(): BelongsTo
    {
        return $this->belongsTo(FeePayment::class, 'fee_payment_id');
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(FeeInvoice::class, 'fee_invoice_id');
    }

    public function invoiceItem(): BelongsTo
    {
        return $this->belongsTo(FeeInvoiceItem::class, 'fee_invoice_item_id');
    }

    public function voteHead(): BelongsTo
    {
        return $this->belongsTo(FeeVoteHead::class, 'fee_vote_head_id');
    }
}