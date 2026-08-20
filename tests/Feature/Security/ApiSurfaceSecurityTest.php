<?php

namespace Tests\Feature\Security;

use App\Models\SchoolNotification;
use Tests\Support\CreatesAcademicSecurityFixtures;
use Tests\Support\CreatesFinanceSecurityFixtures;
use Tests\Support\CreatesOperationsSecurityFixtures;
use Tests\Support\SecurityTestCase;

class ApiSurfaceSecurityTest extends SecurityTestCase
{
    use CreatesAcademicSecurityFixtures;
    use CreatesFinanceSecurityFixtures;
    use CreatesOperationsSecurityFixtures;

    public function test_guests_cannot_access_existing_json_and_notification_surfaces(): void
    {
        $this->get('/school/reports/custom')->assertRedirect(route('login'));
        $this->postJson('/school/reports/custom/run', ['entity' => 'students'])->assertStatus(401);
        $this->get('/school/reports/custom/export-csv?entity=students')->assertRedirect(route('login'));
        $this->get('/school/communication/notifications')->assertRedirect(route('login'));
    }

    public function test_custom_report_uses_existing_permission_and_returns_json(): void
    {
        $school = $this->createSecuritySchool();
        $viewer = $this->createFinanceSecurityUser('report-viewer', $school, ['reports.view']);
        $custom = $this->createFinanceSecurityUser('teacher', $school, ['reports.custom']);

        $this->actingAs($viewer)->get('/school/reports/custom')->assertForbidden();
        $this->actingAs($viewer)->postJson('/school/reports/custom/run', ['entity' => 'students'])->assertForbidden();

        $this->actingAs($custom)
            ->postJson('/school/reports/custom/run', ['entity' => 'students'])
            ->assertOk()
            ->assertJsonStructure(['data', 'count']);
    }

    public function test_custom_report_rejects_cross_tenant_filter_ids(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $classB = $this->createFinanceClass($schoolB);
        $custom = $this->createFinanceSecurityUser('teacher', $schoolA, ['reports.custom']);

        $this->actingAs($custom)
            ->postJson('/school/reports/custom/run', [
                'entity' => 'students',
                'filters' => ['class_id' => $classB->id],
            ])
            ->assertUnprocessable();
    }

    public function test_csv_download_requires_existing_export_permission(): void
    {
        $school = $this->createSecuritySchool();
        $custom = $this->createFinanceSecurityUser('teacher', $school, ['reports.custom']);

        $this->actingAs($custom)
            ->get('/school/reports/custom/export-csv?entity=students')
            ->assertForbidden();
    }

    public function test_hostel_json_endpoint_is_tenant_scoped_and_permission_checked(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $hostelA = $this->createOperationsHostel($schoolA);
        $hostelB = $this->createOperationsHostel($schoolB);
        $user = $this->createOperationsUser('school-admin', $schoolA, ['hostel.view']);
        $noPermission = $this->createOperationsUser('principal', $schoolA);

        $this->actingAs($user)
            ->get('/school/hostel/' . $hostelA->id . '/available-rooms')
            ->assertOk()
            ->assertJson([]);
        $this->actingAs($user)->get('/school/hostel/' . $hostelB->id . '/available-rooms')->assertNotFound();
        $this->actingAs($noPermission)->get('/school/hostel/' . $hostelA->id . '/available-rooms')->assertForbidden();
    }

    public function test_notification_read_endpoint_only_accepts_tenant_owned_notifications(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $user = $this->createOperationsUser('school-admin', $schoolA);
        $own = SchoolNotification::withoutGlobalScopes()->create([
            'school_id' => $schoolA->id,
            'user_id' => $user->id,
            'type' => 'system',
            'title' => 'Own notification',
            'body' => 'Body',
            'channel' => 'in-app',
        ]);
        $other = SchoolNotification::withoutGlobalScopes()->create([
            'school_id' => $schoolB->id,
            'user_id' => $user->id,
            'type' => 'system',
            'title' => 'Other tenant notification',
            'body' => 'Body',
            'channel' => 'in-app',
        ]);

        $this->actingAs($user)->put('/school/communication/notifications/' . $own->id . '/read')->assertRedirect();
        $this->assertNotNull($own->fresh()->read_at);
        $this->actingAs($user)->put('/school/communication/notifications/' . $other->id . '/read')->assertNotFound();
    }

    public function test_public_admission_only_exposes_active_schools(): void
    {
        $active = $this->createSecuritySchool();
        $suspended = $this->createSecuritySchool(['status' => 'suspended']);

        $this->get('/apply/' . $active->id)->assertOk();
        $this->get('/apply/' . $suspended->id)->assertNotFound();
        $this->post('/apply/' . $active->id, [
            'student_name' => 'Public Applicant',
            'class_interested' => 'Grade 1',
            'guardian_name' => 'Guardian',
            'guardian_phone' => '0700000000',
            'guardian_email' => 'guardian@example.test',
            'notes' => 'Public application',
        ])->assertRedirect();

        $this->assertDatabaseHas('admission_inquiries', [
            'school_id' => $active->id,
            'student_name' => 'Public Applicant',
            'source' => 'online',
        ]);
    }

    public function test_academic_report_rejects_cross_tenant_exam_ids(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $classB = $this->createAcademicClass($schoolB);
        $examB = $this->createAcademicExam($schoolB, $classB);
        $viewer = $this->createFinanceSecurityUser('principal', $schoolA, ['reports.view']);

        $this->actingAs($viewer)
            ->get('/school/reports/academic?exam_id=' . $examB->id)
            ->assertNotFound();
    }

    public function test_existing_workflow_permissions_are_required_on_workflow_routes(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createFinanceSecurityUser('principal', $school, ['reports.view']);

        $this->actingAs($user)->get('/school/homework')->assertForbidden();
        $this->actingAs($user)->get('/school/hr/leaves')->assertForbidden();
    }}
