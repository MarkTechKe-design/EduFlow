<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Fee Vote Heads (e.g., Tuition, Activity, Boarding, CBC Materials)
        if (!Schema::hasTable('fee_vote_heads')) {
            Schema::create('fee_vote_heads', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->string('code', 50)->nullable();
                $table->string('name', 150);
                $table->string('category', 100)->nullable();
                $table->text('description')->nullable();
                $table->boolean('is_mandatory')->default(true);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();

                $table->index(['school_id', 'is_active'], 'fvh_school_active_idx');
            });
        }

        // 2. Fee Structure Items (Breakdown per Vote Head)
        if (!Schema::hasTable('fee_structure_items')) {
            Schema::create('fee_structure_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('fee_structure_id')->constrained('fee_structures')->cascadeOnDelete();
                $table->foreignId('fee_vote_head_id')->nullable()->constrained('fee_vote_heads')->nullOnDelete();
                $table->decimal('amount', 12, 2)->default(0.00);
                $table->timestamps();

                $table->index(['school_id', 'fee_structure_id'], 'fsi_school_structure_idx');
            });
        }

        // 3. Fee Invoices (Student Invoicing per Term)
        if (!Schema::hasTable('fee_invoices')) {
            Schema::create('fee_invoices', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->string('invoice_number', 50)->index();
                $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
                $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->nullOnDelete();
                $table->foreignId('class_id')->nullable()->constrained('classes')->nullOnDelete();
                $table->foreignId('fee_structure_id')->nullable()->constrained('fee_structures')->nullOnDelete();
                $table->string('term', 30)->default('Term 1');
                $table->date('issue_date');
                $table->date('due_date')->nullable();
                $table->decimal('total_amount', 12, 2)->default(0.00);
                $table->decimal('paid_amount', 12, 2)->default(0.00);
                $table->decimal('waiver_amount', 12, 2)->default(0.00);
                $table->decimal('balance', 12, 2)->default(0.00);
                $table->string('status', 30)->default('unpaid'); // unpaid, partial, paid, waived, cancelled
                $table->text('notes')->nullable();
                $table->foreignId('generated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['school_id', 'student_id', 'status'], 'fi_school_student_status_idx');
            });
        }

        // 4. Fee Invoice Items
        if (!Schema::hasTable('fee_invoice_items')) {
            Schema::create('fee_invoice_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('fee_invoice_id')->constrained('fee_invoices')->cascadeOnDelete();
                $table->foreignId('fee_vote_head_id')->nullable()->constrained('fee_vote_heads')->nullOnDelete();
                $table->decimal('amount', 12, 2)->default(0.00);
                $table->decimal('paid_amount', 12, 2)->default(0.00);
                $table->decimal('waiver_amount', 12, 2)->default(0.00);
                $table->decimal('balance', 12, 2)->default(0.00);
                $table->timestamps();

                $table->index(['school_id', 'fee_invoice_id'], 'fii_school_invoice_idx');
            });
        }

        // 5. Fee Payment Allocations
        if (!Schema::hasTable('fee_payment_allocations')) {
            Schema::create('fee_payment_allocations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('fee_payment_id')->constrained('fee_payments')->cascadeOnDelete();
                $table->foreignId('fee_invoice_id')->nullable()->constrained('fee_invoices')->nullOnDelete();
                $table->foreignId('fee_invoice_item_id')->nullable()->constrained('fee_invoice_items')->nullOnDelete();
                $table->foreignId('fee_vote_head_id')->nullable()->constrained('fee_vote_heads')->nullOnDelete();
                $table->decimal('amount', 12, 2)->default(0.00);
                $table->timestamps();

                $table->index(['school_id', 'fee_payment_id'], 'fpa_school_payment_idx');
            });
        }

        // 6. Fee Ledger Entries (Double-Entry Student Accounting)
        if (!Schema::hasTable('fee_ledger_entries')) {
            Schema::create('fee_ledger_entries', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
                $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->nullOnDelete();
                $table->string('term', 30)->nullable();
                $table->string('transaction_type', 50); // invoice, payment, waiver, fine, adjustment, refund
                $table->string('reference_number', 100)->nullable();
                $table->decimal('debit', 12, 2)->default(0.00);
                $table->decimal('credit', 12, 2)->default(0.00);
                $table->decimal('running_balance', 12, 2)->default(0.00);
                $table->string('reference_type', 100)->nullable();
                $table->unsignedBigInteger('reference_id')->nullable();
                $table->foreignId('fee_vote_head_id')->nullable()->constrained('fee_vote_heads')->nullOnDelete();
                $table->date('entry_date');
                $table->text('description')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['school_id', 'student_id', 'entry_date'], 'fle_school_student_date_idx');
            });
        }

        // 7. Fee Adjustments
        if (!Schema::hasTable('fee_adjustments')) {
            Schema::create('fee_adjustments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
                $table->foreignId('fee_invoice_id')->nullable()->constrained('fee_invoices')->nullOnDelete();
                $table->foreignId('fee_vote_head_id')->nullable()->constrained('fee_vote_heads')->nullOnDelete();
                $table->string('type', 30)->default('waiver'); // waiver, credit_note, debit_note, fine
                $table->decimal('amount', 12, 2)->default(0.00);
                $table->text('reason')->nullable();
                $table->string('documentation_reference', 100)->nullable();
                $table->string('status', 30)->default('approved');
                $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['school_id', 'student_id'], 'fa_school_student_idx');
            });
        }

        // 8. Unallocated Payments Queue (M-Pesa / Bank reconciliation)
        if (!Schema::hasTable('unallocated_payments')) {
            Schema::create('unallocated_payments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->string('reference_code', 100)->index();
                $table->string('channel', 50)->default('mpesa'); // mpesa, bank, cash, cheque
                $table->decimal('amount', 12, 2)->default(0.00);
                $table->string('payer_name', 150)->nullable();
                $table->string('payer_phone', 50)->nullable();
                $table->string('bill_reference_entered', 100)->nullable();
                $table->dateTime('payment_date')->nullable();
                $table->json('raw_payload')->nullable();
                $table->string('status', 30)->default('unallocated'); // unallocated, allocated, refunded, ignored
                $table->foreignId('allocated_to_student_id')->nullable()->constrained('students')->nullOnDelete();
                $table->foreignId('resolved_by')->nullable()->constrained('users')->nullOnDelete();
                $table->dateTime('resolved_at')->nullable();
                $table->text('resolution_notes')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['school_id', 'status', 'payment_date'], 'up_school_status_date_idx');
            });
        }

        // 9. School Payment Gateways (Daraja M-Pesa / Bank Credentials per School)
        if (!Schema::hasTable('school_payment_gateways')) {
            Schema::create('school_payment_gateways', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->string('gateway_name', 50)->default('mpesa'); // mpesa, bank
                $table->string('shortcode', 50)->nullable();
                $table->string('shortcode_type', 30)->default('paybill'); // paybill, till
                $table->string('consumer_key', 255)->nullable();
                $table->string('consumer_secret', 255)->nullable();
                $table->string('passkey', 255)->nullable();
                $table->string('account_reference_format', 100)->default('ADM_{admission_no}');
                $table->json('bank_details')->nullable();
                $table->boolean('is_active')->default(false);
                $table->boolean('is_sandbox')->default(true);
                $table->timestamps();
                $table->softDeletes();

                $table->unique(['school_id', 'gateway_name'], 'spg_school_gateway_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('school_payment_gateways');
        Schema::dropIfExists('unallocated_payments');
        Schema::dropIfExists('fee_adjustments');
        Schema::dropIfExists('fee_ledger_entries');
        Schema::dropIfExists('fee_payment_allocations');
        Schema::dropIfExists('fee_invoice_items');
        Schema::dropIfExists('fee_invoices');
        Schema::dropIfExists('fee_structure_items');
        Schema::dropIfExists('fee_vote_heads');
    }
};