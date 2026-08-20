<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class WebsitePageSection extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'website_page_id',
        'identifier',
        'block_type',
        'content',
        'settings',
        'sort_order',
        'is_enabled',
        'starts_at',
        'ends_at',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'content'    => 'array',
        'settings'   => 'array',
        'is_enabled' => 'boolean',
        'sort_order' => 'integer',
        'starts_at'  => 'datetime',
        'ends_at'    => 'datetime',
    ];

    public function page(): BelongsTo
    {
        return $this->belongsTo(WebsitePage::class, 'website_page_id');
    }
}