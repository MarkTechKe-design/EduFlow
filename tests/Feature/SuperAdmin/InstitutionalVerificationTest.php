<?php

namespace Tests\Feature\SuperAdmin;

use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class InstitutionalVerificationTest extends TestCase
{
    use RefreshDatabase;

    protected User $superAdmin;
    protected User $schoolAdmin;
    protected School $school;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create permissions required by SchoolPolicy
        $permissions = [
            'schools.view',
            'schools.create',
            'schools.edit',
            'schools.delete',
            'schools.suspend',
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // 2. Setup SuperAdmin role with permissions
        $superAdminRole = Role::firstOrCreate(['name' => 'super-admin', 'guard_name' => 'web']);
        $superAdminRole->syncPermissions($permissions);

        $schoolAdminRole = Role::firstOrCreate(['name' => 'school-admin', 'guard_name' => 'web']);

        // 3. Create SuperAdmin platform user (school_id must be null for platform context)
        $this->superAdmin = User::factory()->create([
            'school_id' => null,
            'status' => 'active',
        ]);
        $this->superAdmin->assignRole($superAdminRole);

        // 4. Create Baseline Test School
        $this->school = School::create([
            'name' => 'Apex High School',
            'slug' => 'apex-high-school-' . Str::random(5),
            'country' => 'KE',
            'county' => 'Nairobi',
            'sub_county' => 'Westlands',
            'curriculum' => 'cbc',
            'status' => 'active',
            'verification_status' => 'pending',
            'knec_code' => 'KNEC/2026/001',
            'registration_number' => 'MOE/PRI/2026/001',
            'nemis_code' => 'NEMIS/001',
        ]);

        // 5. Create Tenant School Admin
        $this->schoolAdmin = User::factory()->create([
            'school_id' => $this->school->id,
            'status' => 'active',
        ]);
        $this->schoolAdmin->assignRole($schoolAdminRole);
    }

    #[Test]
    public function test_school_can_be_created_without_optional_government_identifiers(): void
    {
        $privateSchool = School::create([
            'name' => 'Sunshine Early Learning Kindergarten',
            'slug' => 'sunshine-elc-' . Str::random(5),
            'country' => 'KE',
            'county' => 'Kiambu',
            'sub_county' => 'Ruiru',
            'curriculum' => 'cbc',
            'status' => 'active',
            'verification_status' => 'pending',
        ]);

        $this->assertDatabaseHas('schools', [
            'id' => $privateSchool->id,
            'status' => 'active',
            'verification_status' => 'pending',
            'knec_code' => null,
            'registration_number' => null,
            'nemis_code' => null,
        ]);
    }

    #[Test]
    public function test_duplicate_identifiers_do_not_block_creation_and_flag_collision_in_notes(): void
    {
        $collisionNotes = "[SYSTEM COLLISION ALERT: Claimed KNEC Centre Code matches School #{$this->school->id} ({$this->school->name})]";

        $duplicateSchool = School::create([
            'name' => 'Apex Satellite Campus',
            'slug' => 'apex-satellite-' . Str::random(5),
            'country' => 'KE',
            'county' => 'Nairobi',
            'sub_county' => 'Westlands',
            'curriculum' => 'cbc',
            'status' => 'active',
            'verification_status' => 'pending',
            'knec_code' => 'KNEC/2026/001',
            'verification_notes' => $collisionNotes,
        ]);

        $this->assertDatabaseHas('schools', [
            'id' => $duplicateSchool->id,
            'knec_code' => 'KNEC/2026/001',
            'status' => 'active',
            'verification_status' => 'pending',
        ]);

        $this->assertStringContainsString('SYSTEM COLLISION ALERT', (string) $duplicateSchool->verification_notes);
    }

    #[Test]
    public function test_super_admin_can_verify_an_institution(): void
    {
        $response = $this->actingAs($this->superAdmin)->post(route('super-admin.schools.verify', $this->school), [
            'notes' => 'MOE registration certificate validated via County Director of Education.',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $this->school->refresh();
        $this->assertSame('verified', $this->school->verification_status);
        $this->assertSame($this->superAdmin->id, $this->school->verified_by);
        $this->assertNotNull($this->school->verified_at);
        $this->assertSame('active', $this->school->status);
        $this->assertStringContainsString('AUDITOR VERIFICATION', (string) $this->school->verification_notes);
    }

    #[Test]
    public function test_super_admin_can_reject_an_institution_verification(): void
    {
        $response = $this->actingAs($this->superAdmin)->post(route('super-admin.schools.reject', $this->school), [
            'reason' => 'Invalid MOE certificate serial number.',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $this->school->refresh();
        $this->assertSame('rejected', $this->school->verification_status);
        $this->assertSame($this->superAdmin->id, $this->school->verified_by);
        $this->assertNotNull($this->school->verified_at);
        $this->assertSame('active', $this->school->status);
        $this->assertStringContainsString('REJECTION REASON', (string) $this->school->verification_notes);
    }

    #[Test]
    public function test_super_admin_can_append_verification_notes(): void
    {
        $response = $this->actingAs($this->superAdmin)->post(route('super-admin.schools.verification-notes', $this->school), [
            'notes' => 'Awaiting physical inspection certificate from sub-county office.',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $this->school->refresh();
        $this->assertStringContainsString('Awaiting physical inspection certificate', (string) $this->school->verification_notes);
    }

    #[Test]
    public function test_non_super_admin_users_cannot_access_verification_endpoints(): void
    {
        // Unauthenticated
        $this->post(route('super-admin.schools.verify', $this->school), [
            'notes' => 'Attempting unauthenticated verify',
        ])->assertRedirect(route('login'));

        // School Admin (Tenant user)
        $this->actingAs($this->schoolAdmin)
            ->post(route('super-admin.schools.verify', $this->school), ['notes' => 'Self verification attempt'])
            ->assertForbidden();

        $this->actingAs($this->schoolAdmin)
            ->post(route('super-admin.schools.reject', $this->school), ['reason' => 'Self rejection attempt'])
            ->assertForbidden();

        $this->actingAs($this->schoolAdmin)
            ->post(route('super-admin.schools.verification-notes', $this->school), ['notes' => 'Unauthorized notes update'])
            ->assertForbidden();

        $this->school->refresh();
        $this->assertSame('pending', $this->school->verification_status);
    }

    #[Test]
    public function test_super_admin_can_filter_schools_by_verification_status(): void
    {
        $verifiedSchool = School::create([
            'name' => 'Verified Academy',
            'slug' => 'verified-academy-' . Str::random(5),
            'country' => 'KE',
            'county' => 'Nairobi',
            'sub_county' => 'Langata',
            'curriculum' => 'cbc',
            'status' => 'active',
            'verification_status' => 'verified',
        ]);

        $response = $this->actingAs($this->superAdmin)
            ->get(route('super-admin.schools.index', ['verification_status' => 'verified']));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('SuperAdmin/Schools/Index')
            ->has('schools.data')
            ->where('schools.data.0.id', $verifiedSchool->id)
        );
    }
}