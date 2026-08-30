<?php

namespace App\Mail;

use App\Models\School;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SchoolSuspendedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public School $school,
        public ?string $reason = null
    ) {}

    public function build(): self
    {
        return $this->subject("Notice: Account Suspension - {$this->school->name}")
                    ->view('emails.schools.suspended');
    }
}