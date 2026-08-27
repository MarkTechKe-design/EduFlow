<?php

namespace Tests\Feature;

use App\Models\Package;
use App\Models\School;
use App\Models\SchoolSubscription;
use Illuminate\Auth\Events\Registered;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Tests\TestCase;

class SaaSAcquisitionTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_acquisition_pages_are_available(): void
    {
        $this->get('/')->assertOk();
        $this->get('/register')->assertOk();
        $this->get('/forgot-password')->assertOk();
    }

    public function test_registration_provisions_an_isolated_school_trial_and_admin(): void
    {
        Event::fake([Registered::class]);
        $package = Package::create([
            'name' => 'Starter',
            'slug' => 'starter',
            'price_monthly' => 2500,
            'price_yearly' => 25000,
            'max_students' => 100,
            'max_staff' => 20,
            'storage_gb' => 5,
            'trial_days' => 14,
            'is_active' => true,
            'is_public' => true,
        ]);

        $response = $this->post('/register', [
            'package_id'            => $package->id,
            'billing_cycle'         => 'monthly',
            'school_name'           => 'Nairobi Hills Academy',
            'admin_name'            => 'Amina Wanjiku',
            'email'                 => 'amina@nairobi-hills.test',
            'password'              => 'SecurePass123',
            'password_confirmation' => 'SecurePass123',
            'county'                => 'Nairobi',
            'sub_county'            => 'Westlands',
            'terms'                 => true,
        ]);

        $response->assertRedirect(route('onboarding'));
        $this->assertDatabaseHas('schools', [
            'name'     => 'Nairobi Hills Academy',
            'country'  => 'KE',
            'currency' => 'KES',
            'timezone' => 'Africa/Nairobi',
        ]);
        $school = School::where('name', 'Nairobi Hills Academy')->firstOrFail();
        $this->assertDatabaseHas('users', [
            'email'     => 'amina@nairobi-hills.test',
            'school_id' => $school->id,
        ]);
        $this->assertDatabaseHas('school_subscriptions', [
            'school_id'        => $school->id,
            'package_id'       => $package->id,
            'lifecycle_status' => 'trial',
            'is_trial'         => 1,
        ]);
        $this->assertSame($school->id, SchoolSubscription::where('school_id', $school->id)->value('school_id'));
    }
}