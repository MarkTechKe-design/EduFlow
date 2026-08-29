<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\ActivityHouse;
use App\Models\ActivityTeam;
use App\Models\CocurricularEvent;
use App\Models\EventParticipant;
use App\Models\HousePointLog;
use App\Models\HousePointRule;
use App\Models\MeasurableResult;
use App\Models\PerformanceAdjudication;
use App\Models\SchoolClub;
use App\Models\Student;
use App\Models\StudentAchievement;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CoCurricularService
{
    /**
     * Compute and sync current standings for all houses within a school.
     */
    public static function recalculateHouseStandings(int $schoolId): Collection
    {
        $houses = ActivityHouse::withoutGlobalScopes()->where('school_id', $schoolId)->get();

        foreach ($houses as $house) {
            $sum = (float) HousePointLog::withoutGlobalScopes()
                ->where('school_id', $schoolId)
                ->where('house_id', $house->id)
                ->sum('points');

            $house->update(['total_points' => $sum]);
        }

        return ActivityHouse::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('is_active', true)
            ->orderByDesc('total_points')
            ->get();
    }

    /**
     * Award house points based on rules.
     */
    public static function awardHousePoints(
        int $schoolId,
        int $houseId,
        string $positionRank,
        string $reason,
        ?int $eventId = null,
        ?int $activityId = null,
        ?int $studentId = null,
        ?int $awardedByUserId = null
    ): HousePointLog {
        $rule = HousePointRule::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('position_rank', $positionRank)
            ->where('is_active', true)
            ->first();

        $points = $rule ? $rule->points : 0.00;

        $log = HousePointLog::create([
            'school_id'             => $schoolId,
            'house_id'              => $houseId,
            'cocurricular_event_id' => $eventId,
            'activity_id'           => $activityId,
            'student_id'            => $studentId,
            'points'                => $points,
            'reason'                => $reason,
            'awarded_by'            => $awardedByUserId,
        ]);

        self::recalculateHouseStandings($schoolId);

        return $log;
    }

    /**
     * Analyze and flag personal bests, season bests, and school records for athletics results.
     */
    public static function evaluateAthleticsRecord(MeasurableResult $result): void
    {
        $schoolId = $result->school_id;
        $activityId = $result->activity_id;
        $studentId = $result->student_id;
        $currentYear = date('Y', strtotime($result->recorded_date));

        $isPB = false;
        $isSB = false;
        $isSchoolRecord = false;

        if ($result->metric_type === 'time' && $result->time_recorded_seconds > 0) {
            $bestPB = MeasurableResult::withoutGlobalScopes()
                ->where('school_id', $schoolId)
                ->where('activity_id', $activityId)
                ->where('student_id', $studentId)
                ->where('id', '!=', $result->id)
                ->whereNotNull('time_recorded_seconds')
                ->min('time_recorded_seconds');

            if ($bestPB === null || $result->time_recorded_seconds <= $bestPB) {
                $isPB = true;
            }

            $bestSB = MeasurableResult::withoutGlobalScopes()
                ->where('school_id', $schoolId)
                ->where('activity_id', $activityId)
                ->where('student_id', $studentId)
                ->whereYear('recorded_date', $currentYear)
                ->where('id', '!=', $result->id)
                ->whereNotNull('time_recorded_seconds')
                ->min('time_recorded_seconds');

            if ($bestSB === null || $result->time_recorded_seconds <= $bestSB) {
                $isSB = true;
            }

            $bestSchool = MeasurableResult::withoutGlobalScopes()
                ->where('school_id', $schoolId)
                ->where('activity_id', $activityId)
                ->where('id', '!=', $result->id)
                ->whereNotNull('time_recorded_seconds')
                ->min('time_recorded_seconds');

            if ($bestSchool === null || $result->time_recorded_seconds <= $bestSchool) {
                $isSchoolRecord = true;
            }
        } elseif (in_array($result->metric_type, ['distance', 'height', 'points'], true)) {
            $val = $result->metric_type === 'distance' ? $result->distance_recorded_meters : ($result->metric_type === 'height' ? $result->height_recorded_meters : $result->points_score);

            if ($val > 0) {
                $col = $result->metric_type === 'distance' ? 'distance_recorded_meters' : ($result->metric_type === 'height' ? 'height_recorded_meters' : 'points_score');

                $bestPB = MeasurableResult::withoutGlobalScopes()
                    ->where('school_id', $schoolId)
                    ->where('activity_id', $activityId)
                    ->where('student_id', $studentId)
                    ->where('id', '!=', $result->id)
                    ->max($col);

                if ($bestPB === null || $val >= $bestPB) {
                    $isPB = true;
                }

                $bestSchool = MeasurableResult::withoutGlobalScopes()
                    ->where('school_id', $schoolId)
                    ->where('activity_id', $activityId)
                    ->where('id', '!=', $result->id)
                    ->max($col);

                if ($bestSchool === null || $val >= $bestSchool) {
                    $isSchoolRecord = true;
                }
            }
        }

        $result->update([
            'is_personal_best' => $isPB,
            'is_season_best'   => $isSB,
            'is_school_record' => $isSchoolRecord,
        ]);
    }

    /**
     * Compute comprehensive longitudinal Talent Passport for a student.
     */
    public static function getStudentTalentPassport(int $studentId, int $schoolId): array
    {
        $student = Student::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->with(['schoolClass:id,name', 'section:id,name'])
            ->findOrFail($studentId);

        $teamMemberships = DB::table('activity_team_members')
            ->join('activity_teams', 'activity_team_members.team_id', '=', 'activity_teams.id')
            ->join('activities', 'activity_teams.activity_id', '=', 'activities.id')
            ->where('activity_team_members.school_id', $schoolId)
            ->where('activity_team_members.student_id', $studentId)
            ->select(
                'activity_teams.id as team_id',
                'activity_teams.name as team_name',
                'activity_teams.age_group',
                'activities.name as activity_name',
                'activities.type as activity_type',
                'activity_team_members.role',
                'activity_team_members.jersey_number',
                'activity_team_members.position_name',
                'activity_team_members.status'
            )
            ->get();

        $clubMemberships = DB::table('club_memberships')
            ->join('school_clubs', 'club_memberships.club_id', '=', 'school_clubs.id')
            ->where('club_memberships.school_id', $schoolId)
            ->where('club_memberships.student_id', $studentId)
            ->select(
                'school_clubs.id as club_id',
                'school_clubs.name as club_name',
                'school_clubs.motto as club_motto',
                'club_memberships.role',
                'club_memberships.joined_date',
                'club_memberships.status'
            )
            ->get();

        $measurableHistory = MeasurableResult::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('student_id', $studentId)
            ->with(['activity:id,name', 'participant.event:id,title,competition_level'])
            ->latest('recorded_date')
            ->get();

        $eventParticipations = EventParticipant::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('student_id', $studentId)
            ->with(['event:id,title,start_date,venue,competition_level,status', 'team:id,name', 'house:id,name'])
            ->get();

        $achievements = StudentAchievement::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('student_id', $studentId)
            ->with(['activity:id,name', 'event:id,title,competition_level'])
            ->latest('awarded_date')
            ->get();

        $studentHouse = ActivityHouse::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where(function ($q) use ($studentId) {
                $q->where('captain_student_id', $studentId)
                  ->orWhereHas('teams.members', fn ($m) => $m->where('student_id', $studentId));
            })
            ->first();

        return [
            'student'              => $student,
            'house'                => $studentHouse,
            'teams'                => $teamMemberships,
            'clubs'                => $clubMemberships,
            'measurable_results'   => $measurableHistory,
            'event_participations' => $eventParticipations,
            'achievements'         => $achievements,
            'summary'              => [
                'total_teams'        => $teamMemberships->count(),
                'total_clubs'        => $clubMemberships->count(),
                'total_events'       => $eventParticipations->count(),
                'total_achievements' => $achievements->count(),
                'personal_bests'     => $measurableHistory->where('is_personal_best', true)->count(),
                'school_records'     => $measurableHistory->where('is_school_record', true)->count(),
            ],
        ];
    }

    /**
     * Compute lightweight executive summary for the School Admin Dashboard.
     */
    public static function getSchoolDashboardSummary(int $schoolId): array
    {
        $activeTeams = ActivityTeam::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('status', 'active')
            ->count();

        $activeClubs = SchoolClub::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('status', 'active')
            ->count();

        $upcomingEvents = CocurricularEvent::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('start_date', '>=', now()->startOfDay())
            ->count();

        $leadingHouse = ActivityHouse::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('is_active', true)
            ->orderByDesc('total_points')
            ->first();

        $recentAchievementsCount = StudentAchievement::withoutGlobalScopes()
            ->where('school_id', $schoolId)
            ->where('awarded_date', '>=', now()->subDays(30))
            ->count();

        return [
            'active_teams_count'        => $activeTeams,
            'active_clubs_count'        => $activeClubs,
            'upcoming_events_count'     => $upcomingEvents,
            'leading_house'             => $leadingHouse ? [
                'name'         => $leadingHouse->name,
                'total_points' => (float) $leadingHouse->total_points,
                'color_hex'    => $leadingHouse->color_hex ?? '#4F46E5',
            ] : null,
            'recent_achievements_count' => $recentAchievementsCount,
        ];
    }
}
