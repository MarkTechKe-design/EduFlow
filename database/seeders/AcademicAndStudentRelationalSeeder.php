<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\School;
use App\Models\User;

class AcademicAndStudentRelationalSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $schools = [
            'greenfield' => School::withoutGlobalScopes()->where('slug', 'greenfield-academy')->first(),
            'staustin'   => School::withoutGlobalScopes()->where('slug', 'st-austin-high')->first(),
            'premier'    => School::withoutGlobalScopes()->where('slug', 'nairobi-premier')->first(),
        ];

        foreach ($schools as $key => $school) {
            if (!$school) {
                continue;
            }

            $academicYear = DB::table('academic_years')
                ->where('school_id', $school->id)
                ->where('is_current', 1)
                ->first();

            $academicYearId = $academicYear ? $academicYear->id : null;

            $this->command->info("Seeding Academic Core for: {$school->name}");

            // 1. DEPARTMENTS
            $deptData = [
                ['name' => 'Languages', 'code' => 'LANG', 'type' => 'academic', 'description' => 'English, Kiswahili & Foreign Languages'],
                ['name' => 'Sciences & Mathematics', 'code' => 'SCIMATH', 'type' => 'academic', 'description' => 'Mathematics, Physics, Chemistry, Biology & Integrated Science'],
                ['name' => 'Humanities & Social Sciences', 'code' => 'HUM', 'type' => 'academic', 'description' => 'History, Geography, CRE, Social Studies'],
                ['name' => 'Technical & Creative Arts', 'code' => 'TECH', 'type' => 'academic', 'description' => 'Computer Studies, Agriculture, Art & Music'],
                ['name' => 'Administration & Operations', 'code' => 'ADMIN', 'type' => 'administrative', 'description' => 'School Leadership, Accounts, Registry & Logistics'],
            ];

            $departments = [];
            foreach ($deptData as $d) {
                DB::table('departments')->updateOrInsert(
                    ['school_id' => $school->id, 'code' => $d['code']],
                    [
                        'name'        => $d['name'],
                        'type'        => $d['type'],
                        'description' => $d['description'],
                        'created_at'  => $now,
                        'updated_at'  => $now,
                    ]
                );

                $departments[$d['code']] = DB::table('departments')
                    ->where('school_id', $school->id)
                    ->where('code', $d['code'])
                    ->first()->id;
            }

            // 2. DESIGNATIONS
            $desigData = [
                ['name' => 'Head of Department', 'cadre' => 'teaching', 'is_leadership' => 1, 'dept' => 'SCIMATH'],
                ['name' => 'Senior Teacher', 'cadre' => 'teaching', 'is_leadership' => 1, 'dept' => 'LANG'],
                ['name' => 'Class Facilitator', 'cadre' => 'teaching', 'is_leadership' => 0, 'dept' => 'LANG'],
                ['name' => 'Subject Teacher', 'cadre' => 'teaching', 'is_leadership' => 0, 'dept' => 'TECH'],
                ['name' => 'Chief Accountant / Bursar', 'cadre' => 'administrative', 'is_leadership' => 1, 'dept' => 'ADMIN'],
                ['name' => 'Head Librarian', 'cadre' => 'support', 'is_leadership' => 0, 'dept' => 'ADMIN'],
            ];

            $designations = [];
            foreach ($desigData as $dg) {
                DB::table('designations')->updateOrInsert(
                    ['school_id' => $school->id, 'name' => $dg['name']],
                    [
                        'department_id' => $departments[$dg['dept']] ?? $departments['ADMIN'],
                        'cadre'         => $dg['cadre'],
                        'is_leadership' => $dg['is_leadership'],
                        'description'   => $dg['name'],
                        'created_at'    => $now,
                        'updated_at'    => $now,
                    ]
                );

                $designations[$dg['name']] = DB::table('designations')
                    ->where('school_id', $school->id)
                    ->where('name', $dg['name'])
                    ->first()->id;
            }

            // 3. STAFF & TEACHERS
            $demoTeacherEmail = match ($key) {
                'greenfield' => 'teacher@eduflow.test',
                'staustin'   => 'teacher.staustin@eduflow.test',
                'premier'    => 'teacher.premier@eduflow.test',
                default      => 'teacher@eduflow.test',
            };

            $demoTeacherUser = User::withoutGlobalScopes()->where('email', $demoTeacherEmail)->first();
            $teacherUserId = $demoTeacherUser ? $demoTeacherUser->id : null;

            $staffProfiles = [
                [
                    'user_id'        => $teacherUserId,
                    'emp_id'         => strtoupper(substr($key, 0, 2)) . '-STF-001',
                    'first_name'     => 'Erick',
                    'last_name'      => 'Otieno',
                    'gender'         => 'male',
                    'email'          => $demoTeacherEmail,
                    'phone'          => '+254722100' . rand(100, 999),
                    'designation_id' => $designations['Senior Teacher'],
                    'department_id'  => $departments['LANG'],
                    'salary'         => 85000.00,
                ],
                [
                    'user_id'        => null,
                    'emp_id'         => strtoupper(substr($key, 0, 2)) . '-STF-002',
                    'first_name'     => 'Mercy',
                    'last_name'      => 'Wanjiku',
                    'gender'         => 'female',
                    'email'          => "m.wanjiku.{$key}@eduflow.test",
                    'phone'          => '+254722200' . rand(100, 999),
                    'designation_id' => $designations['Head of Department'],
                    'department_id'  => $departments['SCIMATH'],
                    'salary'         => 95000.00,
                ],
                [
                    'user_id'        => null,
                    'emp_id'         => strtoupper(substr($key, 0, 2)) . '-STF-003',
                    'first_name'     => 'David',
                    'last_name'      => 'Kiprono',
                    'gender'         => 'male',
                    'email'          => "d.kiprono.{$key}@eduflow.test",
                    'phone'          => '+254722300' . rand(100, 999),
                    'designation_id' => $designations['Class Facilitator'],
                    'department_id'  => $departments['HUM'],
                    'salary'         => 72000.00,
                ],
                [
                    'user_id'        => null,
                    'emp_id'         => strtoupper(substr($key, 0, 2)) . '-STF-004',
                    'first_name'     => 'Faith',
                    'last_name'      => 'Mutua',
                    'gender'         => 'female',
                    'email'          => "f.mutua.{$key}@eduflow.test",
                    'phone'          => '+254722400' . rand(100, 999),
                    'designation_id' => $designations['Subject Teacher'],
                    'department_id'  => $departments['TECH'],
                    'salary'         => 68000.00,
                ],
            ];

            $seededStaffIds = [];
            foreach ($staffProfiles as $sp) {
                DB::table('staff')->updateOrInsert(
                    ['school_id' => $school->id, 'emp_id' => $sp['emp_id']],
                    [
                        'user_id'        => $sp['user_id'],
                        'department_id'  => $sp['department_id'],
                        'designation_id' => $sp['designation_id'],
                        'first_name'     => $sp['first_name'],
                        'last_name'      => $sp['last_name'],
                        'gender'         => $sp['gender'],
                        'date_of_birth'  => '1988-04-15',
                        'blood_group'    => 'O+',
                        'religion'       => 'Christian',
                        'nationality'    => 'Kenyan',
                        'phone'          => $sp['phone'],
                        'email'          => $sp['email'],
                        'address'        => 'Nairobi, Kenya',
                        'joining_date'   => '2023-01-10',
                        'salary_type'    => 'fixed',
                        'salary'         => $sp['salary'],
                        'status'         => 'active',
                        'created_at'     => $now,
                        'updated_at'     => $now,
                    ]
                );

                $seededStaffIds[] = DB::table('staff')
                    ->where('school_id', $school->id)
                    ->where('emp_id', $sp['emp_id'])
                    ->first()->id;
            }

            // 4. CLASSES & SECTIONS
            $classList = match ($key) {
                'greenfield' => [
                    ['name' => 'Grade 7', 'num' => 7, 'streams' => ['East', 'West']],
                    ['name' => 'Grade 8', 'num' => 8, 'streams' => ['East', 'West']],
                    ['name' => 'Grade 9', 'num' => 9, 'streams' => ['East', 'West']],
                ],
                'staustin'   => [
                    ['name' => 'Form 1', 'num' => 1, 'streams' => ['Alpha', 'Beta']],
                    ['name' => 'Form 2', 'num' => 2, 'streams' => ['Alpha', 'Beta']],
                    ['name' => 'Form 3', 'num' => 3, 'streams' => ['Alpha', 'Beta']],
                    ['name' => 'Form 4', 'num' => 4, 'streams' => ['Alpha', 'Beta']],
                ],
                'premier'    => [
                    ['name' => 'Year 9 (IGCSE)', 'num' => 9, 'streams' => ['Simba', 'Chui']],
                    ['name' => 'Year 10 (IGCSE)', 'num' => 10, 'streams' => ['Simba', 'Chui']],
                    ['name' => 'Grade 8 (CBC)', 'num' => 8, 'streams' => ['Gold', 'Silver']],
                ],
                default      => [],
            };

            $createdClasses = [];
            foreach ($classList as $idx => $cData) {
                DB::table('classes')->updateOrInsert(
                    ['school_id' => $school->id, 'name' => $cData['name']],
                    [
                        'numeric_name'     => $cData['num'],
                        'capacity'         => 80,
                        'class_teacher_id' => $teacherUserId,
                        'created_at'       => $now,
                        'updated_at'       => $now,
                    ]
                );

                $cls = DB::table('classes')
                    ->where('school_id', $school->id)
                    ->where('name', $cData['name'])
                    ->first();

                $createdSections = [];
                foreach ($cData['streams'] as $streamName) {
                    DB::table('sections')->updateOrInsert(
                        ['school_id' => $school->id, 'class_id' => $cls->id, 'name' => $streamName],
                        [
                            'capacity'   => 40,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]
                    );

                    $createdSections[] = DB::table('sections')
                        ->where('school_id', $school->id)
                        ->where('class_id', $cls->id)
                        ->where('name', $streamName)
                        ->first();
                }

                $createdClasses[] = [
                    'class'    => $cls,
                    'sections' => $createdSections,
                ];

                // 5. SUBJECTS PER CLASS (Audited type enum: 'theory', 'practical')
                $subjects = match ($key) {
                    'greenfield' => [
                        ['name' => 'Mathematics', 'code' => 'MATH-7', 'type' => 'theory'],
                        ['name' => 'English Language', 'code' => 'ENG-7', 'type' => 'theory'],
                        ['name' => 'Kiswahili', 'code' => 'KISW-7', 'type' => 'theory'],
                        ['name' => 'Integrated Science', 'code' => 'ISCI-7', 'type' => 'practical'],
                        ['name' => 'Pre-Technical Studies', 'code' => 'PTECH-7', 'type' => 'practical'],
                    ],
                    'staustin'   => [
                        ['name' => 'Mathematics', 'code' => 'MAT-101', 'type' => 'theory'],
                        ['name' => 'English', 'code' => 'ENG-101', 'type' => 'theory'],
                        ['name' => 'Chemistry', 'code' => 'CHEM-101', 'type' => 'practical'],
                        ['name' => 'Biology', 'code' => 'BIO-101', 'type' => 'practical'],
                        ['name' => 'Physics', 'code' => 'PHY-101', 'type' => 'practical'],
                    ],
                    'premier'    => [
                        ['name' => 'Mathematics (Core)', 'code' => 'C-MATH', 'type' => 'theory'],
                        ['name' => 'First Language English', 'code' => 'C-ENG', 'type' => 'theory'],
                        ['name' => 'Computer Science', 'code' => 'C-CS', 'type' => 'practical'],
                        ['name' => 'Global Perspectives', 'code' => 'C-GP', 'type' => 'theory'],
                    ],
                    default      => [],
                };

                $assignedStaffId = $seededStaffIds[0] ?? null;

                foreach ($subjects as $sb) {
                    DB::table('subjects')->updateOrInsert(
                        ['school_id' => $school->id, 'class_id' => $cls->id, 'name' => $sb['name']],
                        [
                            'code'       => $sb['code'] . '-' . $cls->id,
                            'type'       => $sb['type'],
                            'full_marks' => 100,
                            'pass_marks' => 40,
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]
                    );

                    $subj = DB::table('subjects')
                        ->where('school_id', $school->id)
                        ->where('class_id', $cls->id)
                        ->where('name', $sb['name'])
                        ->first();

                    if ($assignedStaffId && $academicYearId) {
                        DB::table('teacher_assignments')->updateOrInsert(
                            [
                                'school_id'        => $school->id,
                                'class_id'         => $cls->id,
                                'subject_id'       => $subj->id,
                                'academic_year_id' => $academicYearId,
                            ],
                            [
                                'staff_id'        => $assignedStaffId,
                                'user_id'         => $teacherUserId,
                                'assignment_type' => 'subject_teacher',
                                'term'            => 'Term 1',
                                'start_date'      => '2026-01-06',
                                'status'          => 'active',
                                'created_at'      => $now,
                                'updated_at'      => $now,
                            ]
                        );
                    }
                }
            }

            // 6. GUARDIANS
            $demoParentEmail = match ($key) {
                'greenfield' => 'parent@eduflow.test',
                'staustin'   => 'parent.staustin@eduflow.test',
                'premier'    => 'parent.premier@eduflow.test',
                default      => 'parent@eduflow.test',
            };

            $demoParentUser = User::withoutGlobalScopes()->where('email', $demoParentEmail)->first();

            $guardiansList = [
                [
                    'user_id'    => $demoParentUser ? $demoParentUser->id : null,
                    'name'       => 'Grace Achieng Omondi',
                    'relation'   => 'Mother',
                    'phone'      => '+254722550001',
                    'email'      => $demoParentEmail,
                    'occupation' => 'Financial Analyst',
                    'address'    => 'Riverside Drive, Nairobi',
                ],
                [
                    'user_id'    => null,
                    'name'       => 'Patrick Kariuki Njoroge',
                    'relation'   => 'Father',
                    'phone'      => '+254722550002',
                    'email'      => "p.kariuki.{$key}@eduflow.test",
                    'occupation' => 'Civil Engineer',
                    'address'    => 'Kileleshwa, Nairobi',
                ],
            ];

            $seededGuardianIds = [];
            foreach ($guardiansList as $gData) {
                DB::table('guardians')->updateOrInsert(
                    ['school_id' => $school->id, 'email' => $gData['email']],
                    [
                        'user_id'    => $gData['user_id'],
                        'name'       => $gData['name'],
                        'relation'   => $gData['relation'],
                        'phone'      => $gData['phone'],
                        'occupation' => $gData['occupation'],
                        'address'    => $gData['address'],
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );

                $seededGuardianIds[] = DB::table('guardians')
                    ->where('school_id', $school->id)
                    ->where('email', $gData['email'])
                    ->first()->id;
            }

            // 7. STUDENTS & ENROLLMENTS
            $demoStudentEmail = match ($key) {
                'greenfield' => 'student@eduflow.test',
                'staustin'   => 'student.staustin@eduflow.test',
                'premier'    => 'student.premier@eduflow.test',
                default      => 'student@eduflow.test',
            };

            $demoStudentUser = User::withoutGlobalScopes()->where('email', $demoStudentEmail)->first();

            $studentRoster = [
                [
                    'user_id'     => $demoStudentUser ? $demoStudentUser->id : null,
                    'first_name'  => 'Brian',
                    'last_name'   => 'Omondi',
                    'admission_no'=> strtoupper(substr($key, 0, 2)) . '-2026-001',
                    'gender'      => 'male',
                    'category'    => 'general',
                    'guardian_idx'=> 0,
                    'email'       => $demoStudentEmail,
                ],
                [
                    'user_id'     => null,
                    'first_name'  => 'Cynthia',
                    'last_name'   => 'Omondi',
                    'admission_no'=> strtoupper(substr($key, 0, 2)) . '-2026-002',
                    'gender'      => 'female',
                    'category'    => 'general',
                    'guardian_idx'=> 0,
                    'email'       => "cynthia.{$key}@eduflow.test",
                ],
                [
                    'user_id'     => null,
                    'first_name'  => 'Kevin',
                    'last_name'   => 'Kariuki',
                    'admission_no'=> strtoupper(substr($key, 0, 2)) . '-2026-003',
                    'gender'      => 'male',
                    'category'    => 'general',
                    'guardian_idx'=> 1,
                    'email'       => "kevin.{$key}@eduflow.test",
                ],
                [
                    'user_id'     => null,
                    'first_name'  => 'Joy',
                    'last_name'   => 'Mutiso',
                    'admission_no'=> strtoupper(substr($key, 0, 2)) . '-2026-004',
                    'gender'      => 'female',
                    'category'    => 'general',
                    'guardian_idx'=> 1,
                    'email'       => "joy.{$key}@eduflow.test",
                ],
            ];

            foreach ($studentRoster as $sIdx => $st) {
                $primaryClass = $createdClasses[0]['class'] ?? null;
                $primarySection = $createdClasses[0]['sections'][0] ?? null;
                $guardianId = $seededGuardianIds[$st['guardian_idx']] ?? $seededGuardianIds[0];

                DB::table('students')->updateOrInsert(
                    ['school_id' => $school->id, 'admission_no' => $st['admission_no']],
                    [
                        'user_id'           => $st['user_id'],
                        'class_id'          => $primaryClass ? $primaryClass->id : 1,
                        'section_id'        => $primarySection ? $primarySection->id : null,
                        'guardian_id'       => $guardianId,
                        'roll_no'           => (string) ($sIdx + 1),
                        'first_name'        => $st['first_name'],
                        'last_name'         => $st['last_name'],
                        'gender'            => $st['gender'],
                        'date_of_birth'     => '2012-05-20',
                        'blood_group'       => 'B+',
                        'religion'          => 'Christian',
                        'nationality'       => 'Kenyan',
                        'email'             => $st['email'],
                        'category'          => $st['category'],
                        'status'            => 'active',
                        'admission_date'    => '2026-01-06',
                        'admission_type'    => 'new',
                        'nemis_upi'         => 'NEM-' . rand(100000, 999999),
                        'assessment_no'     => 'ASS-' . rand(100000, 999999),
                        'guardian_name'     => $guardiansList[$st['guardian_idx']]['name'],
                        'guardian_phone'    => $guardiansList[$st['guardian_idx']]['phone'],
                        'guardian_relation' => $guardiansList[$st['guardian_idx']]['relation'],
                        'created_at'        => $now,
                        'updated_at'        => $now,
                    ]
                );

                $student = DB::table('students')
                    ->where('school_id', $school->id)
                    ->where('admission_no', $st['admission_no'])
                    ->first();

                DB::table('student_guardians')->updateOrInsert(
                    [
                        'school_id'   => $school->id,
                        'student_id'  => $student->id,
                        'guardian_id' => $guardianId,
                    ],
                    [
                        'relationship_type'          => $guardiansList[$st['guardian_idx']]['relation'],
                        'is_primary'                 => 1,
                        'has_legal_custody'          => 1,
                        'receives_sms_notifications' => 1,
                        'receives_report_cards'      => 1,
                        'emergency_priority'         => 1,
                        'created_at'                 => $now,
                        'updated_at'                 => $now,
                    ]
                );

                if ($academicYearId && $primaryClass && $primarySection) {
                    DB::table('student_enrollments')->updateOrInsert(
                        [
                            'school_id'        => $school->id,
                            'student_id'       => $student->id,
                            'academic_year_id' => $academicYearId,
                            'term'             => 'Term 1',
                        ],
                        [
                            'academic_year' => '2026',
                            'class_id'      => $primaryClass->id,
                            'section_id'    => $primarySection->id,
                            'roll_no'       => (string) ($sIdx + 1),
                            'status'        => 'active',
                            'start_date'    => '2026-01-06',
                            'created_at'    => $now,
                            'updated_at'    => $now,
                        ]
                    );
                }
            }
        }

        $this->command->info('Successfully seeded Academic Core for all 3 schools.');
    }
}