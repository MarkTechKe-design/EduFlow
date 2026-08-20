<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use App\Models\Guardian;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;

class DemoUserSeeder extends Seeder
{
    public function run(): void
    {
        // Create demo school
        $school = School::firstOrCreate(
            ['slug' => 'greenfield-academy'],
            [
                'name'     => 'Greenfield Academy',
                'email'    => 'info@greenfield.edu',
                'phone'    => '+254700000000',
                'address'  => '123 School Road, Dhaka',
                'city'     => 'Dhaka',
                'country' => 'KE',
                'timezone' => 'Africa/Nairobi',
                'currency' => 'KES',
                'language' => 'en',
                'status'   => 'active',
            ]
        );

        // Create current academic year
        AcademicYear::firstOrCreate(
            ['school_id' => $school->id, 'name' => '2025-2026'],
            [
                'start_date' => '2025-01-01',
                'end_date'   => '2025-12-31',
                'is_current' => true,
            ]
        );

        $demoUsers = [
            [
                'name'  => 'School Admin',
                'email' => 'school-admin@eduflow.test',
                'role'  => 'school-admin',
            ],
            [
                'name'  => 'Principal',
                'email' => 'principal@eduflow.test',
                'role'  => 'principal',
            ],
            [
                'name'  => 'Teacher Demo',
                'email' => 'teacher@eduflow.test',
                'role'  => 'teacher',
            ],
            [
                'name'  => 'Accountant Demo',
                'email' => 'accountant@eduflow.test',
                'role'  => 'accountant',
            ],
            [
                'name'  => 'Librarian Demo',
                'email' => 'librarian@eduflow.test',
                'role'  => 'librarian',
            ],
            [
                'name'  => 'Student Demo',
                'email' => 'student@eduflow.test',
                'role'  => 'student',
            ],
            [
                'name'  => 'Parent Demo',
                'email' => 'parent@eduflow.test',
                'role'  => 'parent',
            ],
        ];

        foreach ($demoUsers as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name'      => $data['name'],
                    'school_id' => $school->id,
                    'password'  => bcrypt('password'),
                    'status'    => 'active',
                ]
            );
            $user->syncRoles([$data['role']]);
        }

        // Link demo student user to a Student record
        $studentUser = User::where('email', 'student@eduflow.test')->first();
        if ($studentUser) {
            $class   = SchoolClass::where('school_id', $school->id)->first();
            $section = $class?->sections()->first();

            if ($class && $section) {
                $existing = Student::withoutGlobalScopes()
                    ->where('school_id', $school->id)
                    ->where('user_id', $studentUser->id)
                    ->first();

                if (! $existing) {
                    // Re-use first student record if available, otherwise create one
                    $student = Student::withoutGlobalScopes()
                        ->where('school_id', $school->id)
                        ->whereNull('user_id')
                        ->orWhere('user_id', 0)
                        ->first();

                    if ($student) {
                        $student->update(['user_id' => $studentUser->id]);
                    } else {
                        Student::create([
                            'school_id'     => $school->id,
                            'user_id'       => $studentUser->id,
                            'class_id'      => $class->id,
                            'section_id'    => $section->id,
                            'admission_no'  => 'DEMO-STU-001',
                            'roll_no'       => '01',
                            'first_name'    => 'Student',
                            'last_name'     => 'Demo',
                            'gender'        => 'male',
                            'date_of_birth' => '2008-01-01',
                            'nationality'   => 'Bangladeshi',
                            'category'      => 'general',
                            'status'        => 'active',
                            'admission_date'=> now()->toDateString(),
                        ]);
                    }
                }
            }
        }

        // Link demo parent user to a Guardian record
        $parentUser = User::where('email', 'parent@eduflow.test')->first();
        if ($parentUser) {
            $existingGuardian = Guardian::withoutGlobalScopes()
                ->where('school_id', $school->id)
                ->where('user_id', $parentUser->id)
                ->first();

            if (! $existingGuardian) {
                // Find first guardian with no user_id or user_id=0
                $guardian = Guardian::withoutGlobalScopes()
                    ->where('school_id', $school->id)
                    ->where(fn ($q) => $q->whereNull('user_id')->orWhere('user_id', 0))
                    ->first();

                if ($guardian) {
                    $guardian->update(['user_id' => $parentUser->id]);
                } else {
                    Guardian::create([
                        'school_id' => $school->id,
                        'user_id'   => $parentUser->id,
                        'name'      => 'Parent Demo',
                        'relation'  => 'Father',
                        'phone'     => '+254700000099',
                        'email'     => 'parent@eduflow.test',
                    ]);
                }
            }
        }

        $this->command->info('Demo school and users seeded.');
    }
}
