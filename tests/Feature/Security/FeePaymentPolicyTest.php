<?php

namespace Tests\Feature\Security;

use App\Models\FeePayment;
use Tests\Support\CreatesFeePaymentSecurityFixtures;
use Tests\Support\SecurityTestCase;

class FeePaymentPolicyTest extends SecurityTestCase
{
    use CreatesFeePaymentSecurityFixtures;

    public function test_guests_cannot_access_fee_payment_workflows(): void
    {
        $this->get('/school/fees/payments')->assertRedirect(route('login'));
        $this->get('/school/fees/payments/collect')->assertRedirect(route('login'));
        $this->post('/school/fees/payments')->assertRedirect(route('login'));
        $this->get('/school/fees/outstanding')->assertRedirect(route('login'));
    }

    public function test_accountant_can_view_and_collect_a_same_tenant_payment(): void
    {
        $school = $this->createSecuritySchool();
        $accountant = $this->createFeeSecurityUser('accountant', $school, [
            'fees.view', 'fees.collect', 'fees.reports',
        ]);
        $student = $this->createFeeStudent($school);
        $structure = $this->createFeeStructure($school, $student);

        $this->actingAs($accountant)->get('/school/fees/payments')->assertOk();
        $this->actingAs($accountant)->get('/school/fees/payments/' . $this->createFeePayment($school, $student, $structure)->id)->assertOk();
        $this->actingAs($accountant)->get('/school/fees/payments/collect?student_id=' . $student->id)->assertOk();
        $this->actingAs($accountant)->get('/school/fees/outstanding')->assertOk();

        $response = $this->actingAs($accountant)->post('/school/fees/payments', [
            'student_id' => $student->id,
            'fee_structure_id' => $structure->id,
            'amount_due' => 1000,
            'amount_paid' => 1000,
            'payment_date' => '2026-08-13',
            'method' => 'cash',
        ]);

        $response->assertRedirect('/school/fees/payments');
        $this->assertDatabaseHas('fee_payments', [
            'school_id' => $school->id,
            'student_id' => $student->id,
            'fee_structure_id' => $structure->id,
            'status' => 'paid',
        ]);
    }

    public function test_principal_can_view_and_report_but_cannot_collect(): void
    {
        $school = $this->createSecuritySchool();
        $principal = $this->createFeeSecurityUser('principal', $school, ['fees.view', 'fees.reports']);
        $student = $this->createFeeStudent($school);
        $structure = $this->createFeeStructure($school, $student);
        $payment = $this->createFeePayment($school, $student, $structure);

        $this->actingAs($principal)->get('/school/fees/payments')->assertOk();
        $this->actingAs($principal)->get('/school/fees/payments/' . $payment->id)->assertOk();
        $this->actingAs($principal)->get('/school/fees/outstanding')->assertOk();
        $this->actingAs($principal)->get('/school/fees/payments/collect')->assertForbidden();
        $this->actingAs($principal)->post('/school/fees/payments')->assertForbidden();
    }

    public function test_roles_without_fee_view_cannot_access_payment_listing(): void
    {
        $school = $this->createSecuritySchool();

        foreach (['teacher', 'parent', 'student', 'driver', 'librarian', 'receptionist'] as $role) {
            $user = $this->createFeeSecurityUser($role, $school);
            $this->actingAs($user)->get('/school/fees/payments')->assertForbidden();
        }
    }

    public function test_cross_tenant_payment_is_not_resolved_by_route_binding(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $adminA = $this->createFeeSecurityUser('school-admin', $schoolA, ['fees.view', 'fees.collect', 'fees.reports']);
        $studentB = $this->createFeeStudent($schoolB);
        $structureB = $this->createFeeStructure($schoolB, $studentB);
        $paymentB = $this->createFeePayment($schoolB, $studentB, $structureB);

        $this->actingAs($adminA)->get('/school/fees/payments/' . $paymentB->id)->assertNotFound();
    }

    public function test_cross_tenant_related_ids_cannot_create_a_payment(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $adminA = $this->createFeeSecurityUser('school-admin', $schoolA, ['fees.collect']);
        $studentB = $this->createFeeStudent($schoolB);
        $structureB = $this->createFeeStructure($schoolB, $studentB);

        $this->actingAs($adminA)->post('/school/fees/payments', [
            'student_id' => $studentB->id,
            'fee_structure_id' => $structureB->id,
            'amount_due' => 1000,
            'amount_paid' => 1000,
            'payment_date' => '2026-08-13',
            'method' => 'cash',
        ])->assertNotFound();

        $this->assertDatabaseCount('fee_payments', 0);
    }

    public function test_super_admin_without_tenant_context_is_denied_from_fee_routes(): void
    {
        $superAdmin = $this->createFeeSecurityUser('super-admin', null, [
            'fees.view', 'fees.collect', 'fees.reports',
        ]);

        $this->actingAs($superAdmin)->get('/school/fees/payments')->assertForbidden();
        $this->actingAs($superAdmin)->get('/school/fees/outstanding')->assertForbidden();
        $this->actingAs($superAdmin)->post('/school/fees/payments')->assertForbidden();
    }
}
