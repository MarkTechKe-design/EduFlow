<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lesson_plans', function (Blueprint $table) {
            if (!Schema::hasColumn('lesson_plans', 'term')) {
                $table->string('term', 20)->default('Term 2')->after('subject_id');
            }
            if (!Schema::hasColumn('lesson_plans', 'strand')) {
                $table->string('strand', 255)->nullable()->after('title');
            }
            if (!Schema::hasColumn('lesson_plans', 'sub_strand')) {
                $table->string('sub_strand', 255)->nullable()->after('strand');
            }
            if (!Schema::hasColumn('lesson_plans', 'core_competencies')) {
                $table->json('core_competencies')->nullable()->after('objectives');
            }
            if (!Schema::hasColumn('lesson_plans', 'values_addressed')) {
                $table->json('values_addressed')->nullable()->after('core_competencies');
            }
            if (!Schema::hasColumn('lesson_plans', 'pcis')) {
                $table->string('pcis', 255)->nullable()->after('values_addressed'); // Pertinent & Contemporary Issues
            }
            if (!Schema::hasColumn('lesson_plans', 'lesson_duration_mins')) {
                $table->unsignedInteger('lesson_duration_mins')->default(40)->after('week_start');
            }
            if (!Schema::hasColumn('lesson_plans', 'teacher_reflection')) {
                $table->text('teacher_reflection')->nullable()->after('reviewer_feedback');
            }
        });
    }

    public function down(): void
    {
        Schema::table('lesson_plans', function (Blueprint $table) {
            $cols = ['term', 'strand', 'sub_strand', 'core_competencies', 'values_addressed', 'pcis', 'lesson_duration_mins', 'teacher_reflection'];
            $existing = array_filter($cols, fn ($c) => Schema::hasColumn('lesson_plans', $c));
            if (!empty($existing)) {
                $table->dropColumn($existing);
            }
        });
    }
};