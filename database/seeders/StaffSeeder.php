<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\School;
use App\Models\Department;
use App\Models\Designation;
use App\Models\Staff;
use Illuminate\Support\Facades\Schema;
use Carbon\Carbon;

class StaffSeeder extends Seeder
{
    private array $firstNames = [
        'Brian', 'Kevin', 'Dennis', 'Victor', 'Evans', 'Emmanuel', 'David', 'Ian', 'Samuel', 'Kelvin',
        'Faith', 'Grace', 'Mercy', 'Joy', 'Brenda', 'Sharon', 'Zawadi', 'Vivian', 'Esther', 'Cynthia',
        'Collins', 'Derrick', 'Ezra', 'Felix', 'Titus', 'Dominic', 'Maureen', 'Daisy', 'Sheila', 'Yvonne',
    ];

    private array $lastNames = [
        'Mwangi', 'Ochieng', 'Wanjiku', 'Kiprop', 'Otieno', 'Mutua', 'Cheruiyot', 'Kamau', 'Maina', 'Odhiambo',
        'Kariuki', 'Kimani', 'Njoroge', 'Barasa', 'Wafula', 'Nyambura', 'Wambui', 'Chepkirui', 'Korir', 'Rotich',
        'Omwamba', 'Mogaka', 'Mwendwa', 'Musyoka', 'Nekesa', 'Achieng', 'Chebet', 'Hassan', 'Mohammed', 'Omar',
    ];

    public function run(): void
    {
        $school = School::withoutGlobalScopes()->first();
        if (!$school) {
            $this->command->warn('No school found. Run DemoUserSeeder first.');
            return;
        }

        $sid = $school->id;

        // 1. Seed Departments (Bypassing Global Scopes & Soft Deletes)
        $deptNames = [
            'Languages & Humanities',
            'Science & Mathematics',
            'Technical & Applied Studies',
            'Administration',
            'Support Staff',
        ];

        $departments = collect();
        foreach ($deptNames as $name) {
            $dept = Department::withoutGlobalScopes()
                ->where('school_id', $sid)
                ->where('name', $name)
                ->first();

            if (!$dept) {
                $dept = Department::create([
                    'school_id' => $sid,
                    'name'      => $name,
                ]);
            }
            $departments->push($dept);
        }

        // 2. Seed Designations
        $desigMap = [
            'Languages & Humanities'      => ['Senior Teacher I', 'Subject Teacher (English/Kiswahili)', 'HOD Languages'],
            'Science & Mathematics'       => ['Senior Teacher II', 'Subject Teacher (Maths/Science)', 'HOD Sciences'],
            'Technical & Applied Studies' => ['Subject Teacher (Pre-Tech/Agri)', 'Creative Arts Instructor'],
            'Administration'              => ['Bursar / Accountant', 'School Secretary', 'Senior Administrator'],
            'Support Staff'               => ['Librarian', 'Lab Technician', 'Transport Officer'],
        ];

        $designations = collect();
        foreach ($departments as $dept) {
            $titles = $desigMap[$dept->name] ?? ['Staff Member'];
            foreach ($titles as $title) {
                $desig = Designation::withoutGlobalScopes()
                    ->where('school_id', $sid)
                    ->where('department_id', $dept->id)
                    ->where('name', $title)
                    ->first();

                if (!$desig) {
                    $desig = Designation::create([
                        'school_id'     => $sid,
                        'department_id' => $dept->id,
                        'name'          => $title,
                    ]);
                }
                $designations->push($desig);
            }
        }

        $hasEmployeeId = Schema::hasColumn('staff', 'employee_id');
        $hasStaffId    = Schema::hasColumn('staff', 'staff_id');
        $hasPhone      = Schema::hasColumn('staff', 'phone');
        $hasEmail      = Schema::hasColumn('staff', 'email');
        $hasSalary     = Schema::hasColumn('staff', 'salary');
        $hasGender     = Schema::hasColumn('staff', 'gender');
        $hasJoining    = Schema::hasColumn('staff', 'joining_date');
        $hasStatus     = Schema::hasColumn('staff', 'status');

        $totalStaff = 18;
        for ($i = 0; $i < $totalStaff; $i++) {
            $firstName = $this->firstNames[$i % count($this->firstNames)];
            $lastName  = $this->lastNames[$i % count($this->lastNames)];
            $gender    = ($i % 2 === 0) ? 'male' : 'female';
            $desig     = $designations[$i % $designations->count()];
            $joining   = Carbon::now()->subMonths(rand(3, 36))->format('Y-m-d');
            $empCode   = 'EMP-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT);
            $email     = strtolower($firstName) . '.' . strtolower($lastName) . ($i + 1) . '@school.ac.ke';

            $data = [
                'department_id'  => $desig->department_id,
                'designation_id' => $desig->id,
                'first_name'     => $firstName,
                'last_name'      => $lastName,
            ];

            if ($hasEmployeeId) $data['employee_id']  = $empCode;
            if ($hasStaffId)    $data['staff_id']     = 'STF-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT);
            if ($hasGender)     $data['gender']       = $gender;
            if ($hasPhone)      $data['phone']        = '+2547' . rand(10000000, 99999999);
            if ($hasEmail)      $data['email']        = $email;
            if ($hasJoining)    $data['joining_date'] = $joining;
            if ($hasSalary)     $data['salary']       = rand(30000, 85000);
            if ($hasStatus)     $data['status']       = 'active';

            Staff::withoutGlobalScopes()->updateOrCreate(
                [
                    'school_id' => $sid,
                    'first_name' => $firstName,
                    'last_name'  => $lastName,
                ],
                $data
            );
        }

        $this->command->info("Seeded {$totalStaff} Kenyan staff records cleanly.");
    }
}