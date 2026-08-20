<?php

namespace Tests\Feature\Security;

use App\Models\SchoolModule;
use App\Models\User;
use App\Support\Authorization\ModuleAccessService;
use App\Support\Navigation\NavigationRegistry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\Support\CreatesSecurityFixtures;
use Tests\TestCase;

class CapabilityWiringTest extends TestCase
{
    use RefreshDatabase;
    use CreatesSecurityFixtures;

    public function test_disabled_school_modules_block_direct_routes_and_navigation(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->userWithPermissions($school, 'librarian', ['library.view']);
        SchoolModule::create(['school_id' => $school->id, 'module_slug' => 'library', 'is_enabled' => false]);

        $this->actingAs($user)->get('/school/library/books')->assertForbidden();

        $items = collect(app(NavigationRegistry::class)->for($user))
            ->flatMap(fn (array $group) => $group['items']);
        $this->assertFalse($items->contains('href', url('/school/library/books')));
        $this->assertFalse(app(ModuleAccessService::class)->isEnabledForUser($user, 'library'));
    }

    public function test_multi_role_navigation_uses_union_of_effective_permissions(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->userWithPermissions($school, 'teacher', [
            'reports.view', 'students.view', 'attendance.view', 'timetable.view',
            'exams.view', 'marks.view', 'homework.view', 'library.view',
        ]);
        $user->assignRole($this->roleWithPermissions('librarian', ['library.view']));
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $items = collect(app(NavigationRegistry::class)->for($user))
            ->flatMap(fn (array $group) => $group['items'])
            ->pluck('href');

        $this->assertTrue($items->contains(url('/school/homework')));
        $this->assertTrue($items->contains(url('/school/library/books')));
    }

    public function test_super_admin_navigation_is_platform_only_and_retains_cms_routes(): void
    {
        $user = $this->userWithPermissions(null, 'super-admin', [
            'schools.view', 'users.view', 'website.view', 'settings.view',
        ]);

        $items = collect(app(NavigationRegistry::class)->for($user))
            ->flatMap(fn (array $group) => $group['items'])
            ->pluck('href');

        $this->assertTrue($items->contains(url('/super-admin/blogs')));
        $this->assertTrue($items->contains(url('/super-admin/faqs')));
        $this->assertFalse($items->contains(url('/school/students')));
    }

    public function test_user_management_enforces_platform_and_school_role_context(): void
    {
        $school = $this->createSecuritySchool();
        $platform = $this->userWithPermissions(null, 'super-admin', ['users.create', 'users.edit']);

        $this->actingAs($platform)->post('/super-admin/users', [
            'name' => 'Orphan Teacher',
            'email' => 'orphan-teacher@example.test',
            'password' => 'Password123!',
            'role' => 'teacher',
            'status' => 'active',
        ])->assertSessionHasErrors('school_id');

        $this->actingAs($platform)->post('/super-admin/users', [
            'name' => 'Scoped Platform Admin',
            'email' => 'scoped-platform@example.test',
            'password' => 'Password123!',
            'role' => 'super-admin',
            'school_id' => $school->id,
            'status' => 'active',
        ])->assertSessionHasErrors('school_id');
    }
    private function userWithPermissions(?object $school, string $roleName, array $permissions): User
    {
        $user = $this->createSecurityUser($school, ['email' => $roleName . '-' . uniqid() . '@example.test']);
        $user->assignRole($this->roleWithPermissions($roleName, $permissions));
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    private function roleWithPermissions(string $name, array $permissions): Role
    {
        $role = Role::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        $models = collect($permissions)->map(fn (string $permission) => Permission::firstOrCreate([
            'name' => $permission,
            'guard_name' => 'web',
        ]));
        $role->syncPermissions($models);

        return $role;
    }
}
