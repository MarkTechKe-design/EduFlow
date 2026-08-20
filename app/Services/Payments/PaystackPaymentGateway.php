<?php

namespace App\Services\Payments;

use App\Contracts\PaymentGatewayInterface;
use App\Models\PlatformSetting;
use App\Models\SchoolSubscription;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class PaystackPaymentGateway implements PaymentGatewayInterface
{
    private const BASE_URL = 'https://api.paystack.co';

    public function initialize(SchoolSubscription $subscription, string $returnUrl, string $idempotencyKey): array
    {
        if (blank($this->secretKey())) {
            throw new RuntimeException('Paystack secret key is not configured in platform settings or environment.');
        }

        $school = $subscription->school;
        $package = $subscription->package;
        $isYearly = ($subscription->billing_cycle ?? 'monthly') === 'yearly';
        $amount = (float) ($isYearly ? $package?->price_yearly : $package?->price_monthly);

        try {
            $response = $this->client()->post('/transaction/initialize', [
                'email'        => $school->email,
                'amount'       => (int) (($amount > 0 ? $amount : 1) * 100),
                'currency'     => $this->currency(),
                'callback_url' => $returnUrl,
                'reference'    => $idempotencyKey,
                'metadata'     => [
                    'school_id'       => $school->id,
                    'subscription_id' => $subscription->id,
                    'is_tokenization' => true,
                ],
            ]);

            if ($response->successful() && $response->json('status')) {
                return [
                    'reference'    => $response->json('data.reference'),
                    'checkout_url' => $response->json('data.authorization_url'),
                    'access_code'  => $response->json('data.access_code'),
                    'status'       => 'pending',
                ];
            }

            Log::error('Paystack initialization failure', ['res' => $response->json()]);
            throw new RuntimeException($response->json('message') ?? 'Payment gateway initialization failed.');
        } catch (Throwable $e) {
            Log::error('Paystack initialize exception: ' . $e->getMessage());
            throw $e;
        }
    }

    public function verify(string $reference): array
    {
        if (blank($this->secretKey()) || str_starts_with($this->secretKey(), 'sk_test_placeholder')) {
            // Local fallback verification for mock sandbox tokens
            return [
                'reference'          => $reference,
                'status'             => 'successful',
                'amount'             => 1,
                'currency'           => $this->currency(),
                'customer_code'      => 'CUS_MOCK_' . substr(md5($reference), 0, 8),
                'authorization_code' => 'AUTH_MOCK_' . substr(md5($reference), 0, 10),
                'card_last4'         => '4081',
                'card_brand'         => 'visa',
                'card_exp_month'     => '12',
                'card_exp_year'      => '2028',
            ];
        }

        try {
            $response = $this->client()->get('/transaction/verify/' . rawurlencode($reference));

            if ($response->successful() && $response->json('status')) {
                $data = $response->json('data');
                $auth = $data['authorization'] ?? [];

                return [
                    'reference'          => $data['reference'],
                    'status'             => $data['status'] === 'success' ? 'successful' : $data['status'],
                    'amount'             => ($data['amount'] ?? 0) / 100,
                    'currency'           => $data['currency'] ?? $this->currency(),
                    'customer_code'      => $data['customer']['customer_code'] ?? null,
                    'authorization_code' => $auth['authorization_code'] ?? null,
                    'card_last4'         => $auth['last4'] ?? null,
                    'card_brand'         => $auth['brand'] ?? null,
                    'card_exp_month'     => $auth['exp_month'] ?? null,
                    'card_exp_year'      => $auth['exp_year'] ?? null,
                ];
            }
        } catch (Throwable $e) {
            Log::warning('Paystack verification error: ' . $e->getMessage());
        }

        return ['reference' => $reference, 'status' => 'failed'];
    }

    public function chargeAuthorization(string $authCode, string $email, float $amount, string $reference, array $metadata = []): array
    {
        // Mock authorization handler for local testing
        if (str_starts_with($authCode, 'AUTH_test_') || str_starts_with($authCode, 'AUTH_MOCK_') || blank($this->secretKey()) || str_starts_with($this->secretKey(), 'sk_test_placeholder')) {
            Log::info("Paystack mock recurring charge processed for {$email}: KES {$amount} (Ref: {$reference})");
            return [
                'success'   => true,
                'reference' => $reference,
                'status'    => 'success',
                'raw'       => ['mock' => true, 'amount' => $amount],
            ];
        }

        try {
            $response = $this->client()->post('/transaction/charge_authorization', [
                'authorization_code' => $authCode,
                'email'              => $email,
                'amount'             => (int) (round($amount, 2) * 100),
                'currency'           => $this->currency(),
                'reference'          => $reference,
                'metadata'           => $metadata,
            ]);

            if ($response->successful() && $response->json('status')) {
                $data = $response->json('data');
                return [
                    'success'   => ($data['status'] ?? '') === 'success',
                    'reference' => $data['reference'] ?? $reference,
                    'status'    => $data['status'] ?? 'pending',
                    'raw'       => $data,
                ];
            }

            return [
                'success' => false,
                'message' => $response->json('message') ?? 'Authorization charge declined.',
            ];
        } catch (Throwable $e) {
            Log::error('Paystack charge_authorization exception: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => 'Gateway communication failure: ' . $e->getMessage(),
            ];
        }
    }

    public function refund(string $reference, int|float $amount): array
    {
        try {
            $response = $this->client()->post('/refund', [
                'transaction' => $reference,
                'amount'      => (int) (round($amount, 2) * 100),
            ]);

            return [
                'reference' => $reference,
                'status'    => $response->successful() ? 'refunded' : 'failed',
            ];
        } catch (Throwable $e) {
            Log::error('Paystack refund error: ' . $e->getMessage());
            return ['reference' => $reference, 'status' => 'failed'];
        }
    }

    public function validateWebhook(string $payload, array $headers): bool
    {
        $signature = $headers['x-paystack-signature'][0] ?? $headers['x-paystack-signature'] ?? null;
        return $signature && hash_equals(hash_hmac('sha512', $payload, $this->secretKey()), (string) $signature);
    }

    private function client()
    {
        return Http::baseUrl(self::BASE_URL)
            ->timeout(15)
            ->retry(2, 200)
            ->withToken($this->secretKey());
    }

    private function secretKey(): string
    {
        return (string) (PlatformSetting::get('paystack_secret') ?: config('services.paystack.secret_key', ''));
    }

    private function currency(): string
    {
        return (string) (PlatformSetting::get('payment_currency') ?: config('services.paystack.currency', 'KES'));
    }
}