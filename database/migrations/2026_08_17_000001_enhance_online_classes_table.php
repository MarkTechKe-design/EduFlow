<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('online_classes')) {
            Schema::create('online_classes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
                $table->foreignId('section_id')->nullable()->constrained('sections')->nullOnDelete();
                $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
                $table->foreignId('teacher_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('platform')->default('jitsi'); // jitsi, zoom, google_meet
                $table->string('meeting_id')->nullable()->index();
                $table->text('meeting_url')->nullable();
                $table->string('passcode')->nullable();
                $table->string('room_token', 64)->nullable()->unique();
                $table->dateTime('scheduled_at')->index();
                $table->unsignedInteger('duration_minutes')->default(40);
                $table->dateTime('started_at')->nullable();
                $table->dateTime('ended_at')->nullable();
                $table->string('status')->default('scheduled')->index(); // scheduled, live, completed, cancelled
                $table->timestamps();
                $table->softDeletes();
            });
        } else {
            Schema::table('online_classes', function (Blueprint $table) {
                if (!Schema::hasColumn('online_classes', 'section_id')) {
                    $table->foreignId('section_id')->nullable()->after('class_id')->constrained('sections')->nullOnDelete();
                }
                if (!Schema::hasColumn('online_classes', 'created_by')) {
                    $table->foreignId('created_by')->nullable()->after('teacher_id')->constrained('users')->nullOnDelete();
                }
                if (!Schema::hasColumn('online_classes', 'description')) {
                    $table->text('description')->nullable()->after('title');
                }
                if (!Schema::hasColumn('online_classes', 'room_token')) {
                    $table->string('room_token', 64)->nullable()->unique()->after('passcode');
                }
                if (!Schema::hasColumn('online_classes', 'started_at')) {
                    $table->dateTime('started_at')->nullable()->after('duration_minutes');
                }
                if (!Schema::hasColumn('online_classes', 'ended_at')) {
                    $table->dateTime('ended_at')->nullable()->after('started_at');
                }
            });
        }
    }

    public function down(): void
    {
        // Safe backward-compatible rollback
    }
};