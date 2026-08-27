<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('teacher_assignments')) {
            Schema::create('teacher_assignments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('staff_id')->constrained('staff')->cascadeOnDelete();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
                $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
                $table->foreignId('section_id')->nullable()->constrained('sections')->nullOnDelete();
                $table->foreignId('subject_id')->nullable()->constrained('subjects')->nullOnDelete();
                $table->string('assignment_type', 50)->default('subject_teacher');
                $table->string('term', 20)->nullable();
                $table->date('start_date');
                $table->date('end_date')->nullable();
                $table->string('status', 30)->default('active');
                $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
                $table->text('remarks')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['school_id', 'academic_year_id', 'status'], 'ta_school_year_status_idx');
                $table->index(['school_id', 'staff_id'], 'ta_school_staff_idx');
                $table->index(['school_id', 'class_id', 'section_id'], 'ta_school_class_sec_idx');
                $table->index(['school_id', 'subject_id'], 'ta_school_subj_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_assignments');
    }
};