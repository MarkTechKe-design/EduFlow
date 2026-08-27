<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Consolidate duplicate master records while explicitly repointing children.


        $schools = DB::table('schools')->pluck('id');
        foreach ($schools as $sid) {
            $deptGroups = DB::table('departments')
                ->where('school_id', $sid)
                ->select('name', DB::raw('MIN(id) as master_id'))
                ->groupBy('name')
                ->get();

            foreach ($deptGroups as $dg) {
                $duplicateIds = DB::table('departments')
                    ->where('school_id', $sid)
                    ->where('name', $dg->name)
                    ->where('id', '!=', $dg->master_id)
                    ->pluck('id');

                if ($duplicateIds->isNotEmpty()) {
                    // Update staff references to master department
                    DB::table('staff')
                        ->whereIn('department_id', $duplicateIds)
                        ->update(['department_id' => $dg->master_id]);

                    // Remove redundant designation duplicates before re-pointing
                    DB::table('designations')
                        ->whereIn('department_id', $duplicateIds)
                        ->delete();

                    // Delete duplicate department records
                    DB::table('departments')
                        ->whereIn('id', $duplicateIds)
                        ->delete();
                }
            }
        }



        // 2. Add cluster type and HOD assignment fields
        Schema::table('departments', function (Blueprint $table) {
            if (!Schema::hasColumn('departments', 'type')) {
                $table->string('type', 40)->default('academic')->after('code');
            }
            if (!Schema::hasColumn('departments', 'hod_id')) {
                $table->unsignedBigInteger('hod_id')->nullable()->after('type');
                $table->foreign('hod_id')->references('id')->on('staff')->nullOnDelete();
            }
        });

        // 3. Apply composite unique index per school
        try {
            Schema::table('departments', function (Blueprint $table) {
                $table->unique(['school_id', 'name'], 'school_department_name_unique');
            });
        } catch (\Throwable $e) {}
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            if (Schema::hasColumn('departments', 'hod_id')) {
                $table->dropForeign(['hod_id']);
                $table->dropColumn('hod_id');
            }
            if (Schema::hasColumn('departments', 'type')) {
                $table->dropColumn('type');
            }
            try {
                $table->dropUnique('school_department_name_unique');
            } catch (\Throwable $e) {}
        });
    }
};