<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class WebsiteLead extends Model
{
    protected $fillable = [
        'public_id', 'type', 'status', 'name', 'email', 'phone', 'organization',
        'message', 'payload', 'source', 'ip_hash', 'user_agent', 'handled_by', 'handled_at',
    ];

    protected $casts = ['payload' => 'array', 'handled_at' => 'datetime'];

    protected static function booted(): void
    {
        static::creating(fn (self $lead) => $lead->public_id ??= (string) Str::uuid());
    }

    public function handler(): BelongsTo
    {
        return $this->belongsTo(User::class, 'handled_by');
    }
}
