<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class BlogPost extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'slug',
        'excerpt',
        'body',
        'category',
        'featured_image',
        'gallery_images',
        'video_url',
        'media_type',
        'author_name',
        'source_name',
        'source_url',
        'status',
        'is_featured',
        'read_time_minutes',
        'meta_title',
        'meta_description',
        'created_by',
        'updated_by',
        'published_at',
    ];

    protected $casts = [
        'is_featured' => 'boolean',
        'read_time_minutes' => 'integer',
        'gallery_images' => 'array',
        'published_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($post) {
            if (empty($post->slug)) {
                $post->slug = Str::slug($post->title) . '-' . Str::random(5);
            }
            if ($post->status === 'published' && empty($post->published_at)) {
                $post->published_at = now();
            }
        });

        static::updating(function ($post) {
            if ($post->isDirty('title') && empty($post->slug)) {
                $post->slug = Str::slug($post->title) . '-' . Str::random(5);
            }
            if ($post->isDirty('status') && $post->status === 'published' && empty($post->published_at)) {
                $post->published_at = now();
            }
        });
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')
            ->orderBy('published_at', 'desc')
            ->orderBy('id', 'desc');
    }

    public function scopeFeatured(Builder $query): Builder
    {
        return $query->where('status', 'published')
            ->where('is_featured', true)
            ->orderBy('published_at', 'desc');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}