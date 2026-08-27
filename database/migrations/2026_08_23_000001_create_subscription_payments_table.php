<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // subscription_payments is created by the SaaS foundation migration.
        // Add the tenant key additively and backfill existing rows.
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

        Schema::table('subscription_payments', function (Blueprint $table): void {
            $table->unsignedBigInteger('school_id')->nullable(false)->change();
            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
        });

        try {
            Schema::table('subscription_payments', function (Blueprint $table): void {
                $table->index(['school_id', 'status'], 'subscription_payments_school_status_index');
            });
        } catch (\Throwable) {
            // Existing installations may already have an equivalent index.
        }
    }

    public function down(): void
    {
        Schema::table('subscription_payments', function (Blueprint $table): void {
            try {
                $table->dropForeign(['school_id']);
            } catch (\Throwable) {
            }

            try {
                $table->dropIndex('subscription_payments_school_status_index');
            } catch (\Throwable) {
            }

            $table->dropColumn('school_id');
        });
    }
};