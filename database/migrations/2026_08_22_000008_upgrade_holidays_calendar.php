<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Purge duplicate holiday rows before applying schema modifications.
        // Use the query builder so SQLite and MySQL share the same behavior.
        $seen = [];
        $duplicateIds = [];

        foreach (DB::table('holidays')
            ->orderBy('id')
            ->get(['id', 'school_id', 'date', 'name']) as $holiday) {
            $key = implode('|', [
                (string) $holiday->school_id,
                (string) $holiday->date,
                (string) $holiday->name,
            ]);

            if (isset($seen[$key])) {
                $duplicateIds[] = $holiday->id;
            } else {
                $seen[$key] = $holiday->id;
            }
        }

        foreach (array_chunk($duplicateIds, 500) as $ids) {
            DB::table('holidays')->whereIn('id', $ids)->delete();
        }

        // 2. Add multi-day range, holiday type and academic term columns
        Schema::table('holidays', function (Blueprint $table) {
            if (!Schema::hasColumn('holidays', 'end_date')) {
                $table->date('end_date')->nullable()->after('date');
            }
            if (!Schema::hasColumn('holidays', 'type')) {
                $table->string('type', 40)->default('public_holiday')->after('end_date'); // public_holiday, mid_term_break, term_break, school_event
            }
            if (!Schema::hasColumn('holidays', 'term')) {
                $table->string('term', 20)->default('Term 2')->after('type'); // Term 1, Term 2, Term 3, Annual
            }
        });

        // 3. Apply composite unique constraint per school
        try {
            Schema::table('holidays', function (Blueprint $table) {
                $table->unique(['school_id', 'date', 'name'], 'school_holiday_date_name_unique');
            });
        } catch (\Throwable $e) {}
    }

    public function down(): void
    {
        Schema::table('holidays', function (Blueprint $table) {
            try {
                $table->dropUnique('school_holiday_date_name_unique');
            } catch (\Throwable $e) {}

            $cols = ['end_date', 'type', 'term'];
            $existing = array_filter($cols, fn ($c) => Schema::hasColumn('holidays', $c));
            if (!empty($existing)) {
                $table->dropColumn($existing);
            }
        });
    }
};