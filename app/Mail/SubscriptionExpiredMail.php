<?php

namespace App\Mail;

use App\Models\School;
use App\Models\SchoolSubscription;
use App\Models\Package;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SubscriptionExpiredMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public School $school,
        public SchoolSubscription $subscription,
        public ?Package $package = null
    ) {
        $this->package = $package ?? $subscription->package;
    }

    public function build(): self
    {
        return $this->subject("Important: Your EduFlow Subscription Has Expired - {$this->school->name}")
                    ->view('emails.subscriptions.expired');
    }
}