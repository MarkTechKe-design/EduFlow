<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class ParentStudentSyncSeeder extends Seeder
{
    public function run(): void
    {
        $schools = DB::table('schools')->get();

        foreach ($schools as $school) {
            $parentUser = User::withoutGlobalScopes()
                ->where('school_id', $school->id)
                ->where('email', 'like', 'parent%')
                ->first();

            if (!$parentUser) {
                continue;
            }

            $guardian = DB::table('guardians')
                ->where('school_id', $school->id)
                ->where('email', $parentUser->email)
                ->first();

            if (!$guardian) {
                $guardianId = DB::table('guardians')->insertGetId([
                    'school_id'  => $school->id,
                    'user_id'    => $parentUser->id,
                    'name'       => $parentUser->name ?? 'Parent Demo',
                    'email'      => $parentUser->email,
                    'phone'      => '+254700000099',
                    'relation'   => 'Father',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                DB::table('guardians')
                    ->where('id', $guardian->id)
                    ->update(['user_id' => $parentUser->id]);
                $guardianId = $guardian->id;
            }

            // Link existing students in this school to this guardian if unlinked
            $students = DB::table('students')
                ->where('school_id', $school->id)
                ->get();

            foreach ($students as $student) {
                $hasPivot = DB::table('guardian_student')
                    ->where('guardian_id', $guardianId)
                    ->where('student_id', $student->id)
                    ->exists();

                if (!$hasPivot) {
                    DB::table('guardian_student')->insert([
                        'guardian_id' => $guardianId,
                        'student_id'  => $student->id,
                        'created_at'  => now(),
                        'updated_at'  => now(),
                    ]);
                }
            }
        }
    }
}