<?php

namespace Tests\Support;

use App\Models\Attendance;
use App\Models\Hostel;
use App\Models\HostelAllocation;
use App\Models\HostelRoom;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Staff;
use App\Models\Student;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

trait CreatesOperationsSecurityFixtures
{
    protected function createOperationsUser(string $role, ?School $school, array $permissions = []): User
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

    protected function createOperationsClass(School $school): SchoolClass
    {
        return SchoolClass::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'name' => 'Operations Class ' . uniqid(),
            'numeric_name' => 1,
        ]);
    }

    protected function createOperationsStudent(School $school, SchoolClass $class): Student
    {
        return Student::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'class_id' => $class->id,
            'first_name' => 'Operations',
            'last_name' => 'Student',
            'gender' => 'other',
            'category' => 'general',
            'status' => 'active',
        ]);
    }

    protected function createOperationsStaff(School $school): Staff
    {
        return Staff::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'first_name' => 'Operations',
            'last_name' => 'Staff',
            'gender' => 'other',
            'salary_type' => 'fixed',
            'status' => 'active',
        ]);
    }

    protected function createOperationsAttendance(School $school, Student|Staff $attendable): Attendance
    {
        return Attendance::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'date' => now()->toDateString(),
            'attendable_type' => $attendable::class,
            'attendable_id' => $attendable->id,
            'status' => 'present',
        ]);
    }

    protected function createOperationsHostel(School $school, ?Staff $warden = null): Hostel
    {
        return Hostel::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'name' => 'Operations Hostel ' . uniqid(),
            'type' => 'mixed',
            'warden_id' => $warden?->id,
            'status' => 'active',
        ]);
    }

    protected function createOperationsRoom(School $school, Hostel $hostel): HostelRoom
    {
        return HostelRoom::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'hostel_id' => $hostel->id,
            'room_no' => 'R-' . random_int(100, 999),
            'type' => 'double',
            'capacity' => 2,
            'occupied' => 0,
            'status' => 'available',
        ]);
    }

    protected function createOperationsAllocation(School $school, Hostel $hostel, HostelRoom $room, Student $student): HostelAllocation
    {
        return HostelAllocation::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'hostel_id' => $hostel->id,
            'room_id' => $room->id,
            'student_id' => $student->id,
            'joining_date' => now()->toDateString(),
            'status' => 'active',
            'fee_linked' => true,
        ]);
    }
}
