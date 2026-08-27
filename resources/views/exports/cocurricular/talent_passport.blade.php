<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Learner Talent Passport - {{ $passport['student']->admission_no }}</title>
    <style>
        body { font-family: Helvetica, Arial, sans-serif; font-size: 11px; color: #1e293b; line-height: 1.4; margin: 20px; }
        .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 14px; }
        .school-name { font-size: 15px; font-weight: bold; text-transform: uppercase; color: #0f172a; }
        .doc-title { font-size: 12px; font-weight: bold; color: #059669; text-transform: uppercase; margin-top: 3px; }
        .section-title { font-size: 12px; font-weight: bold; color: #0f172a; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; padding-bottom: 3px; margin-top: 14px; margin-bottom: 8px; }
        .data-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .data-table th, .data-table td { border: 1px solid #cbd5e1; padding: 5px 7px; text-align: left; }
        .data-table th { background-color: #f8fafc; font-weight: bold; font-size: 10px; text-transform: uppercase; color: #475569; }
        .summary-box { background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 8px; border-radius: 4px; margin-bottom: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="school-name">{{ $school->name ?? 'EduFlow School Management Platform' }}</div>
        <div class="doc-title">Official Learner Talent Passport & Co-Curricular Portfolio</div>
        <div>Longitudinal Talent & Extracurricular Record &bull; Generated: {{ date('d M Y') }}</div>
    </div>

    <div class="summary-box">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="width: 15%; font-weight: bold;">Learner Name:</td>
                <td style="width: 35%;">{{ $passport['student']->first_name }} {{ $passport['student']->last_name }}</td>
                <td style="width: 15%; font-weight: bold;">Admission No:</td>
                <td style="width: 35%;">{{ $passport['student']->admission_no }}</td>
            </tr>
            <tr>
                <td style="font-weight: bold;">Class / Stream:</td>
                <td>{{ $passport['student']->schoolClass->name ?? '—' }}</td>
                <td style="font-weight: bold;">Accomplishments:</td>
                <td><strong>{{ $passport['summary']['total_achievements'] }} Awards</strong> &bull; {{ $passport['summary']['personal_bests'] }} Personal Bests</td>
            </tr>
        </table>
    </div>

    <div class="section-title">1. Team Participations & Squad Deployments</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Team Name</th>
                <th>Activity</th>
                <th>Age Group</th>
                <th>Assigned Role</th>
                <th>Jersey</th>
            </tr>
        </thead>
        <tbody>
            @forelse($passport['teams'] as $team)
                <tr>
                    <td><strong>{{ $team->team_name }}</strong></td>
                    <td>{{ $team->activity_name }}</td>
                    <td>{{ strtoupper($team->age_group) }}</td>
                    <td>{{ ucfirst($team->role) }} {{ $team->position_name ? '(' . $team->position_name . ')' : '' }}</td>
                    <td>{{ $team->jersey_number ?? '—' }}</td>
                </tr>
            @empty
                <tr><td colspan="5" style="text-align: center; color: #64748b;">No sports team deployments recorded.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="section-title">2. Track, Field & Athletics Records</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Discipline</th>
                <th>Round</th>
                <th>Performance Metric</th>
                <th>Position</th>
                <th>Status / Badges</th>
                <th>Date</th>
            </tr>
        </thead>
        <tbody>
            @forelse($passport['measurable_results'] as $res)
                <tr>
                    <td><strong>{{ $res->activity->name ?? '—' }}</strong></td>
                    <td>{{ ucfirst($res->event_round) }}</td>
                    <td>
                        @if($res->metric_type === 'time') {{ $res->time_recorded_seconds }}s
                        @elseif($res->metric_type === 'distance') {{ $res->distance_recorded_meters }}m
                        @elseif($res->metric_type === 'height') {{ $res->height_recorded_meters }}m
                        @else {{ $res->points_score }} pts @endif
                    </td>
                    <td>{{ $res->final_position ? '#' . $res->final_position : '—' }}</td>
                    <td>
                        @if($res->is_school_record) <strong>[School Record]</strong> @endif
                        @if($res->is_personal_best) [Personal Best] @endif
                    </td>
                    <td>{{ $res->recorded_date ? $res->recorded_date->format('d M Y') : '—' }}</td>
                </tr>
            @empty
                <tr><td colspan="6" style="text-align: center; color: #64748b;">No individual athletic records recorded.</td></tr>
            @endforelse
        </tbody>
    </table>

    <div class="section-title">3. Verified Accolades, Awards & Honors</div>
    <table class="data-table">
        <thead>
            <tr>
                <th>Honor / Award</th>
                <th>Activity / Event</th>
                <th>Competition Level</th>
                <th>Rank</th>
                <th>Date Conferred</th>
            </tr>
        </thead>
        <tbody>
            @forelse($passport['achievements'] as $ach)
                <tr>
                    <td><strong>{{ $ach->award_title }}</strong> ({{ ucwords(str_replace('_', ' ', $ach->award_type)) }})</td>
                    <td>{{ $ach->activity->name ?? ($ach->event->title ?? '—') }}</td>
                    <td>{{ ucfirst($ach->competition_level) }}</td>
                    <td>{{ $ach->position_rank ?? '—' }}</td>
                    <td>{{ $ach->awarded_date->format('d M Y') }}</td>
                </tr>
            @empty
                <tr><td colspan="5" style="text-align: center; color: #64748b;">No formal achievements recorded.</td></tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>