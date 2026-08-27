<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('data_access_logs')) {
            Schema::create('data_access_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->string('action', 50)->index();
                $table->string('resource_type', 100)->index();
                $table->unsignedBigInteger('resource_id')->nullable();
                $table->foreignId('student_id')->nullable()->constrained('students')->nullOnDelete();
                $table->string('ip_address', 45)->nullable();
                $table->text('user_agent')->nullable();
                $table->text('description')->nullable();
                $table->json('metadata')->nullable();
                $table->timestamps();

                $table->index(['school_id', 'created_at'], 'dal_school_created_idx');
                $table->index(['school_id', 'action'], 'dal_school_action_idx');
                $table->index(['school_id', 'resource_type'], 'dal_school_resource_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('data_access_logs');
    }
};