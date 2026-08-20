<?php

namespace Tests\Unit\Security;

use App\Models\Staff;
use App\Models\StaffDocument;
use Illuminate\Support\Facades\Gate;
use Tests\Support\CreatesStaffSecurityFixtures;
use Tests\Support\SecurityTestCase;

class StaffPolicyTest extends SecurityTestCase
{
    use CreatesStaffSecurityFixtures;

    public function test_staff_and_staff_document_policies_are_registered(): void
    {
        $this->assertInstanceOf(\App\Policies\StaffPolicy::class, Gate::getPolicyFor(Staff::class));
        $this->assertInstanceOf(\App\Policies\StaffDocumentPolicy::class, Gate::getPolicyFor(StaffDocument::class));
    }

    public function test_school_admin_can_use_all_staff_abilities_in_their_tenant(): void
    {
        $school = $this->createSecuritySchool();
        $admin = $this->createStaffSecurityUser('school-admin', $school, [
            'staff.view', 'staff.create', 'staff.edit', 'staff.delete',
        ]);
        $staff = $this->createStaffFixture($school);
        $document = $this->createStaffDocumentFixture($staff);

        $gate = Gate::forUser($admin);

        $this->assertTrue($gate->allows('viewAny', Staff::class));
        $this->assertTrue($gate->allows('view', $staff));
        $this->assertTrue($gate->allows('create', Staff::class));
        $this->assertTrue($gate->allows('update', $staff));
        $this->assertTrue($gate->allows('delete', $staff));
        $this->assertTrue($gate->allows('restore', $staff));
        $this->assertTrue($gate->allows('forceDelete', $staff));
        $this->assertTrue($gate->allows('uploadDocument', $staff));
        $this->assertTrue($gate->allows('view', $document));
        $this->assertTrue($gate->allows('delete', $document));
        $this->assertTrue($gate->allows('deleteDocument', $document));
    }

    public function test_principal_and_librarian_have_view_only_staff_access(): void
    {
        $school = $this->createSecuritySchool();
        $staff = $this->createStaffFixture($school);

        foreach (['principal', 'librarian'] as $role) {
            $user = $this->createStaffSecurityUser($role, $school, ['staff.view']);
            $gate = Gate::forUser($user);

            $this->assertTrue($gate->allows('viewAny', Staff::class));
            $this->assertTrue($gate->allows('view', $staff));
            $this->assertFalse($gate->allows('create', Staff::class));
            $this->assertFalse($gate->allows('update', $staff));
            $this->assertFalse($gate->allows('delete', $staff));
            $this->assertFalse($gate->allows('restore', $staff));
            $this->assertFalse($gate->allows('forceDelete', $staff));
            $this->assertFalse($gate->allows('uploadDocument', $staff));
        }
    }

    public function test_each_staff_permission_maps_to_only_its_intended_ability(): void
    {
        $school = $this->createSecuritySchool();
        $staff = $this->createStaffFixture($school);

        $viewUser = $this->createStaffSecurityUser('staff-view-only', $school, ['staff.view']);
        $this->assertTrue(Gate::forUser($viewUser)->allows('view', $staff));
        $this->assertFalse(Gate::forUser($viewUser)->allows('create', Staff::class));

        $createUser = $this->createStaffSecurityUser('staff-create-only', $school, ['staff.create']);
        $this->assertTrue(Gate::forUser($createUser)->allows('create', Staff::class));
        $this->assertFalse(Gate::forUser($createUser)->allows('view', $staff));

        $editUser = $this->createStaffSecurityUser('staff-edit-only', $school, ['staff.edit']);
        $this->assertTrue(Gate::forUser($editUser)->allows('update', $staff));
        $this->assertTrue(Gate::forUser($editUser)->allows('uploadDocument', $staff));
        $this->assertFalse(Gate::forUser($editUser)->allows('delete', $staff));

        $deleteUser = $this->createStaffSecurityUser('staff-delete-only', $school, ['staff.delete']);
        $this->assertTrue(Gate::forUser($deleteUser)->allows('delete', $staff));
        $this->assertTrue(Gate::forUser($deleteUser)->allows('restore', $staff));
        $this->assertTrue(Gate::forUser($deleteUser)->allows('forceDelete', $staff));
    }

    public function test_cross_tenant_staff_is_denied_for_every_staff_ability(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $user = $this->createStaffSecurityUser('school-admin', $schoolA, [
            'staff.view', 'staff.create', 'staff.edit', 'staff.delete',
        ]);
        $staffB = $this->createStaffFixture($schoolB);

        $gate = Gate::forUser($user);

        foreach (['view', 'update', 'delete', 'restore', 'forceDelete', 'uploadDocument'] as $ability) {
            $this->assertFalse($gate->allows($ability, $staffB));
        }

        $this->assertTrue($gate->allows('create', Staff::class));
    }

    public function test_cross_tenant_or_mismatched_staff_documents_are_denied(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $user = $this->createStaffSecurityUser('school-admin', $schoolA, ['staff.view', 'staff.delete']);
        $staffA = $this->createStaffFixture($schoolA);
        $staffB = $this->createStaffFixture($schoolB);
        $documentA = $this->createStaffDocumentFixture($staffA);
        $documentB = $this->createStaffDocumentFixture($staffB);
        $mismatched = $this->createStaffDocumentFixture($staffB, ['school_id' => $schoolA->id]);

        $gate = Gate::forUser($user);

        $this->assertTrue($gate->allows('view', $documentA));
        $this->assertTrue($gate->allows('deleteDocument', $documentA));
        $this->assertFalse($gate->allows('view', $documentB));
        $this->assertFalse($gate->allows('delete', $documentB));
        $this->assertFalse($gate->allows('deleteDocument', $mismatched));
    }

    public function test_users_without_staff_permissions_are_denied(): void
    {
        $school = $this->createSecuritySchool();
        $staff = $this->createStaffFixture($school);

        foreach (['teacher', 'accountant', 'receptionist', 'driver', 'warden', 'store-manager', 'student', 'parent'] as $role) {
            $user = $this->createStaffSecurityUser($role, $school);
            $gate = Gate::forUser($user);

            $this->assertFalse($gate->allows('viewAny', Staff::class));
            $this->assertFalse($gate->allows('view', $staff));
            $this->assertFalse($gate->allows('create', Staff::class));
            $this->assertFalse($gate->allows('update', $staff));
            $this->assertFalse($gate->allows('delete', $staff));
            $this->assertFalse($gate->allows('uploadDocument', $staff));
        }
    }

    public function test_super_admin_without_tenant_context_is_denied(): void
    {
        $school = $this->createSecuritySchool();
        $superAdmin = $this->createStaffSecurityUser('super-admin', null, [
            'staff.view', 'staff.create', 'staff.edit', 'staff.delete',
        ]);
        $staff = $this->createStaffFixture($school);

        $gate = Gate::forUser($superAdmin);

        $this->assertFalse($gate->allows('viewAny', Staff::class));
        $this->assertFalse($gate->allows('view', $staff));
        $this->assertFalse($gate->allows('create', Staff::class));
        $this->assertFalse($gate->allows('delete', $staff));
    }
}
