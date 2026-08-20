<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WebsiteMenu extends Model
{
    protected $fillable = ['name', 'location', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function items(): HasMany
    {
        return $this->hasMany(WebsiteMenuItem::class)->orderBy('sort_order');
    }
}
