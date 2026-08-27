<?php

namespace App\Http\Controllers;

use App\Models\ActivityHouse;
use App\Models\Attendance;
use App\Models\CocurricularEvent;
use App\Models\FeeLedgerEntry;
use App\Models\FeePayment;
use App\Models\School;
use App\Models\Student;
use App\Services\CoCurricularService;
use App\Support\Authorization\ModuleAccessService;
use App\Services\StudentLedgerService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class StudentPortalController extends Controller
{
    private function getAuthenticatedStudent(Request $request): ?Student
    {
        $user = $request->user();
        if (!$user) return null;

        return Student::where('school_id', $user->school_id)
            ->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere('id', $user->id);
            })
            ->with(['schoolClass:id,name', 'section:id,name'])
            ->first();
    }

    public function index(Request $request): Response
    {
        return $this->dashboard($request);
    }

    public function dashboard(Request $request): Response
    {
        $user = $request->user();
        $student = $this->getAuthenticatedStudent($request);

        $talentSummary = null;
        if ($student && app(ModuleAccessService::class)->isEnabledForUser($user, 'cocurricular')) {
            $passport = CoCurricularService::getStudentTalentPassport($student->id, $user->school_id);
            $talentSummary = [
                'summary'      => $passport['summary'],
                'house'        => $passport['house'] ? [
                    'name'         => $passport['house']->name,
                    'total_points' => (float) $passport['house']->total_points,
                    'color_hex'    => $passport['house']->color_hex ?? '#4F46E5',
                ] : null,
                'achievements' => $passport['achievements']->take(3)->map(fn ($a) => [
                    'title'         => $a->title,
                    'activity_name' => $a->activity->name ?? 'Activity',
                    'award_level'   => $a->award_level ?? 'Participation',
                    'awarded_date'  => $a->awarded_date,
                ]),
                'teams'        => $passport['teams']->take(3)->map(fn ($t) => [
                    'team_name'     => $t->team_name,
                    'activity_name' => $t->activity_name,
                    'role'          => $t->role,
                ]),
                'clubs'        => $passport['clubs']->take(3)->map(fn ($c) => [
                    'club_name'     => $c->club_name,
                    'role'          => $c->role,
                ]),
            ];
        }

        return Inertia::render('Student/Dashboard', [
            'student'             => $user,
            'studentProfile'      => $student ? [
                'id'               => $student->id,
                'name'             => "{$student->first_name} {$student->last_name}",
                'admission_number' => $student->admission_no,
                'grade'            => $student->schoolClass->name ?? 'Enrolled',
                'stream'           => $student->section->name ?? 'A',
            ] : null,
            'talentSummary'       => $talentSummary,
            'attendanceSummary'   => ['present' => 94, 'absent' => 2, 'late' => 1],
            'upcomingAssignments' => [],
            'recentGrades'        => [],
            'announcements'       => [],
        ]);
    }

    public function cocurricular(Request $request): Response
    {
        $user = $request->user();
        $schoolId = $user->school_id;
        $student = $this->getAuthenticatedStudent($request);

        if (!$student) {
            return Inertia::render('Student/CoCurricular', [
                'student'        => $user,
                'passport'       => null,
                'houses'         => [],
                'upcomingEvents' => [],
            ]);
        }

        $passport = CoCurricularService::getStudentTalentPassport($student->id, $schoolId);
        $houseStandings = CoCurricularService::recalculateHouseStandings($schoolId);

        $upcomingEvents = CocurricularEvent::where('school_id', $schoolId)
            ->with(['activity:id,name,type', 'category:id,name'])
            ->where('start_date', '>=', now()->toDateString())
            ->orderBy('start_date')
            ->take(5)
            ->get();

        return Inertia::render('Student/CoCurricular', [
            'student'        => $student,
            'passport'       => $passport,
            'houses'         => $houseStandings,
            'upcomingEvents' => $upcomingEvents,
        ]);
    }

    public function exportTalentPassportPdf(Request $request)
    {
        $user = $request->user();
        $student = $this->getAuthenticatedStudent($request);

        abort_unless($student && (int)$student->school_id === (int)$user->school_id, 403);

        $passport = CoCurricularService::getStudentTalentPassport($student->id, $user->school_id);
        $school = School::find($user->school_id);

        $pdf = Pdf::loadView('exports.cocurricular.talent_passport', [
            'passport' => $passport,
            'school'   => $school,
        ])->setPaper('a4', 'portrait');

        return $pdf->download("Talent_Passport_{$student->admission_no}.pdf");
    }

    public function attendance(Request $request): Response
    {
        return Inertia::render('Student/Attendance', [
            'student' => $request->user(),
            'records' => [],
            'summary' => ['present' => 94, 'absent' => 2, 'late' => 1],
        ]);
    }

    public function timetable(Request $request): Response
    {
        return Inertia::render('Student/Timetable', [
            'schedule' => [],
        ]);
    }

    public function homework(Request $request): Response
    {
        return Inertia::render('Student/Homework', [
            'tasks' => [],
        ]);
    }

    public function results(Request $request): Response
    {
        return Inertia::render('Student/Results', [
            'scores' => [],
            'reportCards' => [],
        ]);
    }

    public function announcements(Request $request): Response
    {
        return Inertia::render('Student/Announcements', [
            'announcements' => [],
        ]);
    }

    public function fees(Request $request): Response
    {
        $user = $request->user();
        $schoolId = $user->school_id;
        $student = $this->getAuthenticatedStudent($request);

        $studentId = $student?->id ?? $user->id;
        $balance = StudentLedgerService::computeBalance($studentId, $schoolId);

        $payments = FeePayment::where('school_id', $schoolId)
            ->where('student_id', $studentId)
            ->orderByDesc('payment_date')
            ->get();

        $ledgerEntries = Schema::hasTable('fee_ledger_entries')
            ? FeeLedgerEntry::where('school_id', $schoolId)->where('student_id', $studentId)->orderByDesc('entry_date')->get()
            : collect([]);

        return Inertia::render('Student/Fees', [
            'student'       => $student ?? $user,
            'balance'       => $balance,
            'payments'      => $payments,
            'ledgerEntries' => $ledgerEntries,
        ]);
    }

    public function profile(Request $request): Response
    {
        return Inertia::render('Student/Profile', [
            'student' => $request->user(),
        ]);
    }

    public function __call($method, $parameters)
    {
        $request = request();
        $targetPage = 'Student/' . ucfirst($method);

        return Inertia::render($targetPage, [
            'student' => $request->user(),
        ]);
    }
}