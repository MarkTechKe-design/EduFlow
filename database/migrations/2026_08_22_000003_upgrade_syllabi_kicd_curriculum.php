<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('syllabi', function (Blueprint $table) {
            if (!Schema::hasColumn('syllabi', 'term')) {
                $table->string('term', 20)->default('Term 1')->after('academic_year');
            }
            if (!Schema::hasColumn('syllabi', 'curriculum_type')) {
                $table->string('curriculum_type', 30)->default('CBC')->after('term');
            }
            if (!Schema::hasColumn('syllabi', 'strands')) {
                $table->json('strands')->nullable()->after('topics');
            }
            if (!Schema::hasColumn('syllabi', 'total_lessons_planned')) {
                $table->unsignedInteger('total_lessons_planned')->default(0)->after('completion_percent');
            }
            if (!Schema::hasColumn('syllabi', 'total_lessons_taught')) {
                $table->unsignedInteger('total_lessons_taught')->default(0)->after('total_lessons_planned');
            }
            if (!Schema::hasColumn('syllabi', 'status')) {
                $table->string('status', 30)->default('in_progress')->after('total_lessons_taught');
            }
        });
    }

    public function down(): void
    {
        Schema::table('syllabi', function (Blueprint $table) {
            $cols = ['term', 'curriculum_type', 'strands', 'total_lessons_planned', 'total_lessons_taught', 'status'];
            $existing = array_filter($cols, fn ($c) => Schema::hasColumn('syllabi', $c));
            if (!empty($existing)) {
                $table->dropColumn($existing);
            }
        });
    }
};