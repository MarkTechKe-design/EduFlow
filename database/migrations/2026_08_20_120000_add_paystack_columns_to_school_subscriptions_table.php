<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('school_subscriptions', function (Blueprint $table) {
            if (!Schema::hasColumn('school_subscriptions', 'billing_cycle')) {
                $table->string('billing_cycle', 20)->default('monthly')->after('package_id');
            }
            if (!Schema::hasColumn('school_subscriptions', 'paystack_customer_code')) {
                $table->string('paystack_customer_code', 100)->nullable()->after('payment_method');
            }
            if (!Schema::hasColumn('school_subscriptions', 'paystack_authorization_code')) {
                $table->string('paystack_authorization_code', 100)->nullable()->after('paystack_customer_code');
            }
            if (!Schema::hasColumn('school_subscriptions', 'card_last4')) {
                $table->string('card_last4', 10)->nullable()->after('paystack_authorization_code');
            }
            if (!Schema::hasColumn('school_subscriptions', 'card_brand')) {
                $table->string('card_brand', 30)->nullable()->after('card_last4');
            }
            if (!Schema::hasColumn('school_subscriptions', 'card_exp_month')) {
                $table->string('card_exp_month', 5)->nullable()->after('card_brand');
            }
            if (!Schema::hasColumn('school_subscriptions', 'card_exp_year')) {
                $table->string('card_exp_year', 5)->nullable()->after('card_exp_month');
            }
        });
    }

    public function down(): void
    {
        Schema::table('school_subscriptions', function (Blueprint $table) {
            $cols = ['billing_cycle', 'paystack_customer_code', 'paystack_authorization_code', 'card_last4', 'card_brand', 'card_exp_month', 'card_exp_year'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('school_subscriptions', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};