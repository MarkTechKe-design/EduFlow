<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('schools', function (Blueprint $table): void {
            $table->string('curriculum', 30)->default('cbc')->after('language');
            $table->timestamp('terms_accepted_at')->nullable()->after('curriculum');
            $table->timestamp('onboarding_completed_at')->nullable()->after('terms_accepted_at');
        });
        Schema::table('packages', function (Blueprint $table): void {
            $table->json('limits')->nullable()->after('features');
            $table->unsignedSmallInteger('trial_days')->default(14)->after('limits');
            $table->boolean('is_public')->default(true)->after('is_active');
        });
        Schema::table('school_subscriptions', function (Blueprint $table): void {
            $table->string('lifecycle_status', 30)->default('trial')->after('status')->index();
            $table->dateTime('grace_period_ends_at')->nullable()->after('trial_ends_at');
            $table->dateTime('renewal_at')->nullable()->after('grace_period_ends_at');
            $table->dateTime('cancelled_at')->nullable()->after('renewal_at');
            $table->dateTime('archived_at')->nullable()->after('cancelled_at');
            $table->uuid('public_id')->unique()->nullable()->after('id');
        });
        Schema::create('payment_gateway_configs', function (Blueprint $table): void {
            $table->id(); $table->string('provider', 40)->unique(); $table->string('name', 100);
            $table->boolean('is_active')->default(false); $table->text('credentials')->nullable();
            $table->json('settings')->nullable(); $table->timestamps();
        });
        Schema::create('subscription_payments', function (Blueprint $table): void {
            $table->id(); $table->foreignId('school_subscription_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 40); $table->string('reference', 120)->unique();
            $table->string('idempotency_key', 120)->unique(); $table->string('status', 30)->default('pending')->index();
            $table->decimal('amount', 12, 2); $table->string('currency', 3)->default('KES');
            $table->json('payload')->nullable(); $table->timestamp('paid_at')->nullable(); $table->timestamps();
        });
        Schema::create('subscription_audit_logs', function (Blueprint $table): void {
            $table->id(); $table->foreignId('school_subscription_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('school_id')->constrained()->cascadeOnDelete();
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('from_status', 30)->nullable(); $table->string('to_status', 30);
            $table->json('metadata')->nullable(); $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_audit_logs');
        Schema::dropIfExists('subscription_payments');
        Schema::dropIfExists('payment_gateway_configs');
        Schema::table('school_subscriptions', fn (Blueprint $table) => $table->dropColumn(['public_id', 'lifecycle_status', 'grace_period_ends_at', 'renewal_at', 'cancelled_at', 'archived_at']));
        Schema::table('packages', fn (Blueprint $table) => $table->dropColumn(['limits', 'trial_days', 'is_public']));
        Schema::table('schools', fn (Blueprint $table) => $table->dropColumn(['curriculum', 'terms_accepted_at', 'onboarding_completed_at']));
    }
};
