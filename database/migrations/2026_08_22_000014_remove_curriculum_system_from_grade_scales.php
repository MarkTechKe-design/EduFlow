<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grade_scales', function (Blueprint $table) {
            if (Schema::hasColumn('grade_scales', 'curriculum_system')) {
                $table->dropColumn('curriculum_system');
            }
        });
    }

    public function down(): void
    {
        Schema::table('grade_scales', function (Blueprint $table) {
            if (!Schema::hasColumn('grade_scales', 'curriculum_system')) {
                $table->enum('curriculum_system', ['844', 'cbc'])->default('844')->after('school_id');
            }
        });
    }
};