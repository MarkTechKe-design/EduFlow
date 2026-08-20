<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            if (!Schema::hasColumn('packages', 'badge')) {
                $table->string('badge', 60)->nullable()->after('name');
            }
            if (!Schema::hasColumn('packages', 'is_popular')) {
                $table->boolean('is_popular')->default(false)->after('is_active');
            }
            if (!Schema::hasColumn('packages', 'is_public')) {
                $table->boolean('is_public')->default(true)->after('is_popular');
            }
            if (!Schema::hasColumn('packages', 'trial_days')) {
                $table->unsignedSmallInteger('trial_days')->default(14)->after('price_yearly');
            }
            if (!Schema::hasColumn('packages', 'sort_order')) {
                $table->unsignedSmallInteger('sort_order')->default(0)->after('storage_gb');
            }
        });
    }

    public function down(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            $table->dropColumn(['badge', 'is_popular', 'is_public', 'trial_days', 'sort_order']);
        });
    }
};