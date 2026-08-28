<?php

namespace Tests\Feature\Reports;

use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ExportAndSearchIntegrityTest extends TestCase
{
    use RefreshDatabase;

    protected School $schoolA;
    protected School $schoolB;
    protected User $adminA;
    protected User $adminB;
    protected Student $studentA;
    protected Student $studentB;

    protected function setUp(): void
    {
        parent::setUp();

        $roles = ['school-admin', 'accountant', 'teacher'];
        foreach ($roles as $r) {
            Role::firstOrCreate(['name' => $r, 'guard_name' => 'web']);
        }

        $permissions = [
            'students.view', 'students.export',
            'fees.view', 'fees.collect', 'reports.view', 'reports.export',
            'attendance.view', 'attendance.export',
        ];
        foreach ($permissions as $p) {
            Permission::firstOrCreate(['name' => $p, 'guard_name' => 'web']);
        }

        $adminRole = Role::findByName('school-admin', 'web');
        $adminRole->givePermissionTo(Permission::all());

        // Create Tenant A
        $this->schoolA = School::create([
            'name'                    => 'Export Test Academy A',
            'slug'                    => 'export-academy-a',
            'status'                  => 'active',
            'country'                 => 'KE',
            'currency'                => 'KES',
            'timezone'                => 'Africa/Nairobi',
            'curriculum'              => 'cbc',
            'onboarding_completed_at' => now(),
        ]);

        $this->adminA = (new User)->forceFill([
            'school_id'         => $this->schoolA->id,
            'name'              => 'Admin School A',
            'email'             => 'admin_a@exporttest.test',
            'password'          => bcrypt('Password123!'),
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);
        $this->adminA->save();
        $this->adminA->assignRole('school-admin');

        $classA = SchoolClass::create(['school_id' => $this->schoolA->id, 'name' => 'Grade 1 Alpha']);
        $sectionA = Section::create(['school_id' => $this->schoolA->id, 'class_id' => $classA->id, 'name' => 'Stream A']);

        $this->studentA = Student::create([
            'school_id'     => $this->schoolA->id,
            'user_id'       => $this->adminA->id,
            'admission_no'  => 'ADM-EXP-A-001',
            'first_name'    => 'John',
            'last_name'     => 'Doe',
            'gender'        => 'male',
            'status'        => 'active',
            'class_id'      => $classA->id,
            'section_id'    => $sectionA->id,
            'date_of_birth' => '2016-01-01',
        ]);

        // Create Tenant B (Foreign School)
        $this->schoolB = School::create([
            'name'                    => 'Export Test Academy B',
            'slug'                    => 'export-academy-b',
            'status'                  => 'active',
            'country'                 => 'KE',
            'currency'                => 'KES',
            'timezone'                => 'Africa/Nairobi',
            'curriculum'              => 'cbc',
            'onboarding_completed_at' => now(),
        ]);

        $this->adminB = (new User)->forceFill([
            'school_id'         => $this->schoolB->id,
            'name'              => 'Admin School B',
            'email'             => 'admin_b@exporttest.test',
            'password'          => bcrypt('Password123!'),
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);
        $this->adminB->save();
        $this->adminB->assignRole('school-admin');

        $classB = SchoolClass::create(['school_id' => $this->schoolB->id, 'name' => 'Grade 1 Beta']);
        $sectionB = Section::create(['school_id' => $this->schoolB->id, 'class_id' => $classB->id, 'name' => 'Stream B']);

        $this->studentB = Student::create([
            'school_id'     => $this->schoolB->id,
            'user_id'       => $this->adminB->id,
            'admission_no'  => 'ADM-EXP-B-999',
            'first_name'    => 'SecretForeign',
            'last_name'     => 'Student',
            'gender'        => 'female',
            'status'        => 'active',
            'class_id'      => $classB->id,
            'section_id'    => $sectionB->id,
            'date_of_birth' => '2016-02-02',
        ]);
    }

    public function test_student_csv_export_produces_clean_stream_and_enforces_tenant_isolation(): void
    {
        $response = $this->actingAs($this->adminA)->get('/school/students/export');

        $response->assertStatus(200);
        $this->assertTrue(str_contains((string) $response->headers->get('content-type'), 'text/csv'));

        ob_start();
        $response->sendContent();
        $content = ob_get_clean();

        $this->assertStringContainsString('ADM-EXP-A-001', $content);
        $this->assertStringContainsString('John', $content);
        $this->assertStringContainsString('Doe', $content);

        // Tenant Isolation: Foreign school data must never appear in export
        $this->assertStringNotContainsString('ADM-EXP-B-999', $content);
        $this->assertStringNotContainsString('SecretForeign', $content);

        // Cleanliness: No HTML tags in stream
        $this->assertStringNotContainsString('<!DOCTYPE html>', $content);
        $this->assertStringNotContainsString('<table', $content);
    }

    public function test_custom_report_csv_export_enforces_clean_tabular_data(): void
    {
        $response = $this->actingAs($this->adminA)->get('/school/reports/custom/export-csv?entity=students');

        $response->assertStatus(200);
        $this->assertTrue(str_contains((string) $response->headers->get('content-type'), 'text/csv'));

        ob_start();
        $response->sendContent();
        $content = ob_get_clean();

        $this->assertStringContainsString('ADM-EXP-A-001', $content);
        $this->assertStringNotContainsString('ADM-EXP-B-999', $content);
    }

    public function test_instant_search_is_tenant_isolated_and_filters_accurately(): void
    {
        // 1. Search for Student A from School A Admin
        $responseA = $this->actingAs($this->adminA)->get('/school/students?search=John');
        $responseA->assertStatus(200);

        // 2. Search for Student B from School A Admin should return 0 results
        $responseForeign = $this->actingAs($this->adminA)->get('/school/students?search=SecretForeign');
        $responseForeign->assertStatus(200);
        $responseForeign->assertDontSee('ADM-EXP-B-999');
    }
}