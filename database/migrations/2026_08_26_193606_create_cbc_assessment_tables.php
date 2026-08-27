<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('cbc_assessments')) {
            Schema::create('cbc_assessments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('academic_year_id')->nullable()->constrained()->nullOnDelete();
                $table->string('term', 20)->nullable();
                $table->foreignId('class_id')->nullable()->constrained('classes')->nullOnDelete();
                $table->foreignId('section_id')->nullable()->constrained('sections')->nullOnDelete();
                $table->foreignId('subject_id')->nullable()->constrained('subjects')->nullOnDelete();
                $table->string('title', 150);
                $table->string('type', 50)->default('formative_task');
                $table->date('assessment_date');
                $table->text('description')->nullable();
                $table->string('status', 30)->default('published');
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['school_id', 'assessment_date']);
                $table->index(['school_id', 'class_id']);
            });
        }

        if (!Schema::hasTable('assessment_strands')) {
            Schema::create('assessment_strands', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('cbc_assessment_id')->constrained('cbc_assessments')->cascadeOnDelete();
                $table->string('strand_name', 150);
                $table->string('sub_strand', 150)->nullable();
                $table->text('specific_learning_outcome')->nullable();
                $table->integer('sort_order')->default(1);
                $table->timestamps();

                $table->index(['school_id', 'cbc_assessment_id']);
            });
        }

        if (!Schema::hasTable('assessment_scores')) {
            Schema::create('assessment_scores', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('cbc_assessment_id')->constrained('cbc_assessments')->cascadeOnDelete();
                $table->foreignId('assessment_strand_id')->constrained('assessment_strands')->cascadeOnDelete();
                $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
                $table->string('performance_level', 10)->nullable(); // EE, ME, AE, BE
                $table->unsignedTinyInteger('numeric_score')->default(3); // 1 to 4
                $table->text('teacher_comments')->nullable();
                $table->timestamps();

                $table->unique(['cbc_assessment_id', 'assessment_strand_id', 'student_id'], 'cbc_strand_student_unique');
                $table->index(['school_id', 'student_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_scores');
        Schema::dropIfExists('assessment_strands');
        Schema::dropIfExists('cbc_assessments');
    }
};