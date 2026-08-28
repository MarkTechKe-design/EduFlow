<?php

namespace Tests\Feature\Reports;

use App\Models\School;
use App\Models\Staff;
use App\Models\User;
use App\Models\VisitorLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class Track85DataOperationsTest extends TestCase
{
    use RefreshDatabase;

    protected School $schoolA;
    protected School $schoolB;
    protected User $adminA;
    protected User $adminB;

    protected function setUp(): void
    {
        parent::setUp();

        $roles = ['school-admin', 'teacher', 'accountant'];
        foreach ($roles as $r) {
            Role::firstOrCreate(['name' => $r, 'guard_name' => 'web']);
        }

        $permissions = [
            'staff.view', 'staff.create', 'staff.edit', 'staff.delete',
            'settings.view', 'settings.edit',
        ];
        foreach ($permissions as $p) {
            Permission::firstOrCreate(['name' => $p, 'guard_name' => 'web']);
        }

        $adminRole = Role::findByName('school-admin', 'web');
        $adminRole->givePermissionTo(Permission::all());

        $this->schoolA = School::create([
            'name'                    => 'Track 85 Academy A',
            'slug'                    => 'track-85-a',
            'status'                  => 'active',
            'country'                 => 'KE',
            'currency'                => 'KES',
            'timezone'                => 'Africa/Nairobi',
            'curriculum'              => 'cbc',
            'onboarding_completed_at' => now(),
        ]);

        $this->adminA = (new User)->forceFill([
            'school_id'         => $this->schoolA->id,
            'name'              => 'Admin 85 A',
            'email'             => 'admin_a@track85.test',
            'password'          => bcrypt('Password123!'),
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);
        $this->adminA->save();
        $this->adminA->assignRole('school-admin');

        $this->schoolB = School::create([
            'name'                    => 'Track 85 Academy B',
            'slug'                    => 'track-85-b',
            'status'                  => 'active',
            'country'                 => 'KE',
            'currency'                => 'KES',
            'timezone'                => 'Africa/Nairobi',
            'curriculum'              => 'cbc',
            'onboarding_completed_at' => now(),
        ]);

        $this->adminB = (new User)->forceFill([
            'school_id'         => $this->schoolB->id,
            'name'              => 'Admin 85 B',
            'email'             => 'admin_b@track85.test',
            'password'          => bcrypt('Password123!'),
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);
        $this->adminB->save();
        $this->adminB->assignRole('school-admin');
    }

    public function test_visitor_log_csv_export_is_tenant_isolated_and_clean(): void
    {
        VisitorLog::create([
            'school_id'      => $this->schoolA->id,
            'name'           => 'Alice Visitor A',
            'phone'          => '0711000111',
            'id_number'      => '11223344',
            'person_to_meet' => 'Principal A',
            'purpose'        => 'Meeting',
            'time_in'        => now(),
        ]);

        VisitorLog::create([
            'school_id'      => $this->schoolB->id,
            'name'           => 'Bob Secret Visitor B',
            'phone'          => '0722999888',
            'id_number'      => '99887766',
            'person_to_meet' => 'Principal B',
            'purpose'        => 'Inspection',
            'time_in'        => now(),
        ]);

        $res = $this->actingAs($this->adminA)->get('/school/admissions/visitors/export-csv');
        $res->assertStatus(200);

        ob_start();
        $res->sendContent();
        $content = ob_get_clean();

        $this->assertStringContainsString('Alice Visitor A', $content);
        $this->assertStringContainsString('11223344', $content);

        // Strict Tenant Isolation Assertion
        $this->assertStringNotContainsString('Bob Secret Visitor B', $content);
        $this->assertStringNotContainsString('99887766', $content);
    }

    public function test_staff_csv_import_template_and_process_workflow(): void
    {
        // 1. Download template
        $templateRes = $this->actingAs($this->adminA)->get('/school/staff/import/template');
        $templateRes->assertStatus(200);
        $templateRes->assertHeader('content-type', 'text/csv; charset=UTF-8');

        // 2. Process import
        $payload = [
            'staff' => [
                [
                    'first_name' => 'Peter',
                    'last_name'  => 'Otieno',
                    'gender'     => 'male',
                    'salary'     => 50000,
                ],
                [
                    'first_name' => 'Grace',
                    'last_name'  => 'Wanjiku',
                    'gender'     => 'female',
                    'salary'     => 38000,
                ],
            ],
        ];

        $importRes = $this->actingAs($this->adminA)->postJson('/school/staff/import/process', $payload);
        $importRes->assertStatus(200);
        $importRes->assertJson(['success' => true, 'imported' => 2]);

        $this->assertDatabaseHas('staff', [
            'school_id'  => $this->schoolA->id,
            'first_name' => 'Peter',
            'last_name'  => 'Otieno',
        ]);

        $this->assertDatabaseHas('staff', [
            'school_id'  => $this->schoolA->id,
            'first_name' => 'Grace',
            'last_name'  => 'Wanjiku',
        ]);

        // Verify Tenant B has no records
        $this->assertSame(0, Staff::withoutGlobalScopes()->where('school_id', $this->schoolB->id)->count());
    }
}