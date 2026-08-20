<?php

namespace Tests\Feature\Security;

use App\Models\Exam;
use Tests\Support\CreatesAcademicSecurityFixtures;
use Tests\Support\SecurityTestCase;

class AcademicAuthorizationTest extends SecurityTestCase
{
    use CreatesAcademicSecurityFixtures;

    public function test_guests_cannot_access_academic_workflows(): void
    {
        foreach ([
            ['get', '/school/timetable'],
            ['get', '/school/exams'],
            ['get', '/school/grade-scales'],
        ] as [$method, $url]) {
            $this->{$method}($url)->assertRedirect(route('login'));
        }
    }

    public function test_school_admin_can_use_same_tenant_academic_workflows(): void
    {
        $school = $this->createSecuritySchool();
        $admin = $this->createAcademicSecurityUser('school-admin', $school, [
            'timetable.view', 'timetable.manage',
            'exams.view', 'exams.create', 'exams.edit', 'exams.delete',
            'marks.view', 'marks.entry', 'results.view',
        ]);
        $class = $this->createAcademicClass($school);
        $section = $this->createAcademicSection($school, $class);
        $subject = $this->createAcademicSubject($school, $class);
        $exam = $this->createAcademicExam($school, $class);
        $student = $this->createAcademicStudent($school, $class, $section);

        $this->actingAs($admin)->get('/school/timetable')->assertOk();
        $this->actingAs($admin)->get('/school/exams')->assertOk();
        $this->actingAs($admin)->get('/school/exams/' . $exam->id . '/marks')->assertOk();
        $this->actingAs($admin)->get('/school/exams/' . $exam->id . '/results')->assertOk();
        $this->actingAs($admin)->get('/school/grade-scales')->assertOk();

        $this->actingAs($admin)->post('/school/timetable', [
            'class_id' => $class->id,
            'section_id' => $section->id,
            'subject_id' => $subject->id,
            'day_of_week' => 'tuesday',
            'start_time' => '09:00',
            'end_time' => '09:45',
        ])->assertRedirect();

        $this->actingAs($admin)->post('/school/exams/' . $exam->id . '/marks', [
            'marks' => [[
                'student_id' => $student->id,
                'subject_id' => $subject->id,
                'marks_obtained' => 80,
                'is_absent' => false,
            ]],
        ])->assertRedirect();
    }

    public function test_teacher_can_view_academics_but_cannot_mutate_exams_or_timetables(): void
    {
        $school = $this->createSecuritySchool();
        $teacher = $this->createAcademicSecurityUser('teacher', $school, [
            'timetable.view', 'exams.view', 'marks.view', 'marks.entry', 'results.view',
        ]);
        $class = $this->createAcademicClass($school);
        $subject = $this->createAcademicSubject($school, $class);
        $exam = $this->createAcademicExam($school, $class);

        $this->actingAs($teacher)->get('/school/timetable')->assertOk();
        $this->actingAs($teacher)->get('/school/exams')->assertOk();
        $this->actingAs($teacher)->get('/school/exams/' . $exam->id . '/marks')->assertOk();
        $this->actingAs($teacher)->get('/school/exams/' . $exam->id . '/results')->assertOk();
        $this->actingAs($teacher)->post('/school/exams', [
            'name' => 'Denied', 'type' => 'mid_term', 'class_id' => $class->id, 'status' => 'draft',
        ])->assertForbidden();
        $this->actingAs($teacher)->post('/school/timetable', [
            'class_id' => $class->id, 'subject_id' => $subject->id, 'day_of_week' => 'monday',
            'start_time' => '10:00', 'end_time' => '10:45',
        ])->assertForbidden();
    }

    public function test_roles_without_academic_permissions_are_denied(): void
    {
        $school = $this->createSecuritySchool();
        $class = $this->createAcademicClass($school);
        $exam = $this->createAcademicExam($school, $class);

        foreach (['accountant', 'librarian'] as $role) {
            $user = $this->createAcademicSecurityUser($role, $school);
            $this->actingAs($user)->get('/school/timetable')->assertForbidden();
            $this->actingAs($user)->get('/school/exams')->assertForbidden();
            $this->actingAs($user)->get('/school/exams/' . $exam->id . '/results')->assertForbidden();
        }
    }

    public function test_cross_tenant_exam_is_not_resolved_by_route_binding(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $admin = $this->createAcademicSecurityUser('school-admin', $schoolA, ['exams.edit']);
        $classB = $this->createAcademicClass($schoolB);
        $examB = $this->createAcademicExam($schoolB, $classB);

        $this->actingAs($admin)->put('/school/exams/' . $examB->id, [
            'name' => 'Cross Tenant', 'type' => 'mid_term', 'class_id' => $classB->id, 'status' => 'draft',
        ])->assertNotFound();
    }

    public function test_cross_tenant_related_academic_ids_are_rejected(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $admin = $this->createAcademicSecurityUser('school-admin', $schoolA, ['exams.create']);
        $classB = $this->createAcademicClass($schoolB);

        $this->actingAs($admin)->post('/school/exams', [
            'name' => 'Cross Tenant', 'type' => 'mid_term', 'class_id' => $classB->id, 'status' => 'draft',
        ])->assertNotFound();
        $this->assertDatabaseCount('exams', 0);
    }

    public function test_cross_tenant_mark_references_are_rejected(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $admin = $this->createAcademicSecurityUser('school-admin', $schoolA, ['marks.entry']);
        $classA = $this->createAcademicClass($schoolA);
        $classB = $this->createAcademicClass($schoolB);
        $subjectA = $this->createAcademicSubject($schoolA, $classA);
        $examA = $this->createAcademicExam($schoolA, $classA);
        $studentB = $this->createAcademicStudent($schoolB, $classB);

        $this->actingAs($admin)->post('/school/exams/' . $examA->id . '/marks', [
            'marks' => [['student_id' => $studentB->id, 'subject_id' => $subjectA->id, 'marks_obtained' => 50]],
        ])->assertNotFound();
    }

    public function test_super_admin_without_tenant_context_is_denied(): void
    {
        $superAdmin = $this->createAcademicSecurityUser('super-admin', null, [
            'timetable.view', 'timetable.manage', 'exams.view', 'exams.create', 'marks.view', 'results.view',
        ]);

        $this->actingAs($superAdmin)->get('/school/timetable')->assertForbidden();
        $this->actingAs($superAdmin)->get('/school/exams')->assertForbidden();
        $this->actingAs($superAdmin)->get('/school/grade-scales')->assertForbidden();
    }
}
