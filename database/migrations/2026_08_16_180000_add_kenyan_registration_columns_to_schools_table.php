<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            if (!Schema::hasColumn('schools', 'county')) {
                $table->string('county', 60)->nullable()->after('city');
            }
            if (!Schema::hasColumn('schools', 'sub_county')) {
                $table->string('sub_county', 60)->nullable()->after('county');
            }
            if (!Schema::hasColumn('schools', 'knec_code')) {
                $table->string('knec_code', 30)->nullable()->after('curriculum');
            }
            if (!Schema::hasColumn('schools', 'registration_number')) {
                $table->string('registration_number', 60)->nullable()->after('knec_code');
            }
        });
    }

    public function down(): void
    {
        Schema::table('schools', function (Blueprint $table) {
            $columnsToDrop = [];
            foreach (['county', 'sub_county', 'knec_code', 'registration_number'] as $col) {
                if (Schema::hasColumn('schools', $col)) {
                    $columnsToDrop[] = $col;
                }
            }
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};