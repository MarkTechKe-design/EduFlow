<?php

namespace Tests\Support;

use App\Models\Exam;
use App\Models\GradeScale;
use App\Models\Mark;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Timetable;
use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

trait CreatesAcademicSecurityFixtures
{
    protected function createAcademicSecurityUser(string $role, ?School $school, array $permissions = []): User
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

    protected function createAcademicClass(School $school): SchoolClass
    {
        return SchoolClass::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'name' => 'Academic Class ' . uniqid(),
            'numeric_name' => 1,
            'capacity' => 30,
        ]);
    }

    protected function createAcademicSection(School $school, SchoolClass $class): Section
    {
        return Section::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'class_id' => $class->id,
            'name' => 'Section A',
        ]);
    }

    protected function createAcademicSubject(School $school, SchoolClass $class): Subject
    {
        return Subject::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'class_id' => $class->id,
            'name' => 'Mathematics',
            'code' => 'MATH',
            'type' => 'theory',
            'full_marks' => 100,
            'pass_marks' => 33,
        ]);
    }

    protected function createAcademicExam(School $school, SchoolClass $class): Exam
    {
        return Exam::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'class_id' => $class->id,
            'name' => 'Term Exam',
            'type' => 'mid_term',
            'status' => 'draft',
        ]);
    }

    protected function createAcademicStudent(School $school, SchoolClass $class, ?Section $section = null): Student
    {
        return Student::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'class_id' => $class->id,
            'section_id' => $section?->id,
            'first_name' => 'Academic',
            'last_name' => 'Student',
            'gender' => 'other',
            'category' => 'general',
            'status' => 'active',
        ]);
    }

    protected function createAcademicMark(School $school, Exam $exam, Student $student, Subject $subject): Mark
    {
        return Mark::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'exam_id' => $exam->id,
            'student_id' => $student->id,
            'subject_id' => $subject->id,
            'marks_obtained' => 75,
            'grade' => 'A',
            'gpa' => 4,
            'is_absent' => false,
        ]);
    }

    protected function createAcademicGradeScale(School $school): GradeScale
    {
        return GradeScale::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'grade' => 'A',
            'gpa' => 4,
            'min_marks' => 70,
            'max_marks' => 79,
            'sort_order' => 1,
        ]);
    }

    protected function createAcademicTimetable(School $school, SchoolClass $class, Subject $subject, ?Section $section = null): Timetable
    {
        return Timetable::withoutGlobalScopes()->create([
            'school_id' => $school->id,
            'class_id' => $class->id,
            'section_id' => $section?->id,
            'subject_id' => $subject->id,
            'day_of_week' => 'monday',
            'start_time' => '08:00',
            'end_time' => '08:45',
        ]);
    }
}
