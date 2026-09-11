<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;
use App\Models\User;

class CompleteEvaluationDataSeeder extends Seeder
{
    public function run(): void
    {
        $schools = DB::table('schools')->get();
        $today = Carbon::today();

        foreach ($schools as $school) {
            $classes = DB::table('classes')->where('school_id', $school->id)->get();
            $subjects = DB::table('subjects')->where('school_id', $school->id)->get();
            $staffMembers = DB::table('staff')->where('school_id', $school->id)->get();
            $adminUser = User::withoutGlobalScopes()->where('school_id', $school->id)->where('email', 'like', '%admin%')->first();
            $teacherUser = User::withoutGlobalScopes()->where('school_id', $school->id)->where('email', 'like', '%teacher%')->first() ?? $adminUser;

            $firstClass = $classes->first();
            $firstSubject = $subjects->first();
            $firstStaff = $staffMembers->first();
            $secondStaff = $staffMembers->skip(1)->first() ?? $firstStaff;

            // 1. GRADE SCALES (CBC / CBA Standard Bands)
            if (Schema::hasTable('grade_scales')) {
                $scales = [
                    ['grade' => 'EE', 'gpa' => 4.0, 'min_marks' => 80, 'max_marks' => 100, 'remarks' => 'Exceeding Expectations', 'sort_order' => 1],
                    ['grade' => 'ME', 'gpa' => 3.0, 'min_marks' => 60, 'max_marks' => 79,  'remarks' => 'Meeting Expectations', 'sort_order' => 2],
                    ['grade' => 'AE', 'gpa' => 2.0, 'min_marks' => 40, 'max_marks' => 59,  'remarks' => 'Approaching Expectations', 'sort_order' => 3],
                    ['grade' => 'BE', 'gpa' => 1.0, 'min_marks' => 0,  'max_marks' => 39,  'remarks' => 'Below Expectations', 'sort_order' => 4],
                ];

                foreach ($scales as $scale) {
                    DB::table('grade_scales')->updateOrInsert(
                        ['school_id' => $school->id, 'grade' => $scale['grade']],
                        array_merge($scale, ['created_at' => now(), 'updated_at' => now()])
                    );
                }
            }

            // 2. HR LEAVE TYPES
            if (Schema::hasTable('leave_types')) {
                $leaveTypes = [
                    ['name' => 'Annual Leave', 'code' => 'ANNUAL', 'policy_category' => 'general', 'max_days_per_year' => 21, 'is_paid' => 1, 'requires_approval' => 1, 'is_active' => 1],
                    ['name' => 'Sick Leave', 'code' => 'SICK', 'policy_category' => 'medical', 'max_days_per_year' => 30, 'is_paid' => 1, 'requires_approval' => 1, 'is_active' => 1],
                    ['name' => 'Maternity Leave', 'code' => 'MATERNITY', 'policy_category' => 'parental', 'max_days_per_year' => 90, 'is_paid' => 1, 'requires_approval' => 1, 'is_active' => 1],
                    ['name' => 'Compassionate Leave', 'code' => 'COMPASSIONATE', 'policy_category' => 'emergency', 'max_days_per_year' => 10, 'is_paid' => 1, 'requires_approval' => 1, 'is_active' => 1],
                ];

                foreach ($leaveTypes as $lt) {
                    DB::table('leave_types')->updateOrInsert(
                        ['school_id' => $school->id, 'code' => $lt['code']],
                        array_merge($lt, [
                            'accrual_method'       => 'beginning_of_year',
                            'requires_attachment'  => 0,
                            'allows_half_day'      => 1,
                            'affects_payroll'      => 0,
                            'min_notice_days'      => 2,
                            'allow_carry_forward'  => 0,
                            'max_carry_forward_days' => 0,
                            'description'          => $lt['name'] . ' according to Kenyan Employment Act.',
                            'created_at'           => now(),
                            'updated_at'           => now(),
                        ])
                    );
                }
            }

            // 3. HR LEAVE REQUESTS
            if (Schema::hasTable('leave_requests') && $firstStaff && Schema::hasTable('leave_types')) {
                $annualLt = DB::table('leave_types')->where('school_id', $school->id)->where('code', 'ANNUAL')->first();
                $sickLt = DB::table('leave_types')->where('school_id', $school->id)->where('code', 'SICK')->first();

                if ($annualLt) {
                    DB::table('leave_requests')->updateOrInsert(
                        [
                            'school_id'  => $school->id,
                            'staff_id'   => $firstStaff->id,
                            'start_date' => $today->copy()->addDays(7)->toDateString(),
                        ],
                        [
                            'relief_staff_id'    => $secondStaff?->id,
                            'leave_type_id'      => $annualLt->id,
                            'end_date'           => $today->copy()->addDays(11)->toDateString(),
                            'days'               => 4,
                            'is_half_day'        => 0,
                            'reason'             => 'Routine annual family leave and resting break.',
                            'contact_while_away' => '+254700000001',
                            'handover_notes'     => 'Scheme of work handouts shared with department head.',
                            'status'             => 'approved',
                            'approved_by'        => $adminUser?->id,
                            'approval_note'      => 'Approved in accordance with termly rota.',
                            'actioned_at'        => now(),
                            'created_at'         => now()->subDays(2),
                            'updated_at'         => now(),
                        ]
                    );
                }

                if ($sickLt && $secondStaff) {
                    DB::table('leave_requests')->updateOrInsert(
                        [
                            'school_id'  => $school->id,
                            'staff_id'   => $secondStaff->id,
                            'start_date' => $today->toDateString(),
                        ],
                        [
                            'relief_staff_id'    => $firstStaff->id,
                            'leave_type_id'      => $sickLt->id,
                            'end_date'           => $today->copy()->addDays(2)->toDateString(),
                            'days'               => 2,
                            'is_half_day'        => 0,
                            'reason'             => 'Medical consultation and doctor-mandated rest.',
                            'contact_while_away' => '+254700000002',
                            'handover_notes'     => 'Class register handed to standby class teacher.',
                            'status'             => 'pending',
                            'created_at'         => now(),
                            'updated_at'         => now(),
                        ]
                    );
                }
            }

            // 4. ANNOUNCEMENTS (Noticeboard)
            if (Schema::hasTable('announcements') && $adminUser) {
                $announcements = [
                    [
                        'title'        => 'Term 2 Academic & Co-Curricular Calendar Release',
                        'body'         => 'All teaching staff and parents are advised to review the upcoming mid-term break and visitation schedules on the calendar hub.',
                        'audience'     => 'all',
                        'target_role'  => null,
                        'is_pinned'    => 1,
                        'published_at' => now()->subDays(3),
                    ],
                    [
                        'title'        => 'Staff Meeting: CBC Formative Assessment Submission',
                        'body'         => 'Departmental heads are requested to convene in the staff boardroom this Thursday at 4:15 PM for broadsheet reconciliation.',
                        'audience'     => 'role',
                        'target_role'  => 'teacher',
                        'is_pinned'    => 0,
                        'published_at' => now()->subDay(),
                    ],
                ];

                foreach ($announcements as $ann) {
                    DB::table('announcements')->updateOrInsert(
                        ['school_id' => $school->id, 'title' => $ann['title']],
                        array_merge($ann, [
                            'author_id'  => $adminUser->id,
                            'class_id'   => null,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ])
                    );
                }
            }

            // 5. INTERNAL MESSAGES
            if (Schema::hasTable('messages') && $adminUser && $teacherUser && ($adminUser->id !== $teacherUser->id)) {
                $messages = [
                    [
                        'sender_id'    => $adminUser->id,
                        'recipient_id' => $teacherUser->id,
                        'subject'      => 'Junior Secondary Lab Inventory Reconciliation',
                        'body'         => 'Please confirm if the new practical biology sets delivered yesterday have been logged in the science department inventory.',
                        'read_at'      => now()->subHours(5),
                    ],
                    [
                        'sender_id'    => $teacherUser->id,
                        'recipient_id' => $adminUser->id,
                        'subject'      => 'Re: Junior Secondary Lab Inventory Reconciliation',
                        'body'         => 'Confirmed. All 15 apparatus kits have been inventoried and verified against the vendor delivery note.',
                        'read_at'      => null,
                    ],
                ];

                foreach ($messages as $msg) {
                    DB::table('messages')->updateOrInsert(
                        [
                            'school_id' => $school->id,
                            'sender_id' => $msg['sender_id'],
                            'subject'   => $msg['subject'],
                        ],
                        array_merge($msg, ['created_at' => now()->subHours(6), 'updated_at' => now()])
                    );
                }
            }

            // 6. SCHOOL IN-APP NOTIFICATIONS
            if (Schema::hasTable('school_notifications') && $adminUser) {
                $notifications = [
                    [
                        'type'    => 'attendance_alert',
                        'title'   => 'Morning Roll-Call Reconciled',
                        'body'    => 'Daily morning custody roll-call completed with unexcused absence SMS dispatch.',
                        'channel' => 'in-app',
                    ],
                    [
                        'type'    => 'fee_alert',
                        'title'   => 'Fee Payment Reconciliation',
                        'body'    => 'Direct M-Pesa Paybill payment reference #DEMO-REC-01 reconciled to student ledger.',
                        'channel' => 'in-app',
                    ],
                ];

                foreach ($notifications as $notif) {
                    DB::table('school_notifications')->updateOrInsert(
                        [
                            'school_id' => $school->id,
                            'user_id'   => $adminUser->id,
                            'title'     => $notif['title'],
                        ],
                        array_merge($notif, [
                            'data'       => json_encode(['action' => 'review']),
                            'read_at'    => null,
                            'created_at' => now()->subHours(2),
                            'updated_at' => now(),
                        ])
                    );
                }
            }

            // 7. LESSON PLANS (CBC Kenyan Standards)
            if (Schema::hasTable('lesson_plans') && $firstClass && $firstSubject && $firstStaff) {
                $lessonPlans = [
                    [
                        'title'                 => 'Grade 7 Agriculture: Soil Conservation Techniques',
                        'strand'                => 'Crop Production & Conservation',
                        'sub_strand'            => 'Soil Erosion Control',
                        'objectives'            => 'By the end of the lesson, the learner should be able to identify three methods of reducing water run-off in farmland.',
                        'core_competencies'     => json_encode(['Critical Thinking', 'Problem Solving', 'Environmental Stewardship']),
                        'values_addressed'      => json_encode(['Responsibility', 'Integrity', 'Teamwork']),
                        'pcis'                  => json_encode(['Environmental Education', 'Disaster Risk Reduction']),
                        'content'               => 'Discussion and practical demonstration of contour bunds and mulching on school garden beds.',
                        'teaching_methods'      => json_encode(['Inquiry-based learning', 'Small group discussion', 'Field demonstration']),
                        'resources'             => json_encode(['School farm plots', 'Garden hoes', 'Mulch material', 'KICD Agriculture Learner Book 7']),
                        'week_start'            => $today->copy()->startOfWeek()->toDateString(),
                        'lesson_duration_mins'  => 40,
                        'status'                => 'approved',
                        'reviewer_feedback'     => 'Excellent integration of hands-on farm demonstration.',
                        'teacher_reflection'    => 'Learners enthusiastically participated in setting up the mulch barriers.',
                        'reviewed_by'           => $adminUser?->id,
                        'reviewed_at'           => now()->subDays(1),
                    ],
                ];

                foreach ($lessonPlans as $lp) {
                    DB::table('lesson_plans')->updateOrInsert(
                        [
                            'school_id' => $school->id,
                            'class_id'  => $firstClass->id,
                            'title'     => $lp['title'],
                        ],
                        array_merge($lp, [
                            'subject_id' => $firstSubject->id,
                            'teacher_id' => $firstStaff->id,
                            'term'       => 'Term 2',
                            'created_at' => now(),
                            'updated_at' => now(),
                        ])
                    );
                }
            }

            // 8. SYLLABI (Curriculum Progress Tracking)
            if (Schema::hasTable('syllabi') && $firstClass && $firstSubject && $firstStaff) {
                DB::table('syllabi')->updateOrInsert(
                    [
                        'school_id'   => $school->id,
                        'class_id'    => $firstClass->id,
                        'subject_id'  => $firstSubject->id,
                    ],
                    [
                        'teacher_id'             => $firstStaff->id,
                        'academic_year'          => '2026',
                        'term'                   => 'Term 2',
                        'curriculum_type'        => 'CBC',
                        'title'                  => 'Junior Secondary Term 2 Curriculum Tracker',
                        'topics'                 => json_encode([
                            ['title' => 'Soil Conservation & Terracing', 'covered' => true],
                            ['title' => 'Nutritional Requirements for Small Livestock', 'covered' => true],
                            ['title' => 'Animal Housing & Welfare Practices', 'covered' => false],
                            ['title' => 'School Farm Kitchen Gardening & Composting', 'covered' => false],
                        ]),
                        'strands'                => json_encode([
                            'Crop Production & Soil Stewardship',
                            'Animal Husbandry & Farm Routines',
                        ]),
                        'completion_percent'     => 68,
                        'total_lessons_planned'  => 36,
                        'total_lessons_taught'   => 24,
                        'status'                 => 'approved',
                        'reviewed_by'            => $adminUser?->id,
                        'reviewed_at'            => now()->subDays(3),
                        'reviewer_feedback'      => 'Pacing aligns with the KICD term timetable guidelines.',
                        'created_at'             => now(),
                        'updated_at'             => now(),
                    ]
                );
            }

            // 9. LOGISTICS & INVENTORY (Categories & Items)
            if (Schema::hasTable('inventory_categories')) {
                $categories = [
                    ['name' => 'Textbooks & Learning Material', 'description' => 'Official KICD curriculum course books and revision guides'],
                    ['name' => 'Science & Laboratory Equipment', 'description' => 'Apparatus and consumables for CBC Integrated Science'],
                ];

                foreach ($categories as $cat) {
                    DB::table('inventory_categories')->updateOrInsert(
                        ['school_id' => $school->id, 'name' => $cat['name']],
                        array_merge($cat, ['created_at' => now(), 'updated_at' => now()])
                    );
                }

                if (Schema::hasTable('inventory_items')) {
                    $bookCat = DB::table('inventory_categories')->where('school_id', $school->id)->where('name', 'Textbooks & Learning Material')->first();
                    $labCat  = DB::table('inventory_categories')->where('school_id', $school->id)->where('name', 'Science & Laboratory Equipment')->first();

                    if ($bookCat) {
                        DB::table('inventory_items')->updateOrInsert(
                            ['school_id' => $school->id, 'category_id' => $bookCat->id, 'name' => 'KICD Grade 7 Mathematics Coursebook'],
                            [
                                'unit'          => 'pieces',
                                'current_stock' => 120,
                                'minimum_stock' => 20,
                                'description'   => 'Hardcover national curriculum textbooks.',
                                'is_active'     => 1,
                                'created_at'    => now(),
                                'updated_at'    => now(),
                            ]
                        );
                    }

                    if ($labCat) {
                        DB::table('inventory_items')->updateOrInsert(
                            ['school_id' => $school->id, 'category_id' => $labCat->id, 'name' => 'Borosilicate Laboratory Beakers (250ml)'],
                            [
                                'unit'          => 'pieces',
                                'current_stock' => 45,
                                'minimum_stock' => 10,
                                'description'   => 'Heat-resistant glassware for Junior Secondary Science experiments.',
                                'is_active'     => 1,
                                'created_at'    => now(),
                                'updated_at'    => now(),
                            ]
                        );
                    }
                }
            }

            // 10. UNALLOCATED FEE PAYMENTS (Queue Demonstration)
            if (Schema::hasTable('unallocated_payments')) {
                DB::table('unallocated_payments')->updateOrInsert(
                    [
                        'school_id'      => $school->id,
                        'reference_code' => 'DEMO-MPESA-UNMATCHED-' . $school->id,
                    ],
                    [
                        'amount'                 => 4500.00,
                        'channel'                => 'mpesa',
                        'payer_phone'            => '+254799000111',
                        'payer_name'             => 'David Kariuki',
                        'bill_reference_entered' => 'ADM 9999 NOT FOUND',
                        'status'                 => 'pending',
                        'payment_date'           => $today->copy()->subDays(1),
                        'resolution_notes'       => 'Demo unmatched M-Pesa paybill transaction awaiting bursar allocation.',
                        'created_at'             => now()->subDays(1),
                        'updated_at'             => now(),
                    ]
                );
            }
        }
    }
}