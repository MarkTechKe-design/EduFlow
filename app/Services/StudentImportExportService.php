<?php

namespace App\Services;

use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StudentImportExportService
{
    /**
     * Standard column matching dictionary
     */
    protected array $headerAliases = [
        'full_name'      => ['name', 'student name', 'full name', 'learner name', 'student_name', 'learner'],
        'first_name'     => ['first name', 'firstname', 'first_name'],
        'last_name'      => ['last name', 'lastname', 'last_name', 'surname'],
        'admission_no'   => ['admission number', 'adm no', 'admission_no', 'adm_no', 'admission', 'reg no', 'upi'],
        'class_name'     => ['class', 'grade', 'level', 'academic level', 'form', 'class_name'],
        'section_name'   => ['section', 'stream', 'section_name', 'stream_name'],
        'gender'         => ['gender', 'sex'],
        'dob'            => ['date of birth', 'dob', 'birth_date', 'birthdate'],
        'guardian_name'  => ['guardian', 'parent', 'parent name', 'guardian name', 'guardian_name'],
        'guardian_phone' => ['guardian phone', 'parent phone', 'phone', 'contact', 'guardian_phone', 'mobile'],
        'admission_date' => ['admission date', 'admission_date', 'enrolled_date', 'date enrolled'],
    ];

    /**
     * Generate CSV Template Content
     */
    public function generateTemplateCsv(): string
    {
        $headers = [
            'Full Name',
            'Admission Number',
            'Class',
            'Section',
            'Gender',
            'Date of Birth (YYYY-MM-DD)',
            'Guardian Name',
            'Guardian Phone',
            'Admission Date (YYYY-MM-DD)',
        ];

        $sampleRows = [
            ['Bradley Mwangi', 'ADM-2026-0001', 'Grade 4', 'Elephant', 'Male', '2016-04-12', 'David Mwangi', '+254712345678', '2026-01-08'],
            ['Zawadi Achieng', 'ADM-2026-0002', 'Grade 7', 'STEM A',   'Female', '2013-09-24', 'Grace Otieno', '+254723456789', '2026-01-08'],
            ['Kevin Kiprop',   'ADM-2026-0003', 'Form 3',  'East',     'Male', '2009-11-05', 'John Kiprop',  '+254734567890', '2026-01-08'],
        ];

        $handle = fopen('php://temp', 'r+');
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
     * Parse and Preview File rows with automated header matching
     */
    public function parseAndPreview(string $filePath, int $schoolId): array
    {
        $rows = [];
        if (($handle = fopen($filePath, 'r')) !== false) {
            while (($data = fgetcsv($handle, 2000, ',')) !== false) {
                // Ignore completely empty lines
                if (array_filter($data, fn($v) => !is_null($v) && trim($v) !== '')) {
                    $rows[] = array_map('trim', $data);
                }
            }
            fclose($handle);
        }

        if (empty($rows)) {
            return ['headers' => [], 'preview' => [], 'mapping' => [], 'errors' => ['File is empty or invalid.']];
        }

        $rawHeaders = array_shift($rows);
        $suggestedMapping = $this->detectHeaderMapping($rawHeaders);

        // Preload classes and sections for school
        $classes = SchoolClass::where('school_id', $schoolId)->pluck('id', 'name')->toArray();
        $sections = Section::where('school_id', $schoolId)->get()->groupBy('class_id');

        $validRows = [];
        $invalidRows = [];

        foreach ($rows as $index => $row) {
            $mapped = [];
            foreach ($suggestedMapping as $field => $colIndex) {
                if ($colIndex !== null && isset($row[$colIndex])) {
                    $mapped[$field] = $row[$colIndex];
                } else {
                    $mapped[$field] = null;
                }
            }

            // Extract names
            $fullName = $mapped['full_name'] ?? '';
            $firstName = $mapped['first_name'] ?? '';
            $lastName = $mapped['last_name'] ?? '';

            if (empty($firstName) && !empty($fullName)) {
                $parts = explode(' ', trim($fullName), 2);
                $firstName = $parts[0];
                $lastName = $parts[1] ?? '';
            }

            $rowError = null;
            if (empty($firstName)) {
                $rowError = 'Student Name is required.';
            }

            $item = [
                'row_index'      => $index + 2,
                'first_name'     => $firstName,
                'last_name'      => $lastName,
                'admission_no'   => $mapped['admission_no'] ?? null,
                'class_name'     => $mapped['class_name'] ?? null,
                'section_name'   => $mapped['section_name'] ?? null,
                'gender'         => strtolower($mapped['gender'] ?? 'male') === 'female' ? 'female' : 'male',
                'dob'            => $this->cleanDate($mapped['dob'] ?? null),
                'guardian_name'  => $mapped['guardian_name'] ?? null,
                'guardian_phone' => $mapped['guardian_phone'] ?? null,
                'admission_date' => $this->cleanDate($mapped['admission_date'] ?? null) ?? now()->toDateString(),
                'error'          => $rowError,
            ];

            if ($rowError) {
                $invalidRows[] = $item;
            } else {
                $validRows[] = $item;
            }
        }

        return [
            'raw_headers'       => $rawHeaders,
            'suggested_mapping' => $suggestedMapping,
            'total_rows'        => count($rows),
            'valid_count'       => count($validRows),
            'invalid_count'     => count($invalidRows),
            'valid_rows'        => $validRows,
            'invalid_rows'      => $invalidRows,
        ];
    }

    /**
     * Commit Imported Records inside a Safe DB Transaction
     */
    public function commitImport(array $records, int $schoolId): array
    {
        $imported = 0;
        $updated  = 0;
        $skipped  = 0;
        $errors   = [];

        DB::beginTransaction();
        try {
            foreach ($records as $item) {
                $firstName = trim($item['first_name'] ?? '');
                $lastName  = trim($item['last_name'] ?? '');

                if (empty($firstName)) {
                    $skipped++;
                    continue;
                }

                // Resolve or create class dynamically
                $classId = null;
                if (!empty($item['class_name'])) {
                    $cls = SchoolClass::firstOrCreate(
                        ['school_id' => $schoolId, 'name' => trim($item['class_name'])],
                        ['numeric_name' => 0, 'capacity' => 45]
                    );
                    $classId = $cls->id;
                }

                // Resolve or create section dynamically under class
                $sectionId = null;
                if ($classId && !empty($item['section_name'])) {
                    $sec = Section::firstOrCreate(
                        ['school_id' => $schoolId, 'class_id' => $classId, 'name' => trim($item['section_name'])],
                        ['capacity' => 45]
                    );
                    $sectionId = $sec->id;
                }

                // Generate unique admission number if absent
                $admNo = !empty($item['admission_no']) ? trim($item['admission_no']) : null;
                if (!$admNo) {
                    $count = Student::where('school_id', $schoolId)->count() + 1;
                    $admNo = 'ADM-' . date('Y') . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
                }

                // Match by admission number scoped to school
                $student = Student::where('school_id', $schoolId)->where('admission_no', $admNo)->first();

                $payload = [
                    'school_id'      => $schoolId,
                    'class_id'       => $classId,
                    'section_id'     => $sectionId,
                    'admission_no'   => $admNo,
                    'first_name'     => $firstName,
                    'last_name'      => $lastName,
                    'gender'         => strtolower($item['gender'] ?? 'male') === 'female' ? 'female' : 'male',
                    'dob'            => $item['dob'] ?? null,
                    'guardian_name'  => $item['guardian_name'] ?? null,
                    'guardian_phone' => $item['guardian_phone'] ?? null,
                    'admission_date' => $item['admission_date'] ?? now()->toDateString(),
                    'status'         => 'active',
                ];

                if ($student) {
                    $student->update($payload);
                    $updated++;
                } else {
                    Student::create($payload);
                    $imported++;
                }
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return [
            'imported' => $imported,
            'updated'  => $updated,
            'skipped'  => $skipped,
            'total'    => $imported + $updated + $skipped,
        ];
    }

    /**
     * Export Filtered Student List to CSV
     */
    public function exportCsv($query): string
    {
        $students = $query->with(['schoolClass', 'section'])->get();

        $headers = [
            'Admission No',
            'Full Name',
            'Class',
            'Section',
            'Gender',
            'Date of Birth',
            'Guardian Name',
            'Guardian Phone',
            'Admission Date',
            'Status',
        ];

        $handle = fopen('php://temp', 'r+');
        fputcsv($handle, $headers);

        foreach ($students as $s) {
            fputcsv($handle, [
                $s->admission_no,
                $s->full_name,
                $s->schoolClass?->name ?? 'N/A',
                $s->section?->name ?? 'N/A',
                ucfirst($s->gender),
                $s->dob ? $s->dob->format('Y-m-d') : '',
                $s->guardian_name ?? '',
                $s->guardian_phone ?? '',
                $s->admission_date ? $s->admission_date->format('Y-m-d') : '',
                ucfirst($s->status),
            ]);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return $csv;
    }

    protected function detectHeaderMapping(array $rawHeaders): array
    {
        $mapping = [];
        $normalizedRaw = array_map(fn($h) => strtolower(trim(preg_replace('/[^a-zA-Z0-9]/', ' ', $h))), $rawHeaders);

        foreach ($this->headerAliases as $field => $aliases) {
            $mapping[$field] = null;
            foreach ($aliases as $alias) {
                $idx = array_search($alias, $normalizedRaw);
                if ($idx !== false) {
                    $mapping[$field] = $idx;
                    break;
                }
            }
        }

        return $mapping;
    }

    protected function cleanDate(?string $dateStr): ?string
    {
        if (empty($dateStr)) return null;
        try {
            return Carbon::parse($dateStr)->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }
}