<?php

namespace App\Services\PaymentGateways;

use App\Contracts\FeePaymentGatewayInterface;
use Illuminate\Http\Request;

class DarajaMpesaAdapter implements FeePaymentGatewayInterface
{
    public function getIdentifier(): string
    {
        return 'mpesa';
    }

    public function parseWebhook(Request $request): ?array
    {
        $payload = $request->all();

        // Standard Safaricom Daraja C2B Confirmation Schema
        if (isset($payload['TransID']) && isset($payload['TransAmount'])) {
            $firstName = $payload['FirstName'] ?? '';
            $middleName = $payload['MiddleName'] ?? '';
            $lastName = $payload['LastName'] ?? '';
            $fullName = trim("{$firstName} {$middleName} {$lastName}");

            $transTime = $payload['TransTime'] ?? null;
            $paymentDate = $transTime 
                ? \Carbon\Carbon::createFromFormat('YmdHis', $transTime)->toDateTimeString()
                : now()->toDateTimeString();

            return [
                'reference_code' => trim($payload['TransID']),
                'amount'         => (float)$payload['TransAmount'],
                'payer_phone'    => $payload['MSISDN'] ?? null,
                'payer_name'     => !empty($fullName) ? $fullName : 'M-Pesa Customer',
                'account_ref'    => trim($payload['BillRefNumber'] ?? ''),
                'payment_date'   => $paymentDate,
                'raw_payload'    => $payload,
            ];
        }

        // Safaricom Daraja STK Push Callback Schema
        if (isset($payload['Body']['stkCallback'])) {
            $callback = $payload['Body']['stkCallback'];
            if (($callback['ResultCode'] ?? 1) !== 0) {
                return null;
            }

            $metaItems = $callback['CallbackMetadata']['Item'] ?? [];
            $meta = [];
            foreach ($metaItems as $item) {
                if (isset($item['Name'])) {
                    $meta[$item['Name']] = $item['Value'] ?? null;
                }
            }

            $transTime = $meta['TransactionDate'] ?? null;
            $paymentDate = $transTime 
                ? \Carbon\Carbon::createFromFormat('YmdHis', (string)$transTime)->toDateTimeString()
                : now()->toDateTimeString();

            return [
                'reference_code' => trim((string)($meta['MpesaReceiptNumber'] ?? $callback['CheckoutRequestID'])),
                'amount'         => (float)($meta['Amount'] ?? 0),
                'payer_phone'    => (string)($meta['PhoneNumber'] ?? null),
                'payer_name'     => 'M-Pesa STK Customer',
                'account_ref'    => trim((string)($callback['AccountReference'] ?? '')),
                'payment_date'   => $paymentDate,
                'raw_payload'    => $payload,
            ];
        }

        return null;
    }
}