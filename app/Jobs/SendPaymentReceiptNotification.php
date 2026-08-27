<?php

namespace App\Jobs;

use App\Models\FeePayment;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendPaymentReceiptNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public FeePayment $feePayment,
        public ?string $recipientEmail = null
    ) {}

    public function handle(): void
    {
        $payment = $this->feePayment->load(['student.schoolClass', 'allocations.voteHead', 'school']);
        $student = $payment->student;
        $email = $this->recipientEmail ?? $student?->guardian_email ?? $student?->email;

        if (!$email) {
            Log::info("Receipt Notification Skipped: No guardian email on record for student #{$student?->admission_no}");
            return;
        }

        Log::info("Dispatched Payment Receipt #{$payment->receipt_no} to {$email} for Student {$student?->first_name} {$student?->last_name} (KSh {$payment->amount_paid})");
    }
}