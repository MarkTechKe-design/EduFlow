<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FeeStructure extends Model
{
    use HasFactory, BelongsToSchool, SoftDeletes;

    protected $table = 'fee_structures';

    protected $fillable = [
        'school_id',
        'academic_year',
        'academic_year_id',
        'fee_category_id',
        'term',
        'class_id',
        'title',
        'student_category',
        'amount',
        'total_amount',
        'due_date',
        'frequency',
        'description',
        'is_active',
    ];

    protected $casts = [
        'due_date'     => 'date',
        'amount'       => 'decimal:2',
        'total_amount' => 'decimal:2',
        'is_active'    => 'boolean',
    ];

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    public function feeCategory(): BelongsTo
    {
        return $this->belongsTo(FeeCategory::class, 'fee_category_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(FeeCategory::class, 'fee_category_id');
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(FeeStructureItem::class, 'fee_structure_id');
    }

    public function invoices(): HasMany
    {
        return $this->hasMany(FeeInvoice::class, 'fee_structure_id');
    }
}