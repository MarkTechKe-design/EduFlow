<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('fee_payments') && Schema::hasColumn('fee_payments', 'fee_structure_id')) {
            Schema::table('fee_payments', function (Blueprint $table) {
                $table->foreignId('fee_structure_id')->nullable()->change();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('fee_payments') && Schema::hasColumn('fee_payments', 'fee_structure_id')) {
            Schema::table('fee_payments', function (Blueprint $table) {
                $table->foreignId('fee_structure_id')->nullable(false)->change();
            });
        }
    }
};