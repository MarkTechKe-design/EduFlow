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
        $refCode = trim((string) ($normalizedData['reference_code'] ?? ''));
        $amount = (float) ($normalizedData['amount'] ?? 0);
        abort_unless($schoolId > 0 && $refCode !== '' && $amount > 0, 422, 'Invalid payment transaction.');

        return DB::transaction(function () use ($schoolId, $normalizedData, $operator, $refCode, $amount): array {
            School::withoutGlobalScopes()->whereKey($schoolId)->lockForUpdate()->firstOrFail();

            $alreadyProcessed = FeeLedgerEntry::withoutGlobalScopes()
                ->where('school_id', $schoolId)->where('reference_number', $refCode)->exists()
                || UnallocatedPayment::withoutGlobalScopes()
                    ->where('school_id', $schoolId)->where('reference_code', $refCode)->exists();
            if ($alreadyProcessed) {
                return ['status' => 'duplicate', 'payment' => null, 'message' => "Transaction reference #{$refCode} has already been processed."];
            }

            $accountRef = trim((string) ($normalizedData['account_ref'] ?? ''));
            $matchedStudent = ! empty($accountRef)
                ? Student::withoutGlobalScopes()->where('school_id', $schoolId)->where(function ($q) use ($accountRef) {
                    $q->where('admission_no', $accountRef)->orWhere('admission_no', 'like', "%{$accountRef}%")
                        ->orWhere('assessment_no', $accountRef)->orWhere('nemis_upi', $accountRef);
                })->first()
                : null;

            if ($matchedStudent) {
                $payment = StudentLedgerService::allocatePayment($matchedStudent, $amount, $refCode, 'mpesa', [], $operator,
                    "Automated M-Pesa C2B from " . ($normalizedData['payer_name'] ?? 'Unknown payer') . " (" . ($normalizedData['payer_phone'] ?? 'unknown') . ")");
                return ['status' => 'allocated', 'student' => $matchedStudent, 'payment' => $payment,
                    'message' => "Payment allocated successfully to {$matchedStudent->first_name} {$matchedStudent->last_name} ({$matchedStudent->admission_no})."];
            }

            $unallocated = UnallocatedPayment::withoutGlobalScopes()->create([
                'school_id' => $schoolId, 'reference_code' => $refCode, 'channel' => 'mpesa', 'amount' => $amount,
                'payer_name' => $normalizedData['payer_name'] ?? null, 'payer_phone' => $normalizedData['payer_phone'] ?? null,
                'bill_reference_entered' => $accountRef, 'payment_date' => $normalizedData['payment_date'] ?? now(),
                'raw_payload' => $normalizedData['raw_payload'] ?? [], 'status' => 'unallocated',
            ]);
            return ['status' => 'unallocated', 'unallocated' => $unallocated,
                'message' => "Account reference '{$accountRef}' unmatched. Queued for Bursar review."];
        });
    }
    /**
     * Bursar Manual Allocation of Unallocated Payment to a Student.
     */
    public static function resolveUnallocatedPayment(UnallocatedPayment $unallocated, Student $student, User $bursar, ?string $notes = null): FeePayment
    {
        abort_unless((int) $unallocated->school_id === (int) $student->school_id
            && (int) $bursar->school_id === (int) $student->school_id, 403, 'Tenant mismatch.');

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