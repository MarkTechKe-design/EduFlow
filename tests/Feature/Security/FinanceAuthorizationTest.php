<?php

namespace Tests\Feature\Security;

use Tests\Support\CreatesFinanceSecurityFixtures;
use Tests\Support\SecurityTestCase;

class FinanceAuthorizationTest extends SecurityTestCase
{
    use CreatesFinanceSecurityFixtures;

    public function test_guests_cannot_access_finance_workflows(): void
    {
        foreach ([
            ['get', '/school/fees/categories'],
            ['get', '/school/fees/structures'],
            ['get', '/school/hr/payroll'],
            ['get', '/school/hr/salary-structure'],
            ['get', '/school/reports/finance'],
        ] as [$method, $url]) {
            $this->{$method}($url)->assertRedirect(route('login'));
        }
    }

    public function test_accountant_can_view_finance_and_payroll_with_existing_permissions(): void
    {
        $school = $this->createSecuritySchool();
        $accountant = $this->createFinanceSecurityUser('accountant', $school, [
            'fees.view', 'fees.structure', 'reports.view', 'payroll.view', 'payroll.generate', 'payslip.download',
        ]);
        $class = $this->createFinanceClass($school);
        $category = $this->createFinanceCategory($school);
        $this->createFinanceStructure($school, $class, $category);
        $department = $this->createFinanceDepartment($school);
        $staff = $this->createFinanceStaff($school, $department);
        $this->createFinanceSalaryStructure($school, $staff);
        $payroll = $this->createFinancePayroll($school, $staff);

        $this->actingAs($accountant)->get('/school/fees/categories')->assertOk();
        $this->actingAs($accountant)->get('/school/fees/structures')->assertOk();
        $this->actingAs($accountant)->get('/school/hr/salary-structure')->assertOk();
        $this->actingAs($accountant)->get('/school/hr/payroll')->assertOk();
        $this->actingAs($accountant)->get('/school/hr/payroll/' . $payroll->id . '/slip')->assertOk();
        $this->actingAs($accountant)->get('/school/reports/finance')->assertOk();
    }

    public function test_principal_can_view_finance_report_but_cannot_manage_fee_structures_or_payroll(): void
    {
        $school = $this->createSecuritySchool();
        $principal = $this->createFinanceSecurityUser('principal', $school, ['fees.view', 'reports.view']);
        $class = $this->createFinanceClass($school);
        $category = $this->createFinanceCategory($school);

        $this->actingAs($principal)->get('/school/reports/finance')->assertOk();
        $this->actingAs($principal)->get('/school/fees/categories')->assertForbidden();
        $this->actingAs($principal)->get('/school/fees/structures')->assertForbidden();
        $this->actingAs($principal)->post('/school/fees/structures', [
            'class_id' => $class->id,
            'fee_category_id' => $category->id,
            'academic_year' => '2026-2027',
            'amount' => 1000,
            'frequency' => 'monthly',
        ])->assertForbidden();
        $this->actingAs($principal)->get('/school/hr/payroll')->assertForbidden();
    }

    public function test_cross_tenant_fee_records_and_related_ids_are_denied(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $admin = $this->createFinanceSecurityUser('accountant', $schoolA, ['fees.structure']);
        $classB = $this->createFinanceClass($schoolB);
        $categoryB = $this->createFinanceCategory($schoolB);
        $structureB = $this->createFinanceStructure($schoolB, $classB, $categoryB);

        $this->actingAs($admin)->get('/school/fees/categories/' . $categoryB->id . '/edit')->assertNotFound();
        $this->actingAs($admin)->put('/school/fees/structures/' . $structureB->id, [
            'class_id' => $classB->id,
            'fee_category_id' => $categoryB->id,
            'academic_year' => '2026-2027',
            'amount' => 2000,
            'frequency' => 'monthly',
        ])->assertNotFound();
        $this->actingAs($admin)->post('/school/fees/structures', [
            'class_id' => $classB->id,
            'fee_category_id' => $categoryB->id,
            'academic_year' => '2026-2027',
            'amount' => 1000,
            'frequency' => 'monthly',
        ])->assertNotFound();
    }

    public function test_cross_tenant_payroll_records_and_staff_are_denied(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $admin = $this->createFinanceSecurityUser('payroll-admin', $schoolA, [
            'payroll.view', 'payroll.generate', 'payslip.download',
        ]);
        $departmentB = $this->createFinanceDepartment($schoolB);
        $staffB = $this->createFinanceStaff($schoolB, $departmentB);
        $payrollB = $this->createFinancePayroll($schoolB, $staffB);

        $this->actingAs($admin)->put('/school/hr/salary-structure/' . $staffB->id, [
            'basic_salary' => 50000,
        ])->assertNotFound();
        $this->actingAs($admin)->put('/school/hr/payroll/' . $payrollB->id . '/paid')->assertNotFound();
        $this->actingAs($admin)->get('/school/hr/payroll/' . $payrollB->id . '/slip')->assertNotFound();
    }

    public function test_suspended_deleted_and_super_admin_tenants_fail_closed(): void
    {
        $suspended = $this->createSecuritySchool(['status' => 'suspended']);
        $deleted = $this->createSecuritySchool();
        $deleted->delete();
        $superAdmin = $this->createFinanceSecurityUser('super-admin', null, [
            'fees.structure', 'reports.view', 'payroll.view', 'payroll.generate', 'payslip.download',
        ]);
        $suspendedUser = $this->createFinanceSecurityUser('suspended-user', $suspended, ['fees.structure']);
        $deletedUser = $this->createFinanceSecurityUser('deleted-user', $deleted, ['fees.structure']);

        foreach ([$suspendedUser, $deletedUser, $superAdmin] as $user) {
            $this->actingAs($user)->get('/school/fees/categories')->assertForbidden();
            $this->actingAs($user)->get('/school/reports/finance')->assertForbidden();
        }
    }

    public function test_finance_export_requires_export_permission(): void
    {
        $school = $this->createSecuritySchool();
        $viewer = $this->createFinanceSecurityUser('school-admin', $school, ['reports.view']);
        $exporter = $this->createFinanceSecurityUser('principal', $school, ['reports.view', 'reports.export']);

        $this->actingAs($viewer)->get('/school/reports/finance/export-pdf')->assertForbidden();
        $this->actingAs($exporter)->get('/school/reports/finance/export-pdf')->assertOk();
    }
}
