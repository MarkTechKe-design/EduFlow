<?php

namespace App\Services;

use App\Models\FeeLedgerEntry;
use App\Models\FeePayment;
use App\Models\School;
use App\Models\Student;
use App\Models\UnallocatedPayment;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PaymentProcessingService
{
    /**
     * Ingest normalized payment transaction.
     * Returns: ['status' => 'allocated'|'unallocated'|'duplicate', 'payment' => $model, 'message' => string]
     */
    public static function processIncomingPayment(int $schoolId, array $normalizedData, ?User $operator = null): array
    {
        $refCode = $normalizedData['reference_code'];

        // 1. Strict Idempotency Check: Prevent duplicate webhook double-crediting
        $alreadyInLedger = FeeLedgerEntry::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('reference_number', $refCode)
            ->exists();

        $alreadyInUnallocated = UnallocatedPayment::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('reference_code', $refCode)
            ->exists();

        if ($alreadyInLedger || $alreadyInUnallocated) {
            return [
                'status'  => 'duplicate',
                'payment' => null,
                'message' => "Transaction reference #{$refCode} has already been processed.",
            ];
        }

        // 2. Search for matching Student via AccountReference / BillRefNumber
        $accountRef = trim($normalizedData['account_ref']);
        $matchedStudent = null;

        if (!empty($accountRef)) {
            $matchedStudent = Student::withoutGlobalScopes()
                ->where('school_id', $schoolId)
                ->where(function ($q) use ($accountRef) {
                    $q->where('admission_no', $accountRef)
                      ->orWhere('admission_no', 'like', "%{$accountRef}%")
                      ->orWhere('assessment_no', $accountRef)
                      ->orWhere('nemis_upi', $accountRef);
                })
                ->first();
        }

        // 3. Matched: Allocate directly to Student Ledger
        if ($matchedStudent) {
            $payment = StudentLedgerService::allocatePayment(
                $matchedStudent,
                $normalizedData['amount'],
                $refCode,
                'mpesa',
                [],
                $operator,
                "Automated M-Pesa C2B from {$normalizedData['payer_name']} ({$normalizedData['payer_phone']})"
            );

            return [
                'status'  => 'allocated',
                'student' => $matchedStudent,
                'payment' => $payment,
                'message' => "Payment allocated successfully to {$matchedStudent->first_name} {$matchedStudent->last_name} ({$matchedStudent->admission_no}).",
            ];
        }

        // 4. Unmatched / Ambiguous: Route to Bursar Unallocated Queue
        $unallocated = UnallocatedPayment::withoutGlobalScopes()->create([
            'school_id'              => $schoolId,
            'reference_code'         => $refCode,
            'channel'                => 'mpesa',
            'amount'                 => $normalizedData['amount'],
            'payer_name'             => $normalizedData['payer_name'],
            'payer_phone'            => $normalizedData['payer_phone'],
            'bill_reference_entered' => $accountRef,
            'payment_date'           => $normalizedData['payment_date'],
            'raw_payload'            => $normalizedData['raw_payload'],
            'status'                 => 'unallocated',
        ]);

        return [
            'status'      => 'unallocated',
            'unallocated' => $unallocated,
            'message'     => "Account reference '{$accountRef}' unmatched. Queued for Bursar review.",
        ];
    }

    /**
     * Bursar Manual Allocation of Unallocated Payment to a Student.
     */
    public static function resolveUnallocatedPayment(UnallocatedPayment $unallocated, Student $student, User $bursar, ?string $notes = null): FeePayment
    {
        return DB::transaction(function () use ($unallocated, $student, $bursar, $notes) {
            // Pessimistically lock row for update to prevent concurrent duplicate resolution
            $locked = UnallocatedPayment::where('id', $unallocated->id)
                ->where('school_id', $unallocated->school_id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($locked->status === 'allocated') {
                throw new \DomainException("Unallocated payment #{$locked->id} with reference '{$locked->reference_code}' has already been allocated.");
            }

            // Allocate to student ledger
            $payment = StudentLedgerService::allocatePayment(
                $student,
                (float)$locked->amount,
                $locked->reference_code,
                $locked->channel,
                [],
                $bursar,
                "Manual resolution from Unallocated Queue by {$bursar->name}. Notes: " . ($notes ?? 'N/A')
            );

            // Mark unallocated record as resolved
            $locked->update([
                'status'                  => 'allocated',
                'allocated_to_student_id' => $student->id,
                'resolved_by'             => $bursar->id,
                'resolved_at'             => now(),
                'resolution_notes'        => $notes,
            ]);

            return $payment;
        });
    }
}