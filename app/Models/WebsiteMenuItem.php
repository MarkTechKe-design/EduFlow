<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WebsiteMenuItem extends Model
{
    protected $fillable = [
        'website_menu_id', 'parent_id', 'label', 'url', 'route_name', 'target',
        'icon', 'sort_order', 'is_visible', 'settings',
    ];

    protected $casts = ['is_visible' => 'boolean', 'settings' => 'array'];

    public function menu(): BelongsTo
    {
        return $this->belongsTo(WebsiteMenu::class, 'website_menu_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('sort_order');
    }
}
