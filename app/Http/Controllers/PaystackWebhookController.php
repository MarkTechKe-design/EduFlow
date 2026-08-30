<?php

namespace App\Http\Controllers;

use App\Models\PlatformSetting;
use App\Models\SchoolSubscription;
use App\Models\SubscriptionPayment;
use App\Services\Payments\PaystackPaymentGateway;
use App\Services\SubscriptionLifecycleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaystackWebhookController extends Controller
{
    public function handleWebhook(Request $request, PaystackPaymentGateway $gateway, SubscriptionLifecycleService $lifecycle): JsonResponse
    {
        $payload = $request->getContent();

        if (! $gateway->validateWebhook($payload, $request->headers->all())) {
            Log::warning('Paystack webhook signature verification failed.', ['ip' => $request->ip()]);
            return response()->json(['message' => 'Invalid signature'], 400);
        }

        $event = (string) $request->input('event');
        $data = $request->input('data');
        if ($event !== 'charge.success' || ! is_array($data)) {
            return response()->json(['status' => 'ignored']);
        }

        $metadata = is_array($data['metadata'] ?? null) ? $data['metadata'] : [];
        $schoolId = (int) ($metadata['school_id'] ?? 0);
        $subscriptionId = (int) ($metadata['subscription_id'] ?? 0);
        $reference = (string) ($data['reference'] ?? '');
        $currency = strtoupper((string) ($data['currency'] ?? ''));
        $amount = ((int) ($data['amount'] ?? 0)) / 100;

        if ($schoolId < 1 || $subscriptionId < 1 || $reference === '' || $amount <= 0) {
            return response()->json(['message' => 'Invalid payment payload'], 422);
        }

        $expectedCurrency = strtoupper((string) (PlatformSetting::get('payment_currency') ?: config('services.paystack.currency', 'KES')));
        $subscription = SchoolSubscription::withoutGlobalScopes()
            ->whereKey($subscriptionId)
            ->where('school_id', $schoolId)
            ->with('package')
            ->first();

        if (! $subscription || $currency !== $expectedCurrency) {
            return response()->json(['message' => 'Payment does not match a valid subscription'], 422);
        }

        $expectedAmount = (float) (($subscription->billing_cycle ?? 'monthly') === 'yearly'
            ? $subscription->package?->price_yearly
            : $subscription->package?->price_monthly);
        if ($expectedAmount <= 0) {
            return response()->json(['message' => 'Subscription package has no valid price'], 422);
        }

        if (abs($amount - $expectedAmount) > 0.01) {
            return response()->json(['message' => 'Payment amount mismatch'], 422);
        }

        $processed = DB::transaction(function () use ($schoolId, $subscriptionId, $reference, $currency, $amount, $data, $event, $metadata, $lifecycle): bool {
            $lockedSubscription = SchoolSubscription::withoutGlobalScopes()
                ->whereKey($subscriptionId)
                ->where('school_id', $schoolId)
                ->lockForUpdate()
                ->firstOrFail();

            $existing = SubscriptionPayment::withoutGlobalScopes()
                ->where('provider', 'paystack')
                ->where('reference', $reference)
                ->lockForUpdate()
                ->first();

            if ($existing) {
                return false;
            }

            SubscriptionPayment::withoutGlobalScopes()->create([
                'school_id' => $schoolId,
                'school_subscription_id' => $lockedSubscription->id,
                'provider' => 'paystack',
                'reference' => $reference,
                'idempotency_key' => $reference,
                'status' => 'successful',
                'amount' => $amount,
                'currency' => $currency,
                'payload' => [
                    'event' => $event,
                    'reference' => $reference,
                    'amount' => $amount,
                    'currency' => $currency,
                ],
                'paid_at' => now(),
            ]);

            $authorization = is_array($data['authorization'] ?? null) ? $data['authorization'] : [];
            if (! empty($authorization['authorization_code'])) {
                $lockedSubscription->update([
                    'paystack_customer_code' => $data['customer']['customer_code'] ?? $lockedSubscription->paystack_customer_code,
                    'paystack_authorization_code' => $authorization['authorization_code'],
                    'card_last4' => $authorization['last4'] ?? null,
                    'card_brand' => $authorization['brand'] ?? null,
                    'card_exp_month' => $authorization['exp_month'] ?? null,
                    'card_exp_year' => $authorization['exp_year'] ?? null,
                ]);
            }

            if ($lockedSubscription->is_trial && empty($metadata['is_tokenization'])) {
                $lifecycle->transition($lockedSubscription, 'active', null, [
                    'source' => 'webhook_charge_success',
                    'reference' => $reference,
                ]);
            }

            return true;
        });

        return response()->json(['status' => $processed ? 'processed' : 'duplicate']);
    }
}