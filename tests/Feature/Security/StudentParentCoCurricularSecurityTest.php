<?php

namespace Tests\Feature\Security;

use App\Models\Activity;
use App\Models\ActivityCategory;
use App\Models\ActivityHouse;
use App\Models\ActivityTeam;
use App\Models\ActivityTeamMember;
use App\Models\Guardian;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use App\Services\CoCurricularService;
use Spatie\Permission\Models\Role;
use Tests\Support\SecurityTestCase;

class StudentParentCoCurricularSecurityTest extends SecurityTestCase
{
    private function setupStudentWithActivity(School $school, User $user, string $admNo): Student
    {
        $class = SchoolClass::firstOrCreate([
            'school_id'    => $school->id,
            'name'         => 'Grade 8A',
            'numeric_name' => 8,
        ]);

        return Student::create([
            'school_id'     => $school->id,
            'user_id'       => $user->id,
            'class_id'      => $class->id,
            'first_name'    => 'Student',
            'last_name'     => $admNo,
            'admission_no'  => $admNo,
            'gender'        => 'male',
            'date_of_birth' => '2012-01-01',
            'status'        => 'active',
        ]);
    }

    public function test_student_can_view_own_cocurricular_passport(): void
    {
        $school = $this->createSecuritySchool();
        $studentUser = $this->createSecurityUser($school);
        $studentRole = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
        $studentUser->assignRole($studentRole);

        $student = $this->setupStudentWithActivity($school, $studentUser, 'ADM-STD-001');

        $cat = ActivityCategory::create(['school_id' => $school->id, 'name' => 'Sports']);
        $act = Activity::create([
            'school_id'    => $school->id,
            'category_id'  => $cat->id,
            'name'         => 'Football',
            'type'         => 'team_fixture',
            'gender_scope' => 'boys',
            'age_group'    => 'under_16',
        ]);

        $team = ActivityTeam::create([
            'school_id'   => $school->id,
            'activity_id' => $act->id,
            'name'        => 'Junior Varsity',
            'age_group'   => 'under_16',
            'gender'      => 'boys',
        ]);

        ActivityTeamMember::create([
            'school_id'     => $school->id,
            'team_id'       => $team->id,
            'student_id'    => $student->id,
            'role'          => 'starter',
            'jersey_number' => '10',
            'status'        => 'active',
        ]);

        $response = $this->actingAs($studentUser)->get('/student/cocurricular');
        $response->assertOk();
    }

    public function test_student_cannot_mutate_achievements_or_house_points(): void
    {
        $school = $this->createSecuritySchool();
        $studentUser = $this->createSecurityUser($school);
        $studentRole = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
        $studentUser->assignRole($studentRole);

        $student = $this->setupStudentWithActivity($school, $studentUser, 'ADM-STD-002');
        $house = ActivityHouse::create(['school_id' => $school->id, 'name' => 'Simba House']);

        // Student tries to award house points
        $response = $this->actingAs($studentUser)->post('/school/cocurricular/houses/award-points', [
            'house_id'      => $house->id,
            'position_rank' => '1st',
            'reason'        => 'Self Award Attempt',
            'student_id'    => $student->id,
        ]);
        $response->assertForbidden();

        // Student tries to create official achievement
        $responseAch = $this->actingAs($studentUser)->post('/school/cocurricular/talent/achievements', [
            'student_id'        => $student->id,
            'award_title'       => 'Fake Trophy',
            'award_type'        => 'trophy',
            'competition_level' => 'national',
            'awarded_date'      => now()->toDateString(),
        ]);
        $responseAch->assertForbidden();
    }

    public function test_parent_can_view_own_child_cocurricular_records(): void
    {
        $school = $this->createSecuritySchool();
        $parentUser = $this->createSecurityUser($school);
        $parentRole = Role::firstOrCreate(['name' => 'parent', 'guard_name' => 'web']);
        $parentUser->assignRole($parentRole);

        $guardian = Guardian::create([
            'school_id' => $school->id,
            'user_id'   => $parentUser->id,
            'name'      => 'Parent One',
            'phone'     => '0711000000',
            'email'     => $parentUser->email,
        ]);

        $studentUser = $this->createSecurityUser($school);
        $child = $this->setupStudentWithActivity($school, $studentUser, 'ADM-CHILD-01');
        $child->update(['guardian_id' => $guardian->id]);

        $response = $this->actingAs($parentUser)->get('/parent/cocurricular?student_id=' . $child->id);
        $response->assertOk();
    }

    public function test_parent_cannot_view_another_parents_child(): void
    {
        $school = $this->createSecuritySchool();

        $parentA = $this->createSecurityUser($school);
        $parentRole = Role::firstOrCreate(['name' => 'parent', 'guard_name' => 'web']);
        $parentA->assignRole($parentRole);

        $parentB = $this->createSecurityUser($school);
        $parentB->assignRole($parentRole);

        $guardianB = Guardian::create([
            'school_id' => $school->id,
            'user_id'   => $parentB->id,
            'name'      => 'Parent B',
            'phone'     => '0722000000',
            'email'     => $parentB->email,
        ]);

        $studentUserB = $this->createSecurityUser($school);
        $childB = $this->setupStudentWithActivity($school, $studentUserB, 'ADM-CHILD-B');
        $childB->update(['guardian_id' => $guardianB->id]);

        // Parent A tries to export Parent B child's PDF (Must fail closed: 403 or 404)
        $response = $this->actingAs($parentA)->get("/parent/talent-passport/{$childB->id}/pdf");
        $this->assertTrue(in_array($response->status(), [403, 404]), 'Accessing another parent child must fail closed.');
    }

    public function test_parent_cannot_cross_tenant_boundaries(): void
    {
        $schoolA = $this->createSecuritySchool();
        $schoolB = $this->createSecuritySchool();

        $parentA = $this->createSecurityUser($schoolA);
        $parentRole = Role::firstOrCreate(['name' => 'parent', 'guard_name' => 'web']);
        $parentA->assignRole($parentRole);

        $studentUserB = $this->createSecurityUser($schoolB);
        $childB = $this->setupStudentWithActivity($schoolB, $studentUserB, 'ADM-CHILD-B2');

        // Parent A in School A attempts to export Child in School B (Must fail closed: 403 or 404)
        $response = $this->actingAs($parentA)->get("/parent/talent-passport/{$childB->id}/pdf");
        $this->assertTrue(in_array($response->status(), [403, 404]), 'Cross-tenant parent access must fail closed.');
    }

    public function test_house_standings_are_strictly_tenant_scoped(): void
    {
        $schoolA = $this->createSecuritySchool();
        $schoolB = $this->createSecuritySchool();

        $houseA = ActivityHouse::create(['school_id' => $schoolA->id, 'name' => 'Simba School A', 'total_points' => 100]);
        $houseB = ActivityHouse::create(['school_id' => $schoolB->id, 'name' => 'Chui School B', 'total_points' => 500]);

        $standingsA = CoCurricularService::recalculateHouseStandings($schoolA->id);
        $this->assertTrue($standingsA->contains(fn ($h) => (int)$h->id === (int)$houseA->id));
        $this->assertFalse($standingsA->contains(fn ($h) => (int)$h->id === (int)$houseB->id));
    }
}