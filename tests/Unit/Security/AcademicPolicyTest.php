<?php

namespace Tests\Unit\Security;

use App\Models\Exam;
use App\Models\GradeScale;
use App\Models\Timetable;
use App\Policies\ExamPolicy;
use App\Policies\GradeScalePolicy;
use App\Policies\TimetablePolicy;
use Illuminate\Support\Facades\Gate;
use Tests\Support\CreatesAcademicSecurityFixtures;
use Tests\Support\SecurityTestCase;

class AcademicPolicyTest extends SecurityTestCase
{
    use CreatesAcademicSecurityFixtures;

    public function test_academic_policies_are_registered(): void
    {
        $this->assertInstanceOf(TimetablePolicy::class, Gate::getPolicyFor(Timetable::class));
        $this->assertInstanceOf(ExamPolicy::class, Gate::getPolicyFor(Exam::class));
        $this->assertInstanceOf(GradeScalePolicy::class, Gate::getPolicyFor(GradeScale::class));
    }

    public function test_timetable_permissions_map_to_workflow_abilities(): void
    {
        $school = $this->createSecuritySchool();
        $class = $this->createAcademicClass($school);
        $subject = $this->createAcademicSubject($school, $class);
        $timetable = $this->createAcademicTimetable($school, $class, $subject);
        $viewer = $this->createAcademicSecurityUser('teacher', $school, ['timetable.view']);
        $manager = $this->createAcademicSecurityUser('school-admin', $school, ['timetable.manage']);

        $this->assertTrue(Gate::forUser($viewer)->allows('viewAny', Timetable::class));
        $this->assertTrue(Gate::forUser($viewer)->allows('teacherSchedule', Timetable::class));
        $this->assertFalse(Gate::forUser($viewer)->allows('create', Timetable::class));
        $this->assertTrue(Gate::forUser($manager)->allows('create', Timetable::class));
        $this->assertTrue(Gate::forUser($manager)->allows('delete', $timetable));
    }

    public function test_exam_permissions_map_to_exam_mark_and_result_abilities(): void
    {
        $school = $this->createSecuritySchool();
        $class = $this->createAcademicClass($school);
        $exam = $this->createAcademicExam($school, $class);
        $user = $this->createAcademicSecurityUser('teacher', $school, [
            'exams.view', 'marks.view', 'marks.entry', 'results.view',
        ]);
        $gate = Gate::forUser($user);

        $this->assertTrue($gate->allows('viewAny', Exam::class));
        $this->assertTrue($gate->allows('marks', $exam));
        $this->assertTrue($gate->allows('saveMarks', $exam));
        $this->assertTrue($gate->allows('results', $exam));
        $this->assertFalse($gate->allows('create', Exam::class));
        $this->assertFalse($gate->allows('delete', $exam));
    }

    public function test_grade_scale_workflow_reuses_exam_configuration_permissions(): void
    {
        $school = $this->createSecuritySchool();
        $scale = $this->createAcademicGradeScale($school);
        $viewer = $this->createAcademicSecurityUser('principal', $school, ['exams.view']);
        $editor = $this->createAcademicSecurityUser('school-admin', $school, ['exams.edit']);

        $this->assertTrue(Gate::forUser($viewer)->allows('viewAny', GradeScale::class));
        $this->assertFalse(Gate::forUser($viewer)->allows('create', GradeScale::class));
        $this->assertTrue(Gate::forUser($editor)->allows('create', GradeScale::class));
        $this->assertTrue(Gate::forUser($editor)->allows('update', $scale));
        $this->assertTrue(Gate::forUser($editor)->allows('delete', $scale));
    }

    public function test_cross_tenant_and_missing_tenant_context_fail_closed(): void
    {
        [$schoolA, $schoolB] = [$this->createSecuritySchool(), $this->createSecuritySchool()];
        $classB = $this->createAcademicClass($schoolB);
        $examB = $this->createAcademicExam($schoolB, $classB);
        $scaleB = $this->createAcademicGradeScale($schoolB);
        $userA = $this->createAcademicSecurityUser('school-admin', $schoolA, [
            'exams.view', 'exams.edit', 'exams.delete', 'timetable.view', 'timetable.manage',
        ]);
        $superAdmin = $this->createAcademicSecurityUser('super-admin', null, [
            'exams.view', 'exams.edit', 'exams.delete', 'timetable.view', 'timetable.manage',
        ]);

        $gateA = Gate::forUser($userA);
        $this->assertFalse($gateA->allows('update', $examB));
        $this->assertFalse($gateA->allows('delete', $examB));
        $this->assertFalse($gateA->allows('update', $scaleB));
        $this->assertFalse(Gate::forUser($superAdmin)->allows('viewAny', Exam::class));
        $this->assertFalse(Gate::forUser($superAdmin)->allows('viewAny', Timetable::class));
    }

    public function test_suspended_tenant_cannot_use_academic_policies(): void
    {
        $school = $this->createSecuritySchool(['status' => 'suspended']);
        $user = $this->createAcademicSecurityUser('school-admin', $school, [
            'exams.view', 'timetable.view',
        ]);

        $this->assertFalse(Gate::forUser($user)->allows('viewAny', Exam::class));
        $this->assertFalse(Gate::forUser($user)->allows('viewAny', Timetable::class));
    }
}
