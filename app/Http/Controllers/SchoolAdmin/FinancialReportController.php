<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\SchoolClass;
use App\Services\FinancialReportService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class FinancialReportController extends Controller
{
    protected function getAuthenticatedSchoolId(): int
    {
        $schoolId = auth()->user()?->school_id;
        if (! $schoolId) {
            abort(403, 'Tenant access denied: No valid school context.');
        }

        return (int) $schoolId;
    }

    public function index(Request $request): Response
    {
        $schoolId = $this->getAuthenticatedSchoolId();
        $classes = SchoolClass::where('school_id', $schoolId)->get();

        $activeTab = $request->input('tab', 'cashbook');
        $cashbookDate = $request->input('date', date('Y-m-d'));
        $startDate = $request->input('start_date', date('Y-m-01'));
        $endDate = $request->input('end_date', date('Y-m-d'));
        $minBalance = (float) $request->input('min_balance', 100);
        $classId = $request->input('class_id') && $request->input('class_id') !== 'all' ? (int) $request->input('class_id') : null;

        $cashbookData = FinancialReportService::getDailyCashbook($schoolId, $cashbookDate);
        $broadsheetData = FinancialReportService::getVoteHeadBroadsheet($schoolId, $startDate, $endDate);
        $arrearsData = FinancialReportService::getArrearsSchedule($schoolId, $minBalance, $classId);

        return Inertia::render('SchoolAdmin/Fees/Reports', [
            'activeTab' => $activeTab,
            'classes' => $classes,
            'cashbookData' => $cashbookData,
            'broadsheetData' => $broadsheetData,
            'arrearsData' => $arrearsData,
            'filters' => [
                'date' => $cashbookDate,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'min_balance' => $minBalance,
                'class_id' => $classId ? (string) $classId : 'all',
            ],
        ]);
    }

    public function sendBatchSms(Request $request): RedirectResponse
    {
        $schoolId = $this->getAuthenticatedSchoolId();

        $validated = $request->validate([
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'integer|exists:students,id',
            'custom_message' => 'nullable|string|max:300',
        ]);

        $count = FinancialReportService::dispatchBatchReminders(
            $schoolId,
            $validated['student_ids'],
            $validated['custom_message'] ?? null
        );

        return redirect()->back()->with('success', "Queued SMS fee balance reminders to {$count} guardian(s).");
    }

    public function exportPdf(Request $request)
    {
        $schoolId = $this->getAuthenticatedSchoolId();
        $school = School::where('id', $schoolId)->firstOrFail();
        $tab = $request->input('tab', 'arrears');

        if ($tab === 'arrears') {
            $minBalance = (float) $request->input('min_balance', 100);
            $classId = $request->input('class_id') && $request->input('class_id') !== 'all' ? (int) $request->input('class_id') : null;
            $data = FinancialReportService::getArrearsSchedule($schoolId, $minBalance, $classId);

            $records = array_map(function ($row) {
                return [
                    'reference' => $row['admission_no'] ?? 'ADM',
                    'admission_no' => $row['admission_no'] ?? '',
                    'name' => $row['student_name'] ?? 'Student',
                    'class_name' => $row['class_name'] ?? 'Class',
                    'phone' => $row['guardian_phone'] ?? '',
                    'amount' => (float) ($row['outstanding_arrears'] ?? $row['balance'] ?? 0.0),
                ];
            }, $data['defaulters'] ?? []);

            $totalAmount = array_sum(array_column($records, 'amount'));
            $title = 'Term Arrears & Defaulters Recovery Schedule';
            $period = 'Academic Year ' . date('Y');
        } else {
            $date = $request->input('date', date('Y-m-d'));
            $data = FinancialReportService::getDailyCashbook($schoolId, $date);
            $records = [];
            $totalAmount = 0;
            $title = 'Daily Bursar Cashbook Audit';
            $period = 'Date: ' . $date;
        }

        $pdf = Pdf::loadView('reports.finance.audit-report', [
            'school' => $school->toArray(),
            'title' => $title,
            'period' => $period,
            'records' => $records,
            'total_amount' => $totalAmount,
        ])->setPaper('a4', 'portrait')
          ->setOptions([
              'isHtml5ParserEnabled' => true,
              'isRemoteEnabled' => true,
              'defaultFont' => 'sans-serif',
          ]);

        $fileName = 'Financial-Audit-' . Str::slug($title) . '-' . date('Ymd') . '.pdf';

        return $pdf->stream($fileName);
    }
}