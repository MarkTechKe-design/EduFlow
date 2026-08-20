<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionAuditLog extends Model
{
    protected $fillable = ['school_subscription_id', 'school_id', 'actor_id', 'from_status', 'to_status', 'metadata'];
    protected function casts(): array { return ['metadata' => 'array']; }
}
