<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdvancedEvaluationSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        $today = now()->startOfDay();

        // 1. NATIONAL CO-CURRICULAR CALENDAR (Ministry & KICD Standards)
        if (Schema::hasTable('national_cocurricular_calendars')) {
            $nationalEvents = [
                [
                    'academic_year'       => '2026',
                    'term'                => 'Term 2',
                    'category_name'       => 'Ball Games & Athletics',
                    'activity_name'       => 'National Junior Secondary Athletics Championships',
                    'education_level'     => 'junior_secondary',
                    'age_bracket'         => 'under_15',
                    'competition_level'   => 'national',
                    'start_date'          => $today->copy()->addMonths(1)->toDateString(),
                    'end_date'            => $today->copy()->addMonths(1)->addDays(4)->toDateString(),
                    'reporting_date'      => $today->copy()->addMonths(1)->subDay()->toDateString(),
                    'departure_date'      => $today->copy()->addMonths(1)->addDays(5)->toDateString(),
                    'venue'               => 'Afraha Stadium, Nakuru',
                    'host_county'         => 'Nakuru',
                    'host_region'         => 'Rift Valley',
                    'circular_reference'  => 'MOE/HQS/CC/2026/VOL.IV',
                    'remarks'             => 'Official KSSA national gala for track and field events.',
                ],
                [
                    'academic_year'       => '2026',
                    'term'                => 'Term 2',
                    'category_name'       => 'Drama & Music',
                    'activity_name'       => 'Kenya National Drama & Film Festival',
                    'education_level'     => 'junior_secondary',
                    'age_bracket'         => 'under_15',
                    'competition_level'   => 'national',
                    'start_date'          => $today->copy()->addMonths(2)->toDateString(),
                    'end_date'            => $today->copy()->addMonths(2)->addDays(6)->toDateString(),
                    'reporting_date'      => $today->copy()->addMonths(2)->subDay()->toDateString(),
                    'departure_date'      => $today->copy()->addMonths(2)->addDays(7)->toDateString(),
                    'venue'               => 'Kangaru Girls High School, Embu',
                    'host_county'         => 'Embu',
                    'host_region'         => 'Eastern',
                    'circular_reference'  => 'MOE/DQAS/NDFF/2026/02',
                    'remarks'             => 'CBC dramatic verse and creative oral literature performances.',
                ]
            ];

            foreach ($nationalEvents as $event) {
                DB::table('national_cocurricular_calendars')->updateOrInsert(
                    [
                        'academic_year' => $event['academic_year'],
                        'activity_name' => $event['activity_name'],
                    ],
                    array_merge($event, [
                        'created_at' => $now,
                        'updated_at' => $now,
                    ])
                );
            }
        }

        $schools = DB::table('schools')->get();
        if ($schools->isEmpty()) return;

        foreach ($schools as $school) {
            $schoolId = $school->id;
            $students = DB::table('students')->where('school_id', $schoolId)->get();
            $houses = DB::table('activity_houses')->where('school_id', $schoolId)->get();
            $activities = DB::table('activities')->where('school_id', $schoolId)->get();
            $events = DB::table('cocurricular_events')->where('school_id', $schoolId)->get();
            $teams = DB::table('activity_teams')->where('school_id', $schoolId)->get();
            $voteHeads = DB::table('fee_vote_heads')->where('school_id', $schoolId)->get();
            $payments = DB::table('fee_payments')->where('school_id', $schoolId)->get();
            $invoices = DB::table('fee_invoices')->where('school_id', $schoolId)->get();

            $leadStudent = $students->first();
            $secondStudent = $students->skip(1)->first() ?? $leadStudent;
            $leadActivity = $activities->first();
            $leadEvent = $events->first();
            $leadTeam = $teams->first();
            $leadHouse = $houses->first();

            // 2. SHIFTS (Institutional Guard & Support Timings)
            if (Schema::hasTable('shifts')) {
                $shiftsData = [
                    ['name' => 'Morning Academic Session', 'start_time' => '07:30:00', 'end_time' => '13:00:00'],
                    ['name' => 'Afternoon Co-Curricular & Remedial', 'start_time' => '14:00:00', 'end_time' => '17:00:00'],
                    ['name' => 'Evening Prep & Supervision', 'start_time' => '18:30:00', 'end_time' => '21:00:00'],
                ];

                foreach ($shiftsData as $sd) {
                    DB::table('shifts')->updateOrInsert(
                        ['school_id' => $schoolId, 'name' => $sd['name']],
                        array_merge($sd, ['created_at' => $now, 'updated_at' => $now])
                    );
                }
            }

            // 3. ACTIVITY TEAM MEMBERS
            if ($leadTeam && $leadStudent && Schema::hasTable('activity_team_members')) {
                DB::table('activity_team_members')->updateOrInsert(
                    [
                        'school_id'  => $schoolId,
                        'team_id'    => $leadTeam->id,
                        'student_id' => $leadStudent->id,
                    ],
                    [
                        'role'          => 'captain',
                        'jersey_number' => '10',
                        'position_name' => 'Central Attacking Midfielder',
                        'joined_date'   => $today->copy()->subMonths(3)->toDateString(),
                        'status'        => 'active',
                        'created_at'    => $now,
                        'updated_at'    => $now,
                    ]
                );

                if ($secondStudent && $secondStudent->id !== $leadStudent->id) {
                    DB::table('activity_team_members')->updateOrInsert(
                        [
                            'school_id'  => $schoolId,
                            'team_id'    => $leadTeam->id,
                            'student_id' => $secondStudent->id,
                        ],
                        [
                            'role'          => 'member',
                            'jersey_number' => '1',
                            'position_name' => 'Goalkeeper',
                            'joined_date'   => $today->copy()->subMonths(3)->toDateString(),
                            'status'        => 'active',
                            'created_at'    => $now,
                            'updated_at'    => $now,
                        ]
                    );
                }
            }

            // 4. EVENT PARTICIPANTS
            $participantId = null;
            if ($leadEvent && $leadStudent && Schema::hasTable('event_participants')) {
                DB::table('event_participants')->updateOrInsert(
                    [
                        'school_id'  => $schoolId,
                        'event_id'   => $leadEvent->id,
                        'student_id' => $leadStudent->id,
                    ],
                    [
                        'team_id'               => $leadTeam?->id,
                        'house_id'              => $leadHouse?->id,
                        'registration_number'   => 'ATH-' . $schoolId . '-001',
                        'heat'                  => 'Heat 1',
                        'lane'                  => 4,
                        'category_division'     => 'Under 15 Boys 200m Sprint',
                        'qualification_status'  => 'qualified',
                        'qualification_level'   => 'sub_county',
                        'notes'                 => 'Seeded in Lane 4 after preliminary time trials.',
                        'created_at'            => $now,
                        'updated_at'            => $now,
                    ]
                );

                $participant = DB::table('event_participants')
                    ->where('school_id', $schoolId)
                    ->where('event_id', $leadEvent->id)
                    ->where('student_id', $leadStudent->id)
                    ->first();
                $participantId = $participant?->id;
            }

            // 5. ACTIVITY FIXTURES
            if ($leadEvent && Schema::hasTable('activity_fixtures')) {
                DB::table('activity_fixtures')->updateOrInsert(
                    [
                        'school_id' => $schoolId,
                        'event_id'  => $leadEvent->id,
                        'venue'     => 'Main Pavilion Pitch 1',
                    ],
                    [
                        'team_a_id'          => $leadTeam?->id,
                        'team_b_id'          => null,
                        'team_a_custom_name' => $leadTeam?->name ?? 'Junior Warriors FC',
                        'team_b_custom_name' => 'Mara River Academy Invitational XI',
                        'scheduled_at'       => $today->copy()->addDays(2)->setHour(14)->setMinute(30),
                        'stage'              => 'quarter_final',
                        'team_a_score'       => 2,
                        'team_b_score'       => 1,
                        'winner_team_id'     => $leadTeam?->id,
                        'outcome'            => 'win',
                        'referee_name'       => 'James Mwangi (FKF Accredited Referee)',
                        'match_report'       => 'High-intensity match with clean counter-attacks. Junior Warriors secured victory in the 82nd minute.',
                        'created_at'         => $now,
                        'updated_at'         => $now,
                    ]
                );
            }

            // 6. ADJUDICATION RUBRICS & RUBRIC ITEMS
            $rubricId = null;
            if (Schema::hasTable('adjudication_rubrics')) {
                DB::table('adjudication_rubrics')->updateOrInsert(
                    [
                        'school_id' => $schoolId,
                        'code'      => 'RUB-PE-CBC-' . $schoolId,
                    ],
                    [
                        'activity_id'     => $leadActivity?->id,
                        'name'            => 'CBC Junior Secondary Physical Education Assessment Rubric',
                        'total_max_score' => 100.00,
                        'description'     => 'Official CBC performance scoring covering technical skill, pacing, sportsmanship, and teamwork.',
                        'is_active'       => 1,
                        'created_at'      => $now,
                        'updated_at'      => $now,
                    ]
                );

                $rubric = DB::table('adjudication_rubrics')->where('school_id', $schoolId)->where('code', 'RUB-PE-CBC-' . $schoolId)->first();
                $rubricId = $rubric?->id;

                if ($rubricId && Schema::hasTable('adjudication_rubric_items')) {
                    $items = [
                        ['criterion_name' => 'Technical Execution & Form', 'max_score' => 40.00, 'display_order' => 1, 'desc' => 'Fluidity, balance, starting technique, and posture.'],
                        ['criterion_name' => 'Tactical & Tactical Awareness', 'max_score' => 30.00, 'display_order' => 2, 'desc' => 'Pacing, transition timing, and strategic execution.'],
                        ['criterion_name' => 'Sportsmanship & Rule Adherence', 'max_score' => 30.00, 'display_order' => 3, 'desc' => 'Compliance with regulations, peer encouragement, and decorum.'],
                    ];

                    foreach ($items as $item) {
                        DB::table('adjudication_rubric_items')->updateOrInsert(
                            [
                                'school_id'      => $schoolId,
                                'rubric_id'      => $rubricId,
                                'criterion_name' => $item['criterion_name'],
                            ],
                            [
                                'max_score'     => $item['max_score'],
                                'display_order' => $item['display_order'],
                                'description'   => $item['desc'],
                                'created_at'    => $now,
                                'updated_at'    => $now,
                            ]
                        );
                    }
                }
            }

            // 7. PERFORMANCE ADJUDICATIONS & SCORES
            if ($participantId && $rubricId && Schema::hasTable('performance_adjudications')) {
                DB::table('performance_adjudications')->updateOrInsert(
                    [
                        'school_id'            => $schoolId,
                        'event_participant_id' => $participantId,
                        'rubric_id'            => $rubricId,
                    ],
                    [
                        'adjudicator_name'    => 'Coach Samson Odhiambo',
                        'total_awarded_score' => 88.50,
                        'grade_attained'      => 'EE',
                        'general_feedback'    => 'Exceeds Expectations. Remarkable sprint form and adherence to lane discipline.',
                        'status'              => 'submitted',
                        'created_at'          => $now,
                        'updated_at'          => $now,
                    ]
                );

                $adjudication = DB::table('performance_adjudications')
                    ->where('school_id', $schoolId)
                    ->where('event_participant_id', $participantId)
                    ->where('rubric_id', $rubricId)
                    ->first();

                if ($adjudication && Schema::hasTable('performance_scores')) {
                    $rubricItems = DB::table('adjudication_rubric_items')->where('school_id', $schoolId)->where('rubric_id', $rubricId)->get();
                    $scores = [36.50, 26.00, 26.00];

                    foreach ($rubricItems as $idx => $ri) {
                        DB::table('performance_scores')->updateOrInsert(
                            [
                                'school_id'       => $schoolId,
                                'adjudication_id' => $adjudication->id,
                                'rubric_item_id'  => $ri->id,
                            ],
                            [
                                'awarded_score' => $scores[$idx % count($scores)],
                                'item_comment'  => 'Consistent performance adhering to official guidelines.',
                                'created_at'    => $now,
                                'updated_at'    => $now,
                            ]
                        );
                    }
                }
            }

            // 8. FEE PAYMENT ALLOCATIONS
            if ($voteHeads->isNotEmpty() && $payments->isNotEmpty() && Schema::hasTable('fee_payment_allocations')) {
                $primaryHead = $voteHeads->first();
                $leadInvoice = $invoices->first();

                foreach ($payments as $payment) {
                    DB::table('fee_payment_allocations')->updateOrInsert(
                        [
                            'school_id'        => $schoolId,
                            'fee_payment_id'   => $payment->id,
                            'fee_vote_head_id' => $primaryHead->id,
                        ],
                        [
                            'fee_invoice_id'      => $payment->fee_structure_id ?? $leadInvoice?->id,
                            'fee_invoice_item_id' => null,
                            'amount'              => $payment->amount_paid ?? 15000.00,
                            'created_at'          => $now,
                            'updated_at'          => $now,
                        ]
                    );
                }
            }
        }
    }
}