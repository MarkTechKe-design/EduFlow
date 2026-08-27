<?php

namespace App\Services;

use App\Models\FeeAdjustment;
use App\Models\FeeInvoice;
use App\Models\FeeInvoiceItem;
use App\Models\FeeLedgerEntry;
use App\Models\FeePayment;
use App\Models\FeePaymentAllocation;
use App\Models\FeeStructure;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class StudentLedgerService
{
    /**
     * Compute real-time immutable balance for a student.
     * Balance = Total Debits (Charges + Refunds) - Total Credits (Payments + Waivers/Scholarships)
     */
    public static function computeBalance(int $studentId, int $schoolId): float
    {
        if (! Schema::hasTable('fee_ledger_entries')) {
            $due = (float) FeePayment::withoutGlobalScopes()
                ->where('student_id', $studentId)
                ->where('school_id', $schoolId)
                ->sum('amount_due');
            $paid = (float) FeePayment::withoutGlobalScopes()
                ->where('student_id', $studentId)
                ->where('school_id', $schoolId)
                ->sum('amount_paid');

            return round(max(0, $due - $paid), 2);
        }

        $query = FeeLedgerEntry::withoutGlobalScopes()
            ->where('student_id', $studentId)
            ->where('school_id', $schoolId);

        $totals = $query->selectRaw('COALESCE(SUM(debit), 0) as total_debit, COALESCE(SUM(credit), 0) as total_credit')->first();

        return round((float) ($totals->total_debit ?? 0) - (float) ($totals->total_credit ?? 0), 2);
    }

    /**
     * Generate term invoice for a student from an approved FeeStructure.
     */
    public static function billStudentFromStructure(Student $student, FeeStructure $structure, ?User $operator = null): FeeInvoice
    {
        return DB::transaction(function () use ($student, $structure, $operator) {
            abort_unless((int) $student->school_id === (int) $structure->school_id, 404);
            $invoiceNumber = 'INV-' . date('Y') . '-' . strtoupper(substr(uniqid(), -6));

            $invoice = FeeInvoice::withoutGlobalScopes()->create([
                'school_id'        => $student->school_id,
                'invoice_number'   => $invoiceNumber,
                'student_id'       => $student->id,
                'academic_year_id' => $structure->academic_year_id,
                'class_id'         => $student->class_id,
                'fee_structure_id' => $structure->id,
                'term'             => $structure->term,
                'issue_date'       => now()->toDateString(),
                'due_date'         => $structure->due_date ?? now()->addDays(30)->toDateString(),
                'total_amount'     => $structure->total_amount > 0 ? $structure->total_amount : $structure->amount,
                'paid_amount'      => 0.00,
                'waiver_amount'    => 0.00,
                'balance'          => $structure->total_amount > 0 ? $structure->total_amount : $structure->amount,
                'status'           => 'unpaid',
                'notes'            => "Automated term fee billing for {$structure->term}",
                'generated_by'     => $operator?->id,
            ]);

            $items = $structure->items()->withoutGlobalScopes()->with(['voteHead' => fn($q) => $q->withoutGlobalScopes()])->get();
            $runningBalance = self::computeBalance($student->id, $student->school_id);

            foreach ($items as $item) {
                FeeInvoiceItem::withoutGlobalScopes()->create([
                    'school_id'        => $student->school_id,
                    'fee_invoice_id'   => $invoice->id,
                    'fee_vote_head_id' => $item->fee_vote_head_id,
                    'amount'           => $item->amount,
                    'paid_amount'      => 0.00,
                    'waiver_amount'    => 0.00,
                    'balance'          => $item->amount,
                ]);

                if (Schema::hasTable('fee_ledger_entries')) {
                    $runningBalance += (float) $item->amount;

                    FeeLedgerEntry::withoutGlobalScopes()->create([
                        'school_id'        => $student->school_id,
                        'student_id'       => $student->id,
                        'academic_year_id' => $structure->academic_year_id,
                        'term'             => $structure->term,
                        'transaction_type' => 'charge',
                        'reference_number' => $invoiceNumber,
                        'debit'            => $item->amount,
                        'credit'           => 0.00,
                        'running_balance'  => $runningBalance,
                        'reference_type'   => FeeInvoice::class,
                        'reference_id'     => $invoice->id,
                        'fee_vote_head_id' => $item->fee_vote_head_id,
                        'entry_date'       => now()->toDateString(),
                        'description'      => "Term Charge: " . ($item->voteHead?->name ?? 'Fee Item') . " ({$structure->term})",
                        'created_by'       => $operator?->id,
                    ]);
                }
            }

            return $invoice;
        });
    }

    /**
     * Record a verified payment, allocate to vote heads, and update the immutable ledger.
     */
    public static function allocatePayment(
        Student $student,
        float $amount,
        string $referenceCode,
        string $channel = 'mpesa',
        array $voteHeadAllocations = [],
        ?User $operator = null,
        ?string $remarks = null
    ): FeePayment {
        return DB::transaction(function () use ($student, $amount, $referenceCode, $channel, $voteHeadAllocations, $operator, $remarks) {
            abort_unless($operator === null || (int) $operator->school_id === (int) $student->school_id, 403);
            $receiptNo = 'REC-' . date('Ymd') . '-' . strtoupper(substr(uniqid(), -4));

            $feePayment = FeePayment::withoutGlobalScopes()->create([
                'school_id'        => $student->school_id,
                'student_id'       => $student->id,
                'fee_structure_id' => null,
                'receipt_no'       => $receiptNo,
                'amount_due'       => self::computeBalance($student->id, $student->school_id),
                'amount_paid'      => $amount,
                'discount'         => 0.00,
                'fine'             => 0.00,
                'payment_date'     => now()->toDateString(),
                'month_year'       => date('m-Y'),
                'method'           => $channel,
                'status'           => 'paid',
                'note'             => "Ref: {$referenceCode} | " . ($remarks ?? 'Payment allocated'),
            ]);

            if (Schema::hasTable('fee_invoices') && Schema::hasTable('fee_payment_allocations')) {
                $remainingPayment = $amount;
                $unpaidInvoices = FeeInvoice::withoutGlobalScopes()
                    ->where('school_id', $student->school_id)
                    ->where('student_id', $student->id)
                    ->where('status', '!=', 'paid')
                    ->orderBy('issue_date')
                    ->with(['items' => fn($q) => $q->withoutGlobalScopes()])
                    ->get();

                foreach ($unpaidInvoices as $inv) {
                    if ($remainingPayment <= 0) break;

                    foreach ($inv->items as $invItem) {
                        if ($remainingPayment <= 0) break;
                        if ($invItem->balance <= 0) continue;

                        $allocAmount = min($invItem->balance, $remainingPayment);
                        $invItem->paid_amount += $allocAmount;
                        $invItem->balance -= $allocAmount;
                        $invItem->save();

                        FeePaymentAllocation::withoutGlobalScopes()->create([
                            'school_id'           => $student->school_id,
                            'fee_payment_id'      => $feePayment->id,
                            'fee_invoice_id'      => $inv->id,
                            'fee_invoice_item_id' => $invItem->id,
                            'fee_vote_head_id'    => $invItem->fee_vote_head_id,
                            'amount'              => $allocAmount,
                        ]);

                        $remainingPayment -= $allocAmount;
                    }

                    $invTotalPaid = $inv->items->sum('paid_amount');
                    $inv->paid_amount = $invTotalPaid;
                    $inv->balance = max(0, $inv->total_amount - ($invTotalPaid + $inv->waiver_amount));
                    $inv->status = $inv->balance <= 0 ? 'paid' : 'partially_paid';
                    $inv->save();
                }
            }

            if (Schema::hasTable('fee_ledger_entries')) {
                $newRunningBalance = self::computeBalance($student->id, $student->school_id) - $amount;

                FeeLedgerEntry::withoutGlobalScopes()->create([
                    'school_id'        => $student->school_id,
                    'student_id'       => $student->id,
                    'academic_year_id' => null,
                    'term'             => null,
                    'transaction_type' => 'payment',
                    'reference_number' => $referenceCode,
                    'debit'            => 0.00,
                    'credit'           => $amount,
                    'running_balance'  => $newRunningBalance,
                    'reference_type'   => FeePayment::class,
                    'reference_id'     => $feePayment->id,
                    'fee_vote_head_id' => null,
                    'entry_date'       => now()->toDateString(),
                    'description'      => "Payment Received ({$channel}): Ref #{$referenceCode}",
                    'created_by'       => $operator?->id,
                ]);
            }

            return $feePayment;
        });
    }

    /**
     * Apply a formal waiver, bursary or scholarship.
     */
    public static function applyAdjustment(Student $student, string $type, float $amount, string $reason, ?User $operator = null): FeeAdjustment
    {
        return DB::transaction(function () use ($student, $type, $amount, $reason, $operator) {
            $adjustment = FeeAdjustment::withoutGlobalScopes()->create([
                'school_id'   => $student->school_id,
                'student_id'  => $student->id,
                'type'        => $type,
                'amount'      => $amount,
                'reason'      => $reason,
                'status'      => 'approved',
                'approved_by' => $operator?->id,
            ]);

            if (Schema::hasTable('fee_ledger_entries')) {
                $newRunningBalance = self::computeBalance($student->id, $student->school_id) - $amount;

                FeeLedgerEntry::withoutGlobalScopes()->create([
                    'school_id'        => $student->school_id,
                    'student_id'       => $student->id,
                    'transaction_type' => 'waiver',
                    'reference_number' => 'ADJ-' . strtoupper(substr(uniqid(), -6)),
                    'debit'            => 0.00,
                    'credit'           => $amount,
                    'running_balance'  => $newRunningBalance,
                    'reference_type'   => FeeAdjustment::class,
                    'reference_id'     => $adjustment->id,
                    'entry_date'       => now()->toDateString(),
                    'description'      => ucfirst($type) . " Applied: {$reason}",
                    'created_by'       => $operator?->id,
                ]);
            }

            return $adjustment;
        });
    }
}