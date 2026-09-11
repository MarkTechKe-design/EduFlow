<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('admission_inquiries', function (Blueprint $table) {
            if (!Schema::hasColumn('admission_inquiries', 'preferred_contact_channel')) {
                $table->string('preferred_contact_channel', 30)->default('phone_call')->after('guardian_email');
            }
            if (!Schema::hasColumn('admission_inquiries', 'last_contact_channel')) {
                $table->string('last_contact_channel', 30)->nullable()->after('preferred_contact_channel');
            }
            if (!Schema::hasColumn('admission_inquiries', 'assigned_staff_id')) {
                $table->unsignedBigInteger('assigned_staff_id')->nullable()->after('converted_student_id');
                if (DB::getDriverName() !== 'sqlite') {
                    $table->foreign('assigned_staff_id')->references('id')->on('staff')->nullOnDelete();
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('admission_inquiries', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                if (Schema::hasColumn('admission_inquiries', 'assigned_staff_id')) {
                    try { $table->dropForeign(['assigned_staff_id']); } catch (\Throwable) {}
                }
            }
            if (Schema::hasColumn('admission_inquiries', 'assigned_staff_id')) {
                $table->dropColumn('assigned_staff_id');
            }
            $cols = ['preferred_contact_channel', 'last_contact_channel'];
            $existing = array_filter($cols, fn ($c) => Schema::hasColumn('admission_inquiries', $c));
            if (!empty($existing)) {
                $table->dropColumn($existing);
            }
        });
    }
};