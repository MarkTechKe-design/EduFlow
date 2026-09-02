<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teacher_duty_rosters', function (Blueprint $table) {
            if (!Schema::hasColumn('teacher_duty_rosters', 'term')) {
                $table->string('term', 50)->nullable()->after('academic_year_id');
            }
            if (!Schema::hasColumn('teacher_duty_rosters', 'week_number')) {
                $table->unsignedSmallInteger('week_number')->nullable()->after('term');
            }
        });

        Schema::table('teacher_duty_assignments', function (Blueprint $table) {
            if (!Schema::hasColumn('teacher_duty_assignments', 'replacement_scope')) {
                $table->string('replacement_scope', 50)->nullable()->default('full_week')->after('replacement_reason');
            }
            if (!Schema::hasColumn('teacher_duty_assignments', 'replacement_time_window')) {
                $table->string('replacement_time_window', 100)->nullable()->after('replacement_scope');
            }
        });
    }

    public function down(): void
    {
        Schema::table('teacher_duty_rosters', function (Blueprint $table) {
            $table->dropColumn(['term', 'week_number']);
        });

        Schema::table('teacher_duty_assignments', function (Blueprint $table) {
            $table->dropColumn(['replacement_scope', 'replacement_time_window']);
        });
    }
};