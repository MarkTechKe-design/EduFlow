<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('visitor_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('visitor_logs', 'id_number')) {
                $table->string('id_number', 50)->nullable()->after('phone'); // Kenyan National ID / Passport No
            }
            if (!Schema::hasColumn('visitor_logs', 'vehicle_reg')) {
                $table->string('vehicle_reg', 30)->nullable()->after('id_number'); // e.g. KDA 421B or Pedestrian
            }
            if (!Schema::hasColumn('visitor_logs', 'badge_number')) {
                $table->string('badge_number', 50)->nullable()->after('vehicle_reg'); // Visitor Pass / Tag No
            }
            if (!Schema::hasColumn('visitor_logs', 'category')) {
                $table->string('category', 50)->default('parent_inquiry')->after('purpose'); // parent_inquiry, moe_qaso, supplier, official_meeting, maintenance, guest
            }
            if (!Schema::hasColumn('visitor_logs', 'staff_id')) {
                $table->unsignedBigInteger('staff_id')->nullable()->after('person_to_meet');
                $table->foreign('staff_id')->references('id')->on('staff')->nullOnDelete();
            }
            if (!Schema::hasColumn('visitor_logs', 'department_id')) {
                $table->unsignedBigInteger('department_id')->nullable()->after('staff_id');
                $table->foreign('department_id')->references('id')->on('departments')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('visitor_logs', function (Blueprint $table) {
            if (Schema::hasColumn('visitor_logs', 'department_id')) {
                $table->dropForeign(['department_id']);
                $table->dropColumn('department_id');
            }
            if (Schema::hasColumn('visitor_logs', 'staff_id')) {
                $table->dropForeign(['staff_id']);
                $table->dropColumn('staff_id');
            }
            $cols = ['id_number', 'vehicle_reg', 'badge_number', 'category'];
            $existing = array_filter($cols, fn ($c) => Schema::hasColumn('visitor_logs', $c));
            if (!empty($existing)) {
                $table->dropColumn($existing);
            }
        });
    }
};