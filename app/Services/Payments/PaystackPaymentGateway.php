<?php

namespace App\Services\Payments;

use App\Models\PlatformSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PaystackPaymentGateway
{
    protected string $secretKey;
    protected string $baseUrl = 'https://api.paystack.co';

    public function __construct()
    {
        $this->secretKey = (string) (PlatformSetting::get('paystack_secret') ?: config('services.paystack.secret_key', ''));
    }

    /**
     * Verify a Paystack transaction reference.
     * Fails closed by returning an error-structured array on any failure.
     *
     * @param string $reference
     * @return array
     */
    public function verify(string $reference): array
    {
        if (empty(trim($reference))) {
            return [
                'success' => false,
                'message' => 'Empty payment reference provided.',
            ];
        }

        if (empty($this->secretKey)) {
            Log::error('Paystack secret key is missing in platform configuration.');
            return [
                'success' => false,
                'message' => 'Payment gateway misconfiguration.',
            ];
        }

        try {
            $response = Http::withToken($this->secretKey)
                ->timeout(15)
                ->get("{$this->baseUrl}/transaction/verify/" . urlencode($reference));

            if (!$response->successful()) {
                Log::warning('Paystack verification request failed', [
                    'reference' => $reference,
                    'status'    => $response->status(),
                ]);
                return [
                    'success' => false,
                    'message' => 'Unable to verify payment with provider.',
                ];
            }

            $body = $response->json();
            $data = $body['data'] ?? [];

            if (!($body['status'] ?? false) || ($data['status'] ?? '') !== 'success') {
                return [
                    'success' => false,
                    'status'  => $data['status'] ?? 'failed',
                    'message' => $data['gateway_response'] ?? 'Payment was not successful.',
                ];
            }

            $authorization = $data['authorization'] ?? [];
            $customer = $data['customer'] ?? [];

            return [
                'success'             => true,
                'status'              => 'success',
                'reference'           => (string) ($data['reference'] ?? $reference),
                'amount'              => ((float) ($data['amount'] ?? 0)) / 100, // Convert from minor currency units (cents/kobo)
                'currency'            => strtoupper((string) ($data['currency'] ?? 'KES')),
                'customer_email'      => strtolower(trim((string) ($customer['email'] ?? ''))),
                'customer_code'       => (string) ($customer['customer_code'] ?? ''),
                'authorization_code'  => (string) ($authorization['authorization_code'] ?? ''),
                'card_last4'          => (string) ($authorization['last4'] ?? ''),
                'card_brand'          => (string) ($authorization['brand'] ?? ''),
                'card_exp_month'      => (string) ($authorization['exp_month'] ?? ''),
                'card_exp_year'       => (string) ($authorization['exp_year'] ?? ''),
                'raw'                 => $data,
            ];
        } catch (\Throwable $e) {
            Log::error('Paystack verification exception: ' . $e->getMessage(), [
                'reference' => $reference,
            ]);
            return [
                'success' => false,
                'message' => 'Payment verification encountered an unexpected error.',
            ];
        }
    }
}