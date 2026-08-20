<?php

namespace App\Services;

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
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Collection;

class AcademicReportService
{
    /**
     * Compile a comprehensive, normalized report payload for a single student's exam.
     */
    public function forStudentExam(Student $student, Exam $exam): array
    {
        if ((int)$student->school_id !== (int)$exam->school_id) {
            throw (new ModelNotFoundException)->setModel(Student::class, [$student->id]);
        }

        $school = $student->school ?? School::withoutGlobalScopes()->findOrFail($student->school_id);
        $gradingService = new GradingService($school->id);

        $subjects = Subject::withoutGlobalScopes()
            ->where('school_id', $school->id)
            ->where('class_id', $exam->class_id)
            ->orderBy('name')
            ->get();

        $marks = Mark::withoutGlobalScopes()
            ->where('school_id', $school->id)
            ->where('exam_id', $exam->id)
            ->where('student_id', $student->id)
            ->get()
            ->keyBy('subject_id');

        $subjectRows = [];
        $totalObtained = 0.0;
        $totalMax = 0.0;
        $gradedCount = 0;
        $gpaSum = 0.0;

        foreach ($subjects as $subject) {
            $mark = $marks->get($subject->id);
            $fullMarks = $subject->full_marks > 0 ? (float) $subject->full_marks : 100.0;

            if ($mark && $mark->is_absent) {
                $subjectRows[] = [
                    'subject_id'     => $subject->id,
                    'subject_name'   => $subject->name,
                    'subject_code'   => $subject->code ?? '',
                    'marks_obtained' => null,
                    'display_mark'   => 'ABS',
                    'full_marks'     => $fullMarks,
                    'percentage'     => 0.0,
                    'grade'          => 'ABS',
                    'points'         => 0.0,
                    'remarks'        => 'Absent',
                    'is_absent'      => true,
                ];
                $totalMax += $fullMarks;
            } elseif ($mark && $mark->marks_obtained !== null) {
                $obtained = (float) $mark->marks_obtained;
                $pct = round(($obtained / $fullMarks) * 100, 2);
                $eval = $gradingService->calculate($obtained, $fullMarks);

                $subjectRows[] = [
                    'subject_id'     => $subject->id,
                    'subject_name'   => $subject->name,
                    'subject_code'   => $subject->code ?? '',
                    'marks_obtained' => $obtained,
                    'display_mark'   => (string) $obtained,
                    'full_marks'     => $fullMarks,
                    'percentage'     => $pct,
                    'grade'          => $eval['grade'],
                    'points'         => $eval['gpa'],
                    'remarks'        => $mark->remarks ?: $eval['remarks'],
                    'is_absent'      => false,
                ];

                $totalObtained += $obtained;
                $totalMax += $fullMarks;
                $gpaSum += $eval['gpa'];
                $gradedCount++;
            } else {
                $subjectRows[] = [
                    'subject_id'     => $subject->id,
                    'subject_name'   => $subject->name,
                    'subject_code'   => $subject->code ?? '',
                    'marks_obtained' => null,
                    'display_mark'   => '—',
                    'full_marks'     => $fullMarks,
                    'percentage'     => null,
                    'grade'          => '—',
                    'points'         => null,
                    'remarks'        => 'Unrecorded',
                    'is_absent'      => false,
                ];
            }
        }

        // Summary Calculations
        $avgPct = $totalMax > 0 ? round(($totalObtained / $totalMax) * 100, 2) : 0.0;
        $meanGpa = $gradedCount > 0 ? round($gpaSum / $gradedCount, 2) : 0.0;
        $meanEval = $gradingService->calculate($totalObtained, $totalMax > 0 ? $totalMax : 100.0);

        // Ranking Calculations
        $ranks = $this->calculateRanks($exam, $student->section_id);

        // Attendance Summary
        $attendance = $this->calculateAttendance($student, $exam);

        // Calendar Details
        $calendar = $this->resolveCalendarContext($school, $exam);

        return [
            'school' => [
                'name'                => $school->name,
                'logo_url'            => $school->logo_url,
                'motto'               => $school->motto ?? 'Excellence in Education',
                'address'             => $school->address ?? '',
                'phone'               => $school->phone ?? '',
                'email'               => $school->email ?? '',
                'registration_number' => $school->registration_number ?? '',
                'knec_code'           => $school->knec_code ?? '',
                'county'              => $school->county ?? '',
                'curriculum'          => $school->curriculum ?? 'CBC',
            ],
            'student' => [
                'id'            => $student->id,
                'full_name'     => trim("{$student->first_name} {$student->last_name}"),
                'admission_no'  => $student->admission_no,
                'nemis_upi'     => $student->nemis_upi ?? '',
                'assessment_no' => $student->assessment_no ?? '',
                'gender'        => ucfirst($student->gender ?? '—'),
                'class_name'    => $student->schoolClass?->name ?? '—',
                'section_name'  => $student->section?->name ?? '—',
                'photo_url'     => $student->photo_url,
            ],
            'exam' => [
                'id'         => $exam->id,
                'name'       => $exam->name,
                'type'       => $exam->type,
                'status'     => $exam->status,
                'start_date' => $exam->start_date?->toDateString(),
                'end_date'   => $exam->end_date?->toDateString(),
            ],
            'subjects' => $subjectRows,
            'summary' => [
                'total_marks'           => $totalObtained,
                'max_possible_marks'    => $totalMax,
                'average_percentage'    => $avgPct,
                'mean_grade'            => $meanEval['grade'],
                'mean_points'           => $meanGpa,
                'class_position'        => $ranks['class_ranks'][$student->id] ?? null,
                'stream_position'       => $ranks['stream_ranks'][$student->id] ?? null,
                'total_students_class'  => $ranks['total_class'],
                'total_students_stream' => $ranks['total_stream'],
                'class_teacher_remarks' => $this->generateRemark($avgPct),
                'headteacher_remarks'   => $this->generatePrincipalRemark($avgPct),
            ],
            'attendance' => $attendance,
            'calendar'   => $calendar,
        ];
    }

    /**
     * Compile class-wide marks matrix and standard competition rankings.
     */
    public function forClassExam(SchoolClass $class, Exam $exam, ?int $sectionId = null): array
    {
        $school = School::withoutGlobalScopes()->findOrFail($class->school_id);
        $gradingService = new GradingService($school->id);

        $subjects = Subject::withoutGlobalScopes()
            ->where('school_id', $school->id)
            ->where('class_id', $class->id)
            ->orderBy('name')
            ->get();

        $studentsQuery = Student::withoutGlobalScopes()
            ->where('school_id', $school->id)
            ->where('class_id', $class->id)
            ->where('status', 'active')
            ->with(['section:id,name']);

        if ($sectionId) {
            $studentsQuery->where('section_id', $sectionId);
        }

        $students = $studentsQuery->orderBy('roll_no')->get();
        $studentIds = $students->pluck('id');

        $allMarks = Mark::withoutGlobalScopes()
            ->where('school_id', $school->id)
            ->where('exam_id', $exam->id)
            ->whereIn('student_id', $studentIds)
            ->get()
            ->groupBy('student_id')
            ->map(fn ($marks) => $marks->keyBy('subject_id'));

        $ranks = $this->calculateRanks($exam, $sectionId);

        $studentRows = $students->map(function ($student) use ($subjects, $allMarks, $gradingService, $ranks) {
            $marks = $allMarks->get($student->id, collect());
            $subjectScores = [];
            $totalObtained = 0.0;
            $totalMax = 0.0;

            foreach ($subjects as $subject) {
                $mark = $marks->get($subject->id);
                $fullMarks = $subject->full_marks > 0 ? (float) $subject->full_marks : 100.0;

                if ($mark && $mark->is_absent) {
                    $subjectScores[$subject->id] = ['score' => 'ABS', 'grade' => 'ABS', 'is_absent' => true];
                    $totalMax += $fullMarks;
                } elseif ($mark && $mark->marks_obtained !== null) {
                    $score = (float) $mark->marks_obtained;
                    $eval = $gradingService->calculate($score, $fullMarks);
                    $subjectScores[$subject->id] = ['score' => $score, 'grade' => $eval['grade'], 'is_absent' => false];
                    $totalObtained += $score;
                    $totalMax += $fullMarks;
                } else {
                    $subjectScores[$subject->id] = ['score' => '—', 'grade' => '—', 'is_absent' => false];
                }
            }

            $avgPct = $totalMax > 0 ? round(($totalObtained / $totalMax) * 100, 2) : 0.0;
            $meanEval = $gradingService->calculate($totalObtained, $totalMax > 0 ? $totalMax : 100.0);

            return [
                'student_id'   => $student->id,
                'full_name'    => trim("{$student->first_name} {$student->last_name}"),
                'admission_no' => $student->admission_no,
                'section_name' => $student->section?->name ?? '—',
                'scores'       => $subjectScores,
                'total_marks'  => $totalObtained,
                'percentage'   => $avgPct,
                'mean_grade'   => $meanEval['grade'],
                'rank'         => $ranks['class_ranks'][$student->id] ?? null,
            ];
        })->sortBy('rank')->values()->all();

        return [
            'class'    => ['id' => $class->id, 'name' => $class->name],
            'exam'     => ['id' => $exam->id, 'name' => $exam->name],
            'subjects' => $subjects->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'code' => $s->code, 'full_marks' => $s->full_marks])->all(),
            'students' => $studentRows,
        ];
    }

    /**
     * Standard 1224 Competition Ranking algorithm.
     */
    protected function calculateRanks(Exam $exam, ?int $sectionId = null): array
    {
        $schoolId = $exam->school_id;

        // Class Population
        $classStudents = Student::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('class_id', $exam->class_id)
            ->where('status', 'active')
            ->pluck('id');

        $classTotals = Mark::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('exam_id', $exam->id)
            ->whereIn('student_id', $classStudents)
            ->selectRaw('student_id, SUM(COALESCE(marks_obtained, 0)) as total_score')
            ->groupBy('student_id')
            ->pluck('total_score', 'student_id')
            ->sortDesc();

        $classRanks = [];
        $currentRank = 1;
        $prevScore = null;
        $index = 0;

        foreach ($classTotals as $sId => $score) {
            $index++;
            if ($prevScore !== null && (float)$score < (float)$prevScore) {
                $currentRank = $index;
            }
            $classRanks[$sId] = $currentRank;
            $prevScore = $score;
        }

        // Stream Population
        $streamRanks = [];
        $totalStream = 0;
        if ($sectionId) {
            $streamStudents = Student::withoutGlobalScopes()
                ->where('school_id', $schoolId)
                ->where('class_id', $exam->class_id)
                ->where('section_id', $sectionId)
                ->where('status', 'active')
                ->pluck('id');

            $totalStream = $streamStudents->count();

            $streamTotals = Mark::withoutGlobalScopes()
                ->where('school_id', $schoolId)
                ->where('exam_id', $exam->id)
                ->whereIn('student_id', $streamStudents)
                ->selectRaw('student_id, SUM(COALESCE(marks_obtained, 0)) as total_score')
                ->groupBy('student_id')
                ->pluck('total_score', 'student_id')
                ->sortDesc();

            $currStreamRank = 1;
            $prevStreamScore = null;
            $sIdx = 0;

            foreach ($streamTotals as $sId => $score) {
                $sIdx++;
                if ($prevStreamScore !== null && (float)$score < (float)$prevStreamScore) {
                    $currStreamRank = $sIdx;
                }
                $streamRanks[$sId] = $currStreamRank;
                $prevStreamScore = $score;
            }
        }

        return [
            'class_ranks'  => $classRanks,
            'stream_ranks' => $streamRanks,
            'total_class'  => $classStudents->count(),
            'total_stream' => $totalStream,
        ];
    }

    protected function calculateAttendance(Student $student, Exam $exam): array
    {
        $query = Attendance::withoutGlobalScopes()
            ->where('school_id', $student->school_id)
            ->where('attendable_type', Student::class)
            ->where('attendable_id', $student->id);

        if ($exam->start_date && $exam->end_date) {
            $query->whereBetween('date', [$exam->start_date, $exam->end_date]);
        }

        $records = $query->get();
        $present = $records->whereIn('status', ['present', 'late', 'half_day'])->count();
        $absent = $records->where('status', 'absent')->count();
        $total = $records->count();

        return [
            'days_present'    => $present,
            'days_absent'     => $absent,
            'total_days'      => $total,
            'attendance_rate' => $total > 0 ? round(($present / $total) * 100, 1) : 100.0,
        ];
    }

    protected function resolveCalendarContext(School $school, Exam $exam): array
    {
        $academicYear = AcademicYear::withoutGlobalScopes()
            ->where('school_id', $school->id)
            ->where('is_current', true)
            ->first();

        return [
            'academic_year'          => $academicYear?->name ?? date('Y'),
            'term'                   => $exam->name,
            'next_term_opening_date' => '04/01/' . (date('Y') + 1),
            'closing_date'           => $exam->end_date?->format('d/m/Y') ?? date('d/m/Y'),
        ];
    }

    protected function generateRemark(float $pct): string
    {
        return match (true) {
            $pct >= 80 => 'An exemplary achievement across all assessed competencies. Keep up the high standards!',
            $pct >= 65 => 'Commendable performance with consistent effort. Can achieve higher with focused revision.',
            $pct >= 50 => 'Satisfactory progress. Needs to concentrate more on challenging topic areas.',
            default    => 'Requires targeted remedial support and closer supervision in key foundation skills.',
        };
    }

    protected function generatePrincipalRemark(float $pct): string
    {
        return match (true) {
            $pct >= 80 => 'Outstanding work. Promising potential for academic excellence.',
            $pct >= 65 => 'Good results. Encourage steady reading habits during the vacation.',
            default    => 'Advised to attend vacation remedial coaching and complete holiday assignments.',
        };
    }
}