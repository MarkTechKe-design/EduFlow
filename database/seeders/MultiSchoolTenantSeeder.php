<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;
use App\Models\School;
use App\Models\User;
use Spatie\Permission\Models\Role;

class MultiSchoolTenantSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // 1. Seed / Sync 3 Distinct Schools using verified 'slug' key
        $schoolsConfig = [
            [
                'slug'         => 'greenfield-academy',
                'name'         => 'Greenfield Academy',
                'email'        => 'info@greenfield.edu',
                'phone'        => '+254711000001',
                'address'      => 'Kilimani, Argwings Kodhek Rd',
                'city'         => 'Nairobi',
                'county'       => 'Nairobi',
                'country'      => 'Kenya',
                'currency'     => 'KES',
                'curriculum'   => 'CBC',
                'status'       => 'active',
            ],
            [
                'slug'         => 'st-austin-high',
                'name'         => 'St. Austin High School',
                'email'        => 'info@staustin.ac.ke',
                'phone'        => '+254711000002',
                'address'      => 'James Gichuru Rd, Lavington',
                'city'         => 'Nairobi',
                'county'       => 'Nairobi',
                'country'      => 'Kenya',
                'currency'     => 'KES',
                'curriculum'   => '8-4-4',
                'status'       => 'active',
            ],
            [
                'slug'         => 'nairobi-premier',
                'name'         => 'Nairobi Premier Academy',
                'email'        => 'info@nairobipremier.ac.ke',
                'phone'        => '+254711000003',
                'address'      => 'Peponi Road, Westlands',
                'city'         => 'Nairobi',
                'county'       => 'Nairobi',
                'country'      => 'Kenya',
                'currency'     => 'KES',
                'curriculum'   => 'Dual (CBC & IGCSE)',
                'status'       => 'active',
            ],
        ];

        $schools = [];
        foreach ($schoolsConfig as $cfg) {
            $slug = $cfg['slug'];
            $school = School::withoutGlobalScopes()->updateOrCreate(
                ['slug' => $slug],
                $cfg
            );
            $schools[$slug] = $school;
        }

        $this->command->info('Configured 3 distinct schools (Greenfield, St. Austin, Nairobi Premier).');

        // 2. Ensure Current Academic Year exists for each school
        foreach ($schools as $school) {
            $yearExists = DB::table('academic_years')
                ->where('school_id', $school->id)
                ->where('is_current', 1)
                ->first();

            if (!$yearExists) {
                DB::table('academic_years')->insert([
                    'school_id'  => $school->id,
                    'name'       => '2026',
                    'start_date' => '2026-01-05',
                    'end_date'   => '2026-11-27',
                    'is_current' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        // 3. Provision Verified Accounts for all 3 schools
        $accounts = [
            // School 1 (Greenfield Academy - CBC Primary/Junior Secondary)
            ['name' => 'Greenfield Admin', 'email' => 'school-admin@eduflow.test', 'role' => 'school-admin', 'school' => 'greenfield-academy'],
            ['name' => 'Greenfield Principal', 'email' => 'principal@eduflow.test', 'role' => 'principal', 'school' => 'greenfield-academy'],
            ['name' => 'Greenfield Teacher', 'email' => 'teacher@eduflow.test', 'role' => 'teacher', 'school' => 'greenfield-academy'],
            ['name' => 'Greenfield Accountant', 'email' => 'accountant@eduflow.test', 'role' => 'accountant', 'school' => 'greenfield-academy'],
            ['name' => 'Greenfield Librarian', 'email' => 'librarian@eduflow.test', 'role' => 'librarian', 'school' => 'greenfield-academy'],
            ['name' => 'Greenfield Parent', 'email' => 'parent@eduflow.test', 'role' => 'parent', 'school' => 'greenfield-academy'],
            ['name' => 'Greenfield Student', 'email' => 'student@eduflow.test', 'role' => 'student', 'school' => 'greenfield-academy'],

            // School 2 (St. Austin High - 8-4-4 Boarding High School)
            ['name' => 'St. Austin Admin', 'email' => 'admin.staustin@eduflow.test', 'role' => 'school-admin', 'school' => 'st-austin-high'],
            ['name' => 'St. Austin Principal', 'email' => 'principal.staustin@eduflow.test', 'role' => 'principal', 'school' => 'st-austin-high'],
            ['name' => 'St. Austin Teacher', 'email' => 'teacher.staustin@eduflow.test', 'role' => 'teacher', 'school' => 'st-austin-high'],
            ['name' => 'St. Austin Accountant', 'email' => 'accountant.staustin@eduflow.test', 'role' => 'accountant', 'school' => 'st-austin-high'],
            ['name' => 'St. Austin Librarian', 'email' => 'librarian.staustin@eduflow.test', 'role' => 'librarian', 'school' => 'st-austin-high'],
            ['name' => 'St. Austin Parent', 'email' => 'parent.staustin@eduflow.test', 'role' => 'parent', 'school' => 'st-austin-high'],
            ['name' => 'St. Austin Student', 'email' => 'student.staustin@eduflow.test', 'role' => 'student', 'school' => 'st-austin-high'],

            // School 3 (Nairobi Premier Academy - Dual Track Day/Boarding)
            ['name' => 'Premier Admin', 'email' => 'admin.premier@eduflow.test', 'role' => 'school-admin', 'school' => 'nairobi-premier'],
            ['name' => 'Premier Principal', 'email' => 'principal.premier@eduflow.test', 'role' => 'principal', 'school' => 'nairobi-premier'],
            ['name' => 'Premier Teacher', 'email' => 'teacher.premier@eduflow.test', 'role' => 'teacher', 'school' => 'nairobi-premier'],
            ['name' => 'Premier Accountant', 'email' => 'accountant.premier@eduflow.test', 'role' => 'accountant', 'school' => 'nairobi-premier'],
            ['name' => 'Premier Librarian', 'email' => 'librarian.premier@eduflow.test', 'role' => 'librarian', 'school' => 'nairobi-premier'],
            ['name' => 'Premier Parent', 'email' => 'parent.premier@eduflow.test', 'role' => 'parent', 'school' => 'nairobi-premier'],
            ['name' => 'Premier Student', 'email' => 'student.premier@eduflow.test', 'role' => 'student', 'school' => 'nairobi-premier'],
        ];

        foreach ($accounts as $acc) {
            $sch = $schools[$acc['school']];
            $user = User::withoutGlobalScopes()->updateOrCreate(
                ['email' => $acc['email']],
                [
                    'name'              => $acc['name'],
                    'school_id'         => $sch->id,
                    'password'          => Hash::make('password'),
                    'status'            => 'active',
                    'email_verified_at' => $now,
                ]
            );

            $role = Role::firstOrCreate(['name' => $acc['role'], 'guard_name' => 'web']);
            $user->syncRoles([$role]);
        }

        // Direct DB update to enforce verified status across all user rows
        DB::table('users')->whereNull('email_verified_at')->update([
            'email_verified_at' => $now,
            'updated_at'        => $now,
        ]);

        $this->command->info('Provisioned all 21 verified multi-tenant demo user accounts.');
    }
}