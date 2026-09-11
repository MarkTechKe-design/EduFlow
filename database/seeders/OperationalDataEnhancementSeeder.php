<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class OperationalDataEnhancementSeeder extends Seeder
{
    public function run(): void
    {
        $schools = DB::table('schools')->get();
        if ($schools->isEmpty()) {
            return;
        }

        $now = now();
        $today = now()->startOfDay();

        foreach ($schools as $school) {
            $schoolId = $school->id;
            $adminUser = DB::table('users')->where('school_id', $schoolId)->first();
            $adminUserId = $adminUser?->id ?? 1;

            $staffMembers = DB::table('staff')->where('school_id', $schoolId)->get();
            $leadTeacher = $staffMembers->first();
            $secondTeacher = $staffMembers->skip(1)->first() ?? $leadTeacher;
            $classes = DB::table('classes')->where('school_id', $schoolId)->get();
            $subjects = DB::table('subjects')->where('school_id', $schoolId)->get();

            // -------------------------------------------------------------
            // 1. EMAIL TEMPLATES
            // -------------------------------------------------------------
            if (Schema::hasTable('email_templates')) {
                $templates = [
                    [
                        'name'      => 'CBC Term Report Card Release',
                        'slug'      => 'report-card-release',
                        'subject'   => 'Term Evaluation & Assessment Summary - {student_name}',
                        'body'      => '<p>Dear {parent_name},</p><p>We are pleased to share {student_name}\'s CBC summative evaluation and progress tracker for {term}.</p><p>You can access the comprehensive performance report online through the EduFlow Parent Portal.</p><p>Best regards,<br>{school_name} Academic Office</p>',
                        'variables' => json_encode(['student_name', 'parent_name', 'term', 'school_name']),
                        'is_active' => true,
                    ],
                    [
                        'name'      => 'Fee Statement & Payment Reminder',
                        'slug'      => 'fee-balance-notice',
                        'subject'   => 'Fee Statement Notice - {student_name} ({admission_number})',
                        'body'      => '<p>Dear {parent_name},</p><p>This is a periodic account statement reminder for <strong>{student_name}</strong>. The current outstanding balance is <strong>KES {outstanding_balance}</strong>.</p><p>Payments can be made via our Paybill account or school bank accounts.</p><p>Regards,<br>Finance Office, {school_name}</p>',
                        'variables' => json_encode(['student_name', 'admission_number', 'parent_name', 'outstanding_balance', 'school_name']),
                        'is_active' => true,
                    ],
                    [
                        'name'      => 'General School Circular & Notice',
                        'slug'      => 'school-circular',
                        'subject'   => 'Important Institutional Circular: {circular_title}',
                        'body'      => '<p>Dear Parents & Guardians,</p><p>Please find the official update regarding <strong>{circular_title}</strong>.</p><p>{circular_summary}</p><p>Thank you for your ongoing partnership with {school_name}.</p>',
                        'variables' => json_encode(['circular_title', 'circular_summary', 'school_name']),
                        'is_active' => true,
                    ],
                ];

                foreach ($templates as $tmpl) {
                    DB::table('email_templates')->updateOrInsert(
                        ['school_id' => $schoolId, 'slug' => $tmpl['slug']],
                        array_merge($tmpl, [
                            'created_at' => $now,
                            'updated_at' => $now,
                        ])
                    );
                }
            }

            // -------------------------------------------------------------
            // 2. ASSIGN CLASS TEACHERS (Clears "Without Active Class Teacher")
            // -------------------------------------------------------------
            if (Schema::hasTable('teacher_assignments') && $staffMembers->isNotEmpty()) {
                $staffCount = $staffMembers->count();
                foreach ($classes as $idx => $class) {
                    $assignedStaff = $staffMembers[$idx % $staffCount];

                    DB::table('teacher_assignments')->updateOrInsert(
                        [
                            'school_id'       => $schoolId,
                            'class_id'        => $class->id,
                            'assignment_type' => 'class_teacher',
                        ],
                        [
                            'staff_id'         => $assignedStaff->id,
                            'user_id'          => $assignedStaff->user_id ?? $adminUserId,
                            'academic_year_id' => 1,
                            'subject_id'       => null,
                            'term'             => 'Term 2',
                            'start_date'       => $today->copy()->startOfYear()->toDateString(),
                            'end_date'         => null,
                            'status'           => 'active',
                            'assigned_by'      => $adminUserId,
                            'remarks'          => 'Primary classroom pedagogue and pastoral coordinator.',
                            'created_at'       => $now,
                            'updated_at'       => $now,
                        ]
                    );
                }
            }

            // -------------------------------------------------------------
            // 3. TEACHER DUTY ROSTERS & ASSIGNMENTS
            // -------------------------------------------------------------
            if (Schema::hasTable('teacher_duty_rosters') && $leadTeacher) {
                $rosterId = DB::table('teacher_duty_rosters')->updateOrInsert(
                    [
                        'school_id'   => $schoolId,
                        'week_number' => 2,
                        'term'        => 'Term 2',
                    ],
                    [
                        'academic_year_id' => 1,
                        'title'            => 'Term 2 Week 2 Operations & Assembly Roster',
                        'start_date'       => $today->copy()->startOfWeek()->toDateString(),
                        'end_date'         => $today->copy()->endOfWeek()->toDateString(),
                        'is_active'        => true,
                        'notes'            => 'Daily parade inspection, dining hall monitoring, and gate supervision.',
                        'created_by'       => $adminUserId,
                        'created_at'       => $now,
                        'updated_at'       => $now,
                    ]
                );

                $currentRoster = DB::table('teacher_duty_rosters')
                    ->where('school_id', $schoolId)
                    ->where('week_number', 2)
                    ->first();

                if ($currentRoster && Schema::hasTable('teacher_duty_assignments')) {
                    $stations = [
                        ['station' => 'Main Gate & Assembly Grounds', 'shift' => 'morning', 'day' => 'Monday', 'staff' => $leadTeacher->id],
                        ['station' => 'Dining Hall & Meal Counter', 'shift' => 'lunch', 'day' => 'Tuesday', 'staff' => $secondTeacher->id],
                        ['station' => 'Junior Secondary Complex & Corridors', 'shift' => 'evening', 'day' => 'Wednesday', 'staff' => $leadTeacher->id],
                    ];

                    foreach ($stations as $st) {
                        DB::table('teacher_duty_assignments')->updateOrInsert(
                            [
                                'school_id'      => $schoolId,
                                'duty_roster_id' => $currentRoster->id,
                                'duty_station'   => $st['station'],
                                'day_of_week'    => $st['day'],
                            ],
                            [
                                'staff_id'       => $st['staff'],
                                'shift'          => $st['shift'],
                                'effective_date' => $today->copy()->toDateString(),
                                'instructions'   => 'Ensure order, safety, punctuality, and pupil supervision.',
                                'created_by'     => $adminUserId,
                                'created_at'     => $now,
                                'updated_at'     => $now,
                            ]
                        );
                    }
                }
            }

            // -------------------------------------------------------------
            // 4. ONLINE CLASSES (Virtual Learning Sessions)
            // -------------------------------------------------------------
            if (Schema::hasTable('online_classes') && $classes->isNotEmpty() && $subjects->isNotEmpty() && $leadTeacher) {
                $targetClass = $classes->first();
                $targetSubject = $subjects->first();

                DB::table('online_classes')->updateOrInsert(
                    [
                        'school_id'  => $schoolId,
                        'title'      => 'Interactive CBC Science & Agriculture Practical Seminar',
                    ],
                    [
                        'class_id'         => $targetClass->id,
                        'subject_id'       => $targetSubject->id,
                        'teacher_id'       => $leadTeacher->id,
                        'created_by'       => $adminUserId,
                        'meeting_type'     => 'scheduled',
                        'description'      => 'Online interactive tutorial discussing Soil Moisture conservation and farm plots.',
                        'platform'         => 'jitsi',
                        'meeting_id'       => 'eduflow-sci-' . $schoolId . '-' . $targetClass->id,
                        'meeting_url'      => 'https://meet.jit.si/eduflow-sci-' . $schoolId . '-' . $targetClass->id,
                        'passcode'         => 'EDUFLOW2026',
                        'scheduled_at'     => $today->copy()->addDays(2)->setHour(10)->setMinute(0),
                        'duration_minutes' => 45,
                        'status'           => 'scheduled',
                        'created_at'       => $now,
                        'updated_at'       => $now,
                    ]
                );
            }
        }
    }
}