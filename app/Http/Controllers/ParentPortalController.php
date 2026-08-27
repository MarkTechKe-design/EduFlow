<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\CocurricularEvent;
use App\Models\FeeInvoice;
use App\Models\FeePayment;
use App\Models\Guardian;
use App\Models\School;
use App\Models\Student;
use App\Services\CoCurricularService;
use App\Support\Authorization\ModuleAccessService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class ParentPortalController extends Controller
{
    private function getParentChildren(Request $request)
    {
        $user = $request->user();
        if (!$user) return collect([]);

        $schoolId = $user->school_id;

        // 1. Direct children relationship on User model if exists
        if (method_exists($user, 'children') && $user->children()->exists()) {
            $relation = $user->children();
            if ($schoolId && Schema::hasColumn($relation->getModel()->getTable(), 'school_id')) {
                $relation->where($relation->getModel()->getTable() . '.school_id', $schoolId);
            }
            return method_exists($relation->getModel(), 'schoolClass')
                ? $relation->with(['schoolClass', 'section'])->get()
                : $relation->get();
        }

        // 2. Guardian table resolution (Strictly mapping guardians.user_id / email -> guardians.id)
        if (Schema::hasTable('guardians')) {
            $guardianIds = Guardian::withoutGlobalScopes()
                ->where('school_id', $schoolId)
                ->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                    if (!empty($user->email)) {
                        $q->orWhere('email', $user->email);
                    }
                })
                ->pluck('id');

            if ($guardianIds->isNotEmpty()) {
                $query = Student::withoutGlobalScopes()->where('school_id', $schoolId);

                $query->where(function ($q) use ($guardianIds, $schoolId) {
                    $q->whereIn('guardian_id', $guardianIds);

                    if (Schema::hasTable('student_guardians')) {
                        $q->orWhereExists(function ($sub) use ($guardianIds, $schoolId) {
                            $sub->select(DB::raw(1))
                                ->from('student_guardians')
                                ->whereColumn('student_guardians.student_id', 'students.id')
                                ->where('student_guardians.school_id', $schoolId)
                                ->whereIn('student_guardians.guardian_id', $guardianIds);
                        });
                    }
                });

                return method_exists(Student::class, 'schoolClass')
                    ? $query->with(['schoolClass', 'section'])->get()
                    : $query->get();
            }
        }

        // 3. Fallback to students table direct parent_id or email linkage
        if (Schema::hasTable('students')) {
            $query = Student::withoutGlobalScopes()->where('school_id', $schoolId);

            $hasFilter = false;
            $query->where(function ($q) use ($user, &$hasFilter) {
                if (Schema::hasColumn('students', 'parent_id')) {
                    $q->orWhere('parent_id', $user->id);
                    $hasFilter = true;
                }
                if (Schema::hasColumn('students', 'parent_email') && !empty($user->email)) {
                    $q->orWhere('parent_email', $user->email);
                    $hasFilter = true;
                }
                if (Schema::hasColumn('students', 'guardian_email') && !empty($user->email)) {
                    $q->orWhere('guardian_email', $user->email);
                    $hasFilter = true;
                }
            });

            if ($hasFilter) {
                return method_exists(Student::class, 'schoolClass')
                    ? $query->with(['schoolClass', 'section'])->get()
                    : $query->get();
            }
        }

        return collect([]);
    }

    public function index(Request $request): Response
    {
        return $this->dashboard($request);
    }

    public function dashboard(Request $request): Response
    {
        $user = $request->user();
        $children = $this->getParentChildren($request);

        $childrenTalent = [];
        $isCocurricularEnabled = app(ModuleAccessService::class)->isEnabledForUser($user, 'cocurricular');
        if ($isCocurricularEnabled && $children->isNotEmpty()) {
            foreach ($children as $child) {
                $passport = CoCurricularService::getStudentTalentPassport($child->id, $user->school_id);
                $childrenTalent[$child->id] = [
                    'summary'      => $passport['summary'],
                    'house'        => $passport['house'] ? [
                        'name'         => $passport['house']->name,
                        'total_points' => (float) $passport['house']->total_points,
                        'color_hex'    => $passport['house']->color_hex ?? '#4F46E5',
                    ] : null,
                    'latest_achievement' => $passport['achievements']->first() ? [
                        'title'         => $passport['achievements']->first()->title,
                        'activity_name' => $passport['achievements']->first()->activity->name ?? 'Activity',
                        'award_level'   => $passport['achievements']->first()->award_level ?? 'Participation',
                    ] : null,
                    'teams_count'  => $passport['teams']->count(),
                    'clubs_count'  => $passport['clubs']->count(),
                ];
            }
        }

        return Inertia::render('Parent/Dashboard', [
            'parent'           => $user,
            'children'         => $children,
            'childrenTalent'   => $isCocurricularEnabled ? $childrenTalent : null,
            'announcements'    => [],
            'recentActivities' => [],
            'stats'            => [
                'totalChildren'     => $children->count(),
                'pendingFees'       => 0,
                'overallAttendance' => 96,
            ],
        ]);
    }

    public function cocurricular(Request $request): Response
    {
        $user = $request->user();
        $schoolId = $user->school_id;
        $children = $this->getParentChildren($request);

        $selectedChildId = $request->input('student_id', $children->first()->id ?? null);
        $selectedChild = $children->firstWhere('id', (int)$selectedChildId) ?? $children->first();

        $passport = null;
        if ($selectedChild) {
            $passport = CoCurricularService::getStudentTalentPassport($selectedChild->id, $schoolId);
        }

        $houseStandings = CoCurricularService::recalculateHouseStandings($schoolId);

        $upcomingEvents = CocurricularEvent::where('school_id', $schoolId)
            ->with(['activity:id,name,type', 'category:id,name'])
            ->where('start_date', '>=', now()->toDateString())
            ->orderBy('start_date')
            ->take(5)
            ->get();

        return Inertia::render('Parent/CoCurricular', [
            'children'        => $children,
            'selectedChildId' => $selectedChild?->id,
            'passport'        => $passport,
            'houses'          => $houseStandings,
            'upcomingEvents'  => $upcomingEvents,
        ]);
    }

    public function exportTalentPassportPdf(Request $request, Student $student)
    {
        $user = $request->user();
        $schoolId = $user->school_id;

        abort_unless((int)$student->school_id === (int)$schoolId, 403);

        $children = $this->getParentChildren($request);
        $isAuthorizedChild = $children->contains(fn ($c) => (int)$c->id === (int)$student->id);

        abort_unless($isAuthorizedChild, 403);

        $passport = CoCurricularService::getStudentTalentPassport($student->id, $schoolId);
        $school = School::find($schoolId);

        $pdf = Pdf::loadView('exports.cocurricular.talent_passport', [
            'passport' => $passport,
            'school'   => $school,
        ])->setPaper('a4', 'portrait');

        return $pdf->download("Talent_Passport_{$student->admission_no}.pdf");
    }

    public function attendance(Request $request): Response
    {
        $children = $this->getParentChildren($request);
        $selectedChildId = $request->input('student_id', $children->first()->id ?? null);

        $records = collect([]);
        if ($selectedChildId && Schema::hasTable('attendances')) {
            $records = Attendance::query()
                ->where('student_id', $selectedChildId)
                ->orderByDesc('date')
                ->limit(30)
                ->get();
        }

        return Inertia::render('Parent/Attendance', [
            'children'        => $children,
            'selectedChildId' => $selectedChildId,
            'records'         => $records,
            'summary'         => [
                'present' => 88,
                'absent'  => 2,
                'late'    => 1,
                'excused' => 1,
            ],
        ]);
    }

    public function fees(Request $request): Response
    {
        $children = $this->getParentChildren($request);
        $selectedChildId = $request->input('student_id', $children->first()->id ?? null);

        return Inertia::render('Parent/Fees', [
            'children'        => $children,
            'selectedChildId' => $selectedChildId,
            'invoices'        => collect([]),
            'payments'        => collect([]),
            'summary'         => [
                'totalBilled' => 0,
                'totalPaid'   => 0,
                'totalDue'    => 0,
            ],
        ]);
    }

    public function announcements(Request $request): Response
    {
        return Inertia::render('Parent/Announcements', [
            'announcements' => [],
            'children'      => $this->getParentChildren($request),
        ]);
    }

    public function notices(Request $request): Response
    {
        return $this->announcements($request);
    }

    public function results(Request $request): Response
    {
        $children = $this->getParentChildren($request);
        return Inertia::render('Parent/Results', [
            'children'        => $children,
            'selectedChildId' => $request->input('student_id', $children->first()->id ?? null),
            'assessments'     => [],
            'reportCards'     => [],
        ]);
    }

    public function grades(Request $request): Response
    {
        return $this->results($request);
    }

    public function timetable(Request $request): Response
    {
        return Inertia::render('Parent/Timetable', [
            'children' => $this->getParentChildren($request),
            'schedule' => [],
        ]);
    }

    public function homework(Request $request): Response
    {
        return Inertia::render('Parent/Homework', [
            'children'    => $this->getParentChildren($request),
            'assignments' => [],
        ]);
    }

    public function messages(Request $request): Response
    {
        return Inertia::render('Parent/Messages', [
            'threads' => [],
        ]);
    }

    public function profile(Request $request): Response
    {
        return Inertia::render('Parent/Profile', [
            'user' => $request->user(),
        ]);
    }

    public function __call($method, $parameters)
    {
        $request = request();
        $targetPage = 'Parent/' . ucfirst($method);

        return Inertia::render($targetPage, [
            'parent'   => $request->user(),
            'children' => $this->getParentChildren($request),
        ]);
    }
}