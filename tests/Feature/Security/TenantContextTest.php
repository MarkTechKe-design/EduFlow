<?php

namespace Tests\Feature\Security;

use App\Models\Holiday;
use App\Models\School;
use App\Models\User;
use Illuminate\Testing\TestResponse;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\Support\SecurityTestCase;

class TenantContextTest extends SecurityTestCase
{
    public function test_an_authenticated_school_a_user_resolves_school_a(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $user = $this->createSchoolUser($schoolA, 'school-a@example.test');
        $holidayA = $this->createHoliday($schoolA, 'School A Holiday');
        $this->createHoliday($schoolB, 'School B Holiday');

        $this->actingAs($user);
        $this->assertAuthenticatedAs($user);
        $this->assertSame($schoolA->id, auth()->user()->school_id);
        $this->assertSame([$holidayA->id], Holiday::query()->pluck('id')->all());
    }

    public function test_an_authenticated_school_b_user_resolves_school_b(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $user = $this->createSchoolUser($schoolB, 'school-b@example.test');
        $this->createHoliday($schoolA, 'School A Holiday');
        $holidayB = $this->createHoliday($schoolB, 'School B Holiday');

        $this->actingAs($user);
        $this->assertAuthenticatedAs($user);
        $this->assertSame($schoolB->id, auth()->user()->school_id);
        $this->assertSame([$holidayB->id], Holiday::query()->pluck('id')->all());
    }

    public function test_a_user_without_a_school_cannot_perform_tenant_operations(): void
    {
        $this->createSecuritySchool();
        $user = $this->createSchoolUser(null, 'no-school@example.test');
        $response = $this->actingAs($user)->get('/school/settings');
        $this->assertAuthenticatedAs($user);
        $response->assertForbidden();
    }

    public function test_a_user_without_a_school_never_falls_back_to_school_one(): void
    {
        $schoolOne = $this->createSecuritySchool(['name' => 'First School']);
        $this->createSecuritySchool(['name' => 'Second School']);
        $user = $this->createSchoolUser(null, 'fallback@example.test');
        $response = $this->actingAs($user)->get('/school/settings');
        $this->assertAuthenticatedAs($user);
        $response->assertForbidden();
        $this->assertDatabaseHas('schools', ['id' => $schoolOne->id, 'name' => 'First School']);
    }

    public function test_tenant_routes_fail_closed_when_the_tenant_context_is_missing(): void
    {
        $user = $this->createSchoolUser(null, 'missing-context@example.test');
        $response = $this->actingAs($user)->get('/school/settings');
        $this->assertAuthenticatedAs($user);
        $response->assertForbidden();
    }

    public function test_platform_routes_do_not_require_or_resolve_a_tenant(): void
    {
        $platformUser = $this->createPlatformUser();
        $response = $this->actingAs($platformUser)->get('/super-admin/settings');
        $this->assertAuthenticatedAs($platformUser);
        $this->assertNull(auth()->user()->school_id);
        $response->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('SuperAdmin/Settings/Index')->missing('school'));
    }

    public function test_tenant_routes_resolve_exactly_one_tenant(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $user = $this->createSchoolUser($schoolA, 'one-tenant@example.test');
        $response = $this->actingAs($user)->get('/school/settings');
        $this->assertAuthenticatedAs($user);
        $this->assertTenantSettingsResponse($response, $schoolA);
        $response->assertInertia(fn (Assert $page) => $page
            ->where('school.id', $schoolA->id)
            ->where('school.name', $schoolA->name)
            ->missing('settings.' . $schoolB->slug));
    }

    public function test_super_admin_bypass_is_not_a_tenant_context_for_tenant_routes(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $platformUser = $this->createPlatformUser();
        $this->createHoliday($schoolA, 'School A Holiday');
        $this->createHoliday($schoolB, 'School B Holiday');
        $this->actingAs($platformUser);
        $this->assertAuthenticatedAs($platformUser);
        $this->assertCount(2, Holiday::query()->get());
        $this->get('/school/settings')->assertForbidden();
    }

    public function test_query_parameters_cannot_override_the_authenticated_tenant(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $user = $this->createSchoolUser($schoolA, 'query-override@example.test');
        $response = $this->actingAs($user)->get('/school/settings?school_id=' . $schoolB->id);
        $this->assertAuthenticatedAs($user);
        $this->assertTenantSettingsResponse($response, $schoolA);
    }

    public function test_session_parameters_cannot_override_the_authenticated_tenant(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $user = $this->createSchoolUser($schoolA, 'session-override@example.test');
        $response = $this->withSession(['school_id' => $schoolB->id])->actingAs($user)->get('/school/settings');
        $this->assertAuthenticatedAs($user);
        $this->assertTenantSettingsResponse($response, $schoolA);
    }

    public function test_request_input_cannot_switch_the_tenant_during_a_tenant_mutation(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $user = $this->createSchoolUser($schoolA, 'request-override@example.test');
        $response = $this->actingAs($user)->post('/school/settings/general', [
            'school_id' => $schoolB->id, 'name' => 'Updated School A', 'email' => null,
        ]);
        $this->assertAuthenticatedAs($user);
        $response->assertRedirect();
        $this->assertDatabaseHas('schools', ['id' => $schoolA->id, 'name' => 'Updated School A']);
        $this->assertDatabaseHas('schools', ['id' => $schoolB->id, 'name' => $schoolB->name]);
    }

    public function test_suspended_schools_cannot_execute_tenant_operations(): void
    {
        $school = $this->createSecuritySchool(['status' => 'suspended']);
        $user = $this->createSchoolUser($school, 'suspended-school@example.test');
        $response = $this->actingAs($user)->get('/school/settings');
        $this->assertAuthenticatedAs($user);
        $response->assertForbidden();
    }

    public function test_deleted_schools_cannot_execute_tenant_operations(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createSchoolUser($school, 'deleted-school@example.test');
        $school->delete();
        $response = $this->actingAs($user)->get('/school/settings');
        $this->assertAuthenticatedAs($user);
        $response->assertNotFound();
    }

    /** @return array{0: School, 1: School} */
    private function createTwoSchools(): array
    {
        return [
            $this->createSecuritySchool(['name' => 'School A']),
            $this->createSecuritySchool(['name' => 'School B']),
        ];
    }

    private function createSchoolUser(?School $school, string $email): User
    {
        $user = $this->createSecurityUser($school, ['email' => $email]);
        $user->assignRole($this->role('school-admin', ['settings.view', 'settings.edit']));
        return $user;
    }

    private function createPlatformUser(): User
    {
        $user = $this->createSecurityUser(null, ['email' => 'platform@example.test']);
        $user->assignRole($this->role('super-admin', ['settings.view', 'settings.edit']));
        return $user;
    }

    private function role(string $name, array $permissions = []): Role
    {
        $role = Role::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        $models = collect($permissions)->map(fn (string $permission) => Permission::firstOrCreate([
            'name' => $permission, 'guard_name' => 'web',
        ]));
        $role->syncPermissions($models);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        return $role;
    }

    private function createHoliday(School $school, string $name): Holiday
    {
        return Holiday::query()->create(['school_id' => $school->id, 'name' => $name, 'date' => '2026-12-25']);
    }

    private function assertTenantSettingsResponse(TestResponse $response, School $school): void
    {
        $response->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('SchoolAdmin/Settings/Index')
            ->where('school.id', $school->id)
            ->where('school.name', $school->name));
    }
}
