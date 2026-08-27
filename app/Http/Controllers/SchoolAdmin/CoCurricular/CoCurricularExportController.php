<?php

namespace App\Http\Controllers\SchoolAdmin\CoCurricular;

use App\Http\Controllers\Controller;
use App\Models\ActivityTeam;
use App\Models\CocurricularEvent;
use App\Models\PerformanceAdjudication;
use App\Models\School;
use App\Models\Student;
use App\Models\StudentAchievement;
use App\Services\CoCurricularService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class CoCurricularExportController extends Controller
{
    public function exportTeamListPdf(Request $request, ActivityTeam $team)
    {
        $schoolId = $request->user()->school_id;
        abort_unless((int)$team->school_id === (int)$schoolId, 403);

        $team->load(['activity', 'coach', 'captain', 'members.student.schoolClass']);
        $school = School::find($schoolId);

        $pdf = Pdf::loadView('exports.cocurricular.team_sheet', [
            'team'   => $team,
            'school' => $school,
        ])->setPaper('a4', 'portrait');

        return $pdf->download("Team_Sheet_{$team->name}.pdf");
    }

    public function exportEventEntryPdf(Request $request, CocurricularEvent $event)
    {
        $schoolId = $request->user()->school_id;
        abort_unless((int)$event->school_id === (int)$schoolId, 403);

        $event->load(['activity', 'category', 'participants.student.schoolClass', 'participants.team']);
        $school = School::find($schoolId);

        $pdf = Pdf::loadView('exports.cocurricular.event_entry_sheet', [
            'event'  => $event,
            'school' => $school,
        ])->setPaper('a4', 'portrait');

        return $pdf->download("Event_Entry_{$event->id}.pdf");
    }

    public function exportAdjudicationPdf(Request $request, PerformanceAdjudication $adjudication)
    {
        $schoolId = $request->user()->school_id;
        abort_unless((int)$adjudication->school_id === (int)$schoolId, 403);

        $adjudication->load(['participant.student.schoolClass', 'participant.event', 'rubric.items', 'itemScores.rubricItem']);
        $school = School::find($schoolId);

        $pdf = Pdf::loadView('exports.cocurricular.adjudication_sheet', [
            'adjudication' => $adjudication,
            'school'       => $school,
        ])->setPaper('a4', 'portrait');

        return $pdf->download("Adjudication_Scorecard_{$adjudication->id}.pdf");
    }

    public function exportHouseStandingsPdf(Request $request)
    {
        $schoolId = $request->user()->school_id;
        $houses = CoCurricularService::recalculateHouseStandings($schoolId);
        $school = School::find($schoolId);

        $pdf = Pdf::loadView('exports.cocurricular.house_standings', [
            'houses' => $houses,
            'school' => $school,
        ])->setPaper('a4', 'portrait');

        return $pdf->download("House_Championship_Standings.pdf");
    }

    public function exportTalentPassportPdf(Request $request, Student $student)
    {
        $schoolId = $request->user()->school_id;
        abort_unless((int)$student->school_id === (int)$schoolId, 403);

        $passport = CoCurricularService::getStudentTalentPassport($student->id, $schoolId);
        $school = School::find($schoolId);

        $pdf = Pdf::loadView('exports.cocurricular.talent_passport', [
            'passport' => $passport,
            'school'   => $school,
        ])->setPaper('a4', 'portrait');

        return $pdf->download("Talent_Passport_{$student->admission_no}.pdf");
    }

    public function exportCertificatePdf(Request $request, StudentAchievement $achievement)
    {
        $schoolId = $request->user()->school_id;
        abort_unless((int)$achievement->school_id === (int)$schoolId, 403);

        $achievement->load(['student.schoolClass', 'activity', 'verifier']);
        $school = School::find($schoolId);

        $pdf = Pdf::loadView('exports.cocurricular.certificate', [
            'achievement' => $achievement,
            'school'      => $school,
        ])->setPaper('a4', 'landscape');

        return $pdf->download("Certificate_{$achievement->id}.pdf");
    }

    public function exportRosterCsv(Request $request): StreamedResponse
    {
        $schoolId = $request->user()->school_id;

        $achievements = StudentAchievement::where('school_id', $schoolId)
            ->with(['student.schoolClass', 'activity'])
            ->get();

        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="CoCurricular_Achievements.csv"',
        ];

        return response()->stream(function () use ($achievements) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Admission No', 'Student Name', 'Class', 'Activity', 'Award Title', 'Type', 'Level', 'Position', 'Date']);

            foreach ($achievements as $a) {
                fputcsv($handle, [
                    $a->student->admission_no ?? '',
                    ($a->student->first_name ?? '') . ' ' . ($a->student->last_name ?? ''),
                    $a->student->schoolClass->name ?? '',
                    $a->activity->name ?? '',
                    $a->award_title,
                    $a->award_type,
                    $a->competition_level,
                    $a->position_rank,
                    $a->awarded_date->toDateString(),
                ]);
            }

            fclose($handle);
        }, 200, $headers);
    }
}