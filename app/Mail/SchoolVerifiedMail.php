<?php

namespace App\Mail;

use App\Models\School;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SchoolVerifiedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public School $school,
        public ?string $notes = null,
        public string $auditorName = 'Super Administrator'
    ) {}

    public function build(): self
    {
        return $this->subject("Official Institutional Verification Approved: {$this->school->name}")
                    ->view('emails.schools.verified');
    }
}