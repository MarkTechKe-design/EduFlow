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

    public int $tries = 3;
    public int $timeout = 120;
    public array $backoff = [10, 30, 60];

    public function __construct(
        public Student $student,
        public float $balance,
        public ?string $customMessage = null
    ) {}

    public function handle(): void
    {
        $phone = $this->student->guardian_phone;
        if (empty($phone)) {
            Log::info("SendArrearsReminderSms: No guardian phone for student ID {$this->student->id}");
            return;
        }

        $school = $this->student->school;
        $schoolName = $school ? $school->name : 'EduFlow School';
        $studentName = $this->student->full_name;
        $formattedBalance = number_format($this->balance, 2);

        $message = $this->customMessage
            ?? "Dear Parent, this is a reminder from {$schoolName} regarding the outstanding fee balance of KES {$formattedBalance} for {$studentName}. Kindly arrange for settlement. Thank you.";

        try {
            $smsService = app(\App\Services\SmsService::class);
            $smsService->send($phone, $message, $this->student->school_id);
            Log::info("SendArrearsReminderSms: Dispatched reminder to {$phone} for student ID {$this->student->id}");
        } catch (\Throwable $e) {
            Log::error("SendArrearsReminderSms failed for student ID {$this->student->id}: " . $e->getMessage());
            throw $e;
        }
    }
}