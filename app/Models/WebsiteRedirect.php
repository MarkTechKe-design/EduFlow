<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WebsiteRedirect extends Model
{
    protected $fillable = ['from_path', 'to_url', 'status_code', 'is_active'];

    protected $casts = ['is_active' => 'boolean', 'status_code' => 'integer'];
}
