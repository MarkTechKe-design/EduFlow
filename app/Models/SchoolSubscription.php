<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SchoolSubscription extends Model
{
    use BelongsToSchool, SoftDeletes;

    protected $fillable = [
        'school_id', 'package_id', 'billing_cycle', 'coupon_id', 'start_date', 'end_date', 'paystack_customer_code', 'paystack_authorization_code', 'card_last4', 'card_brand', 'card_exp_month', 'card_exp_year',
        'status', 'lifecycle_status', 'is_trial', 'trial_ends_at', 'grace_period_ends_at', 'renewal_at', 'cancelled_at', 'archived_at', 'public_id', 'amount_paid', 'payment_method', 'notes',
    ];

    protected $casts = [
        'start_date'    => 'date',
        'end_date'      => 'date',
        'trial_ends_at' => 'date',
        'grace_period_ends_at' => 'datetime',
        'renewal_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'archived_at' => 'datetime',
        'is_trial'      => 'boolean',
        'amount_paid'   => 'decimal:2',
    ];

    public function school(): BelongsTo   { return $this->belongsTo(School::class); }
    public function package(): BelongsTo  { return $this->belongsTo(Package::class); }
    public function coupon(): BelongsTo   { return $this->belongsTo(Coupon::class); }
    public function payments(): HasMany { return $this->hasMany(SubscriptionPayment::class, 'school_subscription_id'); }

}
