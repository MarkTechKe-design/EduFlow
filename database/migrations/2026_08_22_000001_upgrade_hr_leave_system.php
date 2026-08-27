<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Upgrade leave_types to full policy configuration
        Schema::table('leave_types', function (Blueprint $table) {
            $table->string('code', 30)->nullable()->after('name');
            $table->string('policy_category', 50)->default('school_policy')->after('code'); // statutory, contractual, school_policy, cba
            $table->string('accrual_method', 50)->default('annual_entitlement')->after('max_days_per_year'); // annual_entitlement, monthly_accrual, event_based
            $table->boolean('requires_approval')->default(true)->after('is_paid');
            $table->boolean('requires_attachment')->default(false)->after('requires_approval');
            $table->boolean('allows_half_day')->default(false)->after('requires_attachment');
            $table->boolean('affects_payroll')->default(false)->after('allows_half_day');
            $table->unsignedInteger('min_notice_days')->default(0)->after('affects_payroll');
            $table->boolean('allow_carry_forward')->default(false)->after('min_notice_days');
            $table->unsignedInteger('max_carry_forward_days')->default(0)->after('allow_carry_forward');
        });

        // 2. Upgrade leave_requests to support coverage, attachments, handovers
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->unsignedBigInteger('relief_staff_id')->nullable()->after('staff_id');
            $table->string('contact_while_away', 100)->nullable()->after('reason');
            $table->text('handover_notes')->nullable()->after('contact_while_away');
            $table->string('attachment_path', 255)->nullable()->after('handover_notes');
            $table->boolean('is_half_day')->default(false)->after('days');
            $table->timestamp('reviewed_at')->nullable()->after('approval_note');
            $table->unsignedBigInteger('reviewed_by')->nullable()->after('reviewed_at');

            $table->foreign('relief_staff_id')->references('id')->on('staff')->nullOnDelete();
            $table->foreign('reviewed_by')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('leave_requests', function (Blueprint $table) {
            $table->dropForeign(['relief_staff_id']);
            $table->dropForeign(['reviewed_by']);
            $table->dropColumn([
                'relief_staff_id', 'contact_while_away', 'handover_notes',
                'attachment_path', 'is_half_day', 'reviewed_at', 'reviewed_by'
            ]);
        });

        Schema::table('leave_types', function (Blueprint $table) {
            $table->dropColumn([
                'code', 'policy_category', 'accrual_method', 'requires_approval',
                'requires_attachment', 'allows_half_day', 'affects_payroll',
                'min_notice_days', 'allow_carry_forward', 'max_carry_forward_days'
            ]);
        });
    }
};