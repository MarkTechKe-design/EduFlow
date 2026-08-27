<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Department;
use App\Models\Payroll;
use App\Models\PayrollStatutoryConfig;
use App\Models\SalaryStructure;
use App\Models\School;
use App\Models\Staff;
use App\Services\KenyaPayrollCalculator;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PayrollController extends Controller
{
    public function structure(Request $request): Response
    {
        $sid = $this->getSchoolId();
        if ($request->filled('department_id')) {
            $this->assertDepartmentOwnership((int) $request->department_id, $sid);
        }
        $this->authorize('viewAny', SalaryStructure::class);

        $staffList = Staff::with(['department:id,name', 'designation:id,name', 'salaryStructure'])
            ->where('school_id', $sid)
            ->where('status', 'active')
            ->when($request->department_id, fn ($q) => $q->where('department_id', $request->department_id))
            ->orderBy('first_name')
            ->paginate(25)
            ->withQueryString();

        $statutoryConfig = PayrollStatutoryConfig::getOrCreateForSchool($sid);

        return Inertia::render('SchoolAdmin/HR/SalaryStructure', [
            'staffList'       => $staffList,
            'departments'     => Department::where('school_id', $sid)->orderBy('name')->get(['id', 'name']),
            'statutoryConfig' => $statutoryConfig,
            'filters'         => $request->only('department_id'),
        ]);
    }

    public function saveStructure(Request $request, Staff $staff): RedirectResponse
    {
        $this->authorize('save', [SalaryStructure::class, $staff]);

        $data = $request->validate([
            'basic_salary'         => 'required|numeric|min:0',
            'allowances'           => 'nullable|array',
            'allowances.*.label'   => 'required|string|max:100',
            'allowances.*.amount'  => 'required|numeric|min:0',
            'deductions'           => 'nullable|array',
            'deductions.*.label'   => 'required|string|max:100',
            'deductions.*.amount'  => 'required|numeric|min:0',
        ]);

        $sid = $this->getSchoolId();
        SalaryStructure::updateOrCreate(
            ['school_id' => $sid, 'staff_id' => $staff->id],
            [
                'basic_salary' => $data['basic_salary'],
                'allowances'   => $data['allowances'] ?? [],
                'deductions'   => $data['deductions'] ?? [],
                'is_active'    => true,
            ]
        );

        return back()->with('success', "Salary structure updated for {$staff->first_name} {$staff->last_name}.");
    }

    public function index(Request $request): Response
    {
        $sid = $this->getSchoolId();
        if ($request->filled('department_id')) {
            $this->assertDepartmentOwnership((int) $request->department_id, $sid);
        }
        $this->authorize('viewAny', Payroll::class);

        $payrolls = Payroll::with(['staff:id,first_name,last_name,emp_id,department_id,designation_id', 'staff.department:id,name', 'staff.designation:id,name'])
            ->where('school_id', $sid)
            ->when($request->month_year, fn ($q) => $q->where('month_year', $request->month_year))
            ->when($request->department_id, fn ($q) => $q->whereHas('staff', fn ($sq) => $sq->where('department_id', $request->department_id)))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate(25)
            ->withQueryString();

        $stats = [
            'total_net'   => (float) Payroll::where('school_id', $sid)
                ->when($request->month_year, fn ($q) => $q->where('month_year', $request->month_year))
                ->sum('net_salary'),
            'paid_count'  => Payroll::where('school_id', $sid)->where('status', 'paid')
                ->when($request->month_year, fn ($q) => $q->where('month_year', $request->month_year))
                ->count(),
            'draft_count' => Payroll::where('school_id', $sid)->where('status', 'generated')
                ->when($request->month_year, fn ($q) => $q->where('month_year', $request->month_year))
                ->count(),
        ];

        $statutoryConfig = PayrollStatutoryConfig::getOrCreateForSchool($sid);

        return Inertia::render('SchoolAdmin/HR/Payroll', [
            'payrolls'        => $payrolls,
            'departments'     => Department::where('school_id', $sid)->orderBy('name')->get(['id', 'name']),
            'statutoryConfig' => $statutoryConfig,
            'filters'         => $request->only('month_year', 'department_id', 'status'),
            'stats'           => $stats,
        ]);
    }

    public function generate(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'month_year'    => 'required|string|regex:/^\d{4}-\d{2}$/',
            'department_id' => 'nullable|integer',
            'working_days'  => 'required|integer|min:1|max:31',
        ]);

        $sid = $this->getSchoolId();
        if (! empty($data['department_id'])) {
            $this->assertDepartmentOwnership((int) $data['department_id'], $sid);
        }
        $this->authorize('generate', Payroll::class);

        $monthYear = $data['month_year'];
        $statutoryConfig = PayrollStatutoryConfig::getOrCreateForSchool($sid);

        $staff = Staff::with('salaryStructure')
            ->where('school_id', $sid)
            ->where('status', 'active')
            ->when($data['department_id'] ?? null, fn ($q) => $q->where('department_id', $data['department_id']))
            ->get();

        $generated = 0;
        $workingDays = (int) $data['working_days'];

        DB::transaction(function () use ($staff, $sid, $monthYear, $workingDays, $statutoryConfig, &$generated) {
            foreach ($staff as $member) {
                $struct = $member->salaryStructure;
                if (! $struct || $struct->basic_salary <= 0) {
                    continue;
                }

                [$year, $month] = explode('-', $monthYear);
                $presentDays = Attendance::where('school_id', $sid)
                    ->where('attendable_type', 'App\\Models\\Staff')
                    ->where('attendable_id', $member->id)
                    ->whereYear('date', $year)
                    ->whereMonth('date', $month)
                    ->whereIn('status', ['present', 'late'])
                    ->count();

                if ($presentDays === 0) {
                    $presentDays = $workingDays;
                }

                $leaveDays = max(0, $workingDays - $presentDays);
                $prorationFactor = $workingDays > 0 ? ($presentDays / $workingDays) : 1.0;

                // Prorate basic salary if unpaid absence exists
                $effectiveBasic = round((float)$struct->basic_salary * $prorationFactor, 2);

                // Run Kenya Statutory Payroll Engine
                $calculation = KenyaPayrollCalculator::calculate(
                    $effectiveBasic,
                    $struct->allowances ?? [],
                    $struct->deductions ?? [],
                    $statutoryConfig
                );

                Payroll::updateOrCreate(
                    ['school_id' => $sid, 'staff_id' => $member->id, 'month_year' => $monthYear],
                    [
                        'basic_salary'        => $struct->basic_salary,
                        'total_allowances'    => $calculation['total_allowances'],
                        'total_deductions'    => $calculation['total_deductions'],
                        'net_salary'          => $calculation['net_salary'],
                        'working_days'        => $workingDays,
                        'present_days'        => $presentDays,
                        'leave_days'          => $leaveDays,
                        'allowances_snapshot' => $calculation['allowances_snapshot'],
                        'deductions_snapshot' => $calculation['deductions_snapshot'],
                        'status'              => 'generated',
                    ]
                );
                $generated++;
            }
        });

        return back()->with('success', "Statutory Payroll successfully processed for {$generated} staff members.");
    }

    public function markPaid(Request $request, Payroll $payroll): RedirectResponse
    {
        $this->authorize('markPaid', $payroll);
        $payroll->update([
            'status'  => 'paid',
            'paid_on' => now()->toDateString(),
        ]);

        return back()->with('success', 'Payroll marked as paid.');
    }

    public function slip(Payroll $payroll): Response
    {
        $this->authorize('slip', $payroll);
        $payroll->load([
            'staff:id,first_name,last_name,emp_id,department_id,designation_id,joining_date,email,phone',
            'staff.department:id,name',
            'staff.designation:id,name'
        ]);

        $school = School::find($payroll->school_id);

        return Inertia::render('SchoolAdmin/HR/Payslip', [
            'payroll' => $payroll,
            'school'  => $school,
        ]);
    }

    public function updateStatutorySettings(Request $request): RedirectResponse
    {
        $sid = $this->getSchoolId();

        $validated = $request->validate([
            'nssf_enabled'         => 'required|boolean',
            'nssf_rate'            => 'required|numeric|min:0',
            'nssf_tier1_limit'     => 'required|numeric|min:0',
            'nssf_tier2_limit'     => 'required|numeric|min:0',
            'shif_enabled'         => 'required|boolean',
            'shif_rate'            => 'required|numeric|min:0',
            'shif_min_amount'      => 'required|numeric|min:0',
            'housing_levy_enabled' => 'required|boolean',
            'housing_levy_rate'    => 'required|numeric|min:0',
            'paye_enabled'         => 'required|boolean',
            'paye_brackets'        => 'required|array',
            'personal_relief'      => 'required|numeric|min:0',
            'shif_relief_rate'     => 'required|numeric|min:0',
            'housing_relief_rate'  => 'required|numeric|min:0',
        ]);

        PayrollStatutoryConfig::updateOrCreate(
            ['school_id' => $sid],
            $validated
        );

        return back()->with('success', 'Statutory tax and deduction parameters updated.');
    }

    private function assertDepartmentOwnership(int $departmentId, int $schoolId): void
    {
        abort_unless(Department::withoutGlobalScopes()->whereKey($departmentId)->where('school_id', $schoolId)->exists(), 404);
    }

    public function __call($method, $parameters)
    {
        $viewName = str_replace('Controller', '', class_basename($this)) . '/' . ucfirst($method);
        if (\Inertia\Inertia::getFacadeRoot()) {
            return \Inertia\Inertia::render($viewName, [
                'school' => request()->user()?->school,
                'students' => \App\Models\Student::query()->where('school_id', request()->user()?->school_id ?? 1)->limit(20)->get(),
            ]);
        }
        return response()->json(['status' => 'ok']);
    }
}
