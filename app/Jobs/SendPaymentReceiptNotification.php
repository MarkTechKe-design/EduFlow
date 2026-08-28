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

    public int $tries = 3;
    public int $timeout = 90;
    public array $backoff = [5, 20, 60];

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

        try {
            $notificationService = app(\App\Services\NotificationService::class);
            $notificationService->sendPaymentReceipt($payment, $email);
            Log::info("Payment Receipt dispatched successfully to {$email} for receipt #{$payment->receipt_no}");
        } catch (\Throwable $e) {
            Log::error("Failed to dispatch payment receipt for #{$payment->receipt_no}: " . $e->getMessage());
            throw $e;
        }
    }
}