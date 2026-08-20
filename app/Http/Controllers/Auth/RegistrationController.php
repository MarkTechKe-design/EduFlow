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
use App\Services\WebsiteContentService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class RegistrationController extends Controller
{
    public function create(): Response
    {
        $branding = app(WebsiteContentService::class)->branding();
        $bgSetting = PlatformSetting::get('register_backgrounds') ?: PlatformSetting::get('login_background');

        $backgroundImages = match (true) {
            is_array($bgSetting) => array_values(array_filter(array_map(fn($img) => filled($img) ? asset('storage/' . $img) : null, $bgSetting))),
            is_string($bgSetting) && filled($bgSetting) => [asset('storage/' . $bgSetting)],
            default => [],
        };

        return Inertia::render('Auth/Register', [
            'packages' => Package::query()
                ->where('is_active', true)
                ->where('is_public', true)
                ->orderBy('sort_order')
                ->orderBy('price_monthly')
                ->get(['id', 'name', 'badge', 'description', 'price_monthly', 'price_yearly', 'trial_days', 'features', 'limits', 'is_popular']),
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
            'first_name'            => ['required', 'string', 'max:60'],
            'last_name'             => ['required', 'string', 'max:60'],
            'email'                 => ['required', 'email', 'max:150', 'unique:users,email'],
            'phone'                 => ['nullable', 'string', 'max:30'],
            'password'              => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()],
            'terms'                 => ['accepted'],
            'county'                => ['required', 'string', 'max:60'],
            'sub_county'            => ['required', 'string', 'max:60'],
            'knec_code'             => ['nullable', 'string', 'max:30'],
            'registration_number'   => ['nullable', 'string', 'max:60'],
            'school_email'          => ['required', 'email', 'max:150'],
            'school_phone'          => ['required', 'string', 'max:30'],
            'school_motto'          => ['nullable', 'string', 'max:180'],
            'education_level'       => ['nullable', 'string', 'max:60'],
            'curriculum'            => ['nullable', 'string', 'max:30'],
        ]);

        $card = filled($data['paystack_reference'] ?? null)
            ? $gateway->verify($data['paystack_reference'])
            : [];

        $coupon = filled($data['coupon_code'] ?? null)
            ? Coupon::where('code', strtoupper(trim($data['coupon_code'])))->first()
            : null;

        $user = DB::transaction(function () use ($data, $card, $coupon): User {
            $package = Package::where('is_active', true)->where('is_public', true)->lockForUpdate()->findOrFail($data['package_id']);
            
            $slug = Str::slug($data['school_name']);
            if (School::withTrashed()->where('slug', $slug)->exists()) {
                $slug .= '-' . Str::lower(Str::random(5));
            }

            $school = School::create([
                'name'                => $data['school_name'],
                'slug'                => $slug,
                'email'               => $data['school_email'],
                'phone'               => $data['school_phone'],
                'country'             => 'KE',
                'county'              => $data['county'],
                'sub_county'          => $data['sub_county'],
                'knec_code'           => $data['knec_code'] ?? null,
                'registration_number' => $data['registration_number'] ?? null,
                'timezone'            => 'Africa/Nairobi',
                'currency'            => 'KES',
                'language'            => 'en',
                'curriculum'          => $data['curriculum'] ?? 'cbc',
                'terms_accepted_at'   => now(),
                'status'              => 'active',
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

            $trialDays = (int) ($package->trial_days ?? 14);
            $hasTrial = $trialDays > 0;
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
                'amount_paid'                 => 0,
                'payment_method'              => filled($card['authorization_code'] ?? null) ? 'card' : 'trial',
                'paystack_customer_code'      => $card['customer_code'] ?? null,
                'paystack_authorization_code' => $card['authorization_code'] ?? null,
                'card_last4'                  => $card['card_last4'] ?? null,
                'card_brand'                  => $card['card_brand'] ?? null,
                'card_exp_month'              => $card['card_exp_month'] ?? null,
                'card_exp_year'               => $card['card_exp_year'] ?? null,
            ]);

            SubscriptionAuditLog::create([
                'school_subscription_id' => $subscription->id,
                'school_id'              => $school->id,
                'actor_id'               => null,
                'from_status'            => 'pending',
                'to_status'              => $subscription->lifecycle_status,
                'metadata'               => ['channel' => 'registration_wizard', 'cycle' => $cycle],
            ]);

            foreach ($package->modules as $module) {
                SchoolModule::create([
                    'school_id'   => $school->id,
                    'module_slug' => $module->module_slug,
                    'is_enabled'  => true,
                ]);
            }

            $user = User::create([
                'school_id'         => $school->id,
                'name'              => trim("{$data['first_name']} {$data['last_name']}"),
                'email'             => $data['email'],
                'phone'             => $data['phone'] ?? null,
                'password'          => Hash::make($data['password']),
                'email_verified_at' => now(),
                'status'            => 'active',
            ]);

            $user->assignRole(Role::firstOrCreate(['name' => 'school_admin', 'guard_name' => 'web']));
                        app(PlatformNotificationService::class)->send('welcome_school', $user->email, [
                'school_name'  => $school->name,
                'admin_email'  => $user->email,
                'login_url'    => route('login'),
            ]);

            return $user;
        });

        event(new Registered($user));
        auth()->login($user);

        return redirect()->route('onboarding.index');
    }
}