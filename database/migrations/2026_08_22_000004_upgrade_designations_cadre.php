<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Deduplicate table by keeping the lowest ID per unique pair.
        // Use the query builder so SQLite-based tests and MySQL deployments
        // execute the same migration safely.
        $seen = [];
        $duplicateIds = [];

        foreach (DB::table('designations')
            ->orderBy('id')
            ->get(['id', 'school_id', 'department_id', 'name']) as $designation) {
            $key = implode('|', [
                (string) $designation->school_id,
                $designation->department_id === null ? 'null' : (string) $designation->department_id,
                (string) $designation->name,
            ]);

            if (isset($seen[$key])) {
                $duplicateIds[] = $designation->id;
            } else {
                $seen[$key] = $designation->id;
            }
        }

        foreach (array_chunk($duplicateIds, 500) as $ids) {
            DB::table('designations')->whereIn('id', $ids)->delete();
        }

        // 2. Add Cadre Classification & Unique Index
        Schema::table('designations', function (Blueprint $table) {
            if (!Schema::hasColumn('designations', 'cadre')) {
                $table->string('cadre', 50)->default('teaching')->after('name'); // leadership, teaching, finance_admin, operations_support
            }
            if (!Schema::hasColumn('designations', 'is_leadership')) {
                $table->boolean('is_leadership')->default(false)->after('cadre');
            }
        });

        // 3. Drop existing duplicates and add composite unique constraint
        try {
            Schema::table('designations', function (Blueprint $table) {
                $table->unique(['school_id', 'department_id', 'name'], 'school_dept_designation_unique');
            });
        } catch (\Throwable $e) {}
    }

    public function down(): void
    {
        Schema::table('designations', function (Blueprint $table) {
            try {
                $table->dropUnique('school_dept_designation_unique');
            } catch (\Throwable $e) {}

            $cols = ['cadre', 'is_leadership'];
            $existing = array_filter($cols, fn ($c) => Schema::hasColumn('designations', $c));
            if (!empty($existing)) {
                $table->dropColumn($existing);
            }
        });
    }
};