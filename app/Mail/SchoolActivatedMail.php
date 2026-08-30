<?php

namespace App\Mail;

use App\Models\School;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SchoolActivatedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public School $school
    ) {}

    public function build(): self
    {
        return $this->subject("Account Reactivated: Full Access Restored for {$this->school->name}")
                    ->view('emails.schools.activated');
    }
}