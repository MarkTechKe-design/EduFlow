<?php

namespace Tests\Feature\Security;

use App\Models\Activity;
use App\Models\ActivityCategory;
use App\Models\ActivityTeam;
use App\Models\SchoolClass;
use App\Models\Student;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\Support\SecurityTestCase;

class CoCurricularSecurityTest extends SecurityTestCase
{
    private function ensurePermissionsExist(array $permissions): void
    {
        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }
    }

    public function test_guest_cannot_access_cocurricular_hub(): void
    {
        $this->get('/school/cocurricular')->assertRedirect(route('login'));
        $this->get('/school/cocurricular/activities')->assertRedirect(route('login'));
        $this->get('/school/cocurricular/sports/teams')->assertRedirect(route('login'));
        $this->get('/school/cocurricular/athletics')->assertRedirect(route('login'));
        $this->get('/school/cocurricular/arts')->assertRedirect(route('login'));
        $this->get('/school/cocurricular/clubs')->assertRedirect(route('login'));
        $this->get('/school/cocurricular/houses')->assertRedirect(route('login'));
        $this->get('/school/cocurricular/events')->assertRedirect(route('login'));
        $this->get('/school/cocurricular/talent')->assertRedirect(route('login'));
    }

    public function test_school_admin_can_access_cocurricular_dashboard(): void
    {
        $school = $this->createSecuritySchool();
        $admin = $this->createSecurityUser($school);
        
        $role = Role::firstOrCreate(['name' => 'school-admin', 'guard_name' => 'web']);
        $admin->assignRole($role);

        $perms = [
            'activities.view',
            'activities.manage',
            'activities.events',
            'activities.results',
            'activities.clubs',
            'activities.certificates',
            'activities.export',
        ];
        $this->ensurePermissionsExist($perms);
        $admin->givePermissionTo($perms);

        $this->actingAs($admin)->get('/school/cocurricular')->assertOk();
        $this->actingAs($admin)->get('/school/cocurricular/activities')->assertOk();
        $this->actingAs($admin)->get('/school/cocurricular/sports/teams')->assertOk();
        $this->actingAs($admin)->get('/school/cocurricular/athletics')->assertOk();
        $this->actingAs($admin)->get('/school/cocurricular/arts')->assertOk();
        $this->actingAs($admin)->get('/school/cocurricular/clubs')->assertOk();
        $this->actingAs($admin)->get('/school/cocurricular/houses')->assertOk();
        $this->actingAs($admin)->get('/school/cocurricular/events')->assertOk();
        $this->actingAs($admin)->get('/school/cocurricular/talent')->assertOk();
    }

    public function test_strict_tenant_isolation_on_activities(): void
    {
        $schoolA = $this->createSecuritySchool();
        $schoolB = $this->createSecuritySchool();

        $adminA = $this->createSecurityUser($schoolA);
        $role = Role::firstOrCreate(['name' => 'school-admin', 'guard_name' => 'web']);
        $adminA->assignRole($role);

        $this->ensurePermissionsExist(['activities.view', 'activities.manage']);
        $adminA->givePermissionTo(['activities.view', 'activities.manage']);

        $catB = ActivityCategory::create([
            'school_id' => $schoolB->id,
            'name'      => 'Sports B',
            'is_active' => true,
        ]);

        $actB = Activity::create([
            'school_id'    => $schoolB->id,
            'category_id'  => $catB->id,
            'name'         => 'School B Rugby',
            'type'         => 'team_fixture',
            'gender_scope' => 'boys',
            'age_group'    => 'under_19',
            'is_active'    => true,
        ]);

        // Cross-tenant route binding fails closed
        $response = $this->actingAs($adminA)->delete("/school/cocurricular/activities/{$actB->id}");
        $this->assertTrue(in_array($response->status(), [403, 404]), 'Cross-tenant mutation must fail closed (403 or 404).');

        $this->assertDatabaseHas('activities', ['id' => $actB->id]);
    }

    public function test_strict_tenant_isolation_on_talent_passports(): void
    {
        $schoolA = $this->createSecuritySchool();
        $schoolB = $this->createSecuritySchool();

        $adminA = $this->createSecurityUser($schoolA);
        $role = Role::firstOrCreate(['name' => 'school-admin', 'guard_name' => 'web']);
        $adminA->assignRole($role);

        $this->ensurePermissionsExist(['activities.view']);
        $adminA->givePermissionTo(['activities.view']);

        $classB = SchoolClass::create([
            'school_id'    => $schoolB->id,
            'name'         => 'Form 1A',
            'numeric_name' => 1,
        ]);

        $studentB = Student::create([
            'school_id'     => $schoolB->id,
            'class_id'      => $classB->id,
            'first_name'    => 'Brian',
            'last_name'     => 'Otieno',
            'admission_no'  => 'ADM-B-990',
            'gender'        => 'male',
            'date_of_birth' => '2010-05-12',
            'status'        => 'active',
        ]);

        $response = $this->actingAs($adminA)->get("/school/cocurricular/talent/{$studentB->id}");
        $this->assertTrue(in_array($response->status(), [403, 404]), 'Cross-tenant talent passport access must fail closed.');
    }

    public function test_strict_tenant_isolation_on_team_sheet_pdf_export(): void
    {
        $schoolA = $this->createSecuritySchool();
        $schoolB = $this->createSecuritySchool();

        $adminA = $this->createSecurityUser($schoolA);
        $role = Role::firstOrCreate(['name' => 'school-admin', 'guard_name' => 'web']);
        $adminA->assignRole($role);

        $this->ensurePermissionsExist(['activities.export']);
        $adminA->givePermissionTo(['activities.export']);

        $catB = ActivityCategory::create([
            'school_id' => $schoolB->id,
            'name'      => 'Games B',
            'is_active' => true,
        ]);

        $actB = Activity::create([
            'school_id'    => $schoolB->id,
            'category_id'  => $catB->id,
            'name'         => 'Basketball',
            'type'         => 'team_fixture',
            'gender_scope' => 'boys',
            'age_group'    => 'under_19',
            'is_active'    => true,
        ]);

        $teamB = ActivityTeam::create([
            'school_id'   => $schoolB->id,
            'activity_id' => $actB->id,
            'name'        => 'School B Basketball Team',
            'age_group'   => 'under_19',
            'gender'      => 'boys',
            'status'      => 'active',
        ]);

        $response = $this->actingAs($adminA)->get("/school/cocurricular/export/team/{$teamB->id}/pdf");
        $this->assertTrue(in_array($response->status(), [403, 404]), 'Cross-tenant export must fail closed.');
    }
}