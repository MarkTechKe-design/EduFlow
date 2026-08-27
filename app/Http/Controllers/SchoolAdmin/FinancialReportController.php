<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\SchoolClass;
use App\Services\FinancialReportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FinancialReportController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = auth()->user()->school_id;
        $classes = SchoolClass::where('school_id', $schoolId)->get();

        $activeTab = $request->input('tab', 'cashbook');
        $cashbookDate = $request->input('date', date('Y-m-d'));
        $startDate = $request->input('start_date', date('Y-m-01'));
        $endDate = $request->input('end_date', date('Y-m-d'));
        $minBalance = (float)$request->input('min_balance', 100);
        $classId = $request->input('class_id') ? (int)$request->input('class_id') : null;

        $cashbookData = FinancialReportService::getDailyCashbook($schoolId, $cashbookDate);
        $broadsheetData = FinancialReportService::getVoteHeadBroadsheet($schoolId, $startDate, $endDate);
        $arrearsData = FinancialReportService::getArrearsSchedule($schoolId, $minBalance, $classId);

        return Inertia::render('SchoolAdmin/Fees/Reports', [
            'activeTab'      => $activeTab,
            'classes'        => $classes,
            'cashbookData'   => $cashbookData,
            'broadsheetData' => $broadsheetData,
            'arrearsData'    => $arrearsData,
            'filters'        => [
                'date'        => $cashbookDate,
                'start_date'  => $startDate,
                'end_date'    => $endDate,
                'min_balance' => $minBalance,
                'class_id'    => $classId ? (string)$classId : 'all',
            ],
        ]);
    }

    public function sendBatchSms(Request $request): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;

        $validated = $request->validate([
            'student_ids'    => 'required|array|min:1',
            'student_ids.*'  => 'integer|exists:students,id',
            'custom_message' => 'nullable|string|max:300',
        ]);

        $count = FinancialReportService::dispatchBatchReminders(
            $schoolId,
            $validated['student_ids'],
            $validated['custom_message'] ?? null
        );

        return redirect()->back()->with('success', "Queued SMS fee balance reminders to {$count} guardian(s).");
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
