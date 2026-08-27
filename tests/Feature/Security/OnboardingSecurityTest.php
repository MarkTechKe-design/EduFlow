<?php

namespace Tests\Feature\Security;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class OnboardingSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function createSchoolAdmin(bool $onboardingComplete = false): array
    {
        $school = School::create([
            'name'                    => 'Test Academy ' . Str::random(5),
            'slug'                    => 'test-acad-' . Str::lower(Str::random(6)),
            'email'                   => 'school_' . Str::lower(Str::random(6)) . '@eduflow.co.ke',
            'phone'                   => '+254700112233',
            'country'                 => 'KE',
            'county'                  => 'Nairobi',
            'sub_county'              => 'Westlands',
            'timezone'                => 'Africa/Nairobi',
            'currency'                => 'KES',
            'language'                => 'en',
            'curriculum'              => 'cbc',
            'status'                  => 'active',
            'onboarding_completed_at' => $onboardingComplete ? now() : null,
        ]);

        $user = User::create([
            'school_id'         => $school->id,
            'name'              => 'Admin User',
            'email'             => 'admin_' . Str::lower(Str::random(6)) . '@eduflow.co.ke',
            'password'          => bcrypt('P@ssw0rd12345!'),
            'email_verified_at' => now(),
            'status'            => 'active',
        ]);

        $role = Role::firstOrCreate(['name' => 'school-admin', 'guard_name' => 'web']);
        $user->assignRole($role);

        return [$school, $user];
    }

    public function test_guest_cannot_access_onboarding(): void
    {
        $response = $this->get(route('onboarding'));
        $response->assertRedirect(route('login'));
    }

    public function test_new_school_admin_can_access_onboarding(): void
    {
        [$school, $user] = $this->createSchoolAdmin(false);

        $response = $this->actingAs($user)->get(route('onboarding'));
        $response->assertOk();
    }

    public function test_completed_onboarding_redirects_to_dashboard(): void
    {
        [$school, $user] = $this->createSchoolAdmin(true);

        $response = $this->actingAs($user)->get(route('onboarding'));
        $response->assertRedirect(route('dashboard'));
    }

    public function test_submitting_onboarding_updates_school_and_marks_completed(): void
    {
        [$school, $user] = $this->createSchoolAdmin(false);

        $payload = [
            'name'          => 'Updated Academy Name',
            'phone'         => '+254722998877',
            'address'       => 'P.O. Box 1234, Nairobi',
            'city'          => 'Nairobi',
            'country'       => 'KE',
            'timezone'      => 'Africa/Nairobi',
            'currency'      => 'KES',
            'language'      => 'en',
            'curriculum'    => 'cbc',
            'academic_year' => '2026',
        ];

        $response = $this->actingAs($user)->post(route('onboarding.update'), $payload);

        $response->assertRedirect(route('dashboard'));
        $school->refresh();
        $this->assertEquals('Updated Academy Name', $school->name);
        $this->assertNotNull($school->onboarding_completed_at);
        $this->assertDatabaseHas('academic_years', [
            'school_id'  => $school->id,
            'name'       => '2026',
            'is_current' => true,
        ]);
    }
}