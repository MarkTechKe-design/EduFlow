<?php

namespace Tests\Support;

use App\Models\School;
use App\Models\Staff;
use App\Models\StaffDocument;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

trait CreatesStaffSecurityFixtures
{
    /** @param array<int, string> $permissions */
    protected function createStaffSecurityUser(string $roleName, ?School $school, array $permissions = []): User
    {
        $user = $this->createSecurityUser($school, [
            'email' => $roleName . '-' . uniqid() . '@example.test',
        ]);

        $role = Role::firstOrCreate([
            'name' => $roleName,
            'guard_name' => 'web',
        ]);

        $permissionModels = collect($permissions)
            ->map(fn (string $permission) => Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]));

        $role->syncPermissions($permissionModels);
        $user->assignRole($role);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    /** @param array<string, mixed> $attributes */
    protected function createStaffFixture(School $school, array $attributes = []): Staff
    {
        return Staff::query()->create(array_merge([
            'school_id' => $school->id,
            'first_name' => 'Security Staff',
            'last_name' => 'Fixture',
            'gender' => 'other',
            'salary_type' => 'fixed',
            'status' => 'active',
        ], $attributes));
    }

    protected function createStaffDocumentFixture(Staff $staff, array $attributes = []): StaffDocument
    {
        return StaffDocument::query()->create(array_merge([
            'school_id' => $staff->school_id,
            'staff_id' => $staff->id,
            'title' => 'Employment Certificate',
            'file_path' => 'security/staff-document.pdf',
            'file_type' => 'application/pdf',
            'file_size' => 1024,
        ], $attributes));
    }
}
