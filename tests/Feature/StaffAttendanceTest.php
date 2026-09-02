<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Attendance;
use App\Models\Holiday;
use App\Models\LeaveRequest;
use App\Models\LeaveType;
use App\Models\Package;
use App\Models\School;
use App\Models\SchoolSubscription;
use App\Models\Staff;
use App\Models\TeacherDutyAssignment;
use App\Models\TeacherDutyRoster;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Tests\TestCase;

class StaffAttendanceTest extends TestCase
{
    use RefreshDatabase;

    protected School $school;
    protected School $otherSchool;
    protected User $admin;
    protected Staff $staffA;
    protected Staff $staffB;
    protected Staff $otherSchoolStaff;
    protected AcademicYear $academicYear;
    protected LeaveType $sickLeave;
    protected Package $package;

    protected function setUp(): void
    {
        parent::setUp();

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // 1. Seed tenant schools with verified status
        $this->school = School::create([
            'name'                => 'Greenfield Academy',
            'slug'                => 'greenfield-academy',
            'status'              => 'active',
            'verification_status' => 'verified',
        ]);

        $this->otherSchool = School::create([
            'name'                => 'Sunrise Academy',
            'slug'                => 'sunrise-academy',
            'status'              => 'active',
            'verification_status' => 'verified',
        ]);

        // 2. Active subscription package and school subscription entitlement
        $this->package = Package::create([
            'name' => 'Standard Package',
            'slug' => 'standard-package',
        ]);

        SchoolSubscription::create([
            'school_id'        => $this->school->id,
            'package_id'       => $this->package->id,
            'start_date'       => '2026-01-01',
            'end_date'         => '2026-12-31',
            'status'           => 'active',
            'lifecycle_status' => 'active',
        ]);

        // 3. Active academic year
        $this->academicYear = AcademicYear::create([
            'school_id'  => $this->school->id,
            'name'       => '2026 Academic Year',
            'start_date' => '2026-01-01',
            'end_date'   => '2026-12-31',
            'is_active'  => true,
        ]);

        // 4. Spatie roles and permissions
        $adminRole = Role::findOrCreate('school-admin', 'web');
        foreach (['attendance.view', 'attendance.mark', 'attendance.export'] as $perm) {
            Permission::findOrCreate($perm, 'web');
        }
        $adminRole->givePermissionTo(['attendance.view', 'attendance.mark', 'attendance.export']);

        // 5. Authenticated school administrator
        $this->admin = User::factory()->create([
            'school_id'         => $this->school->id,
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);
        $this->admin->assignRole($adminRole);
        $this->admin->givePermissionTo(['attendance.view', 'attendance.mark', 'attendance.export']);

        // 6. Staff records
        $this->staffA = Staff::create([
            'school_id'  => $this->school->id,
            'first_name' => 'John',
            'last_name'  => 'Mwangi',
            'emp_id'     => 'TSC-001',
            'gender'     => 'male',
            'status'     => 'active',
        ]);

        $this->staffB = Staff::create([
            'school_id'  => $this->school->id,
            'first_name' => 'Mary',
            'last_name'  => 'Otieno',
            'emp_id'     => 'TSC-002',
            'gender'     => 'female',
            'status'     => 'active',
        ]);

        $this->otherSchoolStaff = Staff::create([
            'school_id'  => $this->otherSchool->id,
            'first_name' => 'Foreign',
            'last_name'  => 'Teacher',
            'emp_id'     => 'TSC-999',
            'gender'     => 'male',
            'status'     => 'active',
        ]);

        // 7. Leave Type
        $this->sickLeave = LeaveType::create([
            'school_id' => $this->school->id,
            'name'      => 'Sick Leave',
            'code'      => 'SL',
            'is_paid'   => true,
            'is_active' => true,
        ]);
    }

    public function test_user_can_view_staff_attendance_register(): void
    {
        $response = $this->actingAs($this->admin)
            ->get(route('school.attendance.staff.index', ['date' => '2026-09-07']));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('SchoolAdmin/Attendance/StaffIndex')
            ->has('staffList', 2)
            ->has('leaveTypes', 1)
            ->has('stats')
        );
    }

    public function test_can_batch_store_staff_attendance(): void
    {
        $payload = [
            'date'    => '2026-09-07',
            'records' => [
                [
                    'staff_id' => $this->staffA->id,
                    'status'   => 'present',
                    'time_in'  => '07:25',
                    'time_out' => '17:00',
                    'remarks'  => 'On time',
                ],
                [
                    'staff_id' => $this->staffB->id,
                    'status'   => 'half_day',
                    'time_in'  => '07:30',
                    'time_out' => '12:30',
                    'remarks'  => 'Afternoon appointment',
                ],
            ],
        ];

        $response = $this->actingAs($this->admin)
            ->post(route('school.attendance.staff.store'), $payload);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('attendances', [
            'school_id'       => $this->school->id,
            'date'            => '2026-09-07',
            'attendable_type' => Staff::class,
            'attendable_id'   => $this->staffA->id,
            'status'          => 'present',
            'time_in'         => '07:25',
        ]);

        $this->assertDatabaseHas('attendances', [
            'school_id'       => $this->school->id,
            'date'            => '2026-09-07',
            'attendable_type' => Staff::class,
            'attendable_id'   => $this->staffB->id,
            'status'          => 'half_day',
            'time_out'        => '12:30',
        ]);
    }

    public function test_cross_tenant_isolation_prevents_marking_foreign_staff(): void
    {
        $payload = [
            'date'    => '2026-09-07',
            'records' => [
                [
                    'staff_id' => $this->otherSchoolStaff->id,
                    'status'   => 'present',
                    'time_in'  => '07:30',
                    'time_out' => '17:00',
                ],
            ],
        ];

        $response = $this->actingAs($this->admin)
            ->post(route('school.attendance.staff.store'), $payload);

        $response->assertForbidden();
        $this->assertDatabaseMissing('attendances', [
            'attendable_id' => $this->otherSchoolStaff->id,
        ]);
    }

    public function test_apply_staff_leave_auto_excludes_weekends_and_holidays(): void
    {
        Holiday::create([
            'school_id' => $this->school->id,
            'name'      => 'Special School Holiday',
            'date'      => '2026-09-09',
        ]);

        // Range: Monday (2026-09-07) to Sunday (2026-09-13)
        // 7 total days - 2 weekend days (12th, 13th) - 1 holiday (9th) = 4 school days
        $payload = [
            'staff_id'            => $this->staffA->id,
            'leave_type_id'       => $this->sickLeave->id,
            'start_date'          => '2026-09-07',
            'end_date'            => '2026-09-13',
            'reason'              => 'Doctor recommended rest',
            'overwrite_conflicts' => true,
        ];

        $response = $this->actingAs($this->admin)
            ->post(route('school.attendance.staff.apply-leave'), $payload);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('leave_requests', [
            'school_id'     => $this->school->id,
            'staff_id'      => $this->staffA->id,
            'leave_type_id' => $this->sickLeave->id,
            'days'          => 4,
            'status'        => 'approved',
        ]);

        $this->assertDatabaseHas('attendances', [
            'school_id'     => $this->school->id,
            'attendable_id' => $this->staffA->id,
            'date'          => '2026-09-07',
            'status'        => 'on_leave',
        ]);
        $this->assertDatabaseHas('attendances', [
            'school_id'     => $this->school->id,
            'attendable_id' => $this->staffA->id,
            'date'          => '2026-09-08',
            'status'        => 'on_leave',
        ]);
        $this->assertDatabaseHas('attendances', [
            'school_id'     => $this->school->id,
            'attendable_id' => $this->staffA->id,
            'date'          => '2026-09-10',
            'status'        => 'on_leave',
        ]);
        $this->assertDatabaseHas('attendances', [
            'school_id'     => $this->school->id,
            'attendable_id' => $this->staffA->id,
            'date'          => '2026-09-11',
            'status'        => 'on_leave',
        ]);

        // Holiday and Weekend days must not have attendance records
        $this->assertDatabaseMissing('attendances', [
            'school_id'     => $this->school->id,
            'attendable_id' => $this->staffA->id,
            'date'          => '2026-09-09',
        ]);
        $this->assertDatabaseMissing('attendances', [
            'school_id'     => $this->school->id,
            'attendable_id' => $this->staffA->id,
            'date'          => '2026-09-12',
        ]);
    }

    public function test_assign_official_duty_records_stand_in_details(): void
    {
        $payload = [
            'staff_id'             => $this->staffA->id,
            'start_date'           => '2026-09-07',
            'end_date'             => '2026-09-08',
            'duty_type'            => 'Seminar / Workshop',
            'replacement_staff_id' => $this->staffB->id,
            'notes'                => 'County CBC alignment cluster at Kakamega',
        ];

        $response = $this->actingAs($this->admin)
            ->post(route('school.attendance.staff.assign-duty'), $payload);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $record = Attendance::where('school_id', $this->school->id)
            ->where('attendable_id', $this->staffA->id)
            ->where('date', '2026-09-07')
            ->firstOrFail();

        $this->assertEquals('official_duty', $record->status);
        $this->assertStringContainsString('Seminar / Workshop', $record->remarks);
        $this->assertStringContainsString('Mary Otieno', $record->remarks);
    }

    public function test_weekly_duty_roster_creation_and_stand_in_assignment(): void
    {
        $rosterPayload = [
            'title'       => 'Term 3 Week 2 Duty Roster',
            'start_date'  => '2026-09-07',
            'end_date'    => '2026-09-11',
            'assignments' => [
                [
                    'staff_id'     => $this->staffA->id,
                    'duty_station' => 'Main Gate',
                    'day_of_week'  => 'Monday',
                    'shift'        => 'morning',
                    'instructions' => 'Supervise student check-in',
                ],
            ],
        ];

        $response = $this->actingAs($this->admin)
            ->post(route('school.attendance.duty-roster.store'), $rosterPayload);

        $response->assertRedirect();

        $assignment = TeacherDutyAssignment::where('school_id', $this->school->id)
            ->where('staff_id', $this->staffA->id)
            ->firstOrFail();

        $this->assertEquals('Main Gate', $assignment->duty_station);
        $this->assertNull($assignment->replacement_staff_id);

        $standInPayload = [
            'assignment_id'        => $assignment->id,
            'replacement_staff_id' => $this->staffB->id,
            'replacement_reason'   => 'Attending morning staff briefing',
        ];

        $standInResponse = $this->actingAs($this->admin)
            ->post(route('school.attendance.duty-roster.stand-in'), $standInPayload);

        $standInResponse->assertRedirect();

        $assignment->refresh();
        $this->assertEquals($this->staffB->id, $assignment->replacement_staff_id);
        $this->assertEquals('Attending morning staff briefing', $assignment->replacement_reason);
        $this->assertEquals($this->admin->id, $assignment->replacement_changed_by);
        $this->assertNotNull($assignment->replacement_at);
        $this->assertEquals($this->staffA->id, $assignment->staff_id);
    }

    public function test_duty_roster_csv_export(): void
    {
        $roster = TeacherDutyRoster::create([
            'school_id'  => $this->school->id,
            'title'      => 'Test CSV Roster',
            'start_date' => '2026-09-07',
            'end_date'   => '2026-09-11',
            'is_active'  => true,
        ]);

        TeacherDutyAssignment::create([
            'school_id'      => $this->school->id,
            'duty_roster_id' => $roster->id,
            'staff_id'       => $this->staffA->id,
            'duty_station'   => 'Dining Hall & Meals',
            'day_of_week'    => 'Monday',
            'shift'          => 'full_day',
        ]);

        $response = $this->actingAs($this->admin)
            ->get(route('school.attendance.duty-roster.export-csv', ['week_start' => '2026-09-07']));

        $response->assertOk();
        $this->assertInstanceOf(StreamedResponse::class, $response->baseResponse);
        $this->assertStringContainsString('text/csv', (string) $response->headers->get('Content-Type'));

        $content = $response->streamedContent();
        $this->assertStringContainsString('Dining Hall & Meals', $content);
        $this->assertStringContainsString('John Mwangi', $content);
    }
    public function test_can_duplicate_previous_weekly_duty_roster_as_recurring_schedule(): void
    {
        $prevStart = Carbon::now()->startOfWeek(Carbon::MONDAY)->subWeek()->toDateString();
        $prevEnd = Carbon::parse($prevStart)->endOfWeek(Carbon::FRIDAY)->toDateString();

        $prevRoster = TeacherDutyRoster::create([
            'school_id' => $this->school->id,
            'title' => "Previous Week Roster ({$prevStart})",
            'start_date' => $prevStart,
            'end_date' => $prevEnd,
            'is_active' => true,
            'created_by' => $this->admin->id,
        ]);

        TeacherDutyAssignment::create([
            'school_id' => $this->school->id,
            'duty_roster_id' => $prevRoster->id,
            'staff_id' => $this->staffA->id,
            'duty_station' => 'Assembly Ground',
            'day_of_week' => 'Monday',
            'shift' => 'morning',
            'instructions' => 'Oversee morning assembly',
            'replacement_staff_id' => $this->staffB->id,
            'replacement_reason' => 'Previous temporary stand-in',
            'created_by' => $this->admin->id,
        ]);

        $targetWeekStart = Carbon::now()->startOfWeek(Carbon::MONDAY)->toDateString();

        $response = $this->actingAs($this->admin)->post('/school/attendance/duty-roster/duplicate-previous', [
            'target_week_start' => $targetWeekStart,
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();

        $this->assertDatabaseHas('teacher_duty_rosters', [
            'school_id' => $this->school->id,
            'start_date' => $targetWeekStart,
        ]);

        $newRoster = TeacherDutyRoster::where('school_id', $this->school->id)
            ->whereDate('start_date', $targetWeekStart)
            ->first();

        $this->assertNotNull($newRoster);
        $this->assertDatabaseHas('teacher_duty_assignments', [
            'school_id' => $this->school->id,
            'duty_roster_id' => $newRoster->id,
            'staff_id' => $this->staffA->id,
            'duty_station' => 'Assembly Ground',
            'day_of_week' => 'Monday',
            'shift' => 'morning',
            'replacement_staff_id' => null,
            'replacement_reason' => null,
        ]);
    }
}