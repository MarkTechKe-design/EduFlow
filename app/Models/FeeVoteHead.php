<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FeeVoteHead extends Model
{
    use HasFactory, BelongsToSchool, SoftDeletes;

    protected $table = 'fee_vote_heads';

    protected $fillable = [
        'school_id',
        'code',
        'name',
        'category',
        'description',
        'is_mandatory',
        'is_active',
    ];

    protected $casts = [
        'is_mandatory' => 'boolean',
        'is_active'    => 'boolean',
    ];

    public function structureItems(): HasMany
    {
        return $this->hasMany(FeeStructureItem::class, 'fee_vote_head_id');
    }

    public function invoiceItems(): HasMany
    {
        return $this->hasMany(FeeInvoiceItem::class, 'fee_vote_head_id');
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(FeePaymentAllocation::class, 'fee_vote_head_id');
    }
}