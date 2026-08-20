<?php

namespace Tests\Unit\Security;

use App\Models\FeePayment;
use Illuminate\Support\Facades\Gate;
use Tests\Support\CreatesFeePaymentSecurityFixtures;
use Tests\Support\SecurityTestCase;

class FeePaymentPolicyTest extends SecurityTestCase
{
    use CreatesFeePaymentSecurityFixtures;

    public function test_fee_payment_policy_is_registered(): void
    {
        $this->assertInstanceOf(\App\Policies\FeePaymentPolicy::class, Gate::getPolicyFor(FeePayment::class));
    }

    public function test_fee_payment_abilities_map_to_existing_fee_permissions(): void
    {
        $school = $this->createSecuritySchool();
        $student = $this->createFeeStudent($school);
        $structure = $this->createFeeStructure($school, $student);
        $payment = $this->createFeePayment($school, $student, $structure);

        $view = $this->createFeeSecurityUser('fee-view', $school, ['fees.view']);
        $viewGate = Gate::forUser($view);
        $this->assertTrue($viewGate->allows('viewAny', FeePayment::class));
        $this->assertTrue($viewGate->allows('view', $payment));
        $this->assertFalse($viewGate->allows('create', FeePayment::class));
        $this->assertFalse($viewGate->allows('collect', FeePayment::class));
        $this->assertFalse($viewGate->allows('outstanding', FeePayment::class));

        $collect = $this->createFeeSecurityUser('fee-collect', $school, ['fees.collect']);
        $collectGate = Gate::forUser($collect);
        $this->assertTrue($collectGate->allows('create', FeePayment::class));
        $this->assertTrue($collectGate->allows('collect', FeePayment::class));
        $this->assertFalse($collectGate->allows('view', $payment));

        $reports = $this->createFeeSecurityUser('fee-reports', $school, ['fees.reports']);
        $this->assertTrue(Gate::forUser($reports)->allows('outstanding', FeePayment::class));
    }

    public function test_school_admin_can_use_all_existing_fee_payment_workflow_abilities(): void
    {
        $school = $this->createSecuritySchool();
        $admin = $this->createFeeSecurityUser('school-admin', $school, [
            'fees.view', 'fees.collect', 'fees.reports',
        ]);
        $student = $this->createFeeStudent($school);
        $structure = $this->createFeeStructure($school, $student);
        $payment = $this->createFeePayment($school, $student, $structure);
        $gate = Gate::forUser($admin);

        $this->assertTrue($gate->allows('viewAny', FeePayment::class));
        $this->assertTrue($gate->allows('view', $payment));
        $this->assertTrue($gate->allows('create', FeePayment::class));
        $this->assertTrue($gate->allows('collect', FeePayment::class));
        $this->assertTrue($gate->allows('outstanding', FeePayment::class));
    }

    public function test_accountant_can_view_collect_and_report_fees(): void
    {
        $school = $this->createSecuritySchool();
        $accountant = $this->createFeeSecurityUser('accountant', $school, [
            'fees.view', 'fees.collect', 'fees.reports',
        ]);
        $student = $this->createFeeStudent($school);
        $structure = $this->createFeeStructure($school, $student);
        $payment = $this->createFeePayment($school, $student, $structure);
        $gate = Gate::forUser($accountant);

        $this->assertTrue($gate->allows('viewAny', FeePayment::class));
        $this->assertTrue($gate->allows('view', $payment));
        $this->assertTrue($gate->allows('create', FeePayment::class));
        $this->assertTrue($gate->allows('collect', FeePayment::class));
        $this->assertTrue($gate->allows('outstanding', FeePayment::class));
    }

    public function test_principal_can_view_and_report_but_not_collect_fees(): void
    {
        $school = $this->createSecuritySchool();
        $principal = $this->createFeeSecurityUser('principal', $school, ['fees.view', 'fees.reports']);
        $student = $this->createFeeStudent($school);
        $structure = $this->createFeeStructure($school, $student);
        $payment = $this->createFeePayment($school, $student, $structure);
        $gate = Gate::forUser($principal);

        $this->assertTrue($gate->allows('view', $payment));
        $this->assertTrue($gate->allows('outstanding', FeePayment::class));
        $this->assertFalse($gate->allows('create', FeePayment::class));
        $this->assertFalse($gate->allows('collect', FeePayment::class));
    }

    public function test_roles_without_fee_permissions_are_denied(): void
    {
        $school = $this->createSecuritySchool();
        $student = $this->createFeeStudent($school);
        $structure = $this->createFeeStructure($school, $student);
        $payment = $this->createFeePayment($school, $student, $structure);

        foreach (['teacher', 'parent', 'student', 'driver', 'librarian', 'receptionist'] as $role) {
            $user = $this->createFeeSecurityUser($role, $school);
            $gate = Gate::forUser($user);

            $this->assertFalse($gate->allows('viewAny', FeePayment::class));
            $this->assertFalse($gate->allows('view', $payment));
            $this->assertFalse($gate->allows('create', FeePayment::class));
            $this->assertFalse($gate->allows('collect', FeePayment::class));
            $this->assertFalse($gate->allows('outstanding', FeePayment::class));
        }
    }

    public function test_cross_tenant_payment_and_related_records_are_denied(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $user = $this->createFeeSecurityUser('school-admin', $schoolA, ['fees.view', 'fees.collect', 'fees.reports']);
        $studentB = $this->createFeeStudent($schoolB);
        $structureB = $this->createFeeStructure($schoolB, $studentB);
        $paymentB = $this->createFeePayment($schoolB, $studentB, $structureB);
        $gate = Gate::forUser($user);

        $this->assertFalse($gate->allows('view', $paymentB));
        $this->assertTrue($gate->allows('collect', FeePayment::class));
    }

    public function test_super_admin_without_tenant_context_is_denied(): void
    {
        $school = $this->createSecuritySchool();
        $superAdmin = $this->createFeeSecurityUser('super-admin', null, [
            'fees.view', 'fees.collect', 'fees.reports',
        ]);
        $student = $this->createFeeStudent($school);
        $structure = $this->createFeeStructure($school, $student);
        $payment = $this->createFeePayment($school, $student, $structure);
        $gate = Gate::forUser($superAdmin);

        $this->assertFalse($gate->allows('viewAny', FeePayment::class));
        $this->assertFalse($gate->allows('view', $payment));
        $this->assertFalse($gate->allows('create', FeePayment::class));
        $this->assertFalse($gate->allows('collect', FeePayment::class));
        $this->assertFalse($gate->allows('outstanding', FeePayment::class));
    }
}
