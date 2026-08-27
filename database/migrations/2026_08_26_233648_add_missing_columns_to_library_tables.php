<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Update book_issues Table
        Schema::table('book_issues', function (Blueprint $table) {
            if (!Schema::hasColumn('book_issues', 'fine_status')) {
                $table->string('fine_status', 30)->default('unpaid')->after('status');
                $table->index(['school_id', 'status', 'fine_status'], 'bi_school_status_fine_idx');
            }
            if (!Schema::hasColumn('book_issues', 'fine_amount')) {
                $table->decimal('fine_amount', 10, 2)->default(0.00)->after('fine');
            }
            if (!Schema::hasColumn('book_issues', 'fine_paid_at')) {
                $table->dateTime('fine_paid_at')->nullable()->after('fine_status');
            }
            if (!Schema::hasColumn('book_issues', 'notes') && !Schema::hasColumn('book_issues', 'note')) {
                $table->text('notes')->nullable()->after('fine_paid_at');
            }
        });

        // 2. Update books Table
        Schema::table('books', function (Blueprint $table) {
            if (!Schema::hasColumn('books', 'edition')) {
                $table->string('edition', 50)->nullable()->after('category');
            }
            if (!Schema::hasColumn('books', 'price')) {
                $table->decimal('price', 10, 2)->nullable()->after('location');
            }
        });
    }

    public function down(): void
    {
        Schema::table('book_issues', function (Blueprint $table) {
            if (Schema::hasColumn('book_issues', 'fine_status')) {
                $table->dropIndex('bi_school_status_fine_idx');
                $table->dropColumn(['fine_status', 'fine_amount', 'fine_paid_at']);
            }
        });

        Schema::table('books', function (Blueprint $table) {
            if (Schema::hasColumn('books', 'edition')) {
                $table->dropColumn(['edition', 'price']);
            }
        });
    }
};