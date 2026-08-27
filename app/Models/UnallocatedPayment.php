<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class UnallocatedPayment extends Model
{
    use HasFactory, BelongsToSchool, SoftDeletes;

    protected $table = 'unallocated_payments';

    protected $fillable = [
        'school_id',
        'reference_code',
        'channel',
        'amount',
        'payer_name',
        'payer_phone',
        'bill_reference_entered',
        'payment_date',
        'raw_payload',
        'status',
        'allocated_to_student_id',
        'resolved_by',
        'resolved_at',
        'resolution_notes',
    ];

    protected $casts = [
        'payment_date' => 'datetime',
        'resolved_at'  => 'datetime',
        'amount'       => 'decimal:2',
        'raw_payload'  => 'array',
    ];

    public function allocatedStudent(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'allocated_to_student_id');
    }

    public function resolver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }
}