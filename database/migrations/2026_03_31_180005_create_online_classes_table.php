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
                $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
                $table->foreignId('teacher_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('title');
                $table->string('platform')->default('jitsi');
                $table->string('meeting_id')->nullable()->index();
                $table->text('meeting_url')->nullable();
                $table->string('passcode')->nullable();
                $table->dateTime('scheduled_at')->index();
                $table->unsignedInteger('duration_minutes')->default(40);
                $table->string('status')->default('scheduled')->index();
                $table->timestamps();
                $table->softDeletes();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('online_classes');
    }
};