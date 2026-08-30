<?php

namespace App\Mail;

use App\Models\School;
use App\Models\User;
use App\Models\AcademicYear;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SchoolOnboardingCompletedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public School $school,
        public User $admin,
        public ?AcademicYear $academicYear = null
    ) {}

    public function build(): self
    {
        return $this->subject("Workspace Calibration Complete - Welcome to EduFlow, {$this->school->name}!")
                    ->view('emails.schools.onboarding-completed');
    }
}