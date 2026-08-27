<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('timetable_time_slots', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('school_id');
            $table->string('label', 100); // e.g. "Period 1", "Morning Tea Break", "Lunch & Co-Curricular", "Evening Prep"
            $table->string('start_time', 10); // e.g. "07:30"
            $table->string('end_time', 10);   // e.g. "08:15"
            $table->enum('type', ['lesson', 'break'])->default('lesson');
            $table->unsignedSmallInteger('sort_order')->default(1);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
            $table->index(['school_id', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timetable_time_slots');
    }
};