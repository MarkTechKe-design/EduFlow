<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\Coupon;
use App\Models\Package;
use App\Models\PlatformSetting;
use App\Models\School;
use App\Models\SchoolModule;
use App\Models\SchoolSetting;
use App\Models\SchoolSubscription;
use App\Models\SubscriptionAuditLog;
use App\Models\User;
use App\Services\Payments\PaystackPaymentGateway;
use App\Services\PlatformNotificationService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class RegistrationController extends Controller
{
    public function create(): Response
    {
        $packages = Package::where('is_active', true)
            ->where('is_public', true)
            ->with('modules')
            ->orderBy('sort_order')
            ->get();

        $branding = PlatformSetting::get('branding') ?? [];
        $backgroundImages = PlatformSetting::get('auth_background_images') ?? [];

        return Inertia::render('Auth/Register', [
            'packages' => $packages,
            'branding' => [
                'name'          => $branding['name'] ?? config('app.name', 'EduFlow'),
                'support_phone' => $branding['support_phone'] ?? '+254 718 178521',
                'support_email' => $branding['support_email'] ?? 'support@eduflow.co.ke',
            ],
            'backgroundImages'  => $backgroundImages,
            'paystackPublicKey' => PlatformSetting::get('paystack_key') ?: (string) config('services.paystack.public_key', ''),
            'currency'          => PlatformSetting::get('payment_currency') ?: 'KES',
        ]);
    }

    public function validateCoupon(Request $request): JsonResponse
    {
        $request->validate([
            'code'          => ['required', 'string', 'max:50'],
            'package_id'    => ['required', 'integer', 'exists:packages,id'],
            'billing_cycle' => ['required', 'in:monthly,yearly'],
        ]);

        $coupon = Coupon::where('code', strtoupper(trim($request->code)))->first();
        if (!$coupon || !$coupon->isValid()) {
            return response()->json(['valid' => false, 'message' => 'Coupon code is invalid or expired.'], 422);
        }

        $package = Package::findOrFail($request->package_id);
        $basePrice = (float) ($request->billing_cycle === 'yearly' ? $package->price_yearly : $package->price_monthly);
        $discount = $coupon->calculateDiscount($basePrice);

        return response()->json([
            'valid'           => true,
            'coupon_id'       => $coupon->id,
            'code'            => $coupon->code,
            'discount_amount' => $discount,
            'final_price'     => max(0, $basePrice - $discount),
        ]);
    }

    public function store(Request $request, PaystackPaymentGateway $gateway): RedirectResponse
    {
        $data = $request->validate([
            'package_id'            => ['required', 'integer', 'exists:packages,id'],
            'billing_cycle'         => ['required', 'in:monthly,yearly'],
            'coupon_code'           => ['nullable', 'string', 'max:50'],
            'paystack_reference'    => ['nullable', 'string', 'max:100'],
            'school_name'           => ['required', 'string', 'max:150'],
            'first_name'            => ['nullable', 'string', 'max:60'],
            'last_name'             => ['nullable', 'string', 'max:60'],
            'admin_name'            => ['nullable', 'string', 'max:120'],
            'email'                 => ['required', 'email', 'max:150', 'unique:users,email'],
            'phone'                 => ['nullable', 'string', 'max:30'],
            'password'              => ['required', 'confirmed', Password::min(8)],
            'terms'                 => ['accepted'],
            'county'                => ['required', 'string', 'max:60'],
            'sub_county'            => ['required', 'string', 'max:60'],
            'knec_code'             => ['nullable', 'string', 'max:30'],
            'registration_number'   => ['nullable', 'string', 'max:60'],
            'nemis_code'             => ['nullable', 'string', 'max:60'],
            'school_email'          => ['nullable', 'email', 'max:150'],
            'school_phone'          => ['nullable', 'string', 'max:30'],
            'school_motto'          => ['nullable', 'string', 'max:180'],
            'education_level'       => ['nullable', 'string', 'max:60'],
            'curriculum'            => ['nullable', 'string', 'max:60'],
        ]);

        // 1. Authoritative server-side package lookup
        $package = Package::where('is_active', true)
            ->where('is_public', true)
            ->findOrFail($data['package_id']);

        $basePrice = (float) ($data['billing_cycle'] === 'yearly' ? $package->price_yearly : $package->price_monthly);

        // 2. Authoritative server-side coupon calculation
        $coupon = null;
        $discount = 0.0;
        if (filled($data['coupon_code'] ?? null)) {
            $coupon = Coupon::where('code', strtoupper(trim($data['coupon_code'])))->first();
            if (!$coupon || !$coupon->isValid()) {
                throw ValidationException::withMessages([
                    'coupon_code' => ['The provided coupon code is invalid or has expired.'],
                ]);
            }
            $discount = (float) $coupon->calculateDiscount($basePrice);
        }

        $expectedAmount = max(0.0, round($basePrice - $discount, 2));
        $trialDays = (int) ($package->trial_days ?? 0);
        $hasTrial = $trialDays > 0;
        $systemCurrency = strtoupper((string) (PlatformSetting::get('payment_currency') ?: 'KES'));

        // 3. Mandatory Payment Verification for non-trial paid subscriptions
        $verifiedPayment = [];
        if (!$hasTrial && $expectedAmount > 0.0) {
            $ref = trim((string) ($data['paystack_reference'] ?? ''));
            if (empty($ref)) {
                throw ValidationException::withMessages([
                    'paystack_reference' => ['Payment reference is required for this subscription package.'],
                ]);
            }

            // Replay protection: verify reference hasn't already been used in an existing subscription
            $alreadyUsed = SchoolSubscription::withoutGlobalScopes()->where('paystack_reference', $ref)
                ->orWhere('paystack_authorization_code', $ref)
                ->exists();

            if ($alreadyUsed) {
                throw ValidationException::withMessages([
                    'paystack_reference' => ['This payment reference has already been used.'],
                ]);
            }

            $verifiedPayment = $gateway->verify($ref);

            if (!($verifiedPayment['success'] ?? false) || ($verifiedPayment['status'] ?? '') !== 'success') {
                throw ValidationException::withMessages([
                    'paystack_reference' => [$verifiedPayment['message'] ?? 'Payment verification failed with provider.'],
                ]);
            }

            // Bind exact amount (allow a ±0.5 tolerance for floating-point/cents conversions)
            if (abs(((float) $verifiedPayment['amount']) - $expectedAmount) > 0.5) {
                throw ValidationException::withMessages([
                    'paystack_reference' => ["Paid amount ({$verifiedPayment['amount']}) does not match package requirement ({$expectedAmount})."],
                ]);
            }

            // Bind currency
            if (strtoupper((string) $verifiedPayment['currency']) !== $systemCurrency) {
                throw ValidationException::withMessages([
                    'paystack_reference' => ["Payment currency ({$verifiedPayment['currency']}) does not match platform requirement ({$systemCurrency})."],
                ]);
            }

            // Bind customer email
            $submittingEmail = strtolower(trim((string) $data['email']));
            if (strtolower(trim((string) $verifiedPayment['customer_email'])) !== $submittingEmail) {
                throw ValidationException::withMessages([
                    'paystack_reference' => ['Payment transaction email does not match the registering administrator account.'],
                ]);
            }
        } elseif ($hasTrial && filled($data['paystack_reference'] ?? null)) {
            // Optional card authorization capture during free trial
            $verifiedPayment = $gateway->verify($data['paystack_reference']);
        }

        // 4. Atomic Tenant & Subscription Provisioning
        $user = DB::transaction(function () use ($data, $package, $coupon, $hasTrial, $trialDays, $expectedAmount, $verifiedPayment): User {
            $slug = Str::slug($data['school_name']);
            if (School::withTrashed()->where('slug', $slug)->exists()) {
                $slug .= '-' . Str::lower(Str::random(5));
            }

            $rawCurriculum = strtolower($data['curriculum'] ?? 'cbc');
            $curriculum = match (true) {
                str_contains($rawCurriculum, 'dual') => 'dual',
                str_contains($rawCurriculum, '8-4-4') || str_contains($rawCurriculum, '844') => '844',
                str_contains($rawCurriculum, 'international') || str_contains($rawCurriculum, 'igcse') => 'international',
                default => 'cbc',
            };

            // Soft Identifier Collision Detection (Audit Flagging)
            $collisionAlerts = [];
            $knec = filled($data['knec_code'] ?? null) ? trim((string)$data['knec_code']) : null;
            $regNo = filled($data['registration_number'] ?? null) ? trim((string)$data['registration_number']) : null;
            $nemis = filled($data['nemis_code'] ?? null) ? trim((string)$data['nemis_code']) : null;

            if ($knec) {
                $collidingSchool = School::where('knec_code', $knec)->first(['id', 'name']);
                if ($collidingSchool) {
                    $collisionAlerts[] = "[SYSTEM COLLISION ALERT: Claimed KNEC Centre Code matches School #{$collidingSchool->id} ({$collidingSchool->name})]";
                }
            }
            if ($regNo) {
                $collidingSchool = School::where('registration_number', $regNo)->first(['id', 'name']);
                if ($collidingSchool) {
                    $collisionAlerts[] = "[SYSTEM COLLISION ALERT: Claimed MOE Registration Number matches School #{$collidingSchool->id} ({$collidingSchool->name})]";
                }
            }
            if ($nemis) {
                $collidingSchool = School::where('nemis_code', $nemis)->first(['id', 'name']);
                if ($collidingSchool) {
                    $collisionAlerts[] = "[SYSTEM COLLISION ALERT: Claimed NEMIS/UIC Code matches School #{$collidingSchool->id} ({$collidingSchool->name})]";
                }
            }

            $verificationNotes = !empty($collisionAlerts) ? implode("\n", $collisionAlerts) : null;

            $school = School::create([
                'name'                    => $data['school_name'],
                'slug'                    => $slug,
                'email'                   => $data['school_email'] ?? $data['email'],
                'phone'                   => $data['school_phone'] ?? ($data['phone'] ?? '+254700000000'),
                'country'                 => 'KE',
                'county'                  => $data['county'],
                'sub_county'              => $data['sub_county'],
                'knec_code'               => $data['knec_code'] ?? null,
                'registration_number'     => $data['registration_number'] ?? null,
                'nemis_code'              => $data['nemis_code'] ?? null,
                'verification_status'     => 'pending',
                'verification_notes'      => $verificationNotes,
                'timezone'                => 'Africa/Nairobi',
                'currency'                => 'KES',
                'language'                => 'en',
                'curriculum'              => $curriculum,
                'terms_accepted_at'       => now(),
                'status'                  => 'active',
                'onboarding_completed_at' => null, // Preserve canonical onboarding state
            ]);

            if (filled($data['school_motto'] ?? null)) {
                SchoolSetting::set($school->id, 'tagline', $data['school_motto'], 'institution');
            }
            if (filled($data['education_level'] ?? null)) {
                SchoolSetting::set($school->id, 'education_level', $data['education_level'], 'institution');
            }

            AcademicYear::create([
                'school_id'  => $school->id,
                'name'       => (string) now()->year,
                'start_date' => now()->startOfYear(),
                'end_date'   => now()->endOfYear(),
                'is_current' => true,
            ]);

            $cycle = $data['billing_cycle'];
            $endDate = $hasTrial ? now()->addDays($trialDays) : ($cycle === 'yearly' ? now()->addYear() : now()->addMonth());

            if ($coupon && $coupon->isValid()) {
                $coupon->increment('used_count');
            }

            $subscription = SchoolSubscription::create([
                'school_id'                   => $school->id,
                'package_id'                  => $package->id,
                'coupon_id'                   => $coupon?->id,
                'billing_cycle'               => $cycle,
                'start_date'                  => now()->toDateString(),
                'end_date'                    => $endDate->toDateString(),
                'status'                      => $hasTrial ? 'trial' : 'active',
                'lifecycle_status'            => $hasTrial ? 'trial' : 'active',
                'is_trial'                    => $hasTrial,
                'trial_ends_at'               => $hasTrial ? now()->addDays($trialDays) : null,
                'renewal_at'                  => $endDate,
                'public_id'                   => (string) Str::uuid(),
                'amount_paid'                 => $hasTrial ? 0.0 : $expectedAmount,
                'paystack_reference'          => $verifiedPayment['reference'] ?? null,
                'payment_method'              => filled($verifiedPayment['authorization_code'] ?? null) ? 'card' : ($hasTrial ? 'trial' : 'direct'),
                'paystack_customer_code'      => $verifiedPayment['customer_code'] ?? null,
                'paystack_authorization_code' => $verifiedPayment['authorization_code'] ?? null,
                'card_last4'                  => $verifiedPayment['card_last4'] ?? null,
                'card_brand'                  => $verifiedPayment['card_brand'] ?? null,
                'card_exp_month'              => $verifiedPayment['card_exp_month'] ?? null,
                'card_exp_year'               => $verifiedPayment['card_exp_year'] ?? null,
            ]);

            SubscriptionAuditLog::create([
                'school_subscription_id' => $subscription->id,
                'school_id'              => $school->id,
                'actor_id'               => null,
                'from_status'            => 'pending',
                'to_status'              => $subscription->lifecycle_status,
                'metadata'               => ['channel' => 'registration_wizard', 'cycle' => $cycle, 'amount' => $subscription->amount_paid],
            ]);

            foreach ($package->modules as $module) {
                SchoolModule::create([
                    'school_id'   => $school->id,
                    'module_slug' => $module->module_slug,
                    'is_enabled'  => true,
                ]);
            }

            $adminFullName = trim($data['admin_name'] ?? "{$data['first_name']} {$data['last_name']}");
            if (empty($adminFullName)) {
                $adminFullName = 'School Administrator';
            }

            $user = User::create([
                'school_id'         => $school->id,
                'name'              => $adminFullName,
                'email'             => $data['email'],
                'phone'             => $data['phone'] ?? null,
                'password'          => Hash::make($data['password']),
                'email_verified_at' => null,
                'status'            => 'active',
            ]);

            $role = Role::firstOrCreate(['name' => 'school-admin', 'guard_name' => 'web']);
            $user->assignRole($role);

            app(PlatformNotificationService::class)->send('welcome_school', $user->email, [
                'school_name'  => $school->name,
                'admin_email'  => $user->email,
                'login_url'    => route('login'),
            ]);

            return $user;
        });

        event(new Registered($user));
        auth()->login($user);

        return redirect()->route('onboarding');
    }
}