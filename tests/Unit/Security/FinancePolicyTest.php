<?php

namespace Tests\Unit\Security;

use App\Http\Controllers\SchoolAdmin\ReportController;
use App\Models\FeeCategory;
use App\Models\FeeStructure;
use App\Models\Payroll;
use App\Models\SalaryStructure;
use App\Policies\FeeCategoryPolicy;
use App\Policies\FeeStructurePolicy;
use App\Policies\FinanceReportPolicy;
use App\Policies\PayrollPolicy;
use App\Policies\SalaryStructurePolicy;
use Illuminate\Support\Facades\Gate;
use Tests\Support\CreatesFinanceSecurityFixtures;
use Tests\Support\SecurityTestCase;

class FinancePolicyTest extends SecurityTestCase
{
    use CreatesFinanceSecurityFixtures;

    public function test_finance_policies_are_registered(): void
    {
        $this->assertInstanceOf(FeeCategoryPolicy::class, Gate::getPolicyFor(FeeCategory::class));
        $this->assertInstanceOf(FeeStructurePolicy::class, Gate::getPolicyFor(FeeStructure::class));
        $this->assertInstanceOf(PayrollPolicy::class, Gate::getPolicyFor(Payroll::class));
        $this->assertInstanceOf(SalaryStructurePolicy::class, Gate::getPolicyFor(SalaryStructure::class));
        $this->assertInstanceOf(FinanceReportPolicy::class, Gate::getPolicyFor(ReportController::class));
    }

    public function test_fee_permissions_map_to_category_and_structure_abilities(): void
    {
        $school = $this->createSecuritySchool();
        $class = $this->createFinanceClass($school);
        $category = $this->createFinanceCategory($school);
        $structure = $this->createFinanceStructure($school, $class, $category);
        $user = $this->createFinanceSecurityUser('fee-manager', $school, ['fees.structure']);
        $gate = Gate::forUser($user);

        $this->assertTrue($gate->allows('viewAny', FeeCategory::class));
        $this->assertTrue($gate->allows('create', FeeCategory::class));
        $this->assertTrue($gate->allows('update', $category));
        $this->assertTrue($gate->allows('delete', $category));
        $this->assertTrue($gate->allows('viewAny', FeeStructure::class));
        $this->assertTrue($gate->allows('update', $structure));
        $this->assertTrue($gate->allows('delete', $structure));
    }

    public function test_payroll_permissions_map_to_payroll_and_salary_abilities(): void
    {
        $school = $this->createSecuritySchool();
        $department = $this->createFinanceDepartment($school);
        $staff = $this->createFinanceStaff($school, $department);
        $payroll = $this->createFinancePayroll($school, $staff);
        $viewer = $this->createFinanceSecurityUser('payroll-viewer', $school, ['payroll.view']);
        $manager = $this->createFinanceSecurityUser('payroll-manager', $school, ['payroll.generate', 'payslip.download']);

        $this->assertTrue(Gate::forUser($viewer)->allows('viewAny', Payroll::class));
        $this->assertTrue(Gate::forUser($viewer)->allows('viewAny', SalaryStructure::class));
        $this->assertFalse(Gate::forUser($viewer)->allows('generate', Payroll::class));
        $this->assertTrue(Gate::forUser($manager)->allows('generate', Payroll::class));
        $this->assertTrue(Gate::forUser($manager)->allows('markPaid', $payroll));
        $this->assertTrue(Gate::forUser($manager)->allows('slip', $payroll));
        $this->assertTrue(Gate::forUser($manager)->allows('save', [SalaryStructure::class, $staff]));
    }

    public function test_finance_reports_use_existing_report_permissions(): void
    {
        $school = $this->createSecuritySchool();
        $viewer = $this->createFinanceSecurityUser('report-viewer', $school, ['reports.view']);
        $exporter = $this->createFinanceSecurityUser('report-exporter', $school, ['reports.export']);

        $this->assertTrue(Gate::forUser($viewer)->allows('view', ReportController::class));
        $this->assertFalse(Gate::forUser($viewer)->allows('export', ReportController::class));
        $this->assertTrue(Gate::forUser($exporter)->allows('export', ReportController::class));
    }

    public function test_cross_tenant_and_missing_context_fail_closed(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $classB = $this->createFinanceClass($schoolB);
        $categoryB = $this->createFinanceCategory($schoolB);
        $structureB = $this->createFinanceStructure($schoolB, $classB, $categoryB);
        $departmentB = $this->createFinanceDepartment($schoolB);
        $staffB = $this->createFinanceStaff($schoolB, $departmentB);
        $payrollB = $this->createFinancePayroll($schoolB, $staffB);
        $userA = $this->createFinanceSecurityUser('tenant-a', $schoolA, [
            'fees.structure', 'payroll.view', 'payroll.generate', 'payslip.download', 'reports.view',
        ]);
        $superAdmin = $this->createFinanceSecurityUser('super-admin', null, [
            'fees.structure', 'payroll.view', 'payroll.generate', 'payslip.download', 'reports.view',
        ]);

        $gate = Gate::forUser($userA);
        $this->assertFalse($gate->allows('update', $categoryB));
        $this->assertFalse($gate->allows('update', $structureB));
        $this->assertFalse($gate->allows('markPaid', $payrollB));
        $this->assertFalse($gate->allows('slip', $payrollB));
        $this->assertFalse(Gate::forUser($superAdmin)->allows('view', ReportController::class));
        $this->assertFalse(Gate::forUser($superAdmin)->allows('viewAny', FeeCategory::class));
    }
}
