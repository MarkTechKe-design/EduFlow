<?php

namespace Tests\Feature\Security;

use App\Models\Holiday;
use App\Models\PlatformSetting;
use App\Models\SchoolSetting;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\Support\CreatesPlatformAdministrationSecurityFixtures;
use Tests\Support\SecurityTestCase;

class PlatformAdministrationAuthorizationTest extends SecurityTestCase
{
    use CreatesPlatformAdministrationSecurityFixtures;

    public function test_guests_cannot_access_platform_administration_routes(): void
    {
        foreach ([
            ['get', '/school/settings'],
            ['get', '/school/settings/integrations'],
            ['get', '/school/holidays'],
            ['get', '/super-admin/settings'],
            ['get', '/super-admin/schools'],
        ] as [$method, $uri]) {
            $this->{$method}($uri)->assertRedirect(route('login'));
        }
    }

    public function test_tenant_user_can_read_and_update_owned_settings_and_holidays(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $user = $this->createPlatformAdministrationUser('school-admin', $schoolA, [
            'settings.view', 'settings.edit',
        ]);

        $this->actingAs($user)->get('/school/settings')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('SchoolAdmin/Settings/Index')
                ->where('school.id', $schoolA->id));
        $this->actingAs($user)->get('/school/settings/integrations')->assertOk();
        $this->actingAs($user)->get('/school/holidays')->assertOk();

        $this->actingAs($user)->post('/school/settings/general', [
            'school_id' => $schoolB->id,
            'name' => 'Updated School A',
        ])->assertRedirect();

        $this->assertDatabaseHas('schools', ['id' => $schoolA->id, 'name' => 'Updated School A']);
        $this->assertDatabaseHas('schools', ['id' => $schoolB->id, 'name' => $schoolB->name]);

        $this->actingAs($user)->post('/school/holidays', [
            'school_id' => $schoolB->id,
            'name' => 'School A Holiday',
            'date' => '2026-12-25',
        ])->assertRedirect();

        $this->assertDatabaseHas('holidays', [
            'school_id' => $schoolA->id,
            'name' => 'School A Holiday',
        ]);
        $this->assertDatabaseMissing('holidays', [
            'school_id' => $schoolB->id,
            'name' => 'School A Holiday',
        ]);
    }

    public function test_tenant_routes_require_existing_settings_permissions(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createPlatformAdministrationUser('school-admin', $school);

        $this->actingAs($user)->get('/school/settings')->assertForbidden();
        $this->actingAs($user)->get('/school/settings/integrations')->assertForbidden();
        $this->actingAs($user)->get('/school/holidays')->assertForbidden();
        $this->actingAs($user)->post('/school/settings/general', [
            'name' => 'Unauthorized',
        ])->assertForbidden();
    }

    public function test_cross_tenant_holidays_are_not_resolvable(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $user = $this->createPlatformAdministrationUser('school-admin', $schoolA, [
            'settings.view', 'settings.edit',
        ]);
        $holidayB = Holiday::withoutGlobalScopes()->create([
            'school_id' => $schoolB->id,
            'name' => 'School B Holiday',
            'date' => '2026-12-25',
        ]);

        $this->actingAs($user)->put('/school/holidays/' . $holidayB->id, [
            'name' => 'Changed',
            'date' => '2026-12-26',
        ])->assertNotFound();

        $this->assertDatabaseHas('holidays', [
            'id' => $holidayB->id,
            'name' => 'School B Holiday',
        ]);
    }

    public function test_missing_suspended_and_deleted_tenants_fail_closed(): void
    {
        $suspended = $this->createSecuritySchool(['status' => 'suspended']);
        $deleted = $this->createSecuritySchool();
        $deleted->delete();

        foreach ([$suspended, $deleted, null] as $school) {
            $user = $this->createPlatformAdministrationUser('school-admin', $school, [
                'settings.view', 'settings.edit',
            ]);

            $response = $this->actingAs($user)->get('/school/settings');
            $school === $deleted ? $response->assertNotFound() : $response->assertForbidden();
        }
    }

    public function test_super_admin_can_access_platform_settings_only_with_platform_context_and_permissions(): void
    {
        $platformUser = $this->createPlatformAdministrationUser('super-admin', null, [
            'settings.view', 'settings.edit',
        ]);

        $this->actingAs($platformUser)->get('/super-admin/settings')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('SuperAdmin/Settings/Index')
                ->missing('school'));
        $this->actingAs($platformUser)->post('/super-admin/settings/general', [
            'platform_name' => 'Secured Platform',
        ])->assertRedirect();
        $this->assertDatabaseHas('platform_settings', [
            'key' => 'platform_name',
            'value' => 'Secured Platform',
        ]);

        $this->actingAs($platformUser)->get('/school/settings')->assertForbidden();
        $this->actingAs($platformUser)->get('/school/holidays')->assertForbidden();
    }

    public function test_super_admin_without_settings_permission_is_denied(): void
    {
        $platformUser = $this->createPlatformAdministrationUser('super-admin', null);

        $this->actingAs($platformUser)->get('/super-admin/settings')->assertForbidden();
    }

    public function test_school_administration_uses_existing_school_permissions(): void
    {
        $platformUser = $this->createPlatformAdministrationUser('super-admin', null, [
            'schools.view', 'schools.create', 'schools.edit', 'schools.delete', 'schools.suspend',
        ]);
        $school = $this->createSecuritySchool();

        $this->actingAs($platformUser)->get('/super-admin/schools')->assertOk();
        $this->actingAs($platformUser)->get('/super-admin/schools/' . $school->id)->assertOk();
        $this->actingAs($platformUser)->patch('/super-admin/schools/' . $school->id . '/suspend')
            ->assertRedirect();
        $this->assertDatabaseHas('schools', ['id' => $school->id, 'status' => 'suspended']);

        $this->actingAs($platformUser)->patch('/super-admin/schools/' . $school->id . '/activate')
            ->assertRedirect();
        $this->assertDatabaseHas('schools', ['id' => $school->id, 'status' => 'active']);
    }

    public function test_school_settings_model_is_tenant_scoped(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        SchoolSetting::withoutGlobalScopes()->create([
            'school_id' => $schoolA->id, 'key' => 'theme', 'value' => 'a', 'group' => 'branding',
        ]);
        SchoolSetting::withoutGlobalScopes()->create([
            'school_id' => $schoolB->id, 'key' => 'theme', 'value' => 'b', 'group' => 'branding',
        ]);
        $user = $this->createPlatformAdministrationUser('school-admin', $schoolA, ['settings.view']);

        $this->actingAs($user);
        $this->assertSame('a', SchoolSetting::get($schoolA->id, 'theme'));
        $this->assertNull(SchoolSetting::get($schoolB->id, 'theme'));
        $this->assertSame(['a'], SchoolSetting::query()->pluck('value')->all());
        $this->assertSame('a', PlatformSetting::get('missing', 'a'));
    }
}
