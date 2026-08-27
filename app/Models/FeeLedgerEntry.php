<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class FeeLedgerEntry extends Model
{
    use HasFactory, BelongsToSchool, SoftDeletes;

    protected $table = 'fee_ledger_entries';

    protected $fillable = [
        'school_id',
        'student_id',
        'academic_year_id',
        'term',
        'transaction_type',
        'reference_number',
        'debit',
        'credit',
        'running_balance',
        'reference_type',
        'reference_id',
        'fee_vote_head_id',
        'entry_date',
        'description',
        'created_by',
    ];

    protected $casts = [
        'entry_date'      => 'date',
        'debit'           => 'decimal:2',
        'credit'          => 'decimal:2',
        'running_balance' => 'decimal:2',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class, 'academic_year_id');
    }

    public function voteHead(): BelongsTo
    {
        return $this->belongsTo(FeeVoteHead::class, 'fee_vote_head_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}