<?php

namespace Tests\Support;

use App\Models\FeeCategory;
use App\Models\FeePayment;
use App\Models\FeeStructure;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

trait CreatesFeePaymentSecurityFixtures
{
    /** @param array<int, string> $permissions */
    protected function createFeeSecurityUser(string $roleName, ?School $school, array $permissions = []): User
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

    protected function createFeeStudent(School $school): Student
    {
        $class = SchoolClass::query()->create([
            'school_id' => $school->id,
            'name' => 'Fee Security Class ' . uniqid(),
            'numeric_name' => 1,
        ]);

        return Student::query()->create([
            'school_id' => $school->id,
            'class_id' => $class->id,
            'first_name' => 'Fee Student',
            'last_name' => 'Fixture',
            'gender' => 'other',
            'category' => 'general',
            'status' => 'active',
        ]);
    }

    protected function createFeeStructure(School $school, Student $student): FeeStructure
    {
        $category = FeeCategory::query()->create([
            'school_id' => $school->id,
            'name' => 'Tuition ' . uniqid(),
            'type' => 'tuition',
            'is_active' => true,
        ]);

        return FeeStructure::query()->create([
            'school_id' => $school->id,
            'class_id' => $student->class_id,
            'fee_category_id' => $category->id,
            'academic_year' => '2026-2027',
            'amount' => 1000,
            'frequency' => 'monthly',
            'is_active' => true,
        ]);
    }

    protected function createFeePayment(School $school, Student $student, FeeStructure $structure): FeePayment
    {
        return FeePayment::query()->create([
            'school_id' => $school->id,
            'student_id' => $student->id,
            'fee_structure_id' => $structure->id,
            'amount_due' => 1000,
            'amount_paid' => 500,
            'discount' => 0,
            'fine' => 0,
            'payment_date' => '2026-08-01',
            'month_year' => '2026-08',
            'method' => 'cash',
            'status' => 'partial',
        ]);
    }
}
