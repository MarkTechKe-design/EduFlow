<?php

namespace App\Mail;

use App\Models\School;
use App\Models\SchoolSubscription;
use App\Models\Package;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class SubscriptionReceiptMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public School $school,
        public SchoolSubscription $subscription,
        public ?Package $package = null,
        public ?float $amount = null,
        public ?string $reference = null,
        public string $paymentMethod = 'Paystack Online Checkout'
    ) {
        $this->package = $package ?? $subscription->package;
        $this->amount = $amount ?? $this->package?->price ?? 0;
    }

    public function build(): self
    {
        return $this->subject("Official Payment Receipt: EduFlow Subscription - {$this->school->name}")
                    ->view('emails.subscriptions.receipt');
    }
}