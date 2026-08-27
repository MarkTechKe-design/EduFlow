<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('student_enrollments')) {
            Schema::create('student_enrollments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
                $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
                $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->nullOnDelete();
                $table->string('academic_year', 20)->default('2026');
                $table->string('term', 20)->default('Term 1');
                $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
                $table->foreignId('section_id')->nullable()->constrained('sections')->nullOnDelete();
                $table->string('roll_no', 50)->nullable();
                $table->string('status', 30)->default('active'); // active, promoted, repeated, transferred_out, completed
                $table->date('start_date')->nullable();
                $table->date('end_date')->nullable();
                $table->text('remarks')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['school_id', 'academic_year_id', 'class_id']);
                $table->index(['student_id', 'status']);
            });
        }

        // Backfill existing active students into baseline enrollments
        $currentYear = DB::table('academic_years')->where('is_current', 1)->first()
            ?? DB::table('academic_years')->orderByDesc('id')->first();

        $students = DB::table('students')->whereNotNull('class_id')->get();

        $now = now();
        $recordsToInsert = [];

        foreach ($students as $student) {
            $exists = DB::table('student_enrollments')
                ->where('student_id', $student->id)
                ->where('school_id', $student->school_id)
                ->where('class_id', $student->class_id)
                ->exists();

            if (!$exists) {
                $recordsToInsert[] = [
                    'school_id'        => $student->school_id,
                    'student_id'       => $student->id,
                    'academic_year_id' => $currentYear ? $currentYear->id : null,
                    'academic_year'    => $currentYear ? ($currentYear->name ?? '2026') : '2026',
                    'term'             => 'Term 1',
                    'class_id'         => $student->class_id,
                    'section_id'       => $student->section_id,
                    'roll_no'          => $student->roll_no ?? null,
                    'status'           => strtolower($student->status ?? 'active') === 'active' ? 'active' : 'transferred_out',
                    'start_date'       => $student->admission_date ?? $now->toDateString(),
                    'created_at'       => $now,
                    'updated_at'       => $now,
                ];
            }
        }

        if (!empty($recordsToInsert)) {
            foreach (array_chunk($recordsToInsert, 100) as $chunk) {
                DB::table('student_enrollments')->insert($chunk);
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('student_enrollments');
    }
};