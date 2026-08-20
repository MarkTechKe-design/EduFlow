<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGatewayInterface;
use App\Models\SchoolSubscription;
use Illuminate\Support\Str;

class ManualPaymentGateway implements PaymentGatewayInterface
{
    public function initialize(SchoolSubscription $subscription, string $returnUrl, string $idempotencyKey): array
    { return ['reference' => 'MANUAL-'.Str::upper(Str::random(12)), 'checkout_url' => $returnUrl, 'status' => 'pending']; }
    public function verify(string $reference): array { return ['reference' => $reference, 'status' => 'pending']; }
    public function refund(string $reference, int|float $amount): array { return ['reference' => $reference, 'status' => 'pending']; }
    public function validateWebhook(string $payload, array $headers): bool { return false; }
}
