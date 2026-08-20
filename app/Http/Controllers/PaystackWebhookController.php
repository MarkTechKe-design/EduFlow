<?php

namespace App\Http\Controllers;

use App\Models\PlatformSetting;
use App\Models\SchoolSubscription;
use App\Models\SubscriptionPayment;
use App\Services\Payments\PaystackPaymentGateway;
use App\Services\SubscriptionLifecycleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaystackWebhookController extends Controller
{
    public function handleWebhook(Request $request, PaystackPaymentGateway $gateway, SubscriptionLifecycleService $lifecycle): JsonResponse
    {
        $payload = $request->getContent();
        if (!$gateway->validateWebhook($payload, $request->headers->all())) {
            Log::warning('Paystack webhook signature verification failed.');
            return response()->json(['message' => 'Invalid signature'], 400);
        }

        $event = $request->input('event');
        $data = $request->input('data', []);

        Log::info("Paystack webhook received: {$event}", ['event' => $event]);

        if ($event === 'charge.success') {
            $metadata = $data['metadata'] ?? [];
            $subscriptionId = $metadata['subscription_id'] ?? null;
            $auth = $data['authorization'] ?? [];

            if ($subscriptionId) {
                $subscription = SchoolSubscription::find($subscriptionId);
                if ($subscription) {
                    if (!empty($auth['authorization_code'])) {
                        $subscription->update([
                            'paystack_customer_code'      => $data['customer']['customer_code'] ?? $subscription->paystack_customer_code,
                            'paystack_authorization_code' => $auth['authorization_code'],
                            'card_last4'                  => $auth['last4'] ?? null,
                            'card_brand'                  => $auth['brand'] ?? null,
                            'card_exp_month'              => $auth['exp_month'] ?? null,
                            'card_exp_year'               => $auth['exp_year'] ?? null,
                        ]);
                    }

                    if ($subscription->is_trial && empty($metadata['is_tokenization'])) {
                        $lifecycle->transition($subscription, 'active', null, [
                            'source'    => 'webhook_charge_success',
                            'reference' => $data['reference'],
                        ]);
                    }
                }
            }
        }

        return response()->json(['status' => 'success']);
    }
}