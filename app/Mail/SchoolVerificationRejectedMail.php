<?php

namespace App\Mail;

use App\Models\School;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SchoolVerificationRejectedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public School $school,
        public string $reason
    ) {}

    public function build(): self
    {
        return $this->subject("Action Required: Institutional Verification Audit for {$this->school->name}")
                    ->view('emails.schools.rejected');
    }
}