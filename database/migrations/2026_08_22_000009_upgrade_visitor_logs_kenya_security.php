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
            if (!Schema::hasColumn('visitor_logs', 'id_number')) {
                $table->string('id_number', 50)->nullable()->after('phone');
            }
            if (!Schema::hasColumn('visitor_logs', 'vehicle_reg')) {
                $table->string('vehicle_reg', 30)->nullable()->after('id_number');
            }
            if (!Schema::hasColumn('visitor_logs', 'badge_number')) {
                $table->string('badge_number', 50)->nullable()->after('vehicle_reg');
            }
            if (!Schema::hasColumn('visitor_logs', 'category')) {
                $table->string('category', 50)->default('parent_inquiry')->after('purpose');
            }
            if (!Schema::hasColumn('visitor_logs', 'staff_id')) {
                $table->unsignedBigInteger('staff_id')->nullable()->after('person_to_meet');
                if (DB::getDriverName() !== 'sqlite') {
                    $table->foreign('staff_id')->references('id')->on('staff')->nullOnDelete();
                }
            }
            if (!Schema::hasColumn('visitor_logs', 'department_id')) {
                $table->unsignedBigInteger('department_id')->nullable()->after('staff_id');
                if (DB::getDriverName() !== 'sqlite') {
                    $table->foreign('department_id')->references('id')->on('departments')->nullOnDelete();
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('visitor_logs', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                if (Schema::hasColumn('visitor_logs', 'department_id')) {
                    try { $table->dropForeign(['department_id']); } catch (\Throwable) {}
                }
                if (Schema::hasColumn('visitor_logs', 'staff_id')) {
                    try { $table->dropForeign(['staff_id']); } catch (\Throwable) {}
                }
            }
            $cols = ['id_number', 'vehicle_reg', 'badge_number', 'category', 'staff_id', 'department_id'];
            $existing = array_filter($cols, fn ($c) => Schema::hasColumn('visitor_logs', $c));
            if (!empty($existing)) {
                $table->dropColumn($existing);
            }
        });
    }
};