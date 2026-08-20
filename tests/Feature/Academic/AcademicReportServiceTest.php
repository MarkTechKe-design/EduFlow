<?php

namespace Tests\Feature\Academic;

use App\Models\AcademicYear;
use App\Models\Attendance;
use App\Models\Exam;
use App\Models\GradeScale;
use App\Models\Mark;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use App\Services\AcademicReportService;
use App\Services\GradingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AcademicReportServiceTest extends TestCase
{
    use RefreshDatabase;

    protected School $schoolA;
    protected School $schoolB;
    protected User $adminUser;
    protected SchoolClass $classA;
    protected Section $sectionA;
    protected Subject $math;
    protected Subject $eng;
    protected Exam $examA;
    protected Student $student1;
    protected Student $student2;
    protected Student $student3;
    protected Student $student4;

    protected function setUp(): void
    {
        parent::setUp();

        // 1. Create School A
        $this->schoolA = School::create([
            'name'       => 'Greenfield Academy',
            'slug'       => 'greenfield-academy',
            'status'     => 'active',
            'curriculum' => 'CBC',
        ]);

        $this->adminUser = User::create([
            'school_id' => $this->schoolA->id,
            'name'      => 'Admin User',
            'email'     => 'admin@greenfield.test',
            'password'  => bcrypt('password'),
        ]);

        $this->actingAs($this->adminUser);

        foreach (GradingService::defaultScales() as $scale) {
            GradeScale::create(array_merge($scale, ['school_id' => $this->schoolA->id]));
        }

        $this->classA = SchoolClass::create([
            'school_id'    => $this->schoolA->id,
            'name'         => 'Grade 4',
            'numeric_name' => 4,
            'capacity'     => 40,
        ]);

        $this->sectionA = Section::create([
            'school_id' => $this->schoolA->id,
            'class_id'  => $this->classA->id,
            'name'      => 'East',
            'capacity'  => 20,
        ]);

        $this->math = Subject::create([
            'school_id'  => $this->schoolA->id,
            'class_id'   => $this->classA->id,
            'name'       => 'Mathematics',
            'code'       => 'MATH-4',
            'type'       => 'theory',
            'full_marks' => 100,
            'pass_marks' => 40,
        ]);

        $this->eng = Subject::create([
            'school_id'  => $this->schoolA->id,
            'class_id'   => $this->classA->id,
            'name'       => 'English Language',
            'code'       => 'ENG-4',
            'type'       => 'theory',
            'full_marks' => 100,
            'pass_marks' => 40,
        ]);

        $this->examA = Exam::create([
            'school_id'  => $this->schoolA->id,
            'class_id'   => $this->classA->id,
            'name'       => 'Term 2 End-Term Assessment',
            'type'       => 'final',
            'status'     => 'published',
            'start_date' => '2026-07-01',
            'end_date'   => '2026-07-15',
        ]);

        $this->student1 = Student::create([
            'school_id'    => $this->schoolA->id,
            'class_id'     => $this->classA->id,
            'section_id'   => $this->sectionA->id,
            'first_name'   => 'James',
            'last_name'    => 'Myles',
            'admission_no' => 'ADM-001',
            'gender'       => 'male',
            'status'       => 'active',
        ]);

        $this->student2 = Student::create([
            'school_id'    => $this->schoolA->id,
            'class_id'     => $this->classA->id,
            'section_id'   => $this->sectionA->id,
            'first_name'   => 'Mary',
            'last_name'    => 'Achieng',
            'admission_no' => 'ADM-002',
            'gender'       => 'female',
            'status'       => 'active',
        ]);

        $this->student3 = Student::create([
            'school_id'    => $this->schoolA->id,
            'class_id'     => $this->classA->id,
            'section_id'   => $this->sectionA->id,
            'first_name'   => 'Brian',
            'last_name'    => 'Otieno',
            'admission_no' => 'ADM-003',
            'gender'       => 'male',
            'status'       => 'active',
        ]);

        $this->student4 = Student::create([
            'school_id'    => $this->schoolA->id,
            'class_id'     => $this->classA->id,
            'section_id'   => $this->sectionA->id,
            'first_name'   => 'David',
            'last_name'    => 'Kimani',
            'admission_no' => 'ADM-004',
            'gender'       => 'male',
            'status'       => 'active',
        ]);

        // 2. School B for Tenant Isolation Tests
        $this->schoolB = School::create([
            'name'   => 'St. Jude Academy',
            'slug'   => 'st-jude',
            'status' => 'active',
        ]);
    }

    public function test_percentage_calculation_and_grading_delegation(): void
    {
        $grading = new GradingService($this->schoolA->id);
        $res = $grading->calculate(85.0, 100.0);

        $this->assertEquals('A+', $res['grade']);
        $this->assertEquals(5.0, $res['gpa']);
        $this->assertEquals('Outstanding', $res['remarks']);

        Mark::create([
            'school_id'      => $this->schoolA->id,
            'exam_id'        => $this->examA->id,
            'student_id'     => $this->student1->id,
            'subject_id'     => $this->math->id,
            'marks_obtained' => 85.0,
            'grade'          => $res['grade'],
            'gpa'            => $res['gpa'],
            'is_absent'      => false,
        ]);

        $service = app(AcademicReportService::class);
        $report = $service->forStudentExam($this->student1, $this->examA);

        $mathRow = collect($report['subjects'])->firstWhere('subject_id', $this->math->id);
        $this->assertNotNull($mathRow);
        $this->assertEquals(85.0, $mathRow['percentage']);
        $this->assertEquals('A+', $mathRow['grade']);
        $this->assertEquals(5.0, $mathRow['points']);
    }

    public function test_standard_competition_ranking_with_ties_1224(): void
    {
        // Student 1: 95
        Mark::create(['school_id' => $this->schoolA->id, 'exam_id' => $this->examA->id, 'student_id' => $this->student1->id, 'subject_id' => $this->math->id, 'marks_obtained' => 95, 'is_absent' => false]);
        // Student 2: 90 (Tied)
        Mark::create(['school_id' => $this->schoolA->id, 'exam_id' => $this->examA->id, 'student_id' => $this->student2->id, 'subject_id' => $this->math->id, 'marks_obtained' => 90, 'is_absent' => false]);
        // Student 3: 90 (Tied)
        Mark::create(['school_id' => $this->schoolA->id, 'exam_id' => $this->examA->id, 'student_id' => $this->student3->id, 'subject_id' => $this->math->id, 'marks_obtained' => 90, 'is_absent' => false]);
        // Student 4: 80
        Mark::create(['school_id' => $this->schoolA->id, 'exam_id' => $this->examA->id, 'student_id' => $this->student4->id, 'subject_id' => $this->math->id, 'marks_obtained' => 80, 'is_absent' => false]);

        $service = app(AcademicReportService::class);
        $classReport = $service->forClassExam($this->classA, $this->examA);

        $ranks = collect($classReport['students'])->pluck('rank', 'student_id')->toArray();

        // 1224 Standard Competition Ranking
        $this->assertEquals(1, $ranks[$this->student1->id]);
        $this->assertEquals(2, $ranks[$this->student2->id]);
        $this->assertEquals(2, $ranks[$this->student3->id]);
        $this->assertEquals(4, $ranks[$this->student4->id]);
    }

    public function test_explicit_absence_vs_unrecorded_marks(): void
    {
        // Student 1 is marked ABSENT for Math
        Mark::create([
            'school_id'      => $this->schoolA->id,
            'exam_id'        => $this->examA->id,
            'student_id'     => $this->student1->id,
            'subject_id'     => $this->math->id,
            'marks_obtained' => null,
            'is_absent'      => true,
        ]);

        $service = app(AcademicReportService::class);
        $report = $service->forStudentExam($this->student1, $this->examA);

        $mathRow = collect($report['subjects'])->firstWhere('subject_id', $this->math->id);
        $this->assertNotNull($mathRow);
        $this->assertTrue($mathRow['is_absent']);
        $this->assertEquals('ABS', $mathRow['display_mark']);

        // English has NO Mark row created (Unrecorded)
        $engRow = collect($report['subjects'])->firstWhere('subject_id', $this->eng->id);
        $this->assertNotNull($engRow);
        $this->assertFalse($engRow['is_absent']);
        $this->assertEquals('—', $engRow['display_mark']);
    }

    public function test_attendance_summary_aggregation(): void
    {
        Attendance::create([
            'school_id'       => $this->schoolA->id,
            'attendable_type' => Student::class,
            'attendable_id'   => $this->student1->id,
            'date'            => '2026-07-02',
            'status'          => 'present',
        ]);
        Attendance::create([
            'school_id'       => $this->schoolA->id,
            'attendable_type' => Student::class,
            'attendable_id'   => $this->student1->id,
            'date'            => '2026-07-03',
            'status'          => 'absent',
        ]);
        Attendance::create([
            'school_id'       => $this->schoolA->id,
            'attendable_type' => Student::class,
            'attendable_id'   => $this->student1->id,
            'date'            => '2026-07-04',
            'status'          => 'late',
        ]);

        $service = app(AcademicReportService::class);
        $report = $service->forStudentExam($this->student1, $this->examA);

        $this->assertEquals(2, $report['attendance']['days_present']); // present + late
        $this->assertEquals(1, $report['attendance']['days_absent']);
        $this->assertEquals(3, $report['attendance']['total_days']);
    }

    public function test_tenant_isolation_fails_closed(): void
    {
        // Logout so BelongsToSchool does not overwrite student's school_id with School A
        auth()->logout();

        $studentB = Student::create([
            'school_id'    => $this->schoolB->id,
            'class_id'     => $this->classA->id,
            'first_name'   => 'Foreign',
            'last_name'    => 'Learner',
            'admission_no' => 'ADM-999',
            'gender'       => 'male',
            'status'       => 'active',
        ]);

        $this->actingAs($this->adminUser);

        $service = app(AcademicReportService::class);

        $this->expectException(\Illuminate\Database\Eloquent\ModelNotFoundException::class);
        $service->forStudentExam($studentB, $this->examA);
    }
}