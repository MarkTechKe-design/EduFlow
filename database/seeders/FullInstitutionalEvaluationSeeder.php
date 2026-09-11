<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class FullInstitutionalEvaluationSeeder extends Seeder
{
    public function run(): void
    {
        $schools = DB::table('schools')->get();
        if ($schools->isEmpty()) return;

        $now = now();
        $today = now()->startOfDay();

        foreach ($schools as $school) {
            $schoolId = $school->id;
            $students = DB::table('students')->where('school_id', $schoolId)->get();
            $staff = DB::table('staff')->where('school_id', $schoolId)->get();
            $houses = DB::table('activity_houses')->where('school_id', $schoolId)->get();
            $activities = DB::table('activities')->where('school_id', $schoolId)->get();
            $hostels = DB::table('hostels')->where('school_id', $schoolId)->get();
            $items = DB::table('inventory_items')->where('school_id', $schoolId)->get();
            $inquiries = DB::table('admission_inquiries')->where('school_id', $schoolId)->get();
            $structures = DB::table('fee_structures')->where('school_id', $schoolId)->get();

            $leadStudent = $students->first();
            $leadStaff = $staff->first();
            $leadHouse = $houses->first();
            $leadActivity = $activities->first();
            $leadHostel = $hostels->first();
            $leadItem = $items->first();
            $leadStructure = $structures->first();

            // 1. FEE VOTE HEADS & FEE STRUCTURE ITEMS
            if (Schema::hasTable('fee_vote_heads')) {
                $heads = [
                    ['code' => 'TUT', 'name' => 'Tuition & Academic Learning Materials', 'category' => 'tuition'],
                    ['code' => 'ACT', 'name' => 'CBC Activity & Co-Curricular Fund', 'category' => 'activity'],
                    ['code' => 'MED', 'name' => 'Medical & Sanitization Support', 'category' => 'medical'],
                    ['code' => 'DEV', 'name' => 'ICT & Infrastructure Development', 'category' => 'development'],
                ];
                foreach ($heads as $h) {
                    DB::table('fee_vote_heads')->updateOrInsert(
                        ['school_id' => $schoolId, 'code' => $h['code']],
                        [
                            'name'         => $h['name'],
                            'category'     => $h['category'],
                            'description'  => 'Standard vote head allocation for ' . $school->name,
                            'is_mandatory' => true,
                            'is_active'    => true,
                            'created_at'   => $now,
                            'updated_at'   => $now,
                        ]
                    );
                }

                if ($leadStructure && Schema::hasTable('fee_structure_items')) {
                    $savedHeads = DB::table('fee_vote_heads')->where('school_id', $schoolId)->get();
                    $allocations = [12000.00, 3500.00, 1500.00, 2000.00];
                    foreach ($savedHeads as $idx => $sh) {
                        DB::table('fee_structure_items')->updateOrInsert(
                            [
                                'school_id'        => $schoolId,
                                'fee_structure_id' => $leadStructure->id,
                                'fee_vote_head_id' => $sh->id,
                            ],
                            [
                                'amount'     => $allocations[$idx % count($allocations)],
                                'created_at' => $now,
                                'updated_at' => $now,
                            ]
                        );
                    }
                }
            }

            // 2. FIXED ASSETS & MAINTENANCE
            if (Schema::hasTable('assets')) {
                DB::table('assets')->updateOrInsert(
                    ['school_id' => $schoolId, 'asset_code' => 'AST-SCH' . $schoolId . '-001'],
                    [
                        'name'                 => 'CBC Science Laboratory Compound Microscopes (Set of 10)',
                        'category'             => 'Laboratory Equipment',
                        'purchase_date'        => $today->copy()->subMonths(6)->toDateString(),
                        'purchase_price'       => 145000.00,
                        'current_value'        => 130500.00,
                        'depreciation_rate'    => 10.00,
                        'depreciation_method'  => 'straight_line',
                        'status'               => 'active',
                        'location'             => 'Senior Science Laboratory Wing',
                        'description'          => 'Precision compound microscopes for CBC Integrated Science practicals.',
                        'created_at'           => $now,
                        'updated_at'           => $now,
                    ]
                );

                $asset = DB::table('assets')->where('school_id', $schoolId)->where('asset_code', 'AST-SCH' . $schoolId . '-001')->first();
                if ($asset && Schema::hasTable('asset_maintenance_logs')) {
                    DB::table('asset_maintenance_logs')->updateOrInsert(
                        ['school_id' => $schoolId, 'asset_id' => $asset->id, 'description' => 'Bi-annual lens recalibration and optical servicing'],
                        [
                            'date'                   => $today->copy()->subMonths(1)->toDateString(),
                            'cost'                   => 7500.00,
                            'vendor'                 => 'Optics Kenya Lab Supplies Ltd',
                            'next_maintenance_date'  => $today->copy()->addMonths(5)->toDateString(),
                            'created_at'             => $now,
                            'updated_at'             => $now,
                        ]
                    );
                }
            }

            // 3. INVENTORY PURCHASES & ISSUES
            if ($leadItem && Schema::hasTable('inventory_purchases')) {
                DB::table('inventory_purchases')->updateOrInsert(
                    ['school_id' => $schoolId, 'item_id' => $leadItem->id, 'vendor' => 'Chuka Books & Stationery Distributors'],
                    [
                        'purchase_date' => $today->copy()->subDays(20)->toDateString(),
                        'quantity'      => 150,
                        'unit_price'    => 120.00,
                        'total_price'   => 18000.00,
                        'invoice_no'    => 'INV-STAT-' . $schoolId . '-01',
                        'notes'         => 'Received in store by Senior Lab Tech.',
                        'created_at'    => $now,
                        'updated_at'    => $now,
                    ]
                );

                if (Schema::hasTable('inventory_issues')) {
                    DB::table('inventory_issues')->updateOrInsert(
                        ['school_id' => $schoolId, 'item_id' => $leadItem->id, 'issued_to_name' => 'Grade 7 Class Teacher'],
                        [
                            'issued_to_type' => 'staff',
                            'issued_to_id'   => $leadStaff?->id ?? 1,
                            'quantity'       => 40,
                            'issue_date'     => $today->copy()->subDays(10)->toDateString(),
                            'purpose'        => 'Term 2 class distribution and practical exercise assessment books.',
                            'status'         => 'issued',
                            'notes'          => 'Issued directly for Grade 7 CBC class exercise records.',
                            'created_at'     => $now,
                            'updated_at'     => $now,
                        ]
                    );
                }
            }

            // 4. CO-CURRICULAR, SPORTS, TEAMS & HOUSE POINTS
            if ($leadActivity && Schema::hasTable('cocurricular_events')) {
                DB::table('cocurricular_events')->updateOrInsert(
                    ['school_id' => $schoolId, 'title' => 'Inter-House Athletics & Ball Games Gala'],
                    [
                        'activity_id'      => $leadActivity->id,
                        'category_id'      => $leadActivity->category_id ?? 1,
                        'academic_year_id' => 1,
                        'term'             => 'Term 2',
                        'event_type'       => 'inter_house',
                        'start_date'       => $today->copy()->addDays(5)->toDateString(),
                        'end_date'         => $today->copy()->addDays(6)->toDateString(),
                        'venue'            => 'School Sports Complex & Pavilion',
                        'status'           => 'scheduled',
                        'notes'            => 'Annual championship covering Track, Volleyball, and Football.',
                        'created_at'       => $now,
                        'updated_at'       => $now,
                    ]
                );

                $event = DB::table('cocurricular_events')->where('school_id', $schoolId)->where('title', 'Inter-House Athletics & Ball Games Gala')->first();

                if (Schema::hasTable('house_point_rules')) {
                    $rules = [
                        ['position_rank' => 1, 'points' => 20, 'rule_name' => 'Championship First Place'],
                        ['position_rank' => 2, 'points' => 15, 'rule_name' => 'Runner-up Second Place'],
                        ['position_rank' => 3, 'points' => 10, 'rule_name' => 'Third Place Finish'],
                        ['position_rank' => 4, 'points' => 5,  'rule_name' => 'Participation Fair Play Award'],
                    ];
                    foreach ($rules as $r) {
                        DB::table('house_point_rules')->updateOrInsert(
                            ['school_id' => $schoolId, 'position_rank' => $r['position_rank']],
                            array_merge($r, ['is_active' => true, 'created_at' => $now, 'updated_at' => $now])
                        );
                    }
                }

                if ($leadHouse && Schema::hasTable('house_point_logs')) {
                    DB::table('house_point_logs')->updateOrInsert(
                        ['school_id' => $schoolId, 'house_id' => $leadHouse->id, 'reason' => '1st Place: 4x100m Relay Track Heats'],
                        [
                            'cocurricular_event_id' => $event?->id,
                            'activity_id'           => $leadActivity->id,
                            'student_id'            => $leadStudent?->id,
                            'points'                => 20,
                            'created_at'            => $now,
                            'updated_at'            => $now,
                        ]
                    );
                }

                if (Schema::hasTable('activity_teams')) {
                    DB::table('activity_teams')->updateOrInsert(
                        ['school_id' => $schoolId, 'name' => 'Junior Warriors FC'],
                        [
                            'activity_id'      => $leadActivity->id,
                            'house_id'         => $leadHouse?->id,
                            'academic_year_id' => 1,
                            'age_group'        => 'under_15',
                            'gender'           => 'mixed',
                            'coach_id'         => $leadStaff?->id,
                            'status'           => 'active',
                            'created_at'       => $now,
                            'updated_at'       => $now,
                        ]
                    );
                }

                if ($leadStudent && Schema::hasTable('student_achievements')) {
                    DB::table('student_achievements')->updateOrInsert(
                        ['school_id' => $schoolId, 'student_id' => $leadStudent->id, 'award_title' => 'Top Sprinter Trophy - 200m Track Event'],
                        [
                            'activity_id'           => $leadActivity->id,
                            'cocurricular_event_id' => $event?->id,
                            'academic_year_id'      => 1,
                            'term'                  => 'Term 1',
                            'award_type'            => 'certificate_of_merit',
                            'competition_level'     => 'school',
                            'position_rank'         => '1',
                            'citation'              => 'Set institutional Junior Secondary track record.',
                            'verified_by'           => $leadStaff?->id,
                            'awarded_date'          => $today->copy()->subMonths(2)->toDateString(),
                            'created_at'            => $now,
                            'updated_at'            => $now,
                        ]
                    );
                }
            }

            // 5. HOSTEL EXEATS
            if ($leadStudent && $leadHostel && Schema::hasTable('hostel_exeats')) {
                DB::table('hostel_exeats')->updateOrInsert(
                    ['school_id' => $schoolId, 'student_id' => $leadStudent->id, 'departure_date' => $today->copy()->subDays(5)->toDateString()],
                    [
                        'hostel_id'                 => $leadHostel->id,
                        'exeat_type'                => 'medical_leave',
                        'expected_return_date'      => $today->copy()->subDays(3)->toDateString(),
                        'actual_return_date'        => $today->copy()->subDays(3)->toDateString(),
                        'reason'                    => 'Dental checkup with guardian accompaniment at Aga Khan University Hospital.',
                        'guardian_approval_contact' => '+254700000001',
                        'status'                    => 'returned',
                        'created_at'                => $now,
                        'updated_at'                => $now,
                    ]
                );
            }

            // 6. STUDENT MEDICAL PROFILES
            if ($leadStudent && Schema::hasTable('student_medical_profiles')) {
                DB::table('student_medical_profiles')->updateOrInsert(
                    ['school_id' => $schoolId, 'student_id' => $leadStudent->id],
                    [
                        'blood_group'          => 'O+',
                        'allergies'            => 'Peanuts, Penicillin',
                        'chronic_conditions'   => 'Mild Exercise-Induced Asthma',
                        'emergency_medication' => 'Salbutamol Inhaler (Kept in School Clinic)',
                        'dietary_restrictions'=> 'Strict Nut-Free Diet',
                        'sha_nhif_no'          => 'SHA-2026-991204',
                        'preferred_hospital'   => 'Nairobi Hospital Outpatient Wing',
                        'doctor_name'          => 'Dr. Beatrice Wanjiru',
                        'doctor_phone'         => '+254722001122',
                        'special_instructions' => 'Notify school nurse and guardian immediately if shortness of breath occurs.',
                        'created_at'           => $now,
                        'updated_at'           => $now,
                    ]
                );
            }

            // 7. ADMISSIONS INQUIRY FOLLOW-UPS
            if ($inquiries->isNotEmpty() && Schema::hasTable('inquiry_followups')) {
                $leadInq = $inquiries->first();
                DB::table('inquiry_followups')->updateOrInsert(
                    ['inquiry_id' => $leadInq->id, 'note' => 'Called guardian to provide fee schedule and CBC curriculum prospectus.'],
                    [
                        'staff_id'   => $leadStaff?->id ?? 1,
                        'next_date'  => $today->copy()->addDays(3)->toDateString(),
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]
                );
            }
        }
    }
}