<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class WebsitePage extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'public_id', 'title', 'slug', 'path', 'template', 'status', 'is_home',
        'published_at', 'unpublished_at', 'seo_title', 'seo_description',
        'canonical_url', 'og_image_path', 'robots_index', 'robots_follow',
        'structured_data', 'created_by', 'updated_by',
    ];

    protected $casts = [
        'is_home' => 'boolean',
        'published_at' => 'datetime',
        'unpublished_at' => 'datetime',
        'robots_index' => 'boolean',
        'robots_follow' => 'boolean',
        'structured_data' => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $page): void {
            $page->public_id ??= (string) Str::uuid();
            $page->slug = $page->slug ?: Str::slug($page->title);
            $page->path = $page->path ?: '/' . $page->slug;
        });
    }

    public function sections(): HasMany
    {
        return $this->hasMany(WebsitePageSection::class)->orderBy('sort_order');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')
            ->where(function (Builder $query): void {
                $query->whereNull('published_at')->orWhere('published_at', '<=', now());
            })
            ->where(function (Builder $query): void {
                $query->whereNull('unpublished_at')->orWhere('unpublished_at', '>', now());
            });
    }
}
