<?php

namespace App\Contracts;

use App\Models\SchoolSubscription;

interface PaymentGatewayInterface
{
    public function initialize(SchoolSubscription $subscription, string $returnUrl, string $idempotencyKey): array;
    public function verify(string $reference): array;
    public function refund(string $reference, int|float $amount): array;
    public function validateWebhook(string $payload, array $headers): bool;
}
