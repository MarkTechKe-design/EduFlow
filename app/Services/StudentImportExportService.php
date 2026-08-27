<?php

namespace App\Services;

use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Guardian;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class StudentImportExportService
{
    /**
     * Export students to a UTF-8 BOM encoded CSV stream.
     */
    public function exportCsv($query): string
    {
        $students = $query->with(['schoolClass', 'section', 'guardian'])->get();

        $headers = [
            'Admission No',
            'NEMIS UPI',
            'Assessment No',
            'First Name',
            'Middle Name',
            'Last Name',
            'Birth Certificate No',
            'Class',
            'Section',
            'Gender',
            'Date of Birth',
            'Admission Date',
            'Admission Type',
            'Guardian Name',
            'Guardian Phone',
            'Status',
        ];

        $handle = fopen('php://temp', 'r+');
        fputs($handle, "\xEF\xBB\xBF");
        fputcsv($handle, $headers);

        foreach ($students as $s) {
            fputcsv($handle, [
                $s->admission_no,
                $s->nemis_upi ?? '',
                $s->assessment_no ?? '',
                $s->first_name,
                $s->middle_name ?? '',
                $s->last_name ?? '',
                $s->birth_certificate_no ?? '',
                $s->schoolClass?->name ?? 'N/A',
                $s->section?->name ?? 'N/A',
                ucfirst($s->gender ?? ''),
                $s->date_of_birth ? Carbon::parse($s->date_of_birth)->format('Y-m-d') : ($s->dob ? Carbon::parse($s->dob)->format('Y-m-d') : ''),
                $s->admission_date ? Carbon::parse($s->admission_date)->format('Y-m-d') : '',
                ucfirst($s->admission_type ?? 'New'),
                $s->guardian?->name ?? $s->guardian_name ?? '',
                $s->guardian?->phone ?? $s->guardian_phone ?? '',
                ucfirst($s->status ?? 'Active'),
            ]);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return $csv;
    }

    /**
     * Generate sample CSV template for bulk student imports.
     */
    public function generateTemplateCsv(): string
    {
        $headers = [
            'Admission No',
            'NEMIS UPI',
            'Assessment No',
            'First Name',
            'Middle Name',
            'Last Name',
            'Birth Certificate No',
            'Class',
            'Section',
            'Gender',
            'Date of Birth',
            'Admission Date',
            'Admission Type',
            'Guardian Name',
            'Guardian Phone',
            'Guardian Relation',
            'Status',
        ];

        $sampleRows = [
            [
                'ADM-2026-0001',
                'UPI-99281',
                'ASS-2026-01',
                'Faith',
                'Akinyi',
                'Otieno',
                'BC-9812039',
                'Form 1',
                'East',
                'Female',
                '2012-04-15',
                '2026-01-08',
                'New',
                'Otieno Senior',
                '+254712345678',
                'Father',
                'Active',
            ],
            [
                'ADM-2026-0002',
                'UPI-99282',
                'ASS-2026-02',
                'Bradley',
                '',
                'Mwangi',
                'BC-9812040',
                'Form 1',
                'West',
                'Male',
                '2012-08-22',
                '2026-01-08',
                'Transfer In',
                'David Mwangi',
                '+254722334455',
                'Father',
                'Active',
            ],
        ];

        $handle = fopen('php://temp', 'r+');
        fputs($handle, "\xEF\xBB\xBF");
        fputcsv($handle, $headers);

        foreach ($sampleRows as $row) {
            fputcsv($handle, $row);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return $csv;
    }

    /**
     * Backward-compatible alias for generateTemplateCsv.
     */
    public function generateTemplate(): string
    {
        return $this->generateTemplateCsv();
    }

    /**
     * Parse uploaded CSV file and return structured preview rows.
     */
    public function parseAndPreview(UploadedFile $file, int $schoolId): array
    {
        $path = $file->getRealPath();
        $handle = fopen($path, 'r');
        if ($handle === false) {
            return ['headers' => [], 'rows' => [], 'errors' => ['Unable to read uploaded file.']];
        }

        $rawHeaders = fgetcsv($handle);
        if (!$rawHeaders) {
            fclose($handle);
            return ['headers' => [], 'rows' => [], 'errors' => ['The CSV file is empty.']];
        }

        // Clean UTF-8 BOM from the first header if present
        $rawHeaders[0] = preg_replace('/^\xEF\xBB\xBF/', '', $rawHeaders[0]);
        $headers = array_map('trim', $rawHeaders);

        $classes = SchoolClass::where('school_id', $schoolId)->pluck('id', 'name')->toArray();
        $sections = Section::where('school_id', $schoolId)->pluck('id', 'name')->toArray();

        $rows = [];
        $errors = [];
        $rowNum = 1;

        while (($data = fgetcsv($handle)) !== false) {
            $rowNum++;
            if (empty(array_filter($data))) {
                continue;
            }

            $mapped = [];
            foreach ($headers as $index => $header) {
                $mapped[$header] = isset($data[$index]) ? trim($data[$index]) : '';
            }

            $firstName = $mapped['First Name'] ?? $mapped['first_name'] ?? '';
            $lastName = $mapped['Last Name'] ?? $mapped['last_name'] ?? '';
            $admNo = $mapped['Admission No'] ?? $mapped['admission_no'] ?? '';

            $rowErrors = [];
            if (empty($firstName)) {
                $rowErrors[] = "Row {$rowNum}: First Name is required.";
            }
            if (empty($admNo)) {
                $rowErrors[] = "Row {$rowNum}: Admission No is required.";
            }

            $rows[] = [
                'row_number'           => $rowNum,
                'admission_no'         => $admNo,
                'nemis_upi'            => $mapped['NEMIS UPI'] ?? $mapped['nemis_upi'] ?? null,
                'assessment_no'        => $mapped['Assessment No'] ?? $mapped['assessment_no'] ?? null,
                'first_name'           => $firstName,
                'middle_name'          => $mapped['Middle Name'] ?? $mapped['middle_name'] ?? null,
                'last_name'            => $lastName,
                'birth_certificate_no' => $mapped['Birth Certificate No'] ?? $mapped['birth_certificate_no'] ?? null,
                'class_name'           => $mapped['Class'] ?? $mapped['class'] ?? '',
                'section_name'         => $mapped['Section'] ?? $mapped['section'] ?? '',
                'gender'               => strtolower($mapped['Gender'] ?? $mapped['gender'] ?? 'male'),
                'date_of_birth'        => $mapped['Date of Birth'] ?? $mapped['dob'] ?? null,
                'admission_date'       => $mapped['Admission Date'] ?? $mapped['admission_date'] ?? date('Y-m-d'),
                'admission_type'       => strtolower($mapped['Admission Type'] ?? $mapped['admission_type'] ?? 'new'),
                'guardian_name'        => $mapped['Guardian Name'] ?? $mapped['guardian_name'] ?? null,
                'guardian_phone'       => $mapped['Guardian Phone'] ?? $mapped['guardian_phone'] ?? null,
                'guardian_relation'    => $mapped['Guardian Relation'] ?? $mapped['guardian_relation'] ?? 'Parent',
                'status'               => strtolower($mapped['Status'] ?? $mapped['status'] ?? 'active'),
                'errors'               => $rowErrors,
            ];

            if (!empty($rowErrors)) {
                $errors = array_merge($errors, $rowErrors);
            }
        }

        fclose($handle);

        return [
            'headers' => $headers,
            'rows'    => $rows,
            'total'   => count($rows),
            'errors'  => $errors,
        ];
    }

    /**
     * Ingest validated batch rows atomically into the database.
     */
    public function importRows(array $rows, int $schoolId): array
    {
        $imported = 0;
        $failed = 0;
        $errors = [];

        $classes = SchoolClass::where('school_id', $schoolId)->pluck('id', 'name')->toArray();
        $sections = Section::where('school_id', $schoolId)->pluck('id', 'name')->toArray();

        DB::beginTransaction();
        try {
            foreach ($rows as $row) {
                $className = $row['class_name'] ?? '';
                $sectionName = $row['section_name'] ?? '';

                $classId = !empty($className) && isset($classes[$className]) ? $classes[$className] : null;
                $sectionId = !empty($sectionName) && isset($sections[$sectionName]) ? $sections[$sectionName] : null;

                Student::updateOrCreate(
                    [
                        'school_id'    => $schoolId,
                        'admission_no' => $row['admission_no'],
                    ],
                    [
                        'first_name'           => $row['first_name'],
                        'middle_name'          => $row['middle_name'] ?? null,
                        'last_name'            => $row['last_name'] ?? null,
                        'nemis_upi'            => $row['nemis_upi'] ?? null,
                        'assessment_no'        => $row['assessment_no'] ?? null,
                        'birth_certificate_no' => $row['birth_certificate_no'] ?? null,
                        'class_id'             => $classId,
                        'section_id'           => $sectionId,
                        'gender'               => strtolower($row['gender'] ?? 'male'),
                        'date_of_birth'        => !empty($row['date_of_birth']) ? Carbon::parse($row['date_of_birth']) : null,
                        'admission_date'       => !empty($row['admission_date']) ? Carbon::parse($row['admission_date']) : Carbon::today(),
                        'admission_type'       => $row['admission_type'] ?? 'new',
                        'guardian_name'        => $row['guardian_name'] ?? null,
                        'guardian_phone'       => $row['guardian_phone'] ?? null,
                        'guardian_relation'    => $row['guardian_relation'] ?? 'Parent',
                        'status'               => strtolower($row['status'] ?? 'active'),
                    ]
                );

                // Ensure student enrollment ledger entry is created or updated
                if ($classId) {
                    $activeYear = AcademicYear::where('school_id', $schoolId)->where('is_current', 1)->first()
                        ?? AcademicYear::where('school_id', $schoolId)->orderByDesc('id')->first();

                    StudentEnrollment::updateOrCreate(
                        [
                            'school_id'  => $schoolId,
                            'student_id' => $student->id,
                            'status'     => 'active',
                        ],
                        [
                            'academic_year_id' => $activeYear?->id,
                            'academic_year'    => $activeYear?->name ?? date('Y'),
                            'term'             => 'Term 1',
                            'class_id'         => $classId,
                            'section_id'       => $sectionId,
                            'start_date'       => $student->admission_date ?? now()->toDateString(),
                        ]
                    );
                }

                $imported++;
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            $failed = count($rows);
            $errors[] = 'Import failed due to database error: ' . $e->getMessage();
        }

        return [
            'imported' => $imported,
            'failed'   => $failed,
            'errors'   => $errors,
        ];
    }

    /**
     * Commit imported records to database (Controller alias).
     */
    public function commitImport(array $records, int $schoolId): array
    {
        return $this->importRows($records, $schoolId);
    }
}