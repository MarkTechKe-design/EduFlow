<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('online_classes', function (Blueprint $table) {
            if (!Schema::hasColumn('online_classes', 'meeting_type')) {
                $table->string('meeting_type', 40)->default('classroom')->after('title');
                $table->index(['school_id', 'meeting_type'], 'oc_school_meeting_type_idx');
            }
        });
    }

    public function down(): void
    {
        Schema::table('online_classes', function (Blueprint $table) {
            if (Schema::hasColumn('online_classes', 'meeting_type')) {
                $table->dropIndex('oc_school_meeting_type_idx');
                $table->dropColumn('meeting_type');
            }
        });
    }
};