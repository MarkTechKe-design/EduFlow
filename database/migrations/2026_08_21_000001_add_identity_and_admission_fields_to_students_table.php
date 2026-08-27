<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'middle_name')) {
                $table->string('middle_name', 100)->nullable()->after('first_name');
            }
            if (!Schema::hasColumn('students', 'birth_certificate_no')) {
                $table->string('birth_certificate_no', 50)->nullable()->after('nationality');
            }
            if (!Schema::hasColumn('students', 'admission_type')) {
                $table->string('admission_type', 50)->default('new')->after('admission_date');
            }
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['middle_name', 'birth_certificate_no', 'admission_type']);
        });
    }
};