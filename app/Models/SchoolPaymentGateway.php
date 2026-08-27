<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SchoolPaymentGateway extends Model
{
    use HasFactory, BelongsToSchool, SoftDeletes;

    protected $table = 'school_payment_gateways';

    protected $fillable = [
        'school_id',
        'gateway_name',
        'shortcode',
        'shortcode_type',
        'consumer_key',
        'consumer_secret',
        'passkey',
        'account_reference_format',
        'bank_details',
        'is_active',
        'is_sandbox',
    ];

    protected $casts = [
        'is_active'    => 'boolean',
        'is_sandbox'   => 'boolean',
        'bank_details' => 'array',
    ];

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class, 'school_id');
    }
}