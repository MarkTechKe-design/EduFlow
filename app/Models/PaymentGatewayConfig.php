<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentGatewayConfig extends Model
{
    protected $fillable = ['provider', 'name', 'is_active', 'credentials', 'settings'];
    protected $hidden = ['credentials'];
    protected function casts(): array { return ['is_active' => 'boolean', 'credentials' => 'encrypted:array', 'settings' => 'array']; }
}
