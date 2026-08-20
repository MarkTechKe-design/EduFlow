<?php

namespace Tests\Feature\Security;

use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\StudentDocument;
use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\Support\SecurityTestCase;

class StudentPolicyTest extends SecurityTestCase
{
    public function test_a_school_user_can_view_a_student_in_their_own_school(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createRoleUser('teacher', $school, ['students.view']);
        $student = $this->createStudent($school);

        $this->assertTrue(Gate::forUser($user)->allows('view', $student));
    }

    public function test_a_student_from_another_school_is_denied_for_every_student_ability(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $user = $this->createRoleUser('school-admin', $schoolA, [
            'students.view',
            'students.create',
            'students.edit',
            'students.delete',
            'students.restore',
            'students.force-delete',
            'students.export',
        ]);
        $studentB = $this->createStudent($schoolB);
        $documentB = $this->createStudentDocument($studentB);

        $studentAbilities = [
            ['view', $studentB],
            ['update', $studentB],
            ['delete', $studentB],
            ['restore', $studentB],
            ['forceDelete', $studentB],
            ['export', $studentB],
            ['uploadDocument', $studentB],
        ];

        foreach ($studentAbilities as [$ability, $subject]) {
            $this->assertFalse(
                Gate::forUser($user)->allows($ability, $subject),
                "Cross-school student authorization unexpectedly allowed [{$ability}]."
            );
        }

        $this->assertFalse(
            Gate::forUser($user)->allows('deleteDocument', $documentB),
            'Cross-school student document deletion was unexpectedly allowed.'
        );
    }

    public function test_a_school_admin_can_create_and_manage_students_and_documents(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createRoleUser('school-admin', $school, [
            'students.view',
            'students.create',
            'students.edit',
            'students.delete',
            'students.restore',
            'students.force-delete',
            'students.export',
        ]);
        $student = $this->createStudent($school);
        $document = $this->createStudentDocument($student);

        $this->assertTrue(Gate::forUser($user)->allows('view', $student));
        $this->assertTrue(Gate::forUser($user)->allows('create', Student::class));
        $this->assertTrue(Gate::forUser($user)->allows('update', $student));
        $this->assertTrue(Gate::forUser($user)->allows('delete', $student));
        $this->assertTrue(Gate::forUser($user)->allows('restore', $student));
        $this->assertTrue(Gate::forUser($user)->allows('forceDelete', $student));
        $this->assertTrue(Gate::forUser($user)->allows('export', $student));
        $this->assertTrue(Gate::forUser($user)->allows('uploadDocument', $student));
        $this->assertTrue(Gate::forUser($user)->allows('deleteDocument', $document));
    }

    public function test_a_teacher_can_view_and_export_students_but_cannot_manage_them(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createRoleUser('teacher', $school, [
            'students.view',
            'students.export',
        ]);
        $student = $this->createStudent($school);
        $document = $this->createStudentDocument($student);

        $this->assertTrue(Gate::forUser($user)->allows('view', $student));
        $this->assertTrue(Gate::forUser($user)->allows('export', $student));
        $this->assertFalse(Gate::forUser($user)->allows('create', Student::class));
        $this->assertFalse(Gate::forUser($user)->allows('update', $student));
        $this->assertFalse(Gate::forUser($user)->allows('delete', $student));
        $this->assertFalse(Gate::forUser($user)->allows('restore', $student));
        $this->assertFalse(Gate::forUser($user)->allows('forceDelete', $student));
        $this->assertFalse(Gate::forUser($user)->allows('uploadDocument', $student));
        $this->assertFalse(Gate::forUser($user)->allows('deleteDocument', $document));
    }

    public function test_an_accountant_can_view_but_cannot_manage_students(): void
    {
        $this->assertCanViewButCannotManageStudents('accountant', ['students.view']);
    }

    public function test_a_librarian_can_view_but_cannot_manage_students(): void
    {
        $this->assertCanViewButCannotManageStudents('librarian', ['students.view']);
    }

    public function test_a_driver_cannot_manage_students(): void
    {
        $this->assertCannotManageStudents('driver');
    }

    public function test_a_student_user_cannot_manage_students(): void
    {
        $this->assertCannotManageStudents('student');
    }

    public function test_a_parent_user_cannot_manage_students(): void
    {
        $this->assertCannotManageStudents('parent');
    }

    public function test_a_super_admin_does_not_receive_implicit_tenant_access(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createRoleUser('super-admin', $school);
        $student = $this->createStudent($school);
        $document = $this->createStudentDocument($student);

        foreach (['view', 'update', 'delete', 'restore', 'forceDelete', 'export', 'uploadDocument'] as $ability) {
            $this->assertFalse(
                Gate::forUser($user)->allows($ability, $student),
                "Super-admin was implicitly granted tenant student ability [{$ability}]."
            );
        }

        $this->assertFalse(Gate::forUser($user)->allows('create', Student::class));
        $this->assertFalse(Gate::forUser($user)->allows('deleteDocument', $document));
    }

    /** @param array<int, string> $permissions */
    private function assertCanViewButCannotManageStudents(string $roleName, array $permissions): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createRoleUser($roleName, $school, $permissions);
        $student = $this->createStudent($school);
        $document = $this->createStudentDocument($student);

        $this->assertTrue(Gate::forUser($user)->allows('view', $student));
        $this->assertFalse(Gate::forUser($user)->allows('create', Student::class));
        $this->assertFalse(Gate::forUser($user)->allows('update', $student));
        $this->assertFalse(Gate::forUser($user)->allows('delete', $student));
        $this->assertFalse(Gate::forUser($user)->allows('restore', $student));
        $this->assertFalse(Gate::forUser($user)->allows('forceDelete', $student));
        $this->assertFalse(Gate::forUser($user)->allows('export', $student));
        $this->assertFalse(Gate::forUser($user)->allows('uploadDocument', $student));
        $this->assertFalse(Gate::forUser($user)->allows('deleteDocument', $document));
    }

    private function assertCannotManageStudents(string $roleName): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createRoleUser($roleName, $school);
        $student = $this->createStudent($school);
        $document = $this->createStudentDocument($student);

        foreach (['view', 'update', 'delete', 'restore', 'forceDelete', 'export', 'uploadDocument'] as $ability) {
            $this->assertFalse(
                Gate::forUser($user)->allows($ability, $student),
                "Role [{$roleName}] was unexpectedly granted student ability [{$ability}]."
            );
        }

        $this->assertFalse(Gate::forUser($user)->allows('create', Student::class));
        $this->assertFalse(Gate::forUser($user)->allows('deleteDocument', $document));
    }

    /** @param array<int, string> $permissions */
    private function createRoleUser(string $roleName, School $school, array $permissions = []): User
    {
        $user = $this->createSecurityUser($school, [
            'email' => $roleName . '-' . uniqid() . '@example.test',
        ]);

        $role = Role::firstOrCreate([
            'name' => $roleName,
            'guard_name' => 'web',
        ]);

        $permissionModels = collect($permissions)
            ->map(fn (string $permission) => Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]));

        $role->syncPermissions($permissionModels);
        $user->assignRole($role);

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        return $user;
    }

    /** @param array<string, mixed> $attributes */
    private function createStudent(School $school, array $attributes = []): Student
    {
        $class = SchoolClass::query()->create([
            'school_id' => $school->id,
            'name' => 'Security Class ' . uniqid(),
            'numeric_name' => 1,
        ]);

        return Student::query()->create(array_merge([
            'school_id' => $school->id,
            'class_id' => $class->id,
            'first_name' => 'Security Student',
            'last_name' => 'Fixture',
            'gender' => 'other',
            'category' => 'general',
            'status' => 'active',
        ], $attributes));
    }

    private function createStudentDocument(Student $student): StudentDocument
    {
        return StudentDocument::query()->create([
            'school_id' => $student->school_id,
            'student_id' => $student->id,
            'title' => 'Identity Document',
            'file_path' => 'security/student-document.pdf',
            'file_type' => 'application/pdf',
            'file_size' => 1024,
        ]);
    }
}
