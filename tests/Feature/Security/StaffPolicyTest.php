<?php

namespace Tests\Feature\Security;

use App\Models\Staff;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Support\CreatesStaffSecurityFixtures;
use Tests\Support\SecurityTestCase;

class StaffPolicyTest extends SecurityTestCase
{
    use CreatesStaffSecurityFixtures;

    public function test_guests_cannot_access_staff_routes(): void
    {
        $this->get('/school/staff')->assertRedirect(route('login'));
    }

    public function test_school_admin_can_use_staff_crud_routes_in_their_tenant(): void
    {
        $school = $this->createSecuritySchool();
        $admin = $this->createStaffSecurityUser('school-admin', $school, [
            'staff.view', 'staff.create', 'staff.edit', 'staff.delete',
        ]);
        $staff = $this->createStaffFixture($school);

        $this->actingAs($admin)->get('/school/staff')->assertOk();
        $this->actingAs($admin)->get('/school/staff/create')->assertOk();
        $this->actingAs($admin)->get('/school/staff/' . $staff->id)->assertOk();

        $this->actingAs($admin)->put('/school/staff/' . $staff->id, $this->staffPayload([
            'first_name' => 'Updated Staff',
        ]))->assertRedirect();

        $this->assertDatabaseHas('staff', [
            'id' => $staff->id,
            'first_name' => 'Updated Staff',
        ]);

        $this->actingAs($admin)->post('/school/staff', $this->staffPayload([
            'first_name' => 'Created Staff',
        ]))->assertRedirect(route('school.staff.index'));

        $this->assertDatabaseHas('staff', [
            'school_id' => $school->id,
            'first_name' => 'Created Staff',
        ]);

        $this->actingAs($admin)->delete('/school/staff/' . $staff->id)->assertRedirect(route('school.staff.index'));
        $this->assertSoftDeleted('staff', ['id' => $staff->id]);
    }

    public function test_principal_and_librarian_can_view_but_cannot_mutate_staff(): void
    {
        $school = $this->createSecuritySchool();
        $staff = $this->createStaffFixture($school);

        foreach (['principal', 'librarian'] as $role) {
            $user = $this->createStaffSecurityUser($role, $school, ['staff.view']);

            $this->actingAs($user)->get('/school/staff/' . $staff->id)->assertOk();
            $this->actingAs($user)
                ->put('/school/staff/' . $staff->id, $this->staffPayload())
                ->assertForbidden();
        }
    }

    public function test_roles_without_staff_view_are_denied_by_route_or_policy(): void
    {
        $school = $this->createSecuritySchool();

        foreach (['teacher', 'accountant', 'receptionist', 'driver', 'warden', 'store-manager', 'student', 'parent'] as $role) {
            $user = $this->createStaffSecurityUser($role, $school);

            $this->actingAs($user)->get('/school/staff')->assertForbidden();
        }
    }

    public function test_cross_tenant_staff_cannot_be_reached_through_route_binding(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $adminA = $this->createStaffSecurityUser('school-admin', $schoolA, [
            'staff.view', 'staff.edit', 'staff.delete',
        ]);
        $staffB = $this->createStaffFixture($schoolB);

        $this->actingAs($adminA)
            ->get('/school/staff/' . $staffB->id)
            ->assertNotFound();
    }

    public function test_super_admin_without_tenant_context_cannot_access_staff_routes(): void
    {
        $superAdmin = $this->createStaffSecurityUser('super-admin', null, [
            'staff.view', 'staff.create', 'staff.edit', 'staff.delete',
        ]);

        $this->actingAs($superAdmin)->get('/school/staff')->assertForbidden();
    }

    public function test_staff_document_upload_and_delete_require_staff_permissions_and_ownership(): void
    {
        Storage::fake('private');
        $school = $this->createSecuritySchool();
        $admin = $this->createStaffSecurityUser('school-admin', $school, [
            'staff.view', 'staff.edit', 'staff.delete',
        ]);
        $principal = $this->createStaffSecurityUser('principal', $school, ['staff.view']);
        $staff = $this->createStaffFixture($school);

        $upload = $this->actingAs($admin)->post('/school/staff/' . $staff->id . '/documents', [
            'title' => 'Contract',
            'file' => UploadedFile::fake()->create('contract.pdf', 10, 'application/pdf'),
        ]);

        $upload->assertRedirect();
        $document = \App\Models\StaffDocument::query()->where('staff_id', $staff->id)->firstOrFail();

        $this->actingAs($principal)
            ->delete('/school/staff/documents/' . $document->id)
            ->assertForbidden();

        $this->actingAs($admin)
            ->delete('/school/staff/documents/' . $document->id)
            ->assertRedirect();

        $this->assertDatabaseMissing('staff_documents', ['id' => $document->id]);
    }

    /** @return array<string, mixed> */
    private function staffPayload(array $overrides = []): array
    {
        return array_merge([
            'first_name' => 'Staff Payload',
            'last_name' => 'Fixture',
            'gender' => 'other',
            'salary_type' => 'fixed',
            'status' => 'active',
        ], $overrides);
    }
}
