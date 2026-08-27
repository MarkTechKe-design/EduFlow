<?php

namespace Tests\Feature\Security;

use App\Models\Guardian;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\SchoolModule;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CoCurricularDashboardIntegrationTest extends TestCase
{
    use RefreshDatabase;

    private School $school;
    private SchoolClass $class;
    private User $admin;
    private User $studentUser;
    private Student $student;
    private User $parentUser;
    private Guardian $guardian;

    protected function setUp(): void
    {
        parent::setUp();

        $this->school = School::create([
            'name'   => 'Dashboard Test School',
            'slug'   => 'dash-school-' . uniqid(),
            'status' => 'active',
        ]);

        $this->class = SchoolClass::create([
            'school_id' => $this->school->id,
            'name'      => 'Grade 8',
        ]);

        $adminRole = Role::firstOrCreate(['name' => 'school-admin', 'guard_name' => 'web']);
        $studentRole = Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
        $parentRole = Role::firstOrCreate(['name' => 'parent', 'guard_name' => 'web']);

        $this->admin = User::factory()->create([
            'school_id' => $this->school->id,
            'status'    => 'active',
        ]);
        $this->admin->assignRole($adminRole);

        $this->studentUser = User::factory()->create([
            'school_id' => $this->school->id,
            'status'    => 'active',
        ]);
        $this->studentUser->assignRole($studentRole);

        $this->parentUser = User::factory()->create([
            'school_id' => $this->school->id,
            'status'    => 'active',
        ]);
        $this->parentUser->assignRole($parentRole);

        $this->guardian = Guardian::create([
            'school_id' => $this->school->id,
            'user_id'   => $this->parentUser->id,
            'name'      => 'Parent One',
            'phone'     => '0711000000',
            'email'     => $this->parentUser->email,
        ]);

        $this->student = Student::create([
            'school_id'     => $this->school->id,
            'class_id'      => $this->class->id,
            'user_id'       => $this->studentUser->id,
            'guardian_id'   => $this->guardian->id,
            'first_name'    => 'Kevin',
            'last_name'     => 'Omondi',
            'admission_no'  => 'ADM-DASH-01',
            'status'        => 'active',
        ]);
    }

    public function test_school_admin_dashboard_receives_cocurricular_summary_when_enabled(): void
    {
        $response = $this->actingAs($this->admin)->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => 
            $page->component('Dashboard')
                 ->has('cocurricularSummary')
                 ->where('cocurricularSummary.active_teams_count', 0)
                 ->where('cocurricularSummary.active_clubs_count', 0)
        );
    }

    public function test_school_admin_dashboard_hides_cocurricular_summary_when_disabled(): void
    {
        SchoolModule::create([
            'school_id'   => $this->school->id,
            'module_slug' => 'cocurricular',
            'is_enabled'  => false,
        ]);

        $response = $this->actingAs($this->admin)->get(route('dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => 
            $page->component('Dashboard')
                 ->where('cocurricularSummary', null)
        );
    }

    public function test_student_dashboard_receives_talent_summary_when_enabled(): void
    {
        $response = $this->actingAs($this->studentUser)->get(route('student.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => 
            $page->component('Student/Dashboard')
                 ->has('talentSummary')
                 ->where('talentSummary.summary.total_teams', 0)
        );
    }

    public function test_student_dashboard_hides_talent_summary_when_disabled(): void
    {
        SchoolModule::create([
            'school_id'   => $this->school->id,
            'module_slug' => 'cocurricular',
            'is_enabled'  => false,
        ]);

        $response = $this->actingAs($this->studentUser)->get(route('student.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => 
            $page->component('Student/Dashboard')
                 ->where('talentSummary', null)
        );
    }

    public function test_parent_dashboard_receives_child_talent_highlights_when_enabled(): void
    {
        $response = $this->actingAs($this->parentUser)->get(route('parent.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => 
            $page->component('Parent/Dashboard')
                 ->has('childrenTalent')
                 ->has("childrenTalent.{$this->student->id}")
        );
    }

    public function test_parent_dashboard_hides_child_talent_highlights_when_disabled(): void
    {
        SchoolModule::create([
            'school_id'   => $this->school->id,
            'module_slug' => 'cocurricular',
            'is_enabled'  => false,
        ]);

        $response = $this->actingAs($this->parentUser)->get(route('parent.dashboard'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => 
            $page->component('Parent/Dashboard')
                 ->where('childrenTalent', null)
        );
    }
}