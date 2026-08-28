<?php

namespace Tests\Feature\Infrastructure;

use App\Jobs\SendArrearsReminderSms;
use App\Jobs\SendEmailBlast;
use App\Jobs\SendPaymentReceiptNotification;
use App\Jobs\SendSmsBlast;
use App\Models\DataAccessLog;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\User;
use App\Services\OdpcAuditService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class Phase9InfrastructureHardeningTest extends TestCase
{
    use RefreshDatabase;

    protected School $school;
    protected User $adminUser;
    protected Student $student;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'school-admin', 'guard_name' => 'web']);

        $this->school = School::create([
            'name'                    => 'Phase 9 Infrastructure Academy',
            'slug'                    => 'phase9-infra-academy',
            'status'                  => 'active',
            'country'                 => 'KE',
            'currency'                => 'KES',
            'timezone'                => 'Africa/Nairobi',
            'curriculum'              => 'cbc',
            'onboarding_completed_at' => now(),
        ]);

        $this->adminUser = (new User)->forceFill([
            'school_id'         => $this->school->id,
            'name'              => 'Infra Admin',
            'email'             => 'admin@phase9infra.test',
            'password'          => bcrypt('Password123!'),
            'status'            => 'active',
            'email_verified_at' => now(),
        ]);
        $this->adminUser->save();
        $this->adminUser->assignRole('school-admin');

        $class = SchoolClass::create([
            'school_id' => $this->school->id,
            'name'      => 'Grade 1 Infra',
        ]);
        $section = Section::create([
            'school_id' => $this->school->id,
            'class_id'  => $class->id,
            'name'      => 'Stream A',
        ]);

        $this->student = Student::create([
            'school_id'     => $this->school->id,
            'user_id'       => $this->adminUser->id,
            'admission_no'  => 'ADM-P9-001',
            'first_name'    => 'David',
            'last_name'     => 'Infra',
            'gender'        => 'male',
            'status'        => 'active',
            'class_id'      => $class->id,
            'section_id'    => $section->id,
            'date_of_birth' => '2016-01-01',
        ]);
    }

    public function test_all_production_jobs_enforce_strict_queue_contracts(): void
    {
        $jobs = [
            SendArrearsReminderSms::class,
            SendPaymentReceiptNotification::class,
            SendEmailBlast::class,
            SendSmsBlast::class,
        ];

        foreach ($jobs as $jobClass) {
            $reflection = new \ReflectionClass($jobClass);
            $this->assertTrue($reflection->implementsInterface(\Illuminate\Contracts\Queue\ShouldQueue::class), "{$jobClass} must implement ShouldQueue");
            
            $instance = $reflection->newInstanceWithoutConstructor();
            $this->assertGreaterThan(0, $instance->tries, "{$jobClass} must define \$tries > 0");
            $this->assertGreaterThan(0, $instance->timeout, "{$jobClass} must define \$timeout > 0");
            $this->assertIsArray($instance->backoff, "{$jobClass} must define exponential \$backoff array");
        }
    }

    public function test_odpc_audit_service_records_tenant_scoped_data_access(): void
    {
        $this->actingAs($this->adminUser);

        $log = OdpcAuditService::log(
            action: 'EXPORT',
            resourceType: 'Student',
            studentId: $this->student->id,
            resourceId: $this->student->id,
            details: ['fields' => ['first_name', 'national_id', 'medical_history']],
            description: 'Exported student sensitive profile'
        );

        $this->assertInstanceOf(DataAccessLog::class, $log);
        $this->assertDatabaseHas('data_access_logs', [
            'school_id'     => $this->school->id,
            'user_id'       => $this->adminUser->id,
            'student_id'    => $this->student->id,
            'action'        => 'EXPORT',
            'resource_type' => 'Student',
            'resource_id'   => $this->student->id,
            'description'   => 'Exported student sensitive profile',
        ]);
    }
}