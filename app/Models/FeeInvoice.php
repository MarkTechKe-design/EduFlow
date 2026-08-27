<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class FeeInvoice extends Model
{
    use HasFactory, BelongsToSchool, SoftDeletes;

    protected $table = 'fee_invoices';

    protected $fillable = [
        'school_id',
        'invoice_number',
        'student_id',
        'academic_year_id',
        'class_id',
        'fee_structure_id',
        'term',
        'issue_date',
        'due_date',
        'total_amount',
        'paid_amount',
        'waiver_amount',
        'balance',
        'status',
        'notes',
        'generated_by',
    ];

    protected $casts = [
        'issue_date'    => 'date',
        'due_date'      => 'date',
        'total_amount'  => 'decimal:2',
        'paid_amount'   => 'decimal:2',
        'waiver_amount' => 'decimal:2',
        'balance'       => 'decimal:2',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function feeStructure(): BelongsTo
    {
        return $this->belongsTo(FeeStructure::class, 'fee_structure_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(FeeInvoiceItem::class, 'fee_invoice_id');
    }

    public function generator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }
}