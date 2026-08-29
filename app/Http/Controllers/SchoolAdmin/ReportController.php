<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Exam;
use App\Models\FeePayment;
use App\Models\Homework;
use App\Models\User;
use App\Support\Authorization\RoleCatalog;
use App\Models\Mark;
use App\Models\Payroll;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Staff;
use App\Models\Student;
use App\Models\Subject;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Spatie\Activitylog\Models\Activity;

class ReportController extends Controller
{
    // â”€â”€ Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public function dashboard(Request $request) {
        $this->ensureAuthorized(request());
        $sid = $this->getSchoolId();
        $profile = RoleCatalog::dashboardProfile($request->user() ?? auth()->user() ?? new \App\Models\User());

        $data = match ($profile) {
            'super-admin' => $this->superAdminDashboard(),
            'teacher'     => $this->teacherDashboard($sid),
            'accountant'  => $this->accountantDashboard($sid),
            default       => $this->adminDashboard($sid),
        };
        $role = $profile;

        return Inertia::render('SchoolAdmin/Reports/Dashboard', array_merge($data, ['role' => $role]));
    }

    private function adminDashboard(int $sid): array
    {
        $totalStudents = Student::withoutGlobalScopes()->where('school_id', $sid)->count();
        $totalStaff    = Staff::where('school_id', $sid)->where('status', 'active')->count();

        $todayAtt = Attendance::where('school_id', $sid)->whereDate('date', today())->get();
        $attendancePct = $todayAtt->count()
            ? round($todayAtt->where('status', 'present')->count() / $todayAtt->count() * 100, 1)
            : 0;

        $monthFees = FeePayment::where('school_id', $sid)
            ->whereMonth('payment_date', now()->month)
            ->whereYear('payment_date', now()->year)
            ->sum('amount_paid');

        $pendingFees = FeePayment::where('school_id', $sid)
            ->where('status', 'pending')
            ->sum(DB::raw('amount_due - amount_paid'));

        // Monthly fee collection for last 6 months
        $feeChart = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $feeChart[] = [
                'month'  => $month->format('M'),
                'amount' => (float) FeePayment::where('school_id', $sid)
                    ->whereMonth('payment_date', $month->month)
                    ->whereYear('payment_date', $month->year)
                    ->sum('amount_paid'),
            ];
        }

        // Attendance trend last 7 days
        $attChart = [];
        for ($i = 6; $i >= 0; $i--) {
            $day  = now()->subDays($i);
            $recs = Attendance::where('school_id', $sid)->whereDate('date', $day)->get();
            $attChart[] = [
                'day'     => $day->format('D'),
                'present' => $recs->where('status', 'present')->count(),
                'absent'  => $recs->where('status', 'absent')->count(),
            ];
        }

        $pendingHomework = Homework::where('school_id', $sid)->where('is_active', true)->withCount([
            'submissions as pending_count' => fn ($q) => $q->where('status', 'submitted'),
        ])->get()->sum('pending_count');

        $recentActivity = Activity::with('causer')
            ->where('properties->school_id', $sid)
            ->latest()
            ->take(10)
            ->get();

        return compact('totalStudents', 'totalStaff', 'attendancePct', 'monthFees', 'pendingFees', 'feeChart', 'attChart', 'pendingHomework', 'recentActivity');
    }

    private function teacherDashboard(int $sid): array
    {
        $pending = Homework::where('school_id', $sid)->where('is_active', true)->withCount([
            'submissions as pending_count' => fn ($q) => $q->where('status', 'submitted'),
        ])->get()->sum('pending_count');

        return ['pendingHomework' => $pending, 'totalStudents' => 0, 'totalStaff' => 0, 'attendancePct' => 0, 'monthFees' => 0, 'pendingFees' => 0, 'feeChart' => [], 'attChart' => [], 'recentActivity' => collect()];
    }

    private function accountantDashboard(int $sid): array
    {
        $todayCollection = FeePayment::where('school_id', $sid)->whereDate('payment_date', today())->sum('amount_paid');
        $outstanding     = FeePayment::where('school_id', $sid)->where('status', 'pending')->sum(DB::raw('amount_due - amount_paid'));
        $monthFees       = FeePayment::where('school_id', $sid)->whereMonth('payment_date', now()->month)->whereYear('payment_date', now()->year)->sum('amount_paid');

        $feeChart = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $feeChart[] = [
                'month'  => $month->format('M'),
                'amount' => (float) FeePayment::where('school_id', $sid)->whereMonth('payment_date', $month->month)->whereYear('payment_date', $month->year)->sum('amount_paid'),
            ];
        }

        return ['totalStudents' => 0, 'totalStaff' => 0, 'attendancePct' => 0, 'monthFees' => $monthFees, 'pendingFees' => $outstanding, 'todayCollection' => $todayCollection, 'feeChart' => $feeChart, 'attChart' => [], 'pendingHomework' => 0, 'recentActivity' => collect()];
    }

    private function superAdminDashboard(): array
    {
        $schools  = School::count();
        $students = Student::withoutGlobalScopes()->count();
        $revenue  = FeePayment::sum('amount_paid');

        return ['schools' => $schools, 'totalStudents' => $students, 'totalStaff' => 0, 'attendancePct' => 0, 'monthFees' => $revenue, 'pendingFees' => 0, 'feeChart' => [], 'attChart' => [], 'pendingHomework' => 0, 'recentActivity' => collect()];
    }

    // â”€â”€ Attendance Report â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public function attendance(Request $request)
    {
        $this->ensureAuthorized(request());
        $sid = $this->getSchoolId();

        $query = \App\Models\Attendance::with(['attendable'])
            ->where('school_id', $sid)
            ->when($request->from_date, fn ($q) => $q->whereDate('date', '>=', $request->from_date))
            ->when($request->to_date,   fn ($q) => $q->whereDate('date', '<=', $request->to_date))
            ->when($request->status,    fn ($q) => $q->where('status', $request->status))
            ->when($request->type,      fn ($q) => $q->where('attendable_type', $request->type))
            ->when($request->class_id, fn ($q) => $q->whereHasMorph(
                'attendable',
                [\App\Models\Student::class],
                fn ($sq) => $sq->where('class_id', $request->class_id)
            ));

        $attendances = $query->latest('date')
            ->paginate(25)
            ->through(function ($a) {
                $attendable = $a->attendable;
                $name = $attendable?->user?->name 
                    ?? trim(($attendable?->first_name ?? '') . ' ' . ($attendable?->last_name ?? '')) 
                    ?: 'Unknown';
                $admissionNo = $attendable?->admission_number ?? $attendable?->admission_no ?? '-';
                $className = $attendable?->schoolClass?->name ?? '-';

                return [
                    'id'              => $a->id,
                    'date'            => $a->date ? \Carbon\Carbon::parse($a->date)->format('Y-m-d') : null,
                    'status'          => $a->status,
                    'remarks'         => $a->remarks,
                    'attendable_type' => class_basename($a->attendable_type ?? ''),
                    'name'            => $name,
                    'admission_no'    => $admissionNo,
                    'class'           => $className,
                ];
            });

        $summary = \App\Models\Attendance::where('school_id', $sid)
            ->when($request->from_date, fn ($q) => $q->whereDate('date', '>=', $request->from_date))
            ->when($request->to_date,   fn ($q) => $q->whereDate('date', '<=', $request->to_date))
            ->when($request->class_id, fn ($q) => $q->whereHasMorph(
                'attendable',
                [\App\Models\Student::class],
                fn ($sq) => $sq->where('class_id', $request->class_id)
            ))
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return \Inertia\Inertia::render('SchoolAdmin/Reports/Attendance', [
            'attendances' => $attendances,
            'summary'     => $summary,
            'classes'     => \App\Models\SchoolClass::where('school_id', $sid)->select('id', 'name')->get(),
            'filters'     => $request->only(['from_date', 'to_date', 'status', 'type', 'class_id']),
        ]);
    }

    public function academic(Request $request)
    {
        $this->ensureAuthorized(request());
        $sid = $this->getSchoolId();

        if ($request->filled('exam_id')) {
            abort_unless(Exam::where('school_id', $sid)->whereKey($request->integer('exam_id'))->exists(), 404);
        }

        $exams = Exam::where('school_id', $sid)->orderByDesc('start_date')->get(['id', 'name']);

        $classPerformance = [];
        if ($request->exam_id) {
            $classPerformance = SchoolClass::where('school_id', $sid)
                ->get()
                ->map(function ($class) use ($request) {
                    $marks = Mark::whereHas('student', fn ($q) => $q->where('class_id', $class->id))
                        ->where('exam_id', $request->exam_id)
                        ->get();
                    $total   = $marks->count();
                    $passed  = $marks->where('is_pass', true)->count();
                    $avgPct  = $total ? round($marks->avg('percentage'), 1) : 0;
                    return [
                        'class_name'  => $class->name,
                        'total'       => $total,
                        'passed'      => $passed,
                        'failed'      => $total - $passed,
                        'pass_rate'   => $total ? round($passed / $total * 100, 1) : 0,
                        'avg_percent' => $avgPct,
                    ];
                })->values();
        }

        $subjectPerformance = [];
        if ($request->exam_id) {
            $subjectPerformance = Subject::where('school_id', $sid)
                ->get()
                ->map(function ($subject) use ($request) {
                    $marks = Mark::where('subject_id', $subject->id)->where('exam_id', $request->exam_id)->get();
                    return [
                        'subject'     => $subject->name,
                        'avg_percent' => $marks->count() ? round($marks->avg('percentage'), 1) : 0,
                        'pass_rate'   => $marks->count() ? round($marks->where('is_pass', true)->count() / $marks->count() * 100, 1) : 0,
                    ];
                })->filter(fn ($s) => $s['avg_percent'] > 0)->values();
        }

        return Inertia::render('SchoolAdmin/Reports/Academic', [
            'exams'              => $exams,
            'classPerformance'   => $classPerformance,
            'subjectPerformance' => $subjectPerformance,
            'filters'            => $request->only('exam_id', 'class_id'),
        ]);
    }

    // â”€â”€ Finance Report â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public function finance(Request $request)
    {
        $this->ensureAuthorized(request());

        $sid = $this->getSchoolId();

        $from = $request->from_date ?? now()->startOfMonth()->toDateString();
        $to   = $request->to_date   ?? now()->toDateString();

        $collected = FeePayment::where('school_id', $sid)
            ->whereBetween('payment_date', [$from, $to])
            ->sum('amount_paid');

        $outstanding = FeePayment::where('school_id', $sid)
            ->where('status', 'pending')
            ->sum(DB::raw('amount_due - amount_paid'));

        $payroll = Payroll::where('school_id', $sid)
            ->where('month_year', now()->format('Y-m'))
            ->sum('net_salary');

        // Daily collection chart
        $dailyChart = FeePayment::where('school_id', $sid)
            ->whereBetween('payment_date', [$from, $to])
            ->selectRaw('DATE(payment_date) as day, SUM(amount_paid) as amount')
            ->groupBy('day')
            ->orderBy('day')
            ->get();

        // Recent payments
        $payments = FeePayment::with('student:id,first_name,last_name,admission_no')
            ->where('school_id', $sid)
            ->whereBetween('payment_date', [$from, $to])
            ->latest('payment_date')
            ->paginate(30)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/Reports/Finance', [
            'collected'   => $collected,
            'outstanding' => $outstanding,
            'payroll'     => $payroll,
            'dailyChart'  => $dailyChart,
            'payments'    => $payments,
            'filters'     => ['from_date' => $from, 'to_date' => $to],
        ]);
    }

    // â”€â”€ Custom Report Builder â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public function customBuilder()
    {
        $this->ensureAuthorized(request());
        $sid = $this->getSchoolId();

        return Inertia::render('SchoolAdmin/Reports/CustomBuilder', [
            'classes'  => SchoolClass::where('school_id', $sid)->orderBy('numeric_name')->get(['id', 'name']),
            'subjects' => Subject::where('school_id', $sid)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function runCustomReport(Request $request)
    {
        $sid = $this->getSchoolId();
        $data = $request->validate([
            'entity'     => 'required|in:students,attendance,marks,fees,staff',
            'filters'    => 'nullable|array',
            'filters.class_id' => [
                'nullable',
                Rule::exists('classes', 'id')->where(fn ($query) => $query->where('school_id', $sid)),
            ],
            'filters.from_date' => 'nullable|date',
            'filters.to_date'   => 'nullable|date',
            'filters.status'    => 'nullable|string',
        ]);

        $sid    = $this->getSchoolId();
        $this->ensureAuthorized(request());
        $entity = $data['entity'];
        $f      = $data['filters'] ?? [];

        $results = match ($entity) {
            'students'   => Student::withoutGlobalScopes()
                ->where('school_id', $sid)
                ->when($f['class_id'] ?? null, fn ($q) => $q->where('class_id', $f['class_id']))
                ->with('schoolClass:id,name')
                ->get(['id', 'first_name', 'last_name', 'admission_no', 'class_id', 'gender', 'status']),

            'attendance' => Attendance::where('school_id', $sid)
                ->when($f['class_id'] ?? null,  fn ($q) => $q->where('class_id', $f['class_id']))
                ->when($f['from_date'] ?? null,  fn ($q) => $q->whereDate('date', '>=', $f['from_date']))
                ->when($f['to_date'] ?? null,    fn ($q) => $q->whereDate('date', '<=', $f['to_date']))
                ->when($f['status'] ?? null,     fn ($q) => $q->where('status', $f['status']))
                ->with('student:id,first_name,last_name,admission_no')
                ->latest('date')->limit(500)->get(),

            'marks'      => Mark::whereHas('student', fn ($q) => $q->where('school_id', $sid))
                ->when($f['class_id'] ?? null,  fn ($q) => $q->whereHas('student', fn ($s) => $s->where('class_id', $f['class_id'])))
                ->with(['student:id,first_name,last_name,admission_no', 'subject:id,name', 'exam:id,name'])
                ->limit(500)->get(),

            'fees'       => FeePayment::where('school_id', $sid)
                ->when($f['from_date'] ?? null, fn ($q) => $q->whereDate('payment_date', '>=', $f['from_date']))
                ->when($f['to_date'] ?? null,   fn ($q) => $q->whereDate('payment_date', '<=', $f['to_date']))
                ->when($f['status'] ?? null,    fn ($q) => $q->where('status', $f['status']))
                ->with('student:id,first_name,last_name,admission_no')
                ->latest('payment_date')->limit(500)->get(),

            'staff'      => Staff::where('school_id', $sid)
                ->when($f['status'] ?? null, fn ($q) => $q->where('status', $f['status']))
                ->with(['department:id,name', 'designation:id,name'])
                ->get(['id', 'first_name', 'last_name', 'email', 'status', 'department_id', 'designation_id']),

            default => collect(),
        };

        return response()->json(['data' => $results, 'count' => $results->count()]);
    }

    // â”€â”€ Audit Log â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public function auditLog(Request $request)
    {
        $this->ensureAuthorized(request());
        $sid = $this->getSchoolId();
        $logs = Activity::with('causer:id,name')
            ->where(function ($query) use ($sid) {
                $query->whereJsonContains('properties->school_id', $sid)
                    ->orWhere(function ($query) use ($sid) {
                        $query->where('causer_type', User::class)
                            ->whereIn('causer_id', User::query()
                                ->where('school_id', $sid)
                                ->select('id'));
                    });
            })
            ->when($request->causer_id, fn ($q) => $q->where('causer_id', $request->causer_id))
            ->when($request->subject_type, fn ($q) => $q->where('subject_type', 'like', '%' . $request->subject_type . '%'))
            ->when($request->from_date, fn ($q) => $q->whereDate('created_at', '>=', $request->from_date))
            ->when($request->to_date,   fn ($q) => $q->whereDate('created_at', '<=', $request->to_date))
            ->latest()
            ->paginate(50)
            ->withQueryString();

        $users = \App\Models\User::where('school_id', $this->getSchoolId())
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('SchoolAdmin/Reports/AuditLog', [
            'logs'    => $logs,
            'users'   => $users,
            'filters' => $request->only('causer_id', 'subject_type', 'from_date', 'to_date'),
        ]);
    }

    // â”€â”€ PDF Exports â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

    public function exportAttendancePdf(Request $request)
    {
        $this->ensureAuthorized(request());
        $sid     = $this->getSchoolId();
        $records = Attendance::with('student:id,first_name,last_name,admission_no', 'schoolClass:id,name')
            ->where('school_id', $sid)
            ->when($request->class_id,  fn ($q) => $q->where('class_id', $request->class_id))
            ->when($request->from_date, fn ($q) => $q->whereDate('date', '>=', $request->from_date))
            ->when($request->to_date,   fn ($q) => $q->whereDate('date', '<=', $request->to_date))
            ->latest('date')->get();

        $pdf = Pdf::loadView('reports.attendance', compact('records'))->setPaper('a4', 'landscape');
        return $pdf->download('attendance-report.pdf');
    }

    public function exportFinancePdf(Request $request)
    {
        $this->ensureAuthorized(request());

        $sid      = $this->getSchoolId();
        $from     = $request->from_date ?? now()->startOfMonth()->toDateString();
        $to       = $request->to_date   ?? now()->toDateString();
        $payments = FeePayment::with('student:id,first_name,last_name,admission_no')
            ->where('school_id', $sid)
            ->whereBetween('payment_date', [$from, $to])
            ->latest('payment_date')->get();

        $pdf = Pdf::loadView('reports.finance', compact('payments', 'from', 'to'))->setPaper('a4', 'landscape');
        return $pdf->download('finance-report.pdf');
    }

    public function exportCsv(Request $request)
    {
        $data = $request->validate([
            'entity'    => 'required|string|in:students,attendance,marks,fees,staff',
            'class_id'  => 'nullable|integer',
            'from_date' => 'nullable|date',
            'to_date'   => 'nullable|date',
            'status'    => 'nullable|string',
        ]);

        $schoolId = $this->getSchoolId();
        $items = [];
        $headers = [];

        switch ($data['entity']) {
            case 'marks':
                $headers = ['Admission No', 'Student Name', 'Class', 'Exam Name', 'Subject', 'Score / Marks', 'Grade', 'Points / GPA', 'Status', 'Remarks', 'Date Recorded'];
                $query = \App\Models\Mark::with(['student.user', 'student.schoolClass', 'exam', 'subject'])
                    ->where('school_id', $schoolId);

                if (!empty($data['class_id'])) {
                    $query->whereHas('student', fn ($q) => $q->where('class_id', $data['class_id']));
                }

                $records = $query->latest()->get();
                foreach ($records as $m) {
                    $student = $m->student;
                    $studentName = $student?->user?->name 
                        ?? trim(($student?->first_name ?? '') . ' ' . ($student?->last_name ?? '')) 
                        ?: 'N/A';

                    $items[] = [
                        $student?->admission_no ?? 'N/A',
                        $studentName,
                        $student?->schoolClass?->name ?? 'Unassigned',
                        $m->exam?->name ?? 'Assessment',
                        $m->subject?->name ?? 'Subject',
                        $m->marks_obtained ?? 0,
                        $m->grade ?? '-',
                        $m->gpa ?? '-',
                        ($m->is_absent ?? false) ? 'Absent' : 'Present',
                        $m->remarks ?? '-',
                        $m->created_at ? $m->created_at->format('d M Y') : '-',
                    ];
                }
                break;

            case 'students':
                $headers = ['Admission No', 'Full Name', 'Class', 'Gender', 'Status', 'Guardian Name', 'Guardian Phone', 'Admission Date'];
                $records = \App\Models\Student::with(['user', 'schoolClass', 'guardian'])
                    ->where('school_id', $schoolId)
                    ->when(!empty($data['class_id']), fn ($q) => $q->where('class_id', $data['class_id']))
                    ->when(!empty($data['status']), fn ($q) => $q->where('status', $data['status']))
                    ->latest()
                    ->get();

                foreach ($records as $s) {
                    $name = $s->user?->name ?? trim(($s->first_name ?? '') . ' ' . ($s->last_name ?? '')) ?: 'N/A';
                    $guardianName = $s->guardian?->name ?? $s->guardian_name ?? 'N/A';
                    $guardianPhone = $s->guardian?->phone ?? $s->guardian_phone ?? 'N/A';

                    $items[] = [
                        $s->admission_no ?? 'N/A',
                        $name,
                        $s->schoolClass?->name ?? 'N/A',
                        ucfirst($s->gender ?? 'N/A'),
                        ucfirst($s->status ?? 'Active'),
                        $guardianName,
                        $guardianPhone,
                        $s->admission_date ? \Carbon\Carbon::parse($s->admission_date)->format('d M Y') : '-',
                    ];
                }
                break;

            case 'fees':
                $headers = ['Receipt No', 'Admission No', 'Student Name', 'Fee Structure / Description', 'Amount Paid (KSh)', 'Amount Due (KSh)', 'Payment Mode', 'Status', 'Date'];
                $records = \App\Models\FeePayment::with(['student.user', 'feeStructure'])
                    ->where('school_id', $schoolId)
                    ->latest('payment_date')
                    ->get();

                foreach ($records as $f) {
                    $student = $f->student;
                    $studentName = $student?->user?->name 
                        ?? trim(($student?->first_name ?? '') . ' ' . ($student?->last_name ?? '')) 
                        ?: 'N/A';

                    $items[] = [
                        $f->receipt_no ?? ('REC-' . $f->id),
                        $student?->admission_no ?? 'N/A',
                        $studentName,
                        $f->feeStructure?->name ?? 'School Fees',
                        number_format((float) ($f->amount_paid ?? 0), 2),
                        number_format((float) ($f->amount_due ?? 0), 2),
                        strtoupper($f->method ?? 'M-Pesa'),
                        ucfirst($f->status ?? 'Paid'),
                        $f->payment_date ? \Carbon\Carbon::parse($f->payment_date)->format('d M Y') : $f->created_at->format('d M Y'),
                    ];
                }
                break;

            case 'attendance':
                $headers = ['Admission / ID No', 'Full Name', 'Type', 'Class', 'Date', 'Status', 'Remarks'];
                $records = \App\Models\Attendance::with(['attendable'])
                    ->where('school_id', $schoolId)
                    ->when(!empty($data['from_date']), fn ($q) => $q->whereDate('date', '>=', $data['from_date']))
                    ->when(!empty($data['to_date']), fn ($q) => $q->whereDate('date', '<=', $data['to_date']))
                    ->when(!empty($data['status']), fn ($q) => $q->where('status', $data['status']))
                    ->latest('date')
                    ->get();

                foreach ($records as $a) {
                    $attendable = $a->attendable;
                    $name = $attendable?->user?->name 
                        ?? trim(($attendable?->first_name ?? '') . ' ' . ($attendable?->last_name ?? '')) 
                        ?: 'N/A';

                    $idNo = $attendable?->admission_no ?? $attendable?->emp_id ?? 'N/A';
                    $className = $attendable?->schoolClass?->name ?? '-';

                    $items[] = [
                        $idNo,
                        $name,
                        class_basename($a->attendable_type ?? 'User'),
                        $className,
                        $a->date ? \Carbon\Carbon::parse($a->date)->format('d M Y') : '-',
                        ucfirst($a->status ?? 'Present'),
                        $a->remarks ?? '-',
                    ];
                }
                break;

            case 'staff':
                $headers = ['Emp ID', 'Full Name', 'Department', 'Designation', 'Email', 'Phone', 'Status', 'Joining Date'];
                $records = \App\Models\Staff::with(['user', 'department', 'designation'])
                    ->where('school_id', $schoolId)
                    ->latest()
                    ->get();

                foreach ($records as $st) {
                    $name = $st->user?->name ?? trim(($st->first_name ?? '') . ' ' . ($st->last_name ?? '')) ?: 'N/A';
                    $items[] = [
                        $st->emp_id ?? ('STF-' . $st->id),
                        $name,
                        $st->department?->name ?? 'General',
                        $st->designation?->name ?? 'Staff Member',
                        $st->user?->email ?? $st->email ?? 'N/A',
                        $st->phone ?? 'N/A',
                        ucfirst($st->status ?? 'Active'),
                        $st->joining_date ? \Carbon\Carbon::parse($st->joining_date)->format('d M Y') : '-',
                    ];
                }
                break;

            default:
                $headers = ['Record ID', 'Created At'];
                break;
        }

        // Build Excel UTF-8 CSV
        $output = "\xEF\xBB\xBF";
        $output .= implode(',', array_map(fn ($h) => '"' . str_replace('"', '""', $h) . '"', $headers)) . "\n";

        foreach ($items as $row) {
            $output .= implode(',', array_map(
                fn ($v) => '"' . str_replace('"', '""', (string) ($v ?? '')) . '"',
                $row
            )) . "\n";
        }

        $fileName = sprintf('%s-report-%s.csv', $data['entity'], now()->format('Y-m-d'));

        return response($output, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
            'Pragma'              => 'no-cache',
            'Expires'             => '0',
        ]);
    }


    public function exportStudentReportPdf(Request $request, \App\Models\Student $student, \App\Models\Exam $exam)
    {
        $sid = $this->getSchoolId();
        abort_unless($student->school_id === $sid && $exam->school_id === $sid, 404);

        $service = app(\App\Services\AcademicReportService::class);
        $data = $service->forStudentExam($student, $exam);

        $view = (($data['school']['curriculum'] ?? '') === 'CBC')
            ? 'reports.academic-cbc-pdf'
            : 'reports.academic-conventional-pdf';

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView($view, $data)->setPaper('a4', 'portrait');
        $adm = $student->admission_no ?? 'student';
        $firstName = $student->first_name ?? 'report';
        $safeName = \Illuminate\Support\Str::slug("{$adm}-{$firstName}-report");

        return $pdf->download("{$safeName}.pdf");
    }

    public function previewStudentReport(Request $request, \App\Models\Student $student, \App\Models\Exam $exam)
    {
        $sid = $this->getSchoolId();
        abort_unless($student->school_id === $sid && $exam->school_id === $sid, 404);

        $service = app(\App\Services\AcademicReportService::class);
        $data = $service->forStudentExam($student, $exam);

        return \Inertia\Inertia::render('SchoolAdmin/Reports/ReportCard', [
            'report' => $data,
        ]);
    }

    protected function getSchoolId(): int
    {
        $schoolId = auth()->user()?->school_id;
        if (! $schoolId) {
            abort(403, 'Tenant access denied: No valid school context.');
        }

        return (int) $schoolId;
    }

    /**
     * Display or Download CBC Printable Report Card with dynamic templates & analytics.
     */
    public function cbcReportCard(\Illuminate\Http\Request $request, \App\Models\Student $student)
    {
        $schoolId = $this->getSchoolId();
        if ((int) $student->school_id !== $schoolId) {
            abort(403, 'Unauthorized access to student report in another institution.');
        }
        $academicYearId = $request->input('academic_year_id') ? (int)$request->input('academic_year_id') : null;
        $term = $request->input('term', 'Term 1');
        $template = $request->input('template', 'executive');

        $reportService = new \App\Services\AcademicReportService();
        $reportData = $reportService->forCbcStudentReport($student, $academicYearId, $term, $template);

        if ($request->input('export') === 'pdf') {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('reports.cbc.master-cbc-report', $reportData)
                ->setPaper('a4', 'portrait')
                ->setOptions([
                    'isHtml5ParserEnabled' => true,
                    'isRemoteEnabled'      => true,
                    'defaultFont'          => 'sans-serif',
                ]);

            $fileName = 'CBC-Report-' . str_replace(' ', '-', $student->admission_no) . '.pdf';
            return $pdf->stream($fileName);
        }

        return view('reports.cbc.master-cbc-report', $reportData);
    }

    /**
     * Bulk CBC Report Card Generator (Single, Selected Students, or Entire Class/Stream).
     */
    public function bulkCbcReportCards(\Illuminate\Http\Request $request)
    {
        $schoolId = $this->getSchoolId();
        $academicYearId = $request->input('academic_year_id') ? (int)$request->input('academic_year_id') : null;
        $term = $request->input('term', 'Term 1');
        $template = $request->input('template', 'executive');
        $export = $request->input('export');

        // 1. Resolve Target Students
        $query = \App\Models\Student::withoutGlobalScopes()->where('school_id', $schoolId);

        if ($request->filled('student_ids')) {
            $ids = is_array($request->input('student_ids')) 
                ? $request->input('student_ids') 
                : explode(',', (string)$request->input('student_ids'));
            $query->whereIn('id', array_filter(array_map('intval', $ids)));
            $batchTitle = 'Selected Learners (' . count($ids) . ')';
        } elseif ($request->filled('section_id')) {
            $section = \App\Models\Section::withoutGlobalScopes()->find($request->input('section_id'));
            $query->where('section_id', $request->input('section_id'));
            $batchTitle = ($section ? $section->name : 'Stream') . ' Batch';
        } elseif ($request->filled('class_id')) {
            $class = \App\Models\SchoolClass::withoutGlobalScopes()->find($request->input('class_id'));
            $query->where('class_id', $request->input('class_id'));
            $batchTitle = ($class ? $class->name : 'Class') . ' Cohort';
        } else {
            // Default: first available class
            $firstClass = \App\Models\SchoolClass::withoutGlobalScopes()->where('school_id', $schoolId)->first();
            if ($firstClass) {
                $query->where('class_id', $firstClass->id);
                $batchTitle = $firstClass->name . ' Cohort';
            } else {
                $query->limit(20);
                $batchTitle = 'School Learners Batch';
            }
        }

        $students = $query->orderBy('admission_no')->get();

        if ($students->isEmpty()) {
            return redirect()->back()->with('error', 'No student records matched the specified batch criteria.');
        }

        // 2. Compile Report Payloads via AcademicReportService
        $reportService = new \App\Services\AcademicReportService();
        $reports = [];
        foreach ($students as $st) {
            $reports[] = $reportService->forCbcStudentReport($st, $academicYearId, $term, $template);
        }

        // 3. Option A: Export ZIP Archive of Individual PDFs
        if ($export === 'zip') {
            $zipFileName = 'CBC-Reports-' . \Illuminate\Support\Str::slug($batchTitle) . '-' . date('Ymd_His') . '.zip';
            $zipPath = storage_path('app/' . $zipFileName);

            $zip = new \ZipArchive();
            if ($zip->open($zipPath, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === true) {
                foreach ($reports as $rep) {
                    $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('reports.cbc.master-cbc-report', $rep)
                        ->setPaper('a4', 'portrait')
                        ->setOptions([
                            'isHtml5ParserEnabled' => true,
                            'isRemoteEnabled'      => true,
                            'defaultFont'          => 'sans-serif',
                        ]);

                    $cleanAdm = preg_replace('/[^A-Za-z0-9_\-]/', '_', $rep['student']['admission_no']);
                    $cleanName = preg_replace('/[^A-Za-z0-9_\-]/', '_', $rep['student']['full_name']);
                    $fileInZip = "{$cleanAdm}_{$cleanName}_CBC_Report.pdf";
                    $zip->addFromString($fileInZip, $pdf->output());
                }
                $zip->close();

                return response()->download($zipPath)->deleteFileAfterSend(true);
            }
        }

        // 4. Option B: Export Single Combined Multi-Page PDF
        if ($export === 'pdf_combined') {
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('reports.cbc.bulk-cbc-report', [
                'reports'     => $reports,
                'batch_title' => $batchTitle,
                'template'    => $template,
                'is_pdf'      => true,
            ])->setPaper('a4', 'portrait')
              ->setOptions([
                  'isHtml5ParserEnabled' => true,
                  'isRemoteEnabled'      => true,
                  'defaultFont'          => 'sans-serif',
              ]);

            $pdfName = 'Combined-CBC-Reports-' . \Illuminate\Support\Str::slug($batchTitle) . '.pdf';
            return $pdf->stream($pdfName);
        }

        // 5. Default: Render Print-Ready Interactive Multi-Report HTML
        return view('reports.cbc.bulk-cbc-report', [
            'reports'     => $reports,
            'batch_title' => $batchTitle,
            'template'    => $template,
            'is_pdf'      => false,
        ]);
    }
}
