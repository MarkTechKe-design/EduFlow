<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class WebsiteMedia extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'public_id', 'disk', 'path', 'file_name', 'mime_type', 'size', 'folder',
        'title', 'alt_text', 'metadata', 'uploaded_by',
    ];

    protected $casts = ['metadata' => 'array'];

    protected static function booted(): void
    {
        static::creating(fn (self $media) => $media->public_id ??= (string) Str::uuid());
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getUrlAttribute(): string
    {
        return asset('storage/' . ltrim($this->path, '/'));
    }
}
