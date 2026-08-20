<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add missing Kenyan student columns safely without after() clauses
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'photo')) {
                $table->string('photo', 255)->nullable();
            }
            if (!Schema::hasColumn('students', 'nemis_upi')) {
                $table->string('nemis_upi', 30)->nullable();
            }
            if (!Schema::hasColumn('students', 'assessment_no')) {
                $table->string('assessment_no', 30)->nullable();
            }
            if (!Schema::hasColumn('students', 'guardian_name')) {
                $table->string('guardian_name', 150)->nullable();
            }
            if (!Schema::hasColumn('students', 'guardian_phone')) {
                $table->string('guardian_phone', 30)->nullable();
            }
            if (!Schema::hasColumn('students', 'guardian_relation')) {
                $table->string('guardian_relation', 50)->nullable();
            }
            if (!Schema::hasColumn('students', 'phone')) {
                $table->string('phone', 30)->nullable();
            }
            if (!Schema::hasColumn('students', 'email')) {
                $table->string('email', 150)->nullable();
            }
            if (!Schema::hasColumn('students', 'address')) {
                $table->string('address', 255)->nullable();
            }
            if (!Schema::hasColumn('students', 'emergency_contact')) {
                $table->string('emergency_contact', 100)->nullable();
            }
            if (!Schema::hasColumn('students', 'medical_info')) {
                $table->text('medical_info')->nullable();
            }
            if (!Schema::hasColumn('students', 'previous_school')) {
                $table->string('previous_school', 150)->nullable();
            }
        });

        // 2. Create student_documents table
        if (!Schema::hasTable('student_documents')) {
            Schema::create('student_documents', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('student_id')->constrained()->cascadeOnDelete();
                $table->string('title', 150);
                $table->string('document_type', 50)->default('other');
                $table->string('file_path', 255);
                $table->string('file_name', 255);
                $table->unsignedBigInteger('file_size')->default(0);
                $table->string('mime_type', 100)->nullable();
                $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['school_id', 'student_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('student_documents');
        Schema::table('students', function (Blueprint $table) {
            $cols = [
                'photo', 'nemis_upi', 'assessment_no', 'guardian_name', 'guardian_phone',
                'guardian_relation', 'phone', 'email', 'address', 'emergency_contact',
                'medical_info', 'previous_school'
            ];
            foreach ($cols as $col) {
                if (Schema::hasColumn('students', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};