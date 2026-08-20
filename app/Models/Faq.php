<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Faq extends Model
{
    use HasFactory;

    protected $fillable = [
        'question',
        'slug',
        'answer',
        'category',
        'status',
        'is_featured_on_homepage',
        'sort_order',
        'created_by',
        'updated_by',
        'published_at',
    ];

    protected $casts = [
        'is_featured_on_homepage' => 'boolean',
        'sort_order' => 'integer',
        'published_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($faq) {
            if (empty($faq->slug)) {
                $faq->slug = Str::slug($faq->question) . '-' . Str::random(5);
            }
            if ($faq->status === 'published' && empty($faq->published_at)) {
                $faq->published_at = now();
            }
        });

        static::updating(function ($faq) {
            if ($faq->isDirty('question') && empty($faq->slug)) {
                $faq->slug = Str::slug($faq->question) . '-' . Str::random(5);
            }
            if ($faq->isDirty('status') && $faq->status === 'published' && empty($faq->published_at)) {
                $faq->published_at = now();
            }
        });
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', 'published')
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc');
    }

    public function scopeFeaturedOnHomepage(Builder $query): Builder
    {
        return $query->where('status', 'published')
            ->where('is_featured_on_homepage', true)
            ->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}