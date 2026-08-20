<?php

namespace App\Console\Commands;

use App\Models\PlatformSetting;
use App\Models\SchoolSubscription;
use App\Models\SubscriptionPayment;
use App\Services\Payments\PaystackPaymentGateway;
use App\Services\SubscriptionLifecycleService;
use App\Services\PlatformNotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ChargeExpiringSubscriptionTrials extends Command
{
    protected $signature = 'subscriptions:charge-trials';
    protected $description = 'Process recurring charges for expired school trials';

    public function handle(PaystackPaymentGateway $gateway, SubscriptionLifecycleService $lifecycle): int
    {
        SchoolSubscription::query()
            ->where('is_trial', true)
            ->whereIn('lifecycle_status', ['trial', 'pending'])
            ->whereDate('trial_ends_at', '<=', now()->toDateString())
            ->chunkById(50, function ($subscriptions) use ($gateway, $lifecycle) {
                foreach ($subscriptions as $sub) {
                    $this->charge($sub->id, $gateway, $lifecycle);
                }
            });

        return self::SUCCESS;
    }

    private function charge(int $id, PaystackPaymentGateway $gateway, SubscriptionLifecycleService $lifecycle): void
    {
        DB::transaction(function () use ($id, $gateway, $lifecycle) {
            $subscription = SchoolSubscription::query()
                ->with(['school', 'package', 'coupon'])
                ->lockForUpdate()
                ->find($id);

            if (!$subscription || !$subscription->is_trial || !in_array($subscription->lifecycle_status, ['trial', 'pending'], true)) {
                return;
            }

            $package = $subscription->package;
            $school = $subscription->school;
            $isYearly = ($subscription->billing_cycle ?? 'monthly') === 'yearly';
            $baseAmount = (float) ($isYearly ? $package?->price_yearly : $package?->price_monthly);

            // Apply coupon attached during registration
            if ($subscription->coupon) {
                $discount = $subscription->coupon->calculateDiscount($baseAmount);
                $amount = max(0, $baseAmount - $discount);
            } else {
                $amount = $baseAmount;
            }

            $cycleInterval = $isYearly ? now()->addYear() : now()->addMonth();

            if ($amount <= 0) {
                $lifecycle->transition($subscription, 'active', null, ['reason' => 'zero_cost_plan']);
                $subscription->update([
                    'coupon_id'  => null,
                    'is_trial'   => false,
                    'start_date' => now()->toDateString(),
                    'end_date'   => $cycleInterval->toDateString(),
                    'renewal_at' => $cycleInterval,
                ]);
                return;
            }

            if (blank($subscription->paystack_authorization_code)) {
                $lifecycle->transition($subscription, 'grace_period', null, ['reason' => 'missing_payment_token']);
                $subscription->update(['grace_period_ends_at' => now()->addDays(3)]);
                return;
            }

            $reference = 'REN-' . Str::upper(Str::random(10)) . '-' . time();
            $result = $gateway->chargeAuthorization(
                $subscription->paystack_authorization_code,
                $school->email,
                $amount,
                $reference,
                ['subscription_id' => $subscription->id]
            );

            if (!empty($result['success'])) {
                $lifecycle->transition($subscription, 'active', null, [
                    'reference' => $reference,
                    'amount'    => $amount,
                    'coupon_applied' => $subscription->coupon?->code,
                ]);

                // Detach coupon after first successful charge so future cycles bill at standard rates
                $subscription->update([
                    'coupon_id'            => null,
                    'is_trial'             => false,
                    'amount_paid'          => $amount,
                    'payment_method'       => 'card',
                    'start_date'           => now()->toDateString(),
                    'end_date'             => $cycleInterval->toDateString(),
                    'renewal_at'           => $cycleInterval,
                    'grace_period_ends_at' => null,
                ]);

                                SubscriptionPayment::create([
                    'school_subscription_id' => $subscription->id,
                    'provider'               => 'paystack',
                    'reference'              => $reference,
                    'idempotency_key'        => (string) Str::uuid(),
                    'status'                 => 'completed',
                    'amount'                 => $amount,
                    'currency'               => PlatformSetting::get('payment_currency') ?: 'KES',
                    'payload'                => $result['raw'] ?? $result,
                    'paid_at'                => now(),
                ]);

                app(PlatformNotificationService::class)->send('invoice', $school->email, [
                    'school_name' => $school->name,
                    'amount'      => (PlatformSetting::get('payment_currency') ?: 'KES') . ' ' . number_format($amount, 2),
                    'plan_name'   => $package?->name ?? 'Subscription',
                    'invoice_url' => url('/school/billing'),
                ]);
            } else {
                $lifecycle->transition($subscription, 'grace_period', null, ['error' => $result['message'] ?? 'declined']);
                $subscription->update(['grace_period_ends_at' => now()->addDays(3)]);
            }
        });
    }
}