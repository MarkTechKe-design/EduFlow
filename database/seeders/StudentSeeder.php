<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use Carbon\Carbon;

class StudentSeeder extends Seeder
{
    private array $firstNames = [
        'Bradley', 'Zawadi', 'Ethan', 'Faith', 'Ryan', 'Grace', 'Alvin', 'Mercy', 'Victor', 'Joy',
        'Trevor', 'Brenda', 'Kelvin', 'Sharon', 'Austin', 'Daisy', 'Caleb', 'Cynthia', 'Precious', 'Brian',
        'Kiprono', 'Achieng', 'Mwangi', 'Nekesa', 'Kipchumba', 'Njeri', 'Omondi', 'Chebet', 'Mutua', 'Wambui',
    ];

    private array $lastNames = [
        'Mwangi', 'Ochieng', 'Wanjiku', 'Kiprop', 'Otieno', 'Mutua', 'Cheruiyot', 'Kamau', 'Maina', 'Odhiambo',
        'Kariuki', 'Kimani', 'Njoroge', 'Barasa', 'Wafula', 'Nyambura', 'Wambui', 'Chepkirui', 'Korir', 'Rotich',
        'Omwamba', 'Mogaka', 'Mwendwa', 'Musyoka', 'Chebet', 'Achieng', 'Nekesa', 'Hassan', 'Ali', 'Omar',
    ];

    public function run(): void
    {
        $school = School::first();
        if (!$school) {
            $this->command?->warn('No school found.');
            return;
        }

        $sid = $school->id;
        $classes = SchoolClass::withoutGlobalScopes()->where('school_id', $sid)->get();

        if ($classes->isEmpty()) {
            $this->command?->warn('No classes found in StudentSeeder.');
            return;
        }

        $count = 0;
        foreach ($classes as $class) {
            $sections = Section::withoutGlobalScopes()
                ->where('school_id', $sid)
                ->where('class_id', $class->id)
                ->get();

            foreach ($sections as $section) {
                for ($k = 0; $k < 2; $k++) {
                    $count++;
                    $firstName = $this->firstNames[array_rand($this->firstNames)];
                    $lastName  = $this->lastNames[array_rand($this->lastNames)];
                    $admNo     = 'ADM-2026-' . str_pad($count, 4, '0', STR_PAD_LEFT);

                    Student::withoutGlobalScopes()->updateOrCreate(
                        ['school_id' => $sid, 'admission_no' => $admNo],
                        [
                            'class_id'          => $class->id,
                            'section_id'        => $section->id,
                            'first_name'        => $firstName,
                            'last_name'         => $lastName,
                            'gender'            => ($k % 2 === 0) ? 'male' : 'female',
                            'date_of_birth'     => Carbon::now()->subYears(rand(6, 16))->format('Y-m-d'),
                            'admission_date'    => '2026-01-08',
                            'guardian_name'     => $lastName . ' Guardian',
                            'guardian_phone'    => '+2547' . rand(10000000, 99999999),
                            'guardian_relation' => 'Parent',
                            'status'            => 'active',
                        ]
                    );
                }
            }
        }

        $this->command?->info("Seeded {$count} Kenyan learners cleanly across academic levels.");
    }
}