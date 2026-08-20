<?php

namespace Tests\Unit\Security;

use App\Models\Attendance;
use App\Models\Hostel;
use App\Models\HostelAllocation;
use App\Models\HostelRoom;
use App\Policies\AttendancePolicy;
use App\Policies\HostelAllocationPolicy;
use App\Policies\HostelPolicy;
use App\Policies\HostelRoomPolicy;
use Illuminate\Support\Facades\Gate;
use Tests\Support\CreatesOperationsSecurityFixtures;
use Tests\Support\SecurityTestCase;

class OperationsPolicyTest extends SecurityTestCase
{
    use CreatesOperationsSecurityFixtures;

    public function test_operations_policies_are_registered(): void
    {
        $this->assertInstanceOf(AttendancePolicy::class, Gate::getPolicyFor(Attendance::class));
        $this->assertInstanceOf(HostelPolicy::class, Gate::getPolicyFor(Hostel::class));
        $this->assertInstanceOf(HostelRoomPolicy::class, Gate::getPolicyFor(HostelRoom::class));
        $this->assertInstanceOf(HostelAllocationPolicy::class, Gate::getPolicyFor(HostelAllocation::class));
    }

    public function test_existing_attendance_and_hostel_permissions_map_to_abilities(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createOperationsUser('school-admin', $school, [
            'attendance.view', 'attendance.mark', 'attendance.report', 'attendance.export',
            'hostel.view', 'hostel.manage',
        ]);
        $class = $this->createOperationsClass($school);
        $student = $this->createOperationsStudent($school, $class);
        $hostel = $this->createOperationsHostel($school);
        $room = $this->createOperationsRoom($school, $hostel);

        $this->assertTrue(Gate::forUser($user)->allows('viewAny', Attendance::class));
        $this->assertTrue(Gate::forUser($user)->allows('markStudent', [Attendance::class, ['class_id' => $class->id, 'records' => [['student_id' => $student->id]]]]));
        $this->assertTrue(Gate::forUser($user)->allows('viewAny', Hostel::class));
        $this->assertTrue(Gate::forUser($user)->allows('create', [HostelRoom::class, $hostel]));
        $this->assertTrue(Gate::forUser($user)->allows('create', [HostelAllocation::class, ['hostel_id' => $hostel->id, 'room_id' => $room->id, 'student_id' => $student->id]]));
    }

    public function test_cross_tenant_and_related_records_fail_closed_before_permissions(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $user = $this->createOperationsUser('school-admin', $schoolA, [
            'attendance.view', 'attendance.mark', 'hostel.view', 'hostel.manage',
        ]);
        $classB = $this->createOperationsClass($schoolB);
        $studentB = $this->createOperationsStudent($schoolB, $classB);
        $hostelB = $this->createOperationsHostel($schoolB);
        $roomB = $this->createOperationsRoom($schoolB, $hostelB);
        $allocationB = $this->createOperationsAllocation($schoolB, $hostelB, $roomB, $studentB);

        $this->assertFalse(Gate::forUser($user)->allows('view', $hostelB));
        $this->assertFalse(Gate::forUser($user)->allows('vacate', $allocationB));
        $this->assertFalse(Gate::forUser($user)->allows('markStudent', [Attendance::class, ['class_id' => $classB->id, 'records' => [['student_id' => $studentB->id]]]]));
        $this->assertFalse(Gate::forUser($user)->allows('create', [HostelAllocation::class, ['hostel_id' => $hostelB->id, 'room_id' => $roomB->id, 'student_id' => $studentB->id]]));
    }

    public function test_missing_suspended_and_super_admin_contexts_are_denied(): void
    {
        $school = $this->createSecuritySchool();
        $hostel = $this->createOperationsHostel($school);
        $suspendedSchool = $this->createSecuritySchool(['status' => 'suspended']);
        $noTenant = $this->createOperationsUser('school-admin', null, ['hostel.view']);
        $suspended = $this->createOperationsUser('school-admin', $suspendedSchool, ['hostel.view']);
        $superAdmin = $this->createOperationsUser('super-admin', null, ['hostel.view']);

        foreach ([$noTenant, $suspended, $superAdmin] as $user) {
            $this->assertFalse(Gate::forUser($user)->allows('viewAny', Hostel::class));
            $this->assertFalse(Gate::forUser($user)->allows('view', $hostel));
        }
    }
}
