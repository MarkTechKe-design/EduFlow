<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hostels', function (Blueprint $table) {
            if (!Schema::hasColumn('hostels', 'housemaster_name')) {
                $table->string('housemaster_name', 150)->nullable();
            }
            if (!Schema::hasColumn('hostels', 'matron_name')) {
                $table->string('matron_name', 150)->nullable();
            }
            if (!Schema::hasColumn('hostels', 'phone')) {
                $table->string('phone', 25)->nullable();
            }
        });

        if (!Schema::hasTable('hostel_rooms')) {
            Schema::create('hostel_rooms', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('school_id');
                $table->unsignedBigInteger('hostel_id');
                $table->string('room_number', 50);
                $table->unsignedSmallInteger('bed_capacity')->default(4);
                $table->unsignedSmallInteger('current_occupancy')->default(0);
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
                $table->foreign('hostel_id')->references('id')->on('hostels')->cascadeOnDelete();
            });
        }

        if (!Schema::hasTable('hostel_exeats')) {
            Schema::create('hostel_exeats', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('school_id');
                $table->unsignedBigInteger('student_id');
                $table->unsignedBigInteger('hostel_id');
                $table->enum('exeat_type', ['weekend_out', 'half_term', 'medical_leave', 'disciplinary_suspension'])->default('weekend_out');
                $table->date('departure_date');
                $table->date('expected_return_date');
                $table->date('actual_return_date')->nullable();
                $table->string('reason', 250);
                $table->string('guardian_approval_contact', 25);
                $table->enum('status', ['pending', 'approved', 'departed', 'returned', 'overdue'])->default('pending');
                $table->timestamps();

                $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
                $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
                $table->foreign('hostel_id')->references('id')->on('hostels')->cascadeOnDelete();
            });
        }

        if (!Schema::hasTable('hostel_damages')) {
            Schema::create('hostel_damages', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('school_id');
                $table->unsignedBigInteger('student_id');
                $table->unsignedBigInteger('hostel_id');
                $table->string('item_damaged', 150);
                $table->decimal('fine_amount', 10, 2)->default(0.00);
                $table->date('incident_date');
                $table->enum('status', ['reported', 'charged_to_fees', 'paid', 'waived'])->default('reported');
                $table->text('description')->nullable();
                $table->timestamps();

                $table->foreign('school_id')->references('id')->on('schools')->cascadeOnDelete();
                $table->foreign('student_id')->references('id')->on('students')->cascadeOnDelete();
                $table->foreign('hostel_id')->references('id')->on('hostels')->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('hostel_damages');
        Schema::dropIfExists('hostel_exeats');
        Schema::dropIfExists('hostel_rooms');

        Schema::table('hostels', function (Blueprint $table) {
            $cols = ['housemaster_name', 'matron_name', 'phone'];
            $existing = array_filter($cols, fn($c) => Schema::hasColumn('hostels', $c));
            if (!empty($existing)) {
                $table->dropColumn($existing);
            }
        });
    }
};