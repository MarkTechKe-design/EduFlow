<?php

namespace App\Services;

use App\Jobs\SendArrearsReminderSms;
use App\Models\FeeLedgerEntry;
use App\Models\FeePayment;
use App\Models\FeePaymentAllocation;
use App\Models\FeeVoteHead;
use App\Models\School;
use App\Models\Student;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class FinancialReportService
{
    /**
     * Daily Bursar Cashbook Report grouped by payment channel.
     */
    public static function getDailyCashbook(int $schoolId, string $date): array
    {
        $payments = FeePayment::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->whereDate('payment_date', $date)
            ->with(['student.schoolClass', 'allocations.voteHead'])
            ->orderByDesc('id')
            ->get();

        $channels = [
            'mpesa'          => ['label' => 'M-Pesa Daraja', 'total' => 0.00, 'count' => 0],
            'bank_transfer'  => ['label' => 'Bank Transfer', 'total' => 0.00, 'count' => 0],
            'cash'           => ['label' => 'Bursar Cash', 'total' => 0.00, 'count' => 0],
            'cheque'         => ['label' => 'Bank Cheque', 'total' => 0.00, 'count' => 0],
            'direct_deposit' => ['label' => 'Direct Deposit', 'total' => 0.00, 'count' => 0],
        ];

        $grandTotal = 0.00;

        foreach ($payments as $p) {
            $method = $p->method;
            if (isset($channels[$method])) {
                $channels[$method]['total'] += (float)$p->amount_paid;
                $channels[$method]['count'] += 1;
            }
            $grandTotal += (float)$p->amount_paid;
        }

        return [
            'date'               => $date,
            'channels'           => $channels,
            'grand_total'        => round($grandTotal, 2),
            'total_transactions' => $payments->count(),
            'records'            => $payments,
        ];
    }

    /**
     * Vote-Head Collection Broadsheet Distribution.
     */
    public static function getVoteHeadBroadsheet(int $schoolId, ?string $startDate = null, ?string $endDate = null): array
    {
        $query = FeePaymentAllocation::withoutGlobalScopes()
            ->where('fee_payment_allocations.school_id', $schoolId)
            ->join('fee_vote_heads', 'fee_payment_allocations.fee_vote_head_id', '=', 'fee_vote_heads.id');

        if ($startDate && $endDate) {
            $query->whereBetween('fee_payment_allocations.created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59']);
        }

        $voteHeads = $query->select(
            'fee_vote_heads.id as vote_head_id',
            'fee_vote_heads.name as vote_head_name',
            'fee_vote_heads.category',
            DB::raw('SUM(fee_payment_allocations.amount) as total_collected'),
            DB::raw('COUNT(DISTINCT fee_payment_allocations.fee_payment_id) as transaction_count')
        )
        ->groupBy('fee_vote_heads.id', 'fee_vote_heads.name', 'fee_vote_heads.category')
        ->get();

        $totalCollected = (float)$voteHeads->sum('total_collected');

        $broadsheet = $voteHeads->map(function ($item) use ($totalCollected) {
            $amt = (float)$item->total_collected;
            $share = $totalCollected > 0 ? round(($amt / $totalCollected) * 100, 2) : 0;
            return [
                'vote_head_id'      => $item->vote_head_id,
                'name'              => $item->vote_head_name,
                'category'          => $item->category,
                'total_collected'   => $amt,
                'transaction_count' => (int)$item->transaction_count,
                'percentage_share'  => $share,
            ];
        });

        return [
            'items'           => $broadsheet,
            'total_collected' => $totalCollected,
        ];
    }

    /**
     * Term Fee Arrears Defaulters Schedule with threshold filtering.
     */
    public static function getArrearsSchedule(int $schoolId, float $minimumBalance = 100.00, ?int $classId = null): Collection
    {
        $query = Student::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('status', 'active')
            ->with(['schoolClass:id,name', 'section:id,name']);

        if ($classId) {
            $query->where('class_id', $classId);
        }

        $students = $query->get();

        return $students->map(function ($student) use ($schoolId) {
            $balance = StudentLedgerService::computeBalance($student->id, $schoolId);
            $student->outstanding_balance = $balance;
            return $student;
        })->filter(fn($student) => $student->outstanding_balance >= $minimumBalance)
          ->sortByDesc('outstanding_balance')
          ->values();
    }

    /**
     * Batch dispatch arrears SMS reminders to debtors.
     */
    public static function dispatchBatchReminders(int $schoolId, array $studentIds, ?string $customMessage = null): int
    {
        $students = Student::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->whereIn('id', $studentIds)
            ->get();

        $dispatchedCount = 0;

        foreach ($students as $student) {
            $balance = StudentLedgerService::computeBalance($student->id, $schoolId);
            if ($balance > 0 && !empty($student->guardian_phone)) {
                SendArrearsReminderSms::dispatch($student, $balance, $customMessage);
                $dispatchedCount++;
            }
        }

        return $dispatchedCount;
    }
}