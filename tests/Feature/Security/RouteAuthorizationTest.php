<?php

namespace Tests\Feature\Security;

use App\Models\School;
use App\Models\User;
use Illuminate\Testing\TestResponse;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\Support\SecurityTestCase;

class RouteAuthorizationTest extends SecurityTestCase
{
    public function test_guests_cannot_access_the_authenticated_dashboard(): void { $this->get('/dashboard')->assertRedirect(route('login')); }
    public function test_guests_cannot_access_school_administration(): void { $this->get('/school/settings')->assertRedirect(route('login')); }
    public function test_guests_cannot_access_platform_administration(): void { $this->get('/super-admin/settings')->assertRedirect(route('login')); }

    public function test_authenticated_users_without_the_school_role_receive_forbidden(): void
    { $this->assertForbiddenFor($this->createRoleUser('student'), 'GET', '/school/settings'); }
    public function test_students_cannot_access_school_administration_by_direct_url(): void
    { $this->assertForbiddenFor($this->createRoleUser('student'), 'GET', '/school/settings'); }
    public function test_parents_cannot_access_school_administration(): void
    { $this->assertForbiddenFor($this->createRoleUser('parent'), 'GET', '/school/settings'); }
    public function test_teachers_cannot_access_platform_administration(): void
    { $this->assertForbiddenFor($this->createRoleUser('teacher'), 'GET', '/super-admin/settings'); }
    public function test_accountants_cannot_access_integration_administration(): void
    { $this->assertForbiddenFor($this->createRoleUser('accountant'), 'GET', '/school/settings/integrations'); }
    public function test_drivers_cannot_access_finance_routes(): void
    { $this->assertForbiddenFor($this->createRoleUser('driver'), 'GET', '/school/fees/payments'); }
    public function test_drivers_cannot_access_academic_routes(): void
    { $this->assertForbiddenFor($this->createRoleUser('driver'), 'GET', '/school/classes'); }
    public function test_librarians_cannot_access_payroll(): void
    { $this->assertForbiddenFor($this->createRoleUser('librarian'), 'GET', '/school/hr/payroll'); }
    public function test_librarians_cannot_access_platform_settings(): void
    { $this->assertForbiddenFor($this->createRoleUser('librarian'), 'GET', '/super-admin/settings'); }
    public function test_school_administrators_cannot_access_platform_operations(): void
    { $this->assertForbiddenFor($this->createRoleUser('school-admin'), 'GET', '/super-admin/dashboard'); }

    public function test_all_non_super_admin_users_are_rejected_by_super_admin_routes(): void
    {
        foreach (['school-admin', 'principal', 'teacher', 'accountant', 'librarian', 'student', 'parent'] as $role) {
            $this->assertForbiddenFor($this->createRoleUser($role, $role . '@example.test'), 'GET', '/super-admin/dashboard');
        }
    }

    public function test_json_requests_cannot_bypass_route_authorization(): void
    { $this->actingAs($this->createRoleUser('student'))->getJson('/school/settings')->assertForbidden(); }

    public function test_inertia_requests_cannot_bypass_route_authorization(): void
    {
        $this->actingAs($this->createRoleUser('student'))->withHeaders([
            'X-Inertia' => 'true', 'X-Requested-With' => 'XMLHttpRequest', 'X-Inertia-Version' => $this->inertiaVersion(),
        ])->get('/school/settings')->assertForbidden();
    }

    public function test_export_and_download_endpoints_cannot_bypass_route_authorization(): void
    { $this->assertForbiddenFor($this->createRoleUser('student'), 'GET', '/school/reports/finance/export-pdf'); }

    public function test_action_endpoints_cannot_bypass_route_authorization(): void
    { $this->assertForbiddenFor($this->createRoleUser('student'), 'POST', '/school/settings/general', ['name' => 'Unauthorized School Update']); }

    public function test_a_school_administrator_can_access_an_authorized_school_route(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createRoleUser('school-admin', 'authorized-school-admin@example.test', $school);
        $this->actingAs($user)->get('/school/settings')->assertOk();
    }

    public function test_a_super_admin_can_access_an_authorized_platform_route(): void
    {
        $user = $this->createRoleUser('super-admin', 'authorized-super-admin@example.test');
        $this->actingAs($user)->get('/super-admin/settings')->assertOk();
    }

    private function createRoleUser(string $role, ?string $email = null, ?School $school = null): User
    {
        $userSchool = $role === 'super-admin' ? null : ($school ?? $this->createSecuritySchool());
        $user = $this->createSecurityUser($userSchool, [
            'email' => $email ?? ($role . '-' . uniqid() . '@example.test'),
        ]);
        $roleModel = Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        $permissions = $role === 'super-admin' || $role === 'school-admin'
            ? ['settings.view', 'settings.edit'] : [];
        $roleModel->syncPermissions(collect($permissions)->map(fn (string $permission) => Permission::firstOrCreate([
            'name' => $permission, 'guard_name' => 'web',
        ])));
        $user->assignRole($roleModel);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
        return $user;
    }

    private function inertiaVersion(): string
    {
        if (config('app.asset_url')) return hash('xxh128', config('app.asset_url'));
        $manifest = public_path('build/manifest.json');
        if (file_exists($manifest)) return hash_file('xxh128', $manifest);
        return '';
    }

    /** @param array<string, mixed> $data */
    private function assertForbiddenFor(User $user, string $method, string $uri, array $data = []): void
    {
        $response = $this->actingAs($user)->call($method, $uri, $data);
        $this->assertAuthenticatedAs($user);
        $response->assertForbidden();
    }
}
