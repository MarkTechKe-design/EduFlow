<?php

namespace App\Http\Controllers;

use App\Models\Package;
use App\Models\PlatformSetting;
use App\Models\School;
use App\Models\SchoolSubscription;
use App\Models\SubscriptionPayment;
use App\Mail\SubscriptionReceiptMail;
use App\Services\Payments\PaystackPaymentGateway;
use App\Services\SubscriptionLifecycleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class BillingController extends Controller
{
    public function __construct(
        private readonly SubscriptionLifecycleService $lifecycle,
        private readonly PaystackPaymentGateway $gateway
    ) {}

    public function index(Request $request): Response|RedirectResponse
    {
        $school = School::find($request->user()->school_id);
        if (!$school) {
            return redirect()->route('dashboard');
        }

        $subscription = SchoolSubscription::query()
            ->where('school_id', $school->id)
            ->with(['package', 'payments' => fn ($query) => $query->latest()])
            ->latest()
            ->first();

        $packages = Package::where('is_active', true)
            ->where('is_public', true)
            ->orderBy('price_monthly')
            ->get();

        $paystackPublicKey = PlatformSetting::get('paystack_key') ?: (string) config('services.paystack.public_key', '');

        return Inertia::render('Billing/Index', [
            'school'            => $school,
            'subscription'      => $subscription,
            'packages'          => $packages,
            'paystackPublicKey' => $paystackPublicKey,
        ]);
    }

    public function changePackage(Request $request): RedirectResponse
    {
        $school = School::findOrFail($request->user()->school_id);
        $data = $request->validate([
            'package_id' => 'required|exists:packages,id',
        ]);

        $subscription = SchoolSubscription::where('school_id', $school->id)->latest()->firstOrFail();
        $package = Package::where('is_active', true)->where('is_public', true)->findOrFail($data['package_id']);

        $subscription->forceFill(['package_id' => $package->id])->save();

        return back()->with('success', "Your plan has been updated to {$package->name}.");
    }

    public function updateBillingDetails(Request $request): RedirectResponse
    {
        $school = School::findOrFail($request->user()->school_id);
        $data = $request->validate([
            'name'            => 'required|string|max:255',
            'billing_email'   => 'required|email|max:255',
            'kra_pin'         => 'nullable|string|max:50',
            'billing_address' => 'nullable|string|max:500',
        ]);

        $school->update($data);

        return back()->with('success', 'Billing and tax information saved successfully.');
    }

    public function updateCard(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'reference' => 'required|string|max:100',
        ]);

        $user = $request->user();
        $subscription = $this->subscriptionFor($request);

        $verify = $this->gateway->verifyTransaction($data['reference']);

        if (!$verify['status'] || empty($verify['authorization']['authorization_code'])) {
            return back()->withErrors(['card' => 'Could not verify payment method with payment provider.']);
        }

        $customerEmail = strtolower($verify['customer']['email'] ?? '');
        $userEmail = strtolower($user->email);
        $schoolEmail = strtolower($user->school?->email ?? '');

        if ($customerEmail !== $userEmail && $customerEmail !== $schoolEmail) {
            abort(403, 'Unauthorized payment verification attempt.');
        }

        $auth = $verify['authorization'];

        $subscription->update([
            'paystack_customer_code'      => $verify['customer']['customer_code'] ?? $subscription->paystack_customer_code,
            'paystack_authorization_code' => $auth['authorization_code'],
            'card_last4'                  => $auth['last4'] ?? null,
            'card_brand'                  => $auth['brand'] ?? null,
            'card_exp_month'              => $auth['exp_month'] ?? null,
            'card_exp_year'               => $auth['exp_year'] ?? null,
            'payment_method'              => 'card',
        ]);

        return back()->with('success', 'Payment method authorized and updated successfully.');
    }

    public function downloadInvoice(Request $request, $id)
    {
        $school = School::findOrFail($request->user()->school_id);
        $subscription = SchoolSubscription::where('school_id', $school->id)->latest()->firstOrFail();
        $payment = SubscriptionPayment::where('school_subscription_id', $subscription->id)->findOrFail($id);

        return view('invoices.subscription-pdf', [
            'school'       => $school,
            'subscription' => $subscription,
            'package'      => $subscription->package,
            'payment'      => $payment,
        ]);
    }

    public function resendInvoice(Request $request, $id): RedirectResponse
    {
        $school = School::findOrFail($request->user()->school_id);
        $subscription = SchoolSubscription::where('school_id', $school->id)->latest()->firstOrFail();
        $payment = SubscriptionPayment::where('school_subscription_id', $subscription->id)->findOrFail($id);

        $targetEmail = $school->billing_email ?: ($school->email ?: $request->user()->email);

        try {
            Mail::to($targetEmail)->send(
                new SubscriptionReceiptMail(
                    school: $school,
                    subscription: $subscription,
                    package: $subscription->package,
                    amount: $payment->amount,
                    reference: $payment->reference,
                    paymentMethod: $subscription->payment_method ?? 'Paystack Card / Electronic'
                )
            );
            return back()->with('success', "Tax invoice receipt sent to {$targetEmail}.");
        } catch (\Throwable $e) {
            return back()->with('error', "Failed to dispatch email: " . $e->getMessage());
        }
    }

    public function cancel(Request $request): RedirectResponse
    {
        $subscription = $this->subscriptionFor($request);
        $this->lifecycle->transition($subscription, 'cancelled', $request->user(), ['source' => 'customer_portal']);

        return back()->with('success', 'Your subscription has been cancelled. Access remains available until the end of the current period.');
    }

    public function reactivate(Request $request): RedirectResponse
    {
        $subscription = $this->subscriptionFor($request);
        $this->lifecycle->transition($subscription, 'active', $request->user(), ['source' => 'customer_portal']);

        return back()->with('success', 'Your subscription is active again.');
    }

    private function subscriptionFor(Request $request): SchoolSubscription
    {
        return SchoolSubscription::where('school_id', $request->user()->school_id)->latest()->firstOrFail();
    }
}