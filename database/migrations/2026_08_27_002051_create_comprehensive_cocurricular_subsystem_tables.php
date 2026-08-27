<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Activity Categories (Sports, Performing Arts, STEM, Creative, Clubs)
        if (!Schema::hasTable('activity_categories')) {
            Schema::create('activity_categories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->string('name', 120);
                $table->string('code', 50)->nullable();
                $table->string('icon', 50)->default('Activity');
                $table->text('description')->nullable();
                $table->integer('display_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();

                $table->index(['school_id', 'is_active', 'display_order'], 'act_cat_school_active_idx');
            });
        }

        // 2. School Houses (Simba, Chui, Kifaru, Ndovu, etc.)
        if (!Schema::hasTable('activity_houses')) {
            Schema::create('activity_houses', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->string('name', 100);
                $table->string('code', 30)->nullable();
                $table->string('color_code', 30)->default('#10b981');
                $table->string('motto', 255)->nullable();
                $table->foreignId('patron_id')->nullable()->constrained('staff')->nullOnDelete();
                $table->foreignId('captain_student_id')->nullable()->constrained('students')->nullOnDelete();
                $table->decimal('total_points', 12, 2)->default(0.00);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();

                $table->index(['school_id', 'is_active'], 'act_house_school_idx');
            });
        }

        // 3. House Point Scoring Rules
        if (!Schema::hasTable('house_point_rules')) {
            Schema::create('house_point_rules', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->string('position_rank', 30); // 1st, 2nd, 3rd, participant, special_award
                $table->decimal('points', 8, 2)->default(0.00);
                $table->string('rule_name', 120);
                $table->boolean('is_active')->default(true);
                $table->timestamps();

                $table->index(['school_id', 'position_rank'], 'hpr_school_rank_idx');
            });
        }

        // 4. House Points Transaction Audit Log
        if (!Schema::hasTable('house_point_logs')) {
            Schema::create('house_point_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('house_id')->constrained('activity_houses')->cascadeOnDelete();
                $table->unsignedBigInteger('cocurricular_event_id')->nullable();
                $table->unsignedBigInteger('activity_id')->nullable();
                $table->foreignId('student_id')->nullable()->constrained('students')->nullOnDelete();
                $table->decimal('points', 8, 2);
                $table->string('reason', 255);
                $table->foreignId('awarded_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();

                $table->index(['school_id', 'house_id'], 'hpl_school_house_idx');
            });
        }

        // 5. Activities Definition (Athletics 100m, Football U19, Drama Play, Robotics)
        if (!Schema::hasTable('activities')) {
            Schema::create('activities', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('category_id')->constrained('activity_categories')->cascadeOnDelete();
                $table->string('name', 150);
                $table->string('code', 50)->nullable();
                $table->string('type', 40)->default('team_fixture'); // individual_measurable, team_fixture, performance_adjudicated, club_society
                $table->string('gender_scope', 30)->default('open'); // boys, girls, mixed, open
                $table->string('age_group', 30)->default('open'); // under_12, under_14, under_16, under_19, open
                $table->integer('max_participants')->nullable();
                $table->foreignId('patron_id')->nullable()->constrained('staff')->nullOnDelete();
                $table->foreignId('head_coach_id')->nullable()->constrained('staff')->nullOnDelete();
                $table->text('rules')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();

                $table->index(['school_id', 'type', 'is_active'], 'act_school_type_idx');
            });
        }

        // 6. Activity Teams
        if (!Schema::hasTable('activity_teams')) {
            Schema::create('activity_teams', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('activity_id')->constrained('activities')->cascadeOnDelete();
                $table->foreignId('house_id')->nullable()->constrained('activity_houses')->nullOnDelete();
                $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->nullOnDelete();
                $table->string('name', 150);
                $table->string('age_group', 30)->default('open');
                $table->string('gender', 30)->default('open');
                $table->foreignId('coach_id')->nullable()->constrained('staff')->nullOnDelete();
                $table->foreignId('assistant_coach_id')->nullable()->constrained('staff')->nullOnDelete();
                $table->foreignId('captain_student_id')->nullable()->constrained('students')->nullOnDelete();
                $table->foreignId('vice_captain_student_id')->nullable()->constrained('students')->nullOnDelete();
                $table->string('status', 30)->default('active'); // active, disbanded
                $table->timestamps();
                $table->softDeletes();

                $table->index(['school_id', 'activity_id', 'status'], 'at_school_act_status_idx');
            });
        }

        // 7. Activity Team Members
        if (!Schema::hasTable('activity_team_members')) {
            Schema::create('activity_team_members', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('team_id')->constrained('activity_teams')->cascadeOnDelete();
                $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
                $table->string('role', 40)->default('member'); // captain, vice_captain, starter, reserve, member
                $table->string('jersey_number', 20)->nullable();
                $table->string('position_name', 60)->nullable();
                $table->date('joined_date')->nullable();
                $table->string('status', 30)->default('active'); // active, injured, inactive
                $table->timestamps();

                $table->unique(['team_id', 'student_id'], 'atm_team_student_unique');
                $table->index(['school_id', 'student_id'], 'atm_school_student_idx');
            });
        }

        // 8. Co-Curricular Competitions & Events
        if (!Schema::hasTable('cocurricular_events')) {
            Schema::create('cocurricular_events', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('activity_id')->nullable()->constrained('activities')->nullOnDelete();
                $table->foreignId('category_id')->nullable()->constrained('activity_categories')->nullOnDelete();
                $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->nullOnDelete();
                $table->string('term', 30)->default('Term 1');
                $table->string('title', 200);
                $table->string('event_type', 40)->default('internal'); // internal, inter_house, friendly, zonal, sub_county, county, regional, national, east_africa, international
                $table->string('competition_level', 40)->default('school'); // school, zonal, sub_county, county, regional, national, eassrc
                $table->date('start_date');
                $table->date('end_date')->nullable();
                $table->string('venue', 150)->nullable();
                $table->string('host_organization', 150)->nullable();
                $table->date('registration_deadline')->nullable();
                $table->text('adjudicator_names')->nullable();
                $table->string('status', 30)->default('scheduled'); // scheduled, ongoing, completed, cancelled
                $table->text('notes')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['school_id', 'status', 'start_date'], 'cce_school_status_date_idx');
            });
        }

        // 9. Event Participants & Qualification Roster
        if (!Schema::hasTable('event_participants')) {
            Schema::create('event_participants', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('event_id')->constrained('cocurricular_events')->cascadeOnDelete();
                $table->foreignId('student_id')->nullable()->constrained('students')->nullOnDelete();
                $table->foreignId('team_id')->nullable()->constrained('activity_teams')->nullOnDelete();
                $table->foreignId('house_id')->nullable()->constrained('activity_houses')->nullOnDelete();
                $table->string('registration_number', 50)->nullable();
                $table->string('heat', 20)->nullable();
                $table->integer('lane')->nullable();
                $table->string('category_division', 60)->nullable();
                $table->string('disability_adaptation', 150)->nullable();
                $table->string('qualification_status', 40)->default('registered'); // registered, qualified, eliminated, disqualified, withdrawn
                $table->string('qualification_level', 40)->default('school'); // school, zonal, sub_county, county, regional, national, eassrc
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->index(['school_id', 'event_id', 'student_id'], 'ep_school_event_student_idx');
            });
        }

        // 10. Sports Matches & Fixtures
        if (!Schema::hasTable('activity_fixtures')) {
            Schema::create('activity_fixtures', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('event_id')->constrained('cocurricular_events')->cascadeOnDelete();
                $table->foreignId('team_a_id')->nullable()->constrained('activity_teams')->nullOnDelete();
                $table->foreignId('team_b_id')->nullable()->constrained('activity_teams')->nullOnDelete();
                $table->string('team_a_custom_name', 120)->nullable();
                $table->string('team_b_custom_name', 120)->nullable();
                $table->dateTime('scheduled_at');
                $table->string('venue', 120)->nullable();
                $table->string('stage', 40)->default('group'); // group, round_of_16, quarter_final, semi_final, playoff_3rd, final, league_match
                $table->integer('team_a_score')->nullable();
                $table->integer('team_b_score')->nullable();
                $table->foreignId('winner_team_id')->nullable()->constrained('activity_teams')->nullOnDelete();
                $table->string('outcome', 30)->nullable(); // team_a_win, team_b_win, draw, postponed, abandoned
                $table->string('referee_name', 120)->nullable();
                $table->text('match_report')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['school_id', 'event_id', 'scheduled_at'], 'af_school_event_date_idx');
            });
        }

        // 11. Athletics & Measurable Results (Track/Field/Swimming)
        if (!Schema::hasTable('measurable_results')) {
            Schema::create('measurable_results', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('event_participant_id')->constrained('event_participants')->cascadeOnDelete();
                $table->foreignId('activity_id')->constrained('activities')->cascadeOnDelete();
                $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
                $table->string('event_round', 30)->default('final'); // heats, quarter_final, semi_final, final
                $table->string('metric_type', 30)->default('time'); // time, distance, height, points
                $table->decimal('time_recorded_seconds', 8, 3)->nullable();
                $table->decimal('distance_recorded_meters', 8, 3)->nullable();
                $table->decimal('height_recorded_meters', 8, 3)->nullable();
                $table->decimal('points_score', 8, 2)->nullable();
                $table->integer('final_position')->nullable();
                $table->boolean('is_personal_best')->default(false);
                $table->boolean('is_season_best')->default(false);
                $table->boolean('is_school_record')->default(false);
                $table->boolean('is_competition_record')->default(false);
                $table->text('remarks')->nullable();
                $table->date('recorded_date');
                $table->timestamps();

                $table->index(['school_id', 'student_id', 'activity_id'], 'mr_school_student_act_idx');
            });
        }

        // 12. Adjudication Rubrics (Drama, Music, Debate, Science Fair)
        if (!Schema::hasTable('adjudication_rubrics')) {
            Schema::create('adjudication_rubrics', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('activity_id')->nullable()->constrained('activities')->nullOnDelete();
                $table->string('name', 150);
                $table->string('code', 50)->nullable();
                $table->decimal('total_max_score', 8, 2)->default(100.00);
                $table->text('description')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
                $table->softDeletes();

                $table->index(['school_id', 'is_active'], 'ar_school_active_idx');
            });
        }

        // 13. Adjudication Rubric Criteria Items
        if (!Schema::hasTable('adjudication_rubric_items')) {
            Schema::create('adjudication_rubric_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('rubric_id')->constrained('adjudication_rubrics')->cascadeOnDelete();
                $table->string('criterion_name', 150);
                $table->decimal('max_score', 8, 2);
                $table->integer('display_order')->default(0);
                $table->text('description')->nullable();
                $table->timestamps();

                $table->index(['school_id', 'rubric_id'], 'ari_school_rubric_idx');
            });
        }

        // 14. Performance Adjudication Master Records
        if (!Schema::hasTable('performance_adjudications')) {
            Schema::create('performance_adjudications', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('event_participant_id')->constrained('event_participants')->cascadeOnDelete();
                $table->foreignId('rubric_id')->constrained('adjudication_rubrics')->cascadeOnDelete();
                $table->string('adjudicator_name', 120);
                $table->decimal('total_awarded_score', 8, 2)->default(0.00);
                $table->string('grade_attained', 20)->nullable();
                $table->text('general_feedback')->nullable();
                $table->string('status', 30)->default('submitted'); // draft, submitted, verified
                $table->timestamps();

                $table->index(['school_id', 'event_participant_id'], 'pa_school_participant_idx');
            });
        }

        // 15. Itemized Performance Scores
        if (!Schema::hasTable('performance_scores')) {
            Schema::create('performance_scores', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('adjudication_id')->constrained('performance_adjudications')->cascadeOnDelete();
                $table->foreignId('rubric_item_id')->constrained('adjudication_rubric_items')->cascadeOnDelete();
                $table->decimal('awarded_score', 8, 2);
                $table->text('item_comment')->nullable();
                $table->timestamps();

                $table->index(['school_id', 'adjudication_id'], 'ps_school_adj_idx');
            });
        }

        // 16. School Clubs & Societies
        if (!Schema::hasTable('school_clubs')) {
            Schema::create('school_clubs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('category_id')->nullable()->constrained('activity_categories')->nullOnDelete();
                $table->string('name', 150);
                $table->string('code', 50)->nullable();
                $table->string('motto', 255)->nullable();
                $table->foreignId('patron_id')->nullable()->constrained('staff')->nullOnDelete();
                $table->foreignId('assistant_patron_id')->nullable()->constrained('staff')->nullOnDelete();
                $table->string('meeting_schedule', 150)->nullable();
                $table->string('meeting_venue', 120)->nullable();
                $table->text('objectives')->nullable();
                $table->string('constitution_path', 255)->nullable();
                $table->string('status', 30)->default('active'); // active, dormant
                $table->timestamps();
                $table->softDeletes();

                $table->index(['school_id', 'status'], 'sc_school_status_idx');
            });
        }

        // 17. Club Membership Rosters
        if (!Schema::hasTable('club_memberships')) {
            Schema::create('club_memberships', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('club_id')->constrained('school_clubs')->cascadeOnDelete();
                $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
                $table->string('role', 40)->default('member'); // president, chairperson, secretary, treasurer, organizing_secretary, committee_member, member
                $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->nullOnDelete();
                $table->date('joined_date')->nullable();
                $table->string('status', 30)->default('active'); // active, alumni, suspended
                $table->timestamps();

                $table->unique(['club_id', 'student_id'], 'cm_club_student_unique');
                $table->index(['school_id', 'student_id'], 'cm_school_student_idx');
            });
        }

        // 18. Student Achievements & Evidence Vault
        if (!Schema::hasTable('student_achievements')) {
            Schema::create('student_achievements', function (Blueprint $table) {
                $table->id();
                $table->foreignId('school_id')->constrained()->cascadeOnDelete();
                $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
                $table->foreignId('activity_id')->nullable()->constrained('activities')->nullOnDelete();
                $table->foreignId('cocurricular_event_id')->nullable()->constrained('cocurricular_events')->nullOnDelete();
                $table->foreignId('academic_year_id')->nullable()->constrained('academic_years')->nullOnDelete();
                $table->string('term', 30)->nullable();
                $table->string('award_title', 200);
                $table->string('award_type', 40)->default('certificate_of_merit'); // trophy, gold_medal, silver_medal, bronze_medal, certificate_of_merit, honorable_mention, best_adjudicated, leadership_award, participation
                $table->string('competition_level', 40)->default('school'); // school, zonal, sub_county, county, regional, national, eassrc, international
                $table->string('position_rank', 30)->nullable();
                $table->text('citation')->nullable();
                $table->string('certificate_number', 100)->nullable();
                $table->string('evidence_file_path', 255)->nullable();
                $table->foreignId('verified_by')->nullable()->constrained('staff')->nullOnDelete();
                $table->date('awarded_date');
                $table->timestamps();
                $table->softDeletes();

                $table->index(['school_id', 'student_id', 'awarded_date'], 'sa_school_student_date_idx');
            });
        }

        // 19. National Co-Curricular Calendar (MoE circulars, dates, venues, hosts)
        if (!Schema::hasTable('national_cocurricular_calendars')) {
            Schema::create('national_cocurricular_calendars', function (Blueprint $table) {
                $table->id();
                $table->string('academic_year', 20)->default('2026');
                $table->string('term', 30)->default('Term 1');
                $table->string('category_name', 100);
                $table->string('activity_name', 150);
                $table->string('education_level', 30)->default('secondary'); // primary, jss, secondary, special
                $table->string('age_bracket', 30)->default('under_19');
                $table->string('competition_level', 40)->default('national'); // zonal, sub_county, county, regional, national, eassrc
                $table->date('start_date');
                $table->date('end_date')->nullable();
                $table->date('reporting_date')->nullable();
                $table->date('departure_date')->nullable();
                $table->string('venue', 150)->nullable();
                $table->string('host_county', 100)->nullable();
                $table->string('host_region', 100)->nullable();
                $table->string('circular_reference', 100)->nullable();
                $table->text('remarks')->nullable();
                $table->timestamps();

                $table->index(['academic_year', 'term', 'education_level'], 'ncc_year_term_level_idx');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('national_cocurricular_calendars');
        Schema::dropIfExists('student_achievements');
        Schema::dropIfExists('club_memberships');
        Schema::dropIfExists('school_clubs');
        Schema::dropIfExists('performance_scores');
        Schema::dropIfExists('performance_adjudications');
        Schema::dropIfExists('adjudication_rubric_items');
        Schema::dropIfExists('adjudication_rubrics');
        Schema::dropIfExists('measurable_results');
        Schema::dropIfExists('activity_fixtures');
        Schema::dropIfExists('event_participants');
        Schema::dropIfExists('cocurricular_events');
        Schema::dropIfExists('activity_team_members');
        Schema::dropIfExists('activity_teams');
        Schema::dropIfExists('activities');
        Schema::dropIfExists('house_point_logs');
        Schema::dropIfExists('house_point_rules');
        Schema::dropIfExists('activity_houses');
        Schema::dropIfExists('activity_categories');
    }
};