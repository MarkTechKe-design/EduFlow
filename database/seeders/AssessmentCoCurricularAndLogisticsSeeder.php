<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use App\Models\School;

class AssessmentCoCurricularAndLogisticsSeeder extends Seeder
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
            if (!$school) continue;

            $this->command->info("Seeding Operations & Assessments for: {$school->name}");

            $academicYear = DB::table('academic_years')
                ->where('school_id', $school->id)
                ->where('is_current', 1)
                ->first();
            $academicYearId = $academicYear ? $academicYear->id : null;

            $classes = DB::table('classes')->where('school_id', $school->id)->get();
            $students = DB::table('students')->where('school_id', $school->id)->get();
            $staffMembers = DB::table('staff')->where('school_id', $school->id)->get();
            $primaryStaff = $staffMembers->first();
            $primaryStudent = $students->first();

            // ----------------------------------------------------
            // 1. EXAMS & MARKS
            // ----------------------------------------------------
            foreach ($classes as $cls) {
                $examName = "Term 1 Mid-Term Examination 2026";
                DB::table('exams')->updateOrInsert(
                    ['school_id' => $school->id, 'class_id' => $cls->id, 'name' => $examName],
                    [
                        'type'        => 'mid_term',
                        'start_date'  => '2026-02-16',
                        'end_date'    => '2026-02-20',
                        'status'      => 'published',
                        'description' => "Term 1 continuous mid-term assessment for {$cls->name}",
                        'created_at'  => $now,
                        'updated_at'  => $now,
                    ]
                );

                $exam = DB::table('exams')
                    ->where('school_id', $school->id)
                    ->where('class_id', $cls->id)
                    ->where('name', $examName)
                    ->first();

                $subjects = DB::table('subjects')->where('school_id', $school->id)->where('class_id', $cls->id)->get();
                $classStudents = DB::table('students')->where('school_id', $school->id)->where('class_id', $cls->id)->get();

                foreach ($classStudents as $st) {
                    foreach ($subjects as $sb) {
                        $markObtained = rand(58, 96);
                        $grade = match (true) {
                            $markObtained >= 80 => 'A',
                            $markObtained >= 70 => 'B',
                            $markObtained >= 60 => 'C',
                            $markObtained >= 50 => 'D',
                            default             => 'E',
                        };
                        $gpa = match ($grade) {
                            'A' => 4.00,
                            'B' => 3.00,
                            'C' => 2.00,
                            'D' => 1.00,
                            default => 0.00,
                        };

                        DB::table('marks')->updateOrInsert(
                            [
                                'school_id'  => $school->id,
                                'exam_id'    => $exam->id,
                                'student_id' => $st->id,
                                'subject_id' => $sb->id,
                            ],
                            [
                                'marks_obtained' => $markObtained,
                                'grade'          => $grade,
                                'gpa'            => $gpa,
                                'is_absent'      => 0,
                                'remarks'        => 'Consistent conceptual mastery and active participation.',
                                'created_at'     => $now,
                                'updated_at'     => $now,
                            ]
                        );
                    }
                }
            }

            // ----------------------------------------------------
            // 2. CBC FORMATIVE ASSESSMENTS & STRANDS
            // ----------------------------------------------------
            $firstClass = $classes->first();
            $firstSubject = DB::table('subjects')->where('school_id', $school->id)->first();

            if ($firstClass && $firstSubject) {
                DB::table('cbc_assessments')->updateOrInsert(
                    ['school_id' => $school->id, 'title' => 'Formative Strand Project: Environmental Modeling'],
                    [
                        'academic_year_id' => $academicYearId,
                        'term'             => 'Term 1',
                        'class_id'         => $firstClass->id,
                        'subject_id'       => $firstSubject->id,
                        'type'             => 'formative_task',
                        'assessment_date'  => '2026-02-10',
                        'description'      => 'Practical learner-centered strand evaluation based on KICD guidelines.',
                        'status'           => 'published',
                        'created_at'       => $now,
                        'updated_at'       => $now,
                    ]
                );

                $assessment = DB::table('cbc_assessments')
                    ->where('school_id', $school->id)
                    ->where('title', 'Formative Strand Project: Environmental Modeling')
                    ->first();

                $strands = [
                    ['name' => 'Strand 1: Identification & Classification', 'sub' => '1.1 Physical Components'],
                    ['name' => 'Strand 2: Application & Experimentation', 'sub' => '2.1 Model Synthesis'],
                ];

                foreach ($strands as $sIdx => $str) {
                    DB::table('assessment_strands')->updateOrInsert(
                        ['school_id' => $school->id, 'cbc_assessment_id' => $assessment->id, 'strand_name' => $str['name']],
                        [
                            'sub_strand'                => $str['sub'],
                            'specific_learning_outcome' => 'Learner demonstrates ability to observe, categorize and apply core concepts.',
                            'sort_order'                => $sIdx + 1,
                            'created_at'                => $now,
                            'updated_at'                => $now,
                        ]
                    );

                    $strandRec = DB::table('assessment_strands')
                        ->where('school_id', $school->id)
                        ->where('cbc_assessment_id', $assessment->id)
                        ->where('strand_name', $str['name'])
                        ->first();

                    foreach ($students as $st) {
                        DB::table('assessment_scores')->updateOrInsert(
                            [
                                'school_id'            => $school->id,
                                'cbc_assessment_id'    => $assessment->id,
                                'assessment_strand_id' => $strandRec->id,
                                'student_id'           => $st->id,
                            ],
                            [
                                'performance_level' => 'ME', // Meeting Expectations
                                'numeric_score'     => 3,
                                'teacher_comments'  => 'Shows proficient comprehension and meets task criteria independently.',
                                'created_at'        => $now,
                                'updated_at'        => $now,
                            ]
                        );
                    }
                }
            }

            // ----------------------------------------------------
            // 3. ACTIVITY HOUSES & CO-CURRICULAR HUB
            // ----------------------------------------------------
            $housesData = [
                ['name' => 'Simba House', 'code' => 'SIMBA', 'color' => '#ef4444', 'motto' => 'Strength in Courage', 'points' => 380.00],
                ['name' => 'Chui House', 'code' => 'CHUI', 'color' => '#3b82f6', 'motto' => 'Agile and Victorious', 'points' => 415.00],
                ['name' => 'Tai House', 'code' => 'TAI', 'color' => '#f59e0b', 'motto' => 'Soaring Beyond Limits', 'points' => 350.00],
                ['name' => 'Kifaru House', 'code' => 'KIFARU', 'color' => '#10b981', 'motto' => 'Unyielding Determination', 'points' => 290.00],
            ];

            foreach ($housesData as $h) {
                DB::table('activity_houses')->updateOrInsert(
                    ['school_id' => $school->id, 'name' => $h['name']],
                    [
                        'code'               => $h['code'],
                        'color_code'         => $h['color'],
                        'motto'              => $h['motto'],
                        'patron_id'          => $primaryStaff ? $primaryStaff->id : null,
                        'captain_student_id' => $primaryStudent ? $primaryStudent->id : null,
                        'total_points'       => $h['points'],
                        'is_active'          => 1,
                        'created_at'         => $now,
                        'updated_at'         => $now,
                    ]
                );
            }

            // Activity Categories & Activities
            $catId = DB::table('activity_categories')->updateOrInsert(
                ['school_id' => $school->id, 'name' => 'Ball Sports & Athletics'],
                [
                    'code'          => 'BALL-SPORTS',
                    'icon'          => 'Trophy',
                    'description'   => 'Football, Basketball, Volleyball & Track Athletics',
                    'display_order' => 1,
                    'is_active'     => 1,
                    'created_at'    => $now,
                    'updated_at'    => $now,
                ]
            );

            $actCat = DB::table('activity_categories')->where('school_id', $school->id)->where('name', 'Ball Sports & Athletics')->first();

            if ($actCat) {
                DB::table('activities')->updateOrInsert(
                    ['school_id' => $school->id, 'name' => 'Football (Soccer)'],
                    [
                        'category_id'      => $actCat->id,
                        'code'             => 'FTB-01',
                        'type'             => 'team_fixture',
                        'gender_scope'     => 'open',
                        'age_group'        => 'open',
                        'max_participants' => 30,
                        'patron_id'        => $primaryStaff ? $primaryStaff->id : null,
                        'is_active'        => 1,
                        'created_at'       => $now,
                        'updated_at'       => $now,
                    ]
                );
            }

            // School Clubs & Memberships
            DB::table('school_clubs')->updateOrInsert(
                ['school_id' => $school->id, 'name' => 'Robotics & STEM Club'],
                [
                    'code'             => 'STEM-01',
                    'motto'            => 'Innovating Tomorrow',
                    'patron_id'        => $primaryStaff ? $primaryStaff->id : null,
                    'meeting_schedule' => 'Every Thursday 4:00 PM',
                    'meeting_venue'    => 'Computer Lab 1',
                    'status'           => 'active',
                    'created_at'       => $now,
                    'updated_at'       => $now,
                ]
            );

            $club = DB::table('school_clubs')->where('school_id', $school->id)->where('name', 'Robotics & STEM Club')->first();
            if ($club && $primaryStudent) {
                DB::table('club_memberships')->updateOrInsert(
                    ['school_id' => $school->id, 'club_id' => $club->id, 'student_id' => $primaryStudent->id],
                    [
                        'role'             => 'president',
                        'academic_year_id' => $academicYearId,
                        'joined_date'      => '2026-01-10',
                        'status'           => 'active',
                        'created_at'       => $now,
                        'updated_at'       => $now,
                    ]
                );
            }

            // ----------------------------------------------------
            // 4. ATTENDANCE (STUDENT & STAFF)
            // ----------------------------------------------------
            foreach ($students as $st) {
                for ($d = 1; $d <= 5; $d++) {
                    $attDate = Carbon::now()->startOfWeek()->addDays($d - 1)->toDateString();
                    DB::table('attendances')->updateOrInsert(
                        [
                            'school_id'       => $school->id,
                            'attendable_type' => 'App\Models\Student',
                            'attendable_id'   => $st->id,
                            'date'            => $attDate,
                        ],
                        [
                            'academic_year_id'  => $academicYearId,
                            'session'           => 'morning',
                            'status'            => 'present',
                            'time_in'           => '07:45:00',
                            'time_out'          => '16:00:00',
                            'notification_sent' => 0,
                            'created_at'        => $now,
                            'updated_at'        => $now,
                        ]
                    );
                }
            }

            // ----------------------------------------------------
            // 5. TIMETABLES & TIME SLOTS
            // ----------------------------------------------------
            $slots = [
                ['label' => 'Period 1', 'start' => '08:00', 'end' => '08:45', 'type' => 'lesson'],
                ['label' => 'Period 2', 'start' => '08:45', 'end' => '09:30', 'type' => 'lesson'],
                ['label' => 'Short Break', 'start' => '09:30', 'end' => '09:50', 'type' => 'break'],
                ['label' => 'Period 3', 'start' => '09:50', 'end' => '10:35', 'type' => 'lesson'],
            ];

            foreach ($slots as $idx => $sl) {
                DB::table('timetable_time_slots')->updateOrInsert(
                    ['school_id' => $school->id, 'label' => $sl['label']],
                    [
                        'start_time' => $sl['start'],
                        'end_time'   => $sl['end'],
                        'type'       => $sl['type'],
                        'sort_order' => $idx + 1,
                        'is_active'  => 1,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );
            }

            if ($firstClass && $firstSubject) {
                $days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
                foreach ($days as $day) {
                    DB::table('timetables')->updateOrInsert(
                        [
                            'school_id'   => $school->id,
                            'class_id'    => $firstClass->id,
                            'subject_id'  => $firstSubject->id,
                            'day_of_week' => $day,
                            'start_time'  => '08:00:00',
                        ],
                        [
                            'teacher_id' => $primaryStaff ? $primaryStaff->id : null,
                            'end_time'   => '08:45:00',
                            'room'       => 'Room 102',
                            'notes'      => 'Core lecture and classroom exercises',
                            'created_at' => $now,
                            'updated_at' => $now,
                        ]
                    );
                }
            }

            // ----------------------------------------------------
            // 6. LIBRARY & BOOK ISSUES
            // ----------------------------------------------------
            $sampleBooks = [
                ['title' => 'Secondary Mathematics Form 1', 'author' => 'KLB Authoring Team', 'isbn' => '978-9966-10-101'],
                ['title' => 'Fasihi ya Kiswahili: Mwongozo Kamili', 'author' => 'K. W. Wamitila', 'isbn' => '978-9966-20-202'],
                ['title' => 'Principles of Biology & Life Sciences', 'author' => 'P. G. Mwitari', 'isbn' => '978-9966-30-303'],
            ];

            foreach ($sampleBooks as $b) {
                DB::table('books')->updateOrInsert(
                    ['school_id' => $school->id, 'isbn' => $b['isbn']],
                    [
                        'title'            => $b['title'],
                        'author'           => $b['author'],
                        'category'         => 'Textbook',
                        'total_copies'     => 40,
                        'available_copies' => 38,
                        'is_active'        => 1,
                        'created_at'       => $now,
                        'updated_at'       => $now,
                    ]
                );

                $bookRec = DB::table('books')->where('school_id', $school->id)->where('isbn', $b['isbn'])->first();
                if ($bookRec && $primaryStudent) {
                    DB::table('book_issues')->updateOrInsert(
                        ['school_id' => $school->id, 'book_id' => $bookRec->id, 'member_id' => $primaryStudent->id],
                        [
                            'member_type'  => 'App\Models\Student',
                            'issued_date'  => '2026-01-15',
                            'due_date'     => '2026-02-15',
                            'fine'         => 0.00,
                            'fine_amount'  => 0.00,
                            'fine_per_day' => 2.00,
                            'status'       => 'issued',
                            'fine_status'  => 'unpaid',
                            'created_at'   => $now,
                            'updated_at'   => $now,
                        ]
                    );
                }
            }

            // ----------------------------------------------------
            // 7. HOSTELS & ALLOCATIONS
            // ----------------------------------------------------
            DB::table('hostels')->updateOrInsert(
                ['school_id' => $school->id, 'name' => 'Mara Boarding Hall'],
                [
                    'type'           => 'boys',
                    'warden_id'      => $primaryStaff ? $primaryStaff->id : null,
                    'address'        => 'East Wing Residential Block',
                    'total_rooms'    => 20,
                    'total_capacity' => 40,
                    'status'         => 'active',
                    'created_at'     => $now,
                    'updated_at'     => $now,
                ]
            );

            $hostel = DB::table('hostels')->where('school_id', $school->id)->where('name', 'Mara Boarding Hall')->first();
            if ($hostel) {
                DB::table('hostel_rooms')->updateOrInsert(
                    ['school_id' => $school->id, 'hostel_id' => $hostel->id, 'room_no' => 'M-101'],
                    [
                        'floor'       => '1st Floor',
                        'type'        => 'double',
                        'capacity'    => 2,
                        'occupied'    => 1,
                        'monthly_fee' => 12000.00,
                        'status'      => 'available',
                        'created_at'  => $now,
                        'updated_at'  => $now,
                    ]
                );

                $room = DB::table('hostel_rooms')->where('school_id', $school->id)->where('hostel_id', $hostel->id)->where('room_no', 'M-101')->first();
                if ($room && $primaryStudent) {
                    DB::table('hostel_allocations')->updateOrInsert(
                        ['school_id' => $school->id, 'hostel_id' => $hostel->id, 'room_id' => $room->id, 'student_id' => $primaryStudent->id],
                        [
                            'bed_no'       => 'Bed A1',
                            'joining_date' => '2026-01-06',
                            'status'       => 'active',
                            'fee_linked'   => 1,
                            'created_at'   => $now,
                            'updated_at'   => $now,
                        ]
                    );
                }
            }

            // ----------------------------------------------------
            // 8. TRANSPORT & FLEET ROUTES
            // ----------------------------------------------------
            DB::table('vehicles')->updateOrInsert(
                ['school_id' => $school->id, 'registration_no' => 'KDG ' . rand(100, 999) . 'Z'],
                [
                    'name'         => 'School Bus 01',
                    'type'         => 'bus',
                    'capacity'     => 45,
                    'driver_name'  => 'Samuel Mwangi',
                    'driver_phone' => '+254711880011',
                    'status'       => 'active',
                    'created_at'   => $now,
                    'updated_at'   => $now,
                ]
            );

            $vehicle = DB::table('vehicles')->where('school_id', $school->id)->first();

            DB::table('routes')->updateOrInsert(
                ['school_id' => $school->id, 'name' => 'Westlands - Kilimani Route'],
                [
                    'vehicle_id'  => $vehicle ? $vehicle->id : null,
                    'start_point' => 'Westlands Roundabout',
                    'end_point'   => 'Main Campus Gate',
                    'monthly_fee' => 6500.00,
                    'is_active'   => 1,
                    'created_at'  => $now,
                    'updated_at'  => $now,
                ]
            );

            $route = DB::table('routes')->where('school_id', $school->id)->where('name', 'Westlands - Kilimani Route')->first();
            if ($route && $primaryStudent) {
                DB::table('student_route')->updateOrInsert(
                    ['student_id' => $primaryStudent->id, 'route_id' => $route->id],
                    [
                        'stop'       => 'Sarit Centre Gate 2',
                        'fee_linked' => 1,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );
            }
        }

        $this->command->info('Successfully seeded Assessments, Co-Curricular, Attendance, Timetables, Library, Hostels, and Transport for all 3 schools.');
    }
}