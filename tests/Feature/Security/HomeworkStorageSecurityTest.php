<?php

namespace Tests\Feature\Security;

use App\Models\Homework;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class HomeworkStorageSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function createTestSchool(string $name = 'Test Academy'): array
    {
        $school = School::create([
            'name'                    => $name . ' ' . Str::random(5),
            'slug'                    => Str::slug($name) . '-' . Str::lower(Str::random(6)),
            'email'                   => 'school_' . Str::lower(Str::random(6)) . '@eduflow.co.ke',
            'phone'                   => '+254700112233',
            'country'                 => 'KE',
            'county'                  => 'Nairobi',
            'sub_county'              => 'Westlands',
            'timezone'                => 'Africa/Nairobi',
            'currency'                => 'KES',
            'language'                => 'en',
            'curriculum'              => 'cbc',
            'status'                  => 'active',
            'onboarding_completed_at' => now(),
        ]);

        $user = User::create([
            'school_id' => $school->id,
            'name'      => 'Admin User',
            'email'     => 'admin_' . Str::lower(Str::random(6)) . '@eduflow.co.ke',
            'password'  => bcrypt('P@ssw0rd12345!'),
            'status'    => 'active',
        ]);

        $user->forceFill(['email_verified_at' => now()])->save();

        $role = Role::firstOrCreate(['name' => 'school-admin', 'guard_name' => 'web']);
        $permissions = [
            'homework.view', 'homework.create', 'homework.edit', 'homework.delete', 'homework.manage'
        ];
        foreach ($permissions as $p) {
            $perm = Permission::firstOrCreate(['name' => $p, 'guard_name' => 'web']);
            $role->givePermissionTo($perm);
        }
        $user->assignRole($role);

        $schoolClass = SchoolClass::create([
            'school_id' => $school->id,
            'name'      => 'Grade 5',
        ]);

        $subject = Subject::create([
            'school_id' => $school->id,
            'class_id'  => $schoolClass->id,
            'name'      => 'Mathematics',
        ]);

        return [$school, $user, $schoolClass, $subject];
    }

    public function test_guest_cannot_download_homework_attachment(): void
    {
        Storage::fake('private');
        [$school, $user, $schoolClass, $subject] = $this->createTestSchool('School A');

        $file = UploadedFile::fake()->create('assignment.pdf', 100);
        $path = $file->store('homework_attachments', 'private');

        $homework = Homework::create([
            'school_id'   => $school->id,
            'teacher_id'  => null,
            'class_id'    => $schoolClass->id,
            'subject_id'  => $subject->id,
            'title'       => 'Math Homework',
            'description' => 'Solve algebra problems',
            'due_date'    => now()->addDays(2),
            'attachment'  => $path,
        ]);

        $response = $this->get(route('school.homework.download', $homework));
        $response->assertRedirect(route('login'));
    }

    public function test_cross_tenant_cannot_download_homework_attachment(): void
    {
        Storage::fake('private');
        [$schoolA, $userA, $classA, $subjectA] = $this->createTestSchool('School A');
        [$schoolB, $userB, $classB, $subjectB] = $this->createTestSchool('School B');

        $file = UploadedFile::fake()->create('secret.pdf', 100);
        $path = $file->store('homework_attachments', 'private');

        $homeworkA = Homework::create([
            'school_id'   => $schoolA->id,
            'teacher_id'  => null,
            'class_id'    => $classA->id,
            'subject_id'  => $subjectA->id,
            'title'       => 'Secret A',
            'description' => 'Confidential school a data',
            'due_date'    => now()->addDays(2),
            'attachment'  => $path,
        ]);

        $response = $this->actingAs($userB)->get(route('school.homework.download', $homeworkA));
        $this->assertTrue(in_array($response->status(), [403, 404]));
    }

    public function test_authorized_tenant_user_can_download_homework_attachment(): void
    {
        Storage::fake('private');
        [$school, $user, $schoolClass, $subject] = $this->createTestSchool('School A');

        $file = UploadedFile::fake()->create('homework.pdf', 150);
        $path = $file->store('homework_attachments', 'private');

        $homework = Homework::create([
            'school_id'   => $school->id,
            'teacher_id'  => null,
            'class_id'    => $schoolClass->id,
            'subject_id'  => $subject->id,
            'title'       => 'Math Homework',
            'description' => 'Solve algebra problems',
            'due_date'    => now()->addDays(2),
            'attachment'  => $path,
        ]);

        $response = $this->actingAs($user)->get(route('school.homework.download', $homework));
        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
    }

    public function test_deleting_homework_removes_physical_private_file(): void
    {
        Storage::fake('private');
        [$school, $user, $schoolClass, $subject] = $this->createTestSchool('School A');

        $file = UploadedFile::fake()->create('temp.pdf', 100);
        $path = $file->store('homework_attachments', 'private');

        $homework = Homework::create([
            'school_id'   => $school->id,
            'teacher_id'  => null,
            'class_id'    => $schoolClass->id,
            'subject_id'  => $subject->id,
            'title'       => 'Temp HW',
            'description' => 'Temporary homework',
            'due_date'    => now()->addDays(2),
            'attachment'  => $path,
        ]);

        Storage::disk('private')->assertExists($path);

        $response = $this->actingAs($user)->delete(route('school.homework.destroy', $homework));
        $response->assertRedirect();

        Storage::disk('private')->assertMissing($path);
        $this->assertSoftDeleted('homework', ['id' => $homework->id]);
    }
}