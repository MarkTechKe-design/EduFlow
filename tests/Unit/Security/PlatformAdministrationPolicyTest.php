<?php

namespace Tests\Unit\Security;

use App\Models\Holiday;
use App\Models\PlatformSetting;
use App\Models\School;
use App\Models\SchoolSetting;
use App\Policies\HolidayPolicy;
use App\Policies\PlatformSettingPolicy;
use App\Policies\SchoolPolicy;
use App\Policies\SchoolSettingPolicy;
use Illuminate\Support\Facades\Gate;
use Tests\Support\CreatesPlatformAdministrationSecurityFixtures;
use Tests\Support\SecurityTestCase;

class PlatformAdministrationPolicyTest extends SecurityTestCase
{
    use CreatesPlatformAdministrationSecurityFixtures;

    public function test_platform_administration_policies_are_registered(): void
    {
        $this->assertInstanceOf(HolidayPolicy::class, Gate::getPolicyFor(Holiday::class));
        $this->assertInstanceOf(PlatformSettingPolicy::class, Gate::getPolicyFor(PlatformSetting::class));
        $this->assertInstanceOf(SchoolPolicy::class, Gate::getPolicyFor(School::class));
        $this->assertInstanceOf(SchoolSettingPolicy::class, Gate::getPolicyFor(SchoolSetting::class));
    }

    public function test_existing_settings_and_school_permissions_map_to_abilities(): void
    {
        $school = $this->createSecuritySchool();
        $tenantUser = $this->createPlatformAdministrationUser('school-admin', $school, [
            'settings.view', 'settings.edit',
        ]);
        $platformUser = $this->createPlatformAdministrationUser('super-admin', null, [
            'settings.view', 'settings.edit',
            'schools.view', 'schools.create', 'schools.edit', 'schools.delete', 'schools.suspend',
        ]);
        $holiday = Holiday::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'name' => 'Tenant Holiday',
            'date' => '2026-12-25',
        ]);

        $this->assertTrue(Gate::forUser($tenantUser)->allows('viewAny', SchoolSetting::class));
        $this->assertTrue(Gate::forUser($tenantUser)->allows('edit', SchoolSetting::class));
        $this->assertTrue(Gate::forUser($tenantUser)->allows('viewAny', Holiday::class));
        $this->assertTrue(Gate::forUser($tenantUser)->allows('update', $holiday));
        $this->assertTrue(Gate::forUser($platformUser)->allows('viewAny', PlatformSetting::class));
        $this->assertTrue(Gate::forUser($platformUser)->allows('viewAny', School::class));
        $this->assertTrue(Gate::forUser($platformUser)->allows('suspend', $school));
    }

    public function test_tenant_ownership_and_context_are_checked_before_permission(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $user = $this->createPlatformAdministrationUser('school-admin', $schoolA, ['settings.edit']);
        $holidayB = Holiday::withoutGlobalScopes()->create([
            'school_id' => $schoolB->id,
            'name' => 'Foreign Holiday',
            'date' => '2026-12-25',
        ]);
        $superAdmin = $this->createPlatformAdministrationUser('super-admin', null, ['settings.edit']);

        $this->assertFalse(Gate::forUser($user)->allows('update', $holidayB));
        $this->assertTrue(Gate::forUser($user)->allows('edit', SchoolSetting::class));
        $this->assertFalse(Gate::forUser($superAdmin)->allows('edit', SchoolSetting::class));
        $this->assertFalse(Gate::forUser($superAdmin)->allows('viewAny', Holiday::class));
    }

    public function test_suspended_deleted_and_missing_tenant_contexts_fail_closed(): void
    {
        $suspended = $this->createSecuritySchool(['status' => 'suspended']);
        $deleted = $this->createSecuritySchool();
        $deleted->delete();

        foreach ([$suspended, $deleted, null] as $school) {
            $user = $this->createPlatformAdministrationUser('school-admin', $school, [
                'settings.view', 'settings.edit',
            ]);

            $this->assertFalse(Gate::forUser($user)->allows('viewAny', SchoolSetting::class));
            $this->assertFalse(Gate::forUser($user)->allows('viewAny', Holiday::class));
        }
    }
}
