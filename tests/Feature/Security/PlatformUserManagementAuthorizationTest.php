<?php

namespace Tests\Feature\Security;

use App\Models\School;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Tests\Support\CreatesPlatformAdministrationSecurityFixtures;
use Tests\Support\SecurityTestCase;

class PlatformUserManagementAuthorizationTest extends SecurityTestCase
{
    use CreatesPlatformAdministrationSecurityFixtures;

    public function test_platform_user_management_requires_existing_user_permissions(): void
    {
        $school = $this->createSecuritySchool();
        $platformUser = $this->createPlatformAdministrationUser('super-admin', null, ['users.view']);

        $this->actingAs($platformUser)->get('/super-admin/users')->assertOk();

        $tenantUser = $this->createPlatformAdministrationUser('school-admin', $school);
        $this->actingAs($tenantUser)->get('/super-admin/users')->assertForbidden();
    }

    public function test_platform_user_management_mutations_require_ownership_and_permissions(): void
    {
        $school = $this->createSecuritySchool();
        $platformUser = $this->createPlatformAdministrationUser('super-admin', null, [
            'users.view', 'users.create', 'users.edit', 'users.delete',
        ]);
        Role::firstOrCreate(['name' => 'teacher', 'guard_name' => 'web']);

        $this->actingAs($platformUser)->post('/super-admin/users', [
            'name' => 'Managed User', 'email' => 'managed@example.test', 'password' => 'password123',
            'role' => 'teacher', 'school_id' => $school->id, 'status' => 'active',
        ])->assertRedirect();
        $this->assertDatabaseHas('users', ['email' => 'managed@example.test', 'school_id' => $school->id]);

        $this->actingAs($platformUser)->post('/super-admin/users', [
            'name' => 'Invalid User', 'email' => 'invalid-school@example.test', 'password' => 'password123',
            'role' => 'teacher', 'school_id' => 999999, 'status' => 'active',
        ])->assertStatus(422);
    }

    public function test_platform_user_management_cannot_target_the_current_super_admin(): void
    {
        $platformUser = $this->createPlatformAdministrationUser('super-admin', null, ['users.edit']);

        $this->actingAs($platformUser)->patch('/super-admin/users/' . $platformUser->id . '/suspend')
            ->assertForbidden();
        $this->assertDatabaseHas('users', ['id' => $platformUser->id, 'status' => 'active']);
    }
}
