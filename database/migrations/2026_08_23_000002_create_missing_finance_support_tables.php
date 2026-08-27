<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('payroll_statutory_configs')) {
            Schema::create('payroll_statutory_configs', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('school_id')->unique()->constrained('schools')->cascadeOnDelete();
                $table->boolean('nssf_enabled')->default(true);
                $table->decimal('nssf_rate', 8, 2)->default(6);
                $table->decimal('nssf_tier1_limit', 12, 2)->default(8000);
                $table->decimal('nssf_tier2_limit', 12, 2)->default(72000);
                $table->boolean('shif_enabled')->default(true);
                $table->decimal('shif_rate', 8, 2)->default(2.75);
                $table->decimal('shif_min_amount', 12, 2)->default(300);
                $table->boolean('housing_levy_enabled')->default(true);
                $table->decimal('housing_levy_rate', 8, 2)->default(1.5);
                $table->boolean('paye_enabled')->default(true);
                $table->json('paye_brackets')->nullable();
                $table->decimal('personal_relief', 12, 2)->default(2400);
                $table->decimal('shif_relief_rate', 8, 2)->default(15);
                $table->decimal('shif_relief_max', 12, 2)->default(5000);
                $table->decimal('housing_relief_rate', 8, 2)->default(15);
                $table->decimal('housing_relief_max', 12, 2)->default(9000);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('fee_vote_heads')) {
            Schema::create('fee_vote_heads', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
                $table->string('code', 50);
                $table->string('name', 150);
                $table->string('category', 50)->default('tuition');
                $table->text('description')->nullable();
                $table->boolean('is_mandatory')->default(false);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();
                $table->unique(['school_id', 'code'], 'fee_vote_heads_school_code_unique');
                $table->index(['school_id', 'is_active']);
            });
        }

        if (! Schema::hasTable('fee_payment_allocations')) {
            Schema::create('fee_payment_allocations', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
                $table->foreignId('fee_payment_id')->constrained('fee_payments')->cascadeOnDelete();
                $table->foreignId('fee_vote_head_id')->constrained('fee_vote_heads')->cascadeOnDelete();
                $table->unsignedBigInteger('fee_invoice_id')->nullable();
                $table->unsignedBigInteger('fee_invoice_item_id')->nullable();
                $table->decimal('amount', 12, 2);
                $table->timestamps();
                $table->index(['school_id', 'created_at']);
                $table->index(['school_id', 'fee_payment_id']);
                $table->index(['school_id', 'fee_vote_head_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_payment_allocations');
        Schema::dropIfExists('fee_vote_heads');
        Schema::dropIfExists('payroll_statutory_configs');
    }
};