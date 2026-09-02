<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('teacher_duty_rosters')) {
            Schema::create('teacher_duty_rosters', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
                $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->nullOnDelete();
                $table->string('title'); // e.g. "Term 1 Week 5 Duty Roster"
                $table->date('start_date'); // Monday
                $table->date('end_date'); // Friday
                $table->boolean('is_active')->default(true);
                $table->text('notes')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['school_id', 'start_date', 'end_date']);
            });
        }

        if (!Schema::hasTable('teacher_duty_assignments')) {
            Schema::create('teacher_duty_assignments', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained('schools')->cascadeOnDelete();
                $table->foreignId('duty_roster_id')->constrained('teacher_duty_rosters')->cascadeOnDelete();
                $table->foreignId('staff_id')->constrained('staff')->cascadeOnDelete(); // Original Assigned Teacher
                $table->string('duty_station'); // Main Gate, Assembly, Dining, Library, Hostel, Transport, Playground, etc.
                $table->string('day_of_week'); // Monday, Tuesday, Wednesday, Thursday, Friday, All Week
                $table->string('shift')->default('full_day'); // morning, afternoon, full_day
                $table->date('effective_date')->nullable();
                $table->text('instructions')->nullable();

                // Stand-in / Replacement tracking
                $table->foreignId('replacement_staff_id')->nullable()->constrained('staff')->nullOnDelete();
                $table->text('replacement_reason')->nullable();
                $table->foreignId('replacement_changed_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamp('replacement_at')->nullable();

                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['school_id', 'duty_roster_id']);
                $table->index(['staff_id', 'replacement_staff_id']);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_duty_assignments');
        Schema::dropIfExists('teacher_duty_rosters');
    }
};