<?php

namespace App\Services;

use App\Models\Exam;
use App\Models\Mark;
use App\Models\Student;
use App\Models\Subject;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MarksImportExportService
{
    /**
     * Generate a CSV template for a specific class and exam.
     */
    public function generateTemplate(Exam $exam, ?int $sectionId = null): string
    {
        $schoolId = $exam->school_id;

        $subjects = Subject::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('class_id', $exam->class_id)
            ->orderBy('name')
            ->get();

        $studentsQuery = Student::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('class_id', $exam->class_id)
            ->where('status', 'active');

        if ($sectionId) {
            $studentsQuery->where('section_id', $sectionId);
        }

        $students = $studentsQuery->orderBy('roll_no')->get();

        $headers = ['Admission No', 'Student Name', 'Section'];
        foreach ($subjects as $subject) {
            $headers[] = "{$subject->name} [{$subject->code}] (Max: {$subject->full_marks})";
        }

        $output = fopen('php://temp', 'r+');
        fputcsv($output, $headers);

        foreach ($students as $student) {
            $row = [
                $student->admission_no,
                trim("{$student->first_name} {$student->last_name}"),
                $student->section?->name ?? '—',
            ];
            // Empty placeholder for marks
            foreach ($subjects as $subject) {
                $row[] = '';
            }
            fputcsv($output, $row);
        }

        rewind($output);
        $csv = stream_get_contents($output);
        fclose($output);

        return $csv;
    }

    /**
     * Parse and import CSV marks into the marks table.
     */
    public function importCsv(Exam $exam, UploadedFile $file): array
    {
        $schoolId = $exam->school_id;
        $gradingService = new GradingService($schoolId);

        $subjects = Subject::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('class_id', $exam->class_id)
            ->get();

        $handle = fopen($file->getRealPath(), 'r');
        if (!$handle) {
            throw ValidationException::withMessages(['file' => 'Unable to read the uploaded CSV file.']);
        }

        $header = fgetcsv($handle);
        if (!$header || count($header) < 4) {
            fclose($handle);
            throw ValidationException::withMessages(['file' => 'Invalid CSV format. Please use the exported template.']);
        }

        // Map column index to subject
        $subjectMap = [];
        for ($i = 3; $i < count($header); $i++) {
            $colName = $header[$i];
            foreach ($subjects as $subject) {
                if (stripos($colName, $subject->name) !== false || ($subject->code && stripos($colName, $subject->code) !== false)) {
                    $subjectMap[$i] = $subject;
                    break;
                }
            }
        }

        $importedCount = 0;
        $errors = [];
        $rowNumber = 1;

        DB::beginTransaction();
        try {
            while (($row = fgetcsv($handle)) !== false) {
                $rowNumber++;
                if (empty(array_filter($row))) {
                    continue;
                }

                $admNo = trim($row[0] ?? '');
                if (!$admNo) {
                    continue;
                }

                $student = Student::withoutGlobalScopes()
                    ->where('school_id', $schoolId)
                    ->where('class_id', $exam->class_id)
                    ->where('admission_no', $admNo)
                    ->first();

                if (!$student) {
                    $errors[] = "Row {$rowNumber}: Learner with Admission No '{$admNo}' not found in this class.";
                    continue;
                }

                for ($colIdx = 3; $colIdx < count($row); $colIdx++) {
                    if (!isset($subjectMap[$colIdx])) {
                        continue;
                    }

                    $subject = $subjectMap[$colIdx];
                    $val = trim($row[$colIdx] ?? '');

                    if ($val === '') {
                        continue; // Skip unrecorded
                    }

                    $isAbsent = in_array(strtoupper($val), ['ABS', 'A', 'ABSENT']);
                    $marksObtained = $isAbsent ? null : (float)$val;
                    $fullMarks = $subject->full_marks > 0 ? (float)$subject->full_marks : 100.0;

                    if (!$isAbsent && ($marksObtained < 0 || $marksObtained > $fullMarks)) {
                        $errors[] = "Row {$rowNumber}: Mark {$marksObtained} for {$subject->name} exceeds maximum ({$fullMarks}).";
                        continue;
                    }

                    $graded = $marksObtained !== null 
                        ? $gradingService->calculate($marksObtained, $fullMarks)
                        : ['grade' => 'ABS', 'gpa' => 0.00];

                    Mark::withoutGlobalScopes()->updateOrCreate(
                        [
                            'school_id'  => $schoolId,
                            'exam_id'    => $exam->id,
                            'student_id' => $student->id,
                            'subject_id' => $subject->id,
                        ],
                        [
                            'marks_obtained' => $marksObtained,
                            'grade'          => $graded['grade'],
                            'gpa'            => $graded['gpa'],
                            'is_absent'      => $isAbsent,
                        ]
                    );

                    $importedCount++;
                }
            }

            if (!empty($errors) && $importedCount === 0) {
                DB::rollBack();
                fclose($handle);
                throw ValidationException::withMessages(['file' => implode(' ', array_slice($errors, 0, 5))]);
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            fclose($handle);
            if ($e instanceof ValidationException) {
                throw $e;
            }
            throw ValidationException::withMessages(['file' => 'Error importing marks: ' . $e->getMessage()]);
        }

        fclose($handle);

        return [
            'imported' => $importedCount,
            'warnings' => $errors,
        ];
    }
}