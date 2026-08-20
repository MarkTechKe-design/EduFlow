<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SubscriptionPayment extends Model
{
    protected $fillable = ['school_subscription_id', 'provider', 'reference', 'idempotency_key', 'status', 'amount', 'currency', 'payload', 'paid_at'];
    protected function casts(): array { return ['amount' => 'decimal:2', 'payload' => 'array', 'paid_at' => 'datetime']; }
    public function subscription(): BelongsTo { return $this->belongsTo(SchoolSubscription::class, 'school_subscription_id'); }
}
