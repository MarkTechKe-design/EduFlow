<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('syllabi', function (Blueprint $table) {
            if (!Schema::hasColumn('syllabi', 'teacher_id')) {
                $table->unsignedBigInteger('teacher_id')->nullable()->after('subject_id');
                $table->foreign('teacher_id')->references('id')->on('staff')->nullOnDelete();
            }
            if (!Schema::hasColumn('syllabi', 'reviewed_by')) {
                $table->unsignedBigInteger('reviewed_by')->nullable()->after('status');
                $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
                $table->text('reviewer_feedback')->nullable()->after('reviewed_at');
                $table->foreign('reviewed_by')->references('id')->on('users')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('syllabi', function (Blueprint $table) {
            if (Schema::hasColumn('syllabi', 'reviewed_by')) {
                $table->dropForeign(['reviewed_by']);
                $table->dropColumn(['reviewed_by', 'reviewed_at', 'reviewer_feedback']);
            }
            if (Schema::hasColumn('syllabi', 'teacher_id')) {
                $table->dropForeign(['teacher_id']);
                $table->dropColumn('teacher_id');
            }
        });
    }
};