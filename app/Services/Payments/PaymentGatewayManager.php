<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGatewayInterface;
use App\Models\PlatformSetting;

class PaymentGatewayManager
{
    public function resolve(?string $provider = null): PaymentGatewayInterface
    {
        $gateway = $provider
            ?: PlatformSetting::get('payment_gateway_driver')
            ?: config('services.billing.default_gateway', 'paystack');

        return match ($gateway) {
            'paystack' => app(PaystackPaymentGateway::class),
            'manual'   => app(ManualPaymentGateway::class),
            default    => app(PaystackPaymentGateway::class),
        };
    }
}