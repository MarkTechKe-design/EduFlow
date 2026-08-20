<?php

namespace Tests\Feature\Security;

use Tests\Support\CreatesOperationsSecurityFixtures;
use Tests\Support\SecurityTestCase;

class OperationsAuthorizationTest extends SecurityTestCase
{
    use CreatesOperationsSecurityFixtures;

    public function test_guests_cannot_access_operations_workflows(): void
    {
        foreach ([
            ['get', '/school/attendance'],
            ['get', '/school/attendance/staff'],
            ['get', '/school/hostel'],
            ['get', '/school/admissions/visitors'],
        ] as [$method, $uri]) {
            $this->{$method}($uri)->assertRedirect(route('login'));
        }
    }

    public function test_school_admin_can_use_same_tenant_attendance_workflows(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createOperationsUser('school-admin', $school, [
            'attendance.view', 'attendance.mark', 'attendance.report', 'attendance.export',
        ]);
        $class = $this->createOperationsClass($school);
        $student = $this->createOperationsStudent($school, $class);
        $staff = $this->createOperationsStaff($school);

        $this->actingAs($user)->get('/school/attendance')->assertOk();
        $this->actingAs($user)->get('/school/attendance/staff')->assertOk();
        $this->actingAs($user)->post('/school/attendance', [
            'date' => now()->toDateString(),
            'class_id' => $class->id,
            'records' => [['student_id' => $student->id, 'status' => 'present']],
        ])->assertRedirect();
        $this->actingAs($user)->post('/school/attendance/staff', [
            'date' => now()->toDateString(),
            'records' => [['staff_id' => $staff->id, 'status' => 'present']],
        ])->assertRedirect();
        $this->actingAs($user)->get('/school/attendance/students/' . $student->id . '/calendar')->assertOk();
    }

    public function test_school_admin_can_use_same_tenant_hostel_workflows(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createOperationsUser('school-admin', $school, ['hostel.view', 'hostel.manage']);
        $warden = $this->createOperationsStaff($school);
        $class = $this->createOperationsClass($school);
        $student = $this->createOperationsStudent($school, $class);
        $hostel = $this->createOperationsHostel($school, $warden);
        $room = $this->createOperationsRoom($school, $hostel);
        $allocation = $this->createOperationsAllocation($school, $hostel, $room, $student);

        $this->actingAs($user)->get('/school/hostel')->assertOk();
        $this->actingAs($user)->get('/school/hostel/' . $hostel->id . '/rooms')->assertOk();
        $this->actingAs($user)->get('/school/hostel/' . $hostel->id . '/available-rooms')->assertOk();
        $this->actingAs($user)->get('/school/hostel/allocations')->assertOk();
        $this->actingAs($user)->put('/school/hostel/' . $hostel->id, [
            'name' => 'Updated Hostel', 'type' => 'mixed', 'warden_id' => $warden->id, 'status' => 'active',
        ])->assertRedirect();
        $this->actingAs($user)->put('/school/hostel/' . $hostel->id . '/rooms/' . $room->id, [
            'room_no' => $room->room_no, 'type' => 'double', 'capacity' => 2, 'status' => 'available',
        ])->assertRedirect();
        $this->actingAs($user)->put('/school/hostel/allocations/' . $allocation->id . '/vacate', [
            'leaving_date' => now()->toDateString(),
        ])->assertRedirect();
    }

    public function test_roles_without_operations_permissions_are_denied(): void
    {
        $school = $this->createSecuritySchool();
        foreach ([
            ['teacher', '/school/hostel'],
            ['accountant', '/school/attendance'],
            ['librarian', '/school/hostel'],
            ['student', '/school/attendance'],
            ['parent', '/school/hostel'],
        ] as [$role, $uri]) {
            $user = $this->createOperationsUser($role, $school);
            $this->actingAs($user)->get($uri)->assertForbidden();
        }
    }

    public function test_cross_tenant_operations_and_related_ids_are_denied(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $user = $this->createOperationsUser('school-admin', $schoolA, [
            'attendance.view', 'attendance.mark', 'hostel.view', 'hostel.manage',
        ]);
        $classB = $this->createOperationsClass($schoolB);
        $studentB = $this->createOperationsStudent($schoolB, $classB);
        $hostelB = $this->createOperationsHostel($schoolB);
        $roomB = $this->createOperationsRoom($schoolB, $hostelB);

        $this->actingAs($user)->get('/school/hostel/' . $hostelB->id . '/rooms')->assertNotFound();
        $this->actingAs($user)->post('/school/attendance', [
            'date' => now()->toDateString(), 'class_id' => $classB->id,
            'records' => [['student_id' => $studentB->id, 'status' => 'present']],
        ])->assertForbidden();
        $this->actingAs($user)->post('/school/hostel/allocations', [
            'hostel_id' => $hostelB->id, 'room_id' => $roomB->id, 'student_id' => $studentB->id,
            'joining_date' => now()->toDateString(),
        ])->assertForbidden();
    }

    public function test_missing_suspended_deleted_and_super_admin_contexts_fail_closed(): void
    {
        $school = $this->createSecuritySchool();
        $hostel = $this->createOperationsHostel($school);
        $suspended = $this->createSecuritySchool(['status' => 'suspended']);
        $deleted = $this->createSecuritySchool();
        $deleted->delete();

        foreach ([
            $this->createOperationsUser('school-admin', null, ['hostel.view']),
            $this->createOperationsUser('school-admin', $suspended, ['hostel.view']),
            $this->createOperationsUser('school-admin', $deleted, ['hostel.view']),
            $this->createOperationsUser('super-admin', null, ['hostel.view']),
        ] as $user) {
            $this->actingAs($user)->get('/school/hostel')->assertForbidden();
        }

        $this->assertDatabaseHas('hostels', ['id' => $hostel->id, 'school_id' => $school->id]);
    }

    public function test_attendance_exports_require_the_existing_export_permission(): void
    {
        $school = $this->createSecuritySchool();
        $viewer = $this->createOperationsUser('principal', $school, ['attendance.view', 'attendance.report']);

        $this->actingAs($viewer)->get('/school/reports/attendance/export-pdf')->assertForbidden();
    }
}
