<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('subscription_payments', 'school_id')) {
            Schema::table('subscription_payments', function (Blueprint $table): void {
                $table->foreignId('school_id')->nullable()->after('id');
            });
        }

        DB::table('subscription_payments')
            ->whereNull('school_id')
            ->orderBy('id')
            ->get(['id', 'school_subscription_id'])
            ->each(function (object $payment): void {
                $schoolId = DB::table('school_subscriptions')
                    ->where('id', $payment->school_subscription_id)
                    ->value('school_id');

                if ($schoolId !== null) {
                    DB::table('subscription_payments')
                        ->where('id', $payment->id)
                        ->update(['school_id' => $schoolId]);
                }
            });

        // Only enforce strict foreign key alter on MySQL / Postgres; SQLite does not support modifying existing columns with constraints
        if (DB::getDriverName() !== 'sqlite') {
            try {
                Schema::table('subscription_payments', function (Blueprint $table): void {
                    $table->unsignedBigInteger('school_id')->nullable(false)->change();
                    $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
                });
            } catch (\Throwable) {}
        }

        try {
            Schema::table('subscription_payments', function (Blueprint $table): void {
                $table->index(['school_id', 'status'], 'subscription_payments_school_status_index');
            });
        } catch (\Throwable) {}
    }

    public function down(): void
    {
        Schema::table('subscription_payments', function (Blueprint $table): void {
            if (DB::getDriverName() !== 'sqlite') {
                try {
                    $table->dropForeign(['school_id']);
                } catch (\Throwable) {}
            }

            try {
                $table->dropIndex('subscription_payments_school_status_index');
            } catch (\Throwable) {}

            $table->dropColumn('school_id');
        });
    }
};