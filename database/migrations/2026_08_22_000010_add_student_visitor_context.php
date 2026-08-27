<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visitor_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('visitor_logs', 'target_type')) {
                $table->string('target_type', 30)->default('staff')->after('category'); // 'student', 'staff', 'department', 'admission_inquiry'
            }
            if (!Schema::hasColumn('visitor_logs', 'student_id')) {
                $table->unsignedBigInteger('student_id')->nullable()->after('target_type');
                $table->foreign('student_id')->references('id')->on('students')->nullOnDelete();
            }
            if (!Schema::hasColumn('visitor_logs', 'relationship_to_student')) {
                $table->string('relationship_to_student', 50)->nullable()->after('student_id'); // Parent, Mother, Father, Guardian, Sibling, Relative
            }
        });
    }

    public function down(): void
    {
        Schema::table('visitor_logs', function (Blueprint $table) {
            if (Schema::hasColumn('visitor_logs', 'student_id')) {
                $table->dropForeign(['student_id']);
                $table->dropColumn(['student_id', 'target_type', 'relationship_to_student']);
            }
        });
    }
};