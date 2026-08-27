<?php

namespace Tests\Feature\Security;

use App\Models\Package;
use App\Services\Payments\PaystackPaymentGateway;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Mockery;
use Tests\TestCase;

class RegistrationPaymentSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function createTestPackage(array $overrides = []): Package
    {
        $uniqueSlug = 'pkg-' . Str::lower(Str::random(8));
        return Package::create(array_merge([
            'name'          => 'Standard Security Package',
            'slug'          => $uniqueSlug,
            'description'   => 'Package for security tests',
            'price_monthly' => 5000,
            'price_yearly'  => 50000,
            'trial_days'    => 0,
            'is_active'     => true,
            'is_public'     => true,
            'sort_order'    => 1,
        ], $overrides));
    }

    protected function getRegistrationPayload(array $overrides = []): array
    {
        $uniqueEmail = 'admin_' . Str::lower(Str::random(6)) . '@secacademy.co.ke';
        return array_merge([
            'school_name'           => 'Security Test Academy ' . Str::random(5),
            'first_name'            => 'John',
            'last_name'             => 'Doe',
            'email'                 => $uniqueEmail,
            'phone'                 => '+254711223344',
            'password'              => 'P@ssw0rd12345!',
            'password_confirmation' => 'P@ssw0rd12345!',
            'county'                => 'Nairobi',
            'sub_county'            => 'Westlands',
            'billing_cycle'         => 'monthly',
            'terms'                 => true,
        ], $overrides);
    }

    public function test_paid_package_with_zero_trial_without_paystack_reference_is_rejected(): void
    {
        $package = $this->createTestPackage([
            'price_monthly' => 5000,
            'trial_days'    => 0,
        ]);

        $payload = $this->getRegistrationPayload([
            'package_id' => $package->id,
        ]);

        $response = $this->post(route('register.store'), $payload);

        $response->assertSessionHasErrors('paystack_reference');
    }

    public function test_invalid_paystack_reference_is_rejected(): void
    {
        $package = $this->createTestPackage([
            'price_monthly' => 5000,
            'trial_days'    => 0,
        ]);

        $mockGateway = Mockery::mock(PaystackPaymentGateway::class);
        $mockGateway->shouldReceive('verify')
            ->once()
            ->with('INVALID_REF_123')
            ->andReturn([
                'success' => false,
                'message' => 'Transaction reference not found.',
            ]);
        $this->app->instance(PaystackPaymentGateway::class, $mockGateway);

        $payload = $this->getRegistrationPayload([
            'package_id'         => $package->id,
            'paystack_reference' => 'INVALID_REF_123',
        ]);

        $response = $this->post(route('register.store'), $payload);

        $response->assertSessionHasErrors('paystack_reference');
    }

    public function test_paystack_reference_with_wrong_amount_is_rejected(): void
    {
        $package = $this->createTestPackage([
            'price_monthly' => 5000,
            'trial_days'    => 0,
        ]);

        $mockGateway = Mockery::mock(PaystackPaymentGateway::class);
        $mockGateway->shouldReceive('verify')
            ->once()
            ->andReturn([
                'success'        => true,
                'status'         => 'success',
                'reference'      => 'VALID_REF_WRONG_AMOUNT',
                'amount'         => 100.0, // Expected 5000
                'currency'       => 'KES',
                'customer_email' => 'admin_test@secacademy.co.ke',
            ]);
        $this->app->instance(PaystackPaymentGateway::class, $mockGateway);

        $payload = $this->getRegistrationPayload([
            'package_id'         => $package->id,
            'email'              => 'admin_test@secacademy.co.ke',
            'paystack_reference' => 'VALID_REF_WRONG_AMOUNT',
        ]);

        $response = $this->post(route('register.store'), $payload);

        $response->assertSessionHasErrors('paystack_reference');
    }

    public function test_paystack_reference_with_wrong_currency_is_rejected(): void
    {
        $package = $this->createTestPackage([
            'price_monthly' => 5000,
            'trial_days'    => 0,
        ]);

        $mockGateway = Mockery::mock(PaystackPaymentGateway::class);
        $mockGateway->shouldReceive('verify')
            ->once()
            ->andReturn([
                'success'        => true,
                'status'         => 'success',
                'reference'      => 'REF_USD_CURRENCY',
                'amount'         => 5000.0,
                'currency'       => 'USD',
                'customer_email' => 'admin_test@secacademy.co.ke',
            ]);
        $this->app->instance(PaystackPaymentGateway::class, $mockGateway);

        $payload = $this->getRegistrationPayload([
            'package_id'         => $package->id,
            'email'              => 'admin_test@secacademy.co.ke',
            'paystack_reference' => 'REF_USD_CURRENCY',
        ]);

        $response = $this->post(route('register.store'), $payload);

        $response->assertSessionHasErrors('paystack_reference');
    }

    public function test_paystack_reference_with_wrong_customer_email_is_rejected(): void
    {
        $package = $this->createTestPackage([
            'price_monthly' => 5000,
            'trial_days'    => 0,
        ]);

        $mockGateway = Mockery::mock(PaystackPaymentGateway::class);
        $mockGateway->shouldReceive('verify')
            ->once()
            ->andReturn([
                'success'        => true,
                'status'         => 'success',
                'reference'      => 'REF_OTHER_EMAIL',
                'amount'         => 5000.0,
                'currency'       => 'KES',
                'customer_email' => 'attacker@other.com',
            ]);
        $this->app->instance(PaystackPaymentGateway::class, $mockGateway);

        $payload = $this->getRegistrationPayload([
            'package_id'         => $package->id,
            'email'              => 'legitadmin@secacademy.co.ke',
            'paystack_reference' => 'REF_OTHER_EMAIL',
        ]);

        $response = $this->post(route('register.store'), $payload);

        $response->assertSessionHasErrors('paystack_reference');
    }

    public function test_exact_verified_payment_succeeds_and_records_amount_paid(): void
    {
        $package = $this->createTestPackage([
            'price_monthly' => 5000,
            'trial_days'    => 0,
        ]);

        $targetEmail = 'admin_perfect@secacademy.co.ke';
        $schoolName = 'Security Test Academy Perfect';

        $mockGateway = Mockery::mock(PaystackPaymentGateway::class);
        $mockGateway->shouldReceive('verify')
            ->once()
            ->andReturn([
                'success'            => true,
                'status'             => 'success',
                'reference'          => 'PAY_PERFECT_123',
                'amount'             => 5000.0,
                'currency'           => 'KES',
                'customer_email'     => $targetEmail,
                'customer_code'      => 'CUST_123',
                'authorization_code' => 'AUTH_123',
            ]);
        $this->app->instance(PaystackPaymentGateway::class, $mockGateway);

        $payload = $this->getRegistrationPayload([
            'school_name'        => $schoolName,
            'email'              => $targetEmail,
            'package_id'         => $package->id,
            'paystack_reference' => 'PAY_PERFECT_123',
        ]);

        $response = $this->post(route('register.store'), $payload);

        $response->assertRedirect(route('onboarding'));
        $this->assertDatabaseHas('schools', ['name' => $schoolName]);
        $this->assertDatabaseHas('school_subscriptions', [
            'amount_paid' => 5000,
            'status'      => 'active',
        ]);
    }
}