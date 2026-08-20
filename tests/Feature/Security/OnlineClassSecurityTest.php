<?php

namespace Tests\Feature\Security;

use App\Models\OnlineClass;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class OnlineClassSecurityTest extends TestCase
{
    use RefreshDatabase;

    private int $schoolCounter = 0;
    private int $userCounter = 0;

    protected function setUp(): void
    {
        parent::setUp();

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        foreach (['super-admin', 'school-admin', 'teacher', 'student', 'parent'] as $roleName) {
            Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        }
    }

    private function createSchool(array $attributes = []): School
    {
        $this->schoolCounter++;
        return School::create(array_merge([
            'name'     => "Test School {$this->schoolCounter}",
            'slug'     => "test-school-{$this->schoolCounter}-" . Str::random(6),
            'status'   => 'active',
            'email'    => "school{$this->schoolCounter}@example.test",
            'currency' => 'KES',
            'timezone' => 'Africa/Nairobi',
        ], $attributes));
    }

    private function createUser(School $school, string $role, array $attributes = []): User
    {
        $this->userCounter++;
        
        $status = $attributes['status'] ?? 'active';
        $verifiedAt = array_key_exists('email_verified_at', $attributes) ? $attributes['email_verified_at'] : now();
        unset($attributes['status'], $attributes['email_verified_at']);

        $user = User::create(array_merge([
            'school_id'  => $school->id,
            'name'       => "Test User {$this->userCounter}",
            'first_name' => 'Test',
            'last_name'  => "User{$this->userCounter}",
            'email'      => "user{$this->userCounter}@example.test",
            'password'   => Hash::make('password'),
            'status'     => $status,
        ], $attributes));

        $user->forceFill([
            'status'            => $status,
            'email_verified_at' => $verifiedAt,
        ])->save();

        $user->assignRole($role);
        return $user;
    }

    public function test_teacher_can_create_jitsi_online_class_with_secure_room_token(): void
    {
        $school = $this->createSchool();
        $teacher = $this->createUser($school, 'teacher');

        $class = SchoolClass::create([
            'school_id'    => $school->id,
            'name'         => 'Grade 8',
            'numeric_name' => 8,
        ]);

        $subject = Subject::create([
            'school_id' => $school->id,
            'class_id'  => $class->id,
            'name'      => 'Integrated Science',
            'code'      => 'SCI-8',
            'type'      => 'theory',
        ]);

        $response = $this->actingAs($teacher)->post('/school/online-classes', [
            'class_id'         => $class->id,
            'subject_id'       => $subject->id,
            'title'            => 'Photosynthesis Lab',
            'scheduled_at'     => now()->addHour()->format('Y-m-d H:i:s'),
            'duration_minutes' => 45,
            'platform'         => 'jitsi',
        ]);

        $response->assertSessionDoesntHaveErrors();
        $response->assertRedirect();

        $this->assertDatabaseHas('online_classes', [
            'school_id' => $school->id,
            'title'     => 'Photosynthesis Lab',
            'platform'  => 'jitsi',
            'status'    => 'scheduled',
        ]);

        $onlineClass = OnlineClass::withoutGlobalScopes()->where('title', 'Photosynthesis Lab')->first();
        $this->assertNotNull($onlineClass);
        $this->assertNotNull($onlineClass->room_token);
        $this->assertStringStartsWith('EduFlow_', $onlineClass->meeting_id);
    }

    public function test_authorized_student_can_enter_virtual_classroom(): void
    {
        $school = $this->createSchool();
        $class = SchoolClass::create([
            'school_id'    => $school->id,
            'name'         => 'Grade 8',
            'numeric_name' => 8,
        ]);

        $subject = Subject::create([
            'school_id' => $school->id,
            'class_id'  => $class->id,
            'name'      => 'Mathematics',
            'code'      => 'MATH-8',
            'type'      => 'theory',
        ]);

        $studentUser = $this->createUser($school, 'student');

        Student::create([
            'school_id'    => $school->id,
            'user_id'      => $studentUser->id,
            'class_id'     => $class->id,
            'first_name'   => 'Brian',
            'last_name'    => 'Otieno',
            'gender'       => 'male',
            'admission_no' => 'ADM-8001',
            'status'       => 'active',
        ]);

        $onlineClass = OnlineClass::create([
            'school_id'        => $school->id,
            'class_id'         => $class->id,
            'subject_id'       => $subject->id,
            'title'            => 'Algebra Revision',
            'scheduled_at'     => now(),
            'duration_minutes' => 40,
            'platform'         => 'jitsi',
            'status'           => 'live',
        ]);

        $response = $this->actingAs($studentUser)->get("/school/classroom/{$onlineClass->id}");
        $response->assertOk();
    }

    public function test_unauthorized_student_in_different_class_is_rejected(): void
    {
        $school = $this->createSchool();
        $class8 = SchoolClass::create(['school_id' => $school->id, 'name' => 'Grade 8', 'numeric_name' => 8]);
        $class7 = SchoolClass::create(['school_id' => $school->id, 'name' => 'Grade 7', 'numeric_name' => 7]);

        $subject = Subject::create([
            'school_id' => $school->id,
            'class_id'  => $class8->id,
            'name'      => 'Science',
            'code'      => 'SCI-8',
            'type'      => 'theory',
        ]);

        $studentUser = $this->createUser($school, 'student');

        Student::create([
            'school_id'    => $school->id,
            'user_id'      => $studentUser->id,
            'class_id'     => $class7->id,
            'first_name'   => 'Mercy',
            'last_name'    => 'Wanjiku',
            'gender'       => 'female',
            'admission_no' => 'ADM-7001',
            'status'       => 'active',
        ]);

        $onlineClass = OnlineClass::create([
            'school_id'        => $school->id,
            'class_id'         => $class8->id,
            'subject_id'       => $subject->id,
            'title'            => 'Grade 8 Advanced Physics',
            'scheduled_at'     => now(),
            'duration_minutes' => 40,
            'platform'         => 'jitsi',
            'status'           => 'live',
        ]);

        $response = $this->actingAs($studentUser)->get("/school/classroom/{$onlineClass->id}");
        $response->assertForbidden();
    }

    public function test_cross_school_student_is_rejected(): void
    {
        $schoolA = $this->createSchool();
        $schoolB = $this->createSchool();

        $classA = SchoolClass::create(['school_id' => $schoolA->id, 'name' => 'Form 3', 'numeric_name' => 15]);
        $subjectA = Subject::create([
            'school_id' => $schoolA->id,
            'class_id'  => $classA->id,
            'name'      => 'Chemistry',
            'code'      => 'CHEM-3',
            'type'      => 'theory',
        ]);

        $studentUserB = $this->createUser($schoolB, 'student');

        $onlineClassA = OnlineClass::create([
            'school_id'        => $schoolA->id,
            'class_id'         => $classA->id,
            'subject_id'       => $subjectA->id,
            'title'            => 'Organic Chemistry Live',
            'scheduled_at'     => now(),
            'duration_minutes' => 45,
            'platform'         => 'jitsi',
            'status'           => 'live',
        ]);

        $response = $this->actingAs($studentUserB)->get("/school/classroom/{$onlineClassA->id}");
        $response->assertNotFound();
    }

    public function test_unauthenticated_user_cannot_access_classroom(): void
    {
        $school = $this->createSchool();
        $class = SchoolClass::create(['school_id' => $school->id, 'name' => 'Grade 8', 'numeric_name' => 8]);
        $subject = Subject::create([
            'school_id' => $school->id,
            'class_id'  => $class->id,
            'name'      => 'Math',
            'code'      => 'M8',
            'type'      => 'theory',
        ]);

        $onlineClass = OnlineClass::create([
            'school_id'        => $school->id,
            'class_id'         => $class->id,
            'subject_id'       => $subject->id,
            'title'            => 'Math Live',
            'scheduled_at'     => now(),
            'duration_minutes' => 40,
            'platform'         => 'jitsi',
            'status'           => 'live',
        ]);

        $response = $this->get("/school/classroom/{$onlineClass->id}");
        $response->assertRedirect('/login');
    }

    public function test_inactive_user_cannot_access_classroom(): void
    {
        $school = $this->createSchool();
        $class = SchoolClass::create(['school_id' => $school->id, 'name' => 'Grade 8', 'numeric_name' => 8]);
        $subject = Subject::create([
            'school_id' => $school->id,
            'class_id'  => $class->id,
            'name'      => 'Math',
            'code'      => 'M8',
            'type'      => 'theory',
        ]);

        $inactiveUser = $this->createUser($school, 'student', ['status' => 'inactive']);

        Student::create([
            'school_id'    => $school->id,
            'user_id'      => $inactiveUser->id,
            'class_id'     => $class->id,
            'first_name'   => 'Inactive',
            'last_name'    => 'Learner',
            'gender'       => 'male',
            'admission_no' => 'ADM-INACTIVE',
            'status'       => 'inactive',
        ]);

        $onlineClass = OnlineClass::create([
            'school_id'        => $school->id,
            'class_id'         => $class->id,
            'subject_id'       => $subject->id,
            'title'            => 'Math Live',
            'scheduled_at'     => now(),
            'duration_minutes' => 40,
            'platform'         => 'jitsi',
            'status'           => 'live',
        ]);

        $response = $this->actingAs($inactiveUser)->get("/school/classroom/{$onlineClass->id}");
        $response->assertForbidden();
    }
}