<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;
use App\Models\Student;
use App\Models\Staff;

class ComprehensiveEvaluationDataSeeder extends Seeder
{
    public function run(): void
    {
        $schools = DB::table('schools')->get();
        $today = Carbon::today();

        foreach ($schools as $school) {
            $classes = DB::table('classes')->where('school_id', $school->id)->get();
            $subjects = DB::table('subjects')->where('school_id', $school->id)->get();
            $students = DB::table('students')->where('school_id', $school->id)->get();
            $staffMembers = DB::table('staff')->where('school_id', $school->id)->get();
            $academicYear = DB::table('academic_years')->where('school_id', $school->id)->first();

            $firstClass = $classes->first();
            $firstSubject = $subjects->first();
            $firstStaff = $staffMembers->first();
            $academicYearId = $academicYear?->id ?? null;

            // 1. ADMISSION INQUIRIES
            if (Schema::hasTable('admission_inquiries')) {
                $inquiries = [
                    [
                        'student_name'              => 'Brian Kiprop',
                        'class_interested'          => $firstClass ? $firstClass->name : 'Grade 7',
                        'guardian_name'             => 'Wesley Kiprop',
                        'guardian_phone'            => '+254712345001',
                        'guardian_email'            => 'w.kiprop@example.com',
                        'status'                    => 'new',
                        'notes'                     => 'Interested in Junior Secondary CBC Grade 7 admission and boarding options.',
                        'source'                    => 'online',
                        'preferred_contact_channel' => 'phone_call',
                        'created_at'                => $today->copy()->subDays(2),
                        'updated_at'                => $today->copy()->subDays(2),
                    ],
                    [
                        'student_name'              => 'Amina Hassan',
                        'class_interested'          => $firstClass ? $firstClass->name : 'Grade 8',
                        'guardian_name'             => 'Fatuma Hassan',
                        'guardian_phone'            => '+254722345002',
                        'guardian_email'            => 'fatuma.h@example.com',
                        'status'                    => 'follow_up',
                        'notes'                     => 'Walk-in visit. Requested CBC fee structure and school transport route details.',
                        'source'                    => 'walk-in',
                        'preferred_contact_channel' => 'whatsapp',
                        'created_at'                => $today->copy()->subDays(5),
                        'updated_at'                => $today->copy()->subDays(1),
                    ],
                    [
                        'student_name'              => 'Joy Muthoni',
                        'class_interested'          => $firstClass ? $firstClass->name : 'Grade 9',
                        'guardian_name'             => 'Samuel Mwangi',
                        'guardian_phone'            => '+254733345003',
                        'guardian_email'            => 'samuel.m@example.com',
                        'status'                    => 'admitted',
                        'notes'                     => 'Completed assessment interview. Admission fee settled.',
                        'source'                    => 'referral',
                        'preferred_contact_channel' => 'sms',
                        'created_at'                => $today->copy()->subDays(10),
                        'updated_at'                => $today->copy()->subDays(3),
                    ],
                ];

                foreach ($inquiries as $inq) {
                    DB::table('admission_inquiries')->updateOrInsert(
                        [
                            'school_id'      => $school->id,
                            'guardian_phone' => $inq['guardian_phone'],
                        ],
                        array_merge($inq, [
                            'school_id'  => $school->id,
                            'created_at' => $inq['created_at'],
                            'updated_at' => $inq['updated_at'],
                        ])
                    );
                }
            }

            // 2. VISITOR GATE LOGS
            if (Schema::hasTable('visitor_logs')) {
                $visitors = [
                    [
                        'name'           => 'Dr. James Otieno',
                        'phone'          => '+254720987654',
                        'id_number'      => '24890123',
                        'vehicle_reg'    => 'KDA 421B',
                        'badge_number'   => 'VIS-001',
                        'category'       => 'official_meeting',
                        'purpose'        => 'Parent consultation regarding CBC performance broadsheet',
                        'person_to_meet' => 'Principal',
                        'time_in'        => $today->copy()->setTime(8, 30),
                        'time_out'       => null,
                        'remarks'        => 'Currently inside campus at administration block.',
                    ],
                    [
                        'name'           => 'Agnes Wambui',
                        'phone'          => '+254711889900',
                        'id_number'      => '18490211',
                        'vehicle_reg'    => 'Pedestrian',
                        'badge_number'   => 'VIS-002',
                        'category'       => 'moe_qaso',
                        'purpose'        => 'Ministry Quality Assurance (QASO) curriculum standards assessment',
                        'person_to_meet' => 'Academic Registrar',
                        'time_in'        => $today->copy()->setTime(9, 15),
                        'time_out'       => $today->copy()->setTime(11, 45),
                        'remarks'        => 'Completed routine audit of junior secondary laboratory records.',
                    ],
                ];

                foreach ($visitors as $v) {
                    DB::table('visitor_logs')->updateOrInsert(
                        [
                            'school_id' => $school->id,
                            'phone'     => $v['phone'],
                        ],
                        array_merge($v, [
                            'school_id'  => $school->id,
                            'created_at' => $v['time_in'],
                            'updated_at' => $v['time_out'] ?? $v['time_in'],
                        ])
                    );
                }
            }

            // 3. ACADEMIC CALENDAR & HOLIDAYS
            if (Schema::hasTable('holidays')) {
                $holidays = [
                    [
                        'name'        => 'Madaraka Day',
                        'date'        => '2026-06-01',
                        'end_date'    => '2026-06-01',
                        'type'        => 'public_holiday',
                        'term'        => 'Term 2',
                        'description' => 'National public holiday celebrated across Kenya.',
                    ],
                    [
                        'name'        => 'Term 2 Mid-Term Recess',
                        'date'        => '2026-06-22',
                        'end_date'    => '2026-06-28',
                        'type'        => 'mid_term_break',
                        'term'        => 'Term 2',
                        'description' => 'Official Ministry of Education mid-term break for all learners.',
                    ],
                    [
                        'name'        => 'Term 2 Vacation Recess',
                        'date'        => '2026-08-08',
                        'end_date'    => '2026-08-30',
                        'type'        => 'term_break',
                        'term'        => 'Term 2',
                        'description' => 'End of Term 2 holidays prior to Term 3 resumption.',
                    ],
                    [
                        'name'        => 'Mashujaa Day',
                        'date'        => '2026-10-20',
                        'end_date'    => '2026-10-20',
                        'type'        => 'public_holiday',
                        'term'        => 'Term 3',
                        'description' => 'National Heroes Day celebration.',
                    ],
                    [
                        'name'        => 'Jamhuri Day',
                        'date'        => '2026-12-12',
                        'end_date'    => '2026-12-12',
                        'type'        => 'public_holiday',
                        'term'        => 'Term 3',
                        'description' => 'Republic Day and December holiday recess.',
                    ],
                ];

                foreach ($holidays as $h) {
                    DB::table('holidays')->updateOrInsert(
                        [
                            'school_id' => $school->id,
                            'date'      => $h['date'],
                            'name'      => $h['name'],
                        ],
                        array_merge($h, [
                            'school_id'  => $school->id,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ])
                    );
                }
            }

            // 4. STUDENT & STAFF ATTENDANCES (Roll Call)
            if (Schema::hasTable('attendances')) {
                // Students roll call
                foreach ($students->take(12) as $idx => $student) {
                    $status = ($idx % 6 === 0) ? 'absent' : (($idx % 4 === 0) ? 'late' : 'present');
                    $remarks = match ($status) {
                        'absent' => 'Unexcused morning absence; SMS broadcast dispatched.',
                        'late'   => 'Reported 20 minutes past morning assembly.',
                        default  => 'Marked present in morning roll-call.',
                    };

                    DB::table('attendances')->updateOrInsert(
                        [
                            'school_id'       => $school->id,
                            'date'            => $today->toDateString(),
                            'attendable_type' => Student::class,
                            'attendable_id'   => $student->id,
                        ],
                        [
                            'academic_year_id' => $academicYearId,
                            'status'           => $status,
                            'remarks'          => $remarks,
                            'created_at'       => now(),
                            'updated_at'       => now(),
                        ]
                    );
                }

                // Staff roll call
                foreach ($staffMembers->take(6) as $idx => $staff) {
                    DB::table('attendances')->updateOrInsert(
                        [
                            'school_id'       => $school->id,
                            'date'            => $today->toDateString(),
                            'attendable_type' => Staff::class,
                            'attendable_id'   => $staff->id,
                        ],
                        [
                            'academic_year_id' => $academicYearId,
                            'status'           => ($idx === 4) ? 'late' : 'present',
                            'remarks'          => 'Staffroom morning check-in.',
                            'created_at'       => now(),
                            'updated_at'       => now(),
                        ]
                    );
                }
            }

            // 5. HOMEWORK & CBC LEARNING TASKS
            if (Schema::hasTable('homework') && $firstClass && $firstSubject) {
                $tasks = [
                    [
                        'title'       => 'CBC Agriculture: Local Soil Conservation Methods',
                        'description' => 'Document three traditional or contemporary soil conservation methods utilized in your sub-county. Submit notes or pictures.',
                        'due_date'    => $today->copy()->addDays(3)->toDateString(),
                    ],
                    [
                        'title'       => 'Integrated Science: Respiratory Gaseous Exchange',
                        'description' => 'Create a detailed, labeled sketch of the human respiratory alveoli showing the diffusion pathway of oxygen and carbon dioxide.',
                        'due_date'    => $today->copy()->addDays(5)->toDateString(),
                    ],
                ];

                foreach ($tasks as $t) {
                    $hw = DB::table('homework')
                        ->where('school_id', $school->id)
                        ->where('title', $t['title'])
                        ->first();

                    if (!$hw) {
                        $hwId = DB::table('homework')->insertGetId([
                            'school_id'   => $school->id,
                            'class_id'    => $firstClass->id,
                            'subject_id'  => $firstSubject->id,
                            'teacher_id'  => $firstStaff?->id,
                            'title'       => $t['title'],
                            'description' => $t['description'],
                            'due_date'    => $t['due_date'],
                            'is_active'   => 1,
                            'created_at'  => now(),
                            'updated_at'  => now(),
                        ]);
                    } else {
                        $hwId = $hw->id;
                    }

                    // Homework submissions from students
                    if (Schema::hasTable('homework_submissions') && $students->isNotEmpty()) {
                        foreach ($students->take(4) as $sIdx => $st) {
                            $subStatus = ($sIdx === 0) ? 'reviewed' : 'submitted';
                            DB::table('homework_submissions')->updateOrInsert(
                                [
                                    'homework_id' => $hwId,
                                    'student_id'  => $st->id,
                                ],
                                [
                                    'school_id'       => $school->id,
                                    'text_response'   => 'Attached field documentation notes and completed diagram worksheets.',
                                    'status'          => $subStatus,
                                    'teacher_remarks' => ($subStatus === 'reviewed') ? 'Exceeding Expectations (EE) - Well structured observation log.' : null,
                                    'created_at'      => now()->subHours(2),
                                    'updated_at'      => now(),
                                ]
                            );
                        }
                    }
                }
            }
        }
    }
}