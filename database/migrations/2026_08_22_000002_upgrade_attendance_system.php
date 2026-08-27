<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Drop existing unique indexes dynamically if present. Keep this
        // migration portable because the test suite and supported local
        // installs may use SQLite while production uses MySQL.
        $driver = Schema::getConnection()->getDriverName();
        $existingIndexes = match ($driver) {
            'mysql', 'mariadb' => DB::select("SHOW INDEX FROM `attendances` WHERE Non_unique = 0 AND Key_name != 'PRIMARY'"),
            'sqlite' => DB::select("PRAGMA index_list('attendances')"),
            default => [],
        };

        foreach ($existingIndexes as $idx) {
            $keyName = (string) ($idx->Key_name ?? $idx->name ?? '');

            if ($keyName === '' || $keyName === 'PRIMARY') {
                continue;
            }

            try {
                if ($driver === 'sqlite') {
                    DB::statement(sprintf(
                        'DROP INDEX IF EXISTS "%s"',
                        str_replace('"', '""', $keyName),
                    ));
                } else {
                    DB::statement(sprintf(
                        'ALTER TABLE `attendances` DROP INDEX `%s`',
                        str_replace('`', '``', $keyName),
                    ));
                }
            } catch (\Throwable $e) {
                // Ignore if the index was already dropped by an earlier run.
            }
        }

        // 2. Add new session, time, and audit columns
        Schema::table('attendances', function (Blueprint $table) {
            if (!Schema::hasColumn('attendances', 'session')) {
                $table->string('session', 30)->default('morning')->after('date');
            }
            if (!Schema::hasColumn('attendances', 'time_in')) {
                $table->time('time_in')->nullable()->after('status');
            }
            if (!Schema::hasColumn('attendances', 'time_out')) {
                $table->time('time_out')->nullable()->after('time_in');
            }
            if (!Schema::hasColumn('attendances', 'marked_by')) {
                $table->unsignedBigInteger('marked_by')->nullable()->after('remarks');
                $table->foreign('marked_by')->references('id')->on('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('attendances', 'notification_sent')) {
                $table->boolean('notification_sent')->default(false)->after('marked_by');
            }
        });

        // 3. Apply session-based unique constraint
        Schema::table('attendances', function (Blueprint $table) {
            $table->unique(['school_id', 'date', 'session', 'attendable_type', 'attendable_id'], 'school_att_date_session_unique');
        });
    }

    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            if (Schema::hasColumn('attendances', 'marked_by')) {
                $table->dropForeign(['marked_by']);
            }
            try {
                $table->dropUnique('school_att_date_session_unique');
            } catch (\Throwable $e) {}

            $colsToDrop = [];
            foreach (['session', 'time_in', 'time_out', 'marked_by', 'notification_sent'] as $col) {
                if (Schema::hasColumn('attendances', $col)) {
                    $colsToDrop[] = $col;
                }
            }
            if (!empty($colsToDrop)) {
                $table->dropColumn($colsToDrop);
            }
        });
    }
};