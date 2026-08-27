<?php

namespace App\Jobs;

use App\Models\Student;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendArrearsReminderSms implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public Student $student,
        public float $balance,
        public ?string $customMessage = null
    ) {}

    public function handle(): void
    {
        $phone = $this->student->guardian_phone;
        if (!$phone) {
            Log::info("SMS Reminder Skipped: No guardian phone on record for Student #{$this->student->admission_no}");
            return;
        }

        $formattedBalance = number_format($this->balance, 2);
        $message = $this->customMessage 
            ?? "Dear Parent, this is a reminder that {$this->student->first_name} ({$this->student->admission_no}) has an outstanding fee balance of KSh {$formattedBalance}. Kindly settle via official school payment channels.";

        Log::info("Dispatched Arrears SMS to [{$phone}]: {$message}");
    }
}