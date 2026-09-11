<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visitor_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('visitor_logs', 'student_id')) {
                $table->unsignedBigInteger('student_id')->nullable()->after('department_id');
                if (DB::getDriverName() !== 'sqlite') {
                    $table->foreign('student_id')->references('id')->on('students')->nullOnDelete();
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('visitor_logs', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                if (Schema::hasColumn('visitor_logs', 'student_id')) {
                    try { $table->dropForeign(['student_id']); } catch (\Throwable) {}
                }
            }
            if (Schema::hasColumn('visitor_logs', 'student_id')) {
                $table->dropColumn('student_id');
            }
        });
    }
};