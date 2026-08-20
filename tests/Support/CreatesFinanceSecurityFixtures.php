<?php

namespace Tests\Support;

use App\Models\Department;
use App\Models\FeeCategory;
use App\Models\FeeStructure;
use App\Models\Payroll;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\SalaryStructure;
use App\Models\Staff;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

trait CreatesFinanceSecurityFixtures
{
    protected function createFinanceSecurityUser(string $role, ?School $school, array $permissions = []): User
    {
        $user = $this->createSecurityUser($school, [
            'email' => $role . '-' . uniqid() . '@example.test',
        ]);
        $roleModel = Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        $permissionModels = collect($permissions)->map(fn (string $permission) => Permission::firstOrCreate([
            'name' => $permission,
            'guard_name' => 'web',
        ]));
        $roleModel->syncPermissions($permissionModels);
        $user->assignRole($roleModel);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    protected function createFinanceClass(School $school): SchoolClass
    {
        return SchoolClass::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'name' => 'Finance Class ' . uniqid(),
            'numeric_name' => 1,
        ]);
    }

    protected function createFinanceCategory(School $school): FeeCategory
    {
        return FeeCategory::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'name' => 'Tuition ' . uniqid(),
            'type' => 'tuition',
            'is_active' => true,
        ]);
    }

    protected function createFinanceStructure(School $school, SchoolClass $class, FeeCategory $category): FeeStructure
    {
        return FeeStructure::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'class_id' => $class->id,
            'fee_category_id' => $category->id,
            'academic_year' => '2026-2027',
            'amount' => 1000,
            'frequency' => 'monthly',
            'is_active' => true,
        ]);
    }

    protected function createFinanceDepartment(School $school): Department
    {
        return Department::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'name' => 'Finance Department ' . uniqid(),
            'code' => 'FIN-' . random_int(1000, 9999),
        ]);
    }

    protected function createFinanceStaff(School $school, ?Department $department = null): Staff
    {
        return Staff::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'department_id' => $department?->id,
            'first_name' => 'Finance',
            'last_name' => 'Staff',
            'gender' => 'other',
            'salary_type' => 'fixed',
            'status' => 'active',
        ]);
    }

    protected function createFinanceSalaryStructure(School $school, Staff $staff): SalaryStructure
    {
        return SalaryStructure::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'staff_id' => $staff->id,
            'basic_salary' => 50000,
            'allowances' => [],
            'deductions' => [],
            'is_active' => true,
        ]);
    }

    protected function createFinancePayroll(School $school, Staff $staff): Payroll
    {
        return Payroll::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'staff_id' => $staff->id,
            'month_year' => '2026-08',
            'basic_salary' => 50000,
            'total_allowances' => 0,
            'total_deductions' => 0,
            'net_salary' => 50000,
            'working_days' => 26,
            'present_days' => 26,
            'leave_days' => 0,
            'status' => 'generated',
        ]);
    }
}
