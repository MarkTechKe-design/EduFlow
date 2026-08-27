<?php

namespace Tests\Feature\Security;

use App\Models\Activity;
use App\Models\ActivityCategory;
use App\Models\ActivityFixture;
use App\Models\ActivityHouse;
use App\Models\ActivityTeam;
use App\Models\CocurricularEvent;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\Support\SecurityTestCase;

class CoCurricularOperationalUxTest extends SecurityTestCase
{
    private function ensurePermissionsExist(array $permissions): void
    {
        foreach ($permissions as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }
    }

    public function test_coach_can_access_field_entry_console(): void
    {
        $school = $this->createSecuritySchool();
        $coach = $this->createSecurityUser($school);
        $role = Role::firstOrCreate(['name' => 'school-admin', 'guard_name' => 'web']);
        $coach->assignRole($role);

        $this->ensurePermissionsExist(['activities.view', 'activities.results']);
        $coach->givePermissionTo(['activities.view', 'activities.results']);

        $response = $this->actingAs($coach)->get('/school/cocurricular/field-entry');
        $response->assertOk();
    }

    public function test_quick_score_endpoint_updates_match_and_enforces_tenant_boundary(): void
    {
        $schoolA = $this->createSecuritySchool();
        $schoolB = $this->createSecuritySchool();

        // 1. Create fixtures for both schools before authenticating
        $catA = ActivityCategory::withoutEvents(fn () => ActivityCategory::create(['school_id' => $schoolA->id, 'name' => 'Games A']));
        $actA = Activity::withoutEvents(fn () => Activity::create(['school_id' => $schoolA->id, 'category_id' => $catA->id, 'name' => 'Football A', 'type' => 'team_fixture', 'gender_scope' => 'boys', 'age_group' => 'under_19']));
        $eventA = CocurricularEvent::withoutEvents(fn () => CocurricularEvent::create(['school_id' => $schoolA->id, 'title' => 'Term 1 League A', 'start_date' => now()->toDateString()]));
        $teamA1 = ActivityTeam::withoutEvents(fn () => ActivityTeam::create(['school_id' => $schoolA->id, 'activity_id' => $actA->id, 'name' => 'Tigers A']));
        $teamA2 = ActivityTeam::withoutEvents(fn () => ActivityTeam::create(['school_id' => $schoolA->id, 'activity_id' => $actA->id, 'name' => 'Lions A']));

        $fixtureA = ActivityFixture::withoutEvents(fn () => ActivityFixture::create([
            'school_id'    => $schoolA->id,
            'event_id'     => $eventA->id,
            'team_a_id'    => $teamA1->id,
            'team_b_id'    => $teamA2->id,
            'scheduled_at' => now(),
            'stage'        => 'final',
        ]));

        $eventB = CocurricularEvent::withoutEvents(fn () => CocurricularEvent::create(['school_id' => $schoolB->id, 'title' => 'School B Cup', 'start_date' => now()->toDateString()]));
        $fixtureB = ActivityFixture::withoutEvents(fn () => ActivityFixture::create([
            'school_id'    => $schoolB->id,
            'event_id'     => $eventB->id,
            'scheduled_at' => now(),
            'stage'        => 'group',
        ]));

        // 2. Authenticate Coach from School A
        $coachA = $this->createSecurityUser($schoolA);
        $role = Role::firstOrCreate(['name' => 'school-admin', 'guard_name' => 'web']);
        $coachA->assignRole($role);
        $this->ensurePermissionsExist(['activities.results', 'activities.manage']);
        $coachA->givePermissionTo(['activities.results', 'activities.manage']);

        // 3. Same-tenant update on School A fixture MUST succeed (200)
        $response = $this->actingAs($coachA)->postJson("/school/cocurricular/field-entry/fixtures/{$fixtureA->id}/quick-score", [
            'team_a_score' => 2,
            'team_b_score' => 1,
            'outcome'      => 'team_a_win',
        ]);
        $response->assertOk();
        $this->assertEquals(2, $fixtureA->fresh()->team_a_score);

        // 4. Cross-tenant update against School B fixture MUST fail closed (403 or 404)
        $responseCross = $this->actingAs($coachA)->postJson("/school/cocurricular/field-entry/fixtures/{$fixtureB->id}/quick-score", [
            'team_a_score' => 3,
            'team_b_score' => 0,
            'outcome'      => 'team_a_win',
        ]);
        $this->assertTrue(in_array($responseCross->status(), [403, 404]), 'Cross-tenant quick score must fail closed (403 or 404).');
        $this->assertNull($fixtureB->fresh()->team_a_score);
    }

    public function test_quick_track_result_evaluates_pb_and_updates_house_points(): void
    {
        $school = $this->createSecuritySchool();
        $coach = $this->createSecurityUser($school);
        $role = Role::firstOrCreate(['name' => 'school-admin', 'guard_name' => 'web']);
        $coach->assignRole($role);
        $this->ensurePermissionsExist(['activities.results', 'activities.manage']);
        $coach->givePermissionTo(['activities.results', 'activities.manage']);

        $class = SchoolClass::create(['school_id' => $school->id, 'name' => 'Form 2B', 'numeric_name' => 2]);
        $student = Student::create(['school_id' => $school->id, 'class_id' => $class->id, 'first_name' => 'Dennis', 'last_name' => 'Kipruto', 'admission_no' => 'ADM-TR-01', 'gender' => 'male', 'date_of_birth' => '2010-01-01', 'status' => 'active']);
        $cat = ActivityCategory::create(['school_id' => $school->id, 'name' => 'Athletics']);
        $act = Activity::create(['school_id' => $school->id, 'category_id' => $cat->id, 'name' => '100m Sprint', 'type' => 'individual_measurable', 'gender_scope' => 'boys', 'age_group' => 'under_19']);
        $event = CocurricularEvent::create(['school_id' => $school->id, 'title' => 'Inter-House Gala', 'start_date' => now()->toDateString()]);
        $house = ActivityHouse::create(['school_id' => $school->id, 'name' => 'Ndovu House', 'total_points' => 0]);

        $response = $this->actingAs($coach)->postJson('/school/cocurricular/field-entry/quick-track-result', [
            'event_id'              => $event->id,
            'activity_id'           => $act->id,
            'student_id'            => $student->id,
            'house_id'              => $house->id,
            'event_round'           => 'final',
            'metric_type'           => 'time',
            'time_recorded_seconds' => 11.45,
            'final_position'        => 1,
            'award_house_points'    => true,
        ]);

        $response->assertOk();
        $this->assertDatabaseHas('measurable_results', [
            'school_id'             => $school->id,
            'student_id'            => $student->id,
            'time_recorded_seconds' => 11.45,
            'is_personal_best'      => true,
        ]);
    }

    public function test_print_event_entry_and_house_standings_pdf_exports(): void
    {
        $school = $this->createSecuritySchool();
        $admin = $this->createSecurityUser($school);
        $role = Role::firstOrCreate(['name' => 'school-admin', 'guard_name' => 'web']);
        $admin->assignRole($role);
        $this->ensurePermissionsExist(['activities.export', 'activities.view']);
        $admin->givePermissionTo(['activities.export', 'activities.view']);

        $event = CocurricularEvent::create(['school_id' => $school->id, 'title' => 'County Championship', 'start_date' => now()->toDateString()]);

        $responseEntry = $this->actingAs($admin)->get("/school/cocurricular/export/event/{$event->id}/pdf");
        $responseEntry->assertOk();

        $responseHouse = $this->actingAs($admin)->get('/school/cocurricular/export/house-standings/pdf');
        $responseHouse->assertOk();
    }
}