<?php

namespace App\Mail;

use App\Models\School;
use App\Models\SchoolSubscription;
use App\Models\Package;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SubscriptionReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public School $school,
        public SchoolSubscription $subscription,
        public int $daysLeft,
        public ?Package $package = null,
        public ?User $admin = null
    ) {
        $this->package = $package ?? $subscription->package;
    }

    public function build(): self
    {
        return $this->subject("Reminder: {$this->daysLeft} Days Remaining on Your {$this->school->name} Subscription")
                    ->view('emails.subscriptions.reminder');
    }
}