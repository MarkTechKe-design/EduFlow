<?php

namespace Tests\Feature\Security;

use App\Models\School;
use App\Models\SchoolModule;
use App\Models\User;
use App\Support\Authorization\ModuleAccessService;
use App\Support\Navigation\NavigationRegistry;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\Support\SecurityTestCase;

class CoCurricularNavigationTest extends SecurityTestCase
{
    private function ensurePermissionsExist(array $permissions): void
    {
        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }
    }

    public function test_school_admin_navigation_contains_cocurricular(): void
    {
        $school = $this->createSecuritySchool();
        $admin = $this->createSecurityUser($school);
        $role = Role::firstOrCreate(['name' => 'school-admin', 'guard_name' => 'web']);
        $admin->assignRole($role);
        $this->ensurePermissionsExist(['activities.view', 'activities.manage']);
        $admin->givePermissionTo(['activities.view', 'activities.manage']);

        $response = $this->actingAs($admin)->get('/school');
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('navigation')
            ->where('navigation.0.groupTitle', fn ($title) => true)
        );

        $items = collect(app(NavigationRegistry::class)->for($admin))
            ->flatMap(fn (array $group) => $group['items']);
        $this->assertTrue($items->contains('href', route('school.cocurricular.index')));
    }

    public function test_student_navigation_contains_talent_and_activities(): void
    {
        $school = $this->createSecuritySchool();
        $studentUser = $this->createSecurityUser($school);
        $role = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
        $studentUser->assignRole($role);

        $response = $this->actingAs($studentUser)->get('/student');
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->has('navigation'));

        $items = collect(app(NavigationRegistry::class)->for($studentUser))
            ->flatMap(fn (array $group) => $group['items']);
        $this->assertTrue($items->contains('href', route('student.cocurricular')));
    }

    public function test_parent_navigation_contains_cocurricular_and_talent(): void
    {
        $school = $this->createSecuritySchool();
        $parentUser = $this->createSecurityUser($school);
        $role = Role::firstOrCreate(['name' => 'parent', 'guard_name' => 'web']);
        $parentUser->assignRole($role);

        $response = $this->actingAs($parentUser)->get('/parent');
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->has('navigation'));

        $items = collect(app(NavigationRegistry::class)->for($parentUser))
            ->flatMap(fn (array $group) => $group['items']);
        $this->assertTrue($items->contains('href', route('parent.cocurricular')));
    }

    public function test_disabled_cocurricular_module_hides_navigation_and_blocks_route(): void
    {
        $school = $this->createSecuritySchool();

        // Explicitly create disabled module record for this school (standard EduFlow pattern)
        SchoolModule::create([
            'school_id' => $school->id,
            'module_slug' => 'cocurricular',
            'is_enabled' => false,
        ]);

        $admin = $this->createSecurityUser($school);
        $role = Role::firstOrCreate(['name' => 'school-admin', 'guard_name' => 'web']);
        $admin->assignRole($role);

        // 1. Direct route access must return 403 Forbidden
        $response = $this->actingAs($admin)->get('/school/cocurricular');
        $response->assertForbidden();

        // 2. Navigation item must be hidden
        $items = collect(app(NavigationRegistry::class)->for($admin))
            ->flatMap(fn (array $group) => $group['items']);
        $this->assertFalse($items->contains('href', route('school.cocurricular.index')));
        $this->assertFalse(app(ModuleAccessService::class)->isEnabledForUser($admin, 'cocurricular'));
    }
}