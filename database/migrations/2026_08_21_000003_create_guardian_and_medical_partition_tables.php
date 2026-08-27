<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Normalized Student-Guardian Pivot Table
        if (!Schema::hasTable('student_guardians')) {
            Schema::create('student_guardians', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
                $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
                $table->foreignId('guardian_id')->constrained('guardians')->cascadeOnDelete();
                $table->string('relationship_type', 50)->default('Father'); // Father, Mother, Legal Guardian, Sponsor, Other
                $table->boolean('is_primary')->default(true);
                $table->boolean('has_legal_custody')->default(true);
                $table->boolean('receives_sms_notifications')->default(true);
                $table->boolean('receives_report_cards')->default(true);
                $table->unsignedTinyInteger('emergency_priority')->default(1); // 1 = First Call, 2 = Second Call
                $table->timestamps();
                $table->softDeletes();

                $table->index(['school_id', 'student_id']);
                $table->index(['guardian_id', 'student_id']);
                $table->unique(['student_id', 'guardian_id']);
            });
        }

        // 2. Sensitive Medical Data Partition (ODPC Compliant)
        if (!Schema::hasTable('student_medical_profiles')) {
            Schema::create('student_medical_profiles', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
                $table->foreignId('student_id')->unique()->constrained('students')->cascadeOnDelete();
                $table->string('blood_group', 10)->nullable();
                $table->text('allergies')->nullable();
                $table->text('chronic_conditions')->nullable();
                $table->text('emergency_medication')->nullable();
                $table->text('dietary_restrictions')->nullable();
                $table->string('sha_nhif_no', 50)->nullable(); // Social Health Authority / NHIF
                $table->string('preferred_hospital', 150)->nullable();
                $table->string('doctor_name', 100)->nullable();
                $table->string('doctor_phone', 50)->nullable();
                $table->text('special_instructions')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['school_id', 'student_id']);
            });
        }

        // 3. Data Backfill Strategy: Normalize existing student guardian & medical records
        $students = DB::table('students')->get();
        $now = now();

        foreach ($students as $student) {
            $guardianId = $student->guardian_id;

            // If guardian record doesn't exist, create a normalized Guardian row
            if (!$guardianId && (!empty($student->guardian_name) || !empty($student->guardian_phone))) {
                $guardianId = DB::table('guardians')->insertGetId([
                    'school_id'   => $student->school_id,
                    'name'        => $student->guardian_name ?: 'Guardian of ' . ($student->first_name ?? 'Student'),
                    'relation'    => $student->guardian_relation ?: 'Parent',
                    'phone'       => $student->guardian_phone ?: $student->phone,
                    'email'       => $student->email ?? null,
                    'address'     => $student->address ?? null,
                    'created_at'  => $now,
                    'updated_at'  => $now,
                ]);

                // Update master pointer
                DB::table('students')->where('id', $student->id)->update(['guardian_id' => $guardianId]);
            }

            // Create normalized StudentGuardian relationship row
            if ($guardianId) {
                $exists = DB::table('student_guardians')
                    ->where('student_id', $student->id)
                    ->where('guardian_id', $guardianId)
                    ->exists();

                if (!$exists) {
                    DB::table('student_guardians')->insert([
                        'school_id'                  => $student->school_id,
                        'student_id'                 => $student->id,
                        'guardian_id'                => $guardianId,
                        'relationship_type'          => $student->guardian_relation ?: 'Parent',
                        'is_primary'                 => true,
                        'has_legal_custody'          => true,
                        'receives_sms_notifications' => true,
                        'receives_report_cards'      => true,
                        'emergency_priority'         => 1,
                        'created_at'                 => $now,
                        'updated_at'                 => $now,
                    ]);
                }
            }

            // Create baseline medical profile if any medical information exists
            if (!empty($student->blood_group) || !empty($student->medical_info)) {
                $hasMed = DB::table('student_medical_profiles')->where('student_id', $student->id)->exists();
                if (!$hasMed) {
                    DB::table('student_medical_profiles')->insert([
                        'school_id'            => $student->school_id,
                        'student_id'           => $student->id,
                        'blood_group'          => $student->blood_group ?? null,
                        'special_instructions' => $student->medical_info ?? null,
                        'created_at'           => $now,
                        'updated_at'           => $now,
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('student_medical_profiles');
        Schema::dropIfExists('student_guardians');
    }
};