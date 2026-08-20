<?php

namespace Tests\Unit\Security;

use App\Http\Controllers\SchoolAdmin\ReportController;
use App\Models\Student;
use App\Policies\StudentPolicy;
use Illuminate\Support\Facades\Gate;
use Tests\Support\CreatesFinanceSecurityFixtures;
use Tests\Support\SecurityTestCase;

class ApiSurfacePolicyTest extends SecurityTestCase
{
    use CreatesFinanceSecurityFixtures;

    public function test_custom_and_export_api_abilities_use_existing_permissions(): void
    {
        $school = $this->createSecuritySchool();
        $custom = $this->createFinanceSecurityUser('report-custom', $school, ['reports.custom']);
        $exporter = $this->createFinanceSecurityUser('report-exporter', $school, ['reports.export']);

        $this->assertTrue(Gate::forUser($custom)->allows('custom', ReportController::class));
        $this->assertFalse(Gate::forUser($custom)->allows('export', ReportController::class));
        $this->assertFalse(Gate::forUser($exporter)->allows('custom', ReportController::class));
        $this->assertTrue(Gate::forUser($exporter)->allows('export', ReportController::class));
    }

    public function test_custom_api_ability_fails_closed_for_suspended_deleted_and_super_admin_contexts(): void
    {
        $suspended = $this->createSecuritySchool(['status' => 'suspended']);
        $deleted = $this->createSecuritySchool();
        $deleted->delete();

        $suspendedUser = $this->createFinanceSecurityUser('suspended', $suspended, ['reports.custom']);
        $deletedUser = $this->createFinanceSecurityUser('deleted', $deleted, ['reports.custom']);
        $superAdmin = $this->createFinanceSecurityUser('super-admin', null, ['reports.custom']);

        foreach ([$suspendedUser, $deletedUser, $superAdmin] as $user) {
            $this->assertFalse(Gate::forUser($user)->allows('custom', ReportController::class));
        }
    }

    public function test_student_policy_fails_closed_for_suspended_school_context(): void
    {
        $school = $this->createSecuritySchool(['status' => 'suspended']);
        $user = $this->createSecurityUser($school);
        $student = new Student(['school_id' => $school->id]);

        $this->assertFalse((new StudentPolicy())->view($user, $student));
    }}
