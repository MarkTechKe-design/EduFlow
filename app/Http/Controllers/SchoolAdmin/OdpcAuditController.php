<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\DataAccessLog;
use App\Models\Student;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class OdpcAuditController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = auth()->user()->school_id;

        $query = DataAccessLog::where('school_id', $schoolId)
            ->with(['user:id,name,email', 'student:id,first_name,last_name,admission_no']);

        if ($request->filled('action') && $request->action !== 'all') {
            $query->where('action', $request->action);
        }

        if ($request->filled('resource_type') && $request->resource_type !== 'all') {
            $query->where('resource_type', $request->resource_type);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('ip_address', 'like', "%{$search}%")
                  ->orWhere('details', 'like', "%{$search}%")
                  ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('student', fn ($s) => $s->where('first_name', 'like', "%{$search}%")->orWhere('last_name', 'like', "%{$search}%")->orWhere('admission_no', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $logs = $query->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        // High-level compliance KPI metrics
        $totalLogs = DataAccessLog::where('school_id', $schoolId)->count();
        $downloadsCount = DataAccessLog::where('school_id', $schoolId)->where('action', 'DOWNLOAD')->count();
        $medicalViews = DataAccessLog::where('school_id', $schoolId)->where('resource_type', 'medical_profile')->count();
        $docUploads = DataAccessLog::where('school_id', $schoolId)->where('action', 'UPLOAD')->count();

        return Inertia::render('SchoolAdmin/Compliance/AuditLog', [
            'logs'    => $logs,
            'filters' => [
                'action'        => $request->input('action', ''),
                'resource_type' => $request->input('resource_type', ''),
                'search'        => $request->input('search', ''),
                'date_from'     => $request->input('date_from', ''),
                'date_to'       => $request->input('date_to', ''),
            ],
            'metrics' => [
                'total_events'   => $totalLogs,
                'downloads'      => $downloadsCount,
                'medical_audits' => $medicalViews,
                'vault_uploads'  => $docUploads,
            ],
        ]);
    }

    public function exportCsv(): StreamedResponse
    {
        $schoolId = auth()->user()->school_id;

        $logs = DataAccessLog::where('school_id', $schoolId)
            ->with(['user:id,name,email', 'student:id,first_name,last_name,admission_no'])
            ->orderByDesc('created_at')
            ->get();

        $filename = sprintf('ODPC_Data_Access_Audit_Trail_%s.csv', date('Ymd_His'));

        $headers = [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma'              => 'no-cache',
            'Cache-Control'       => 'must-revalidate, post-check=0, pre-check=0',
            'Expires'             => '0',
        ];

        $callback = function () use ($logs) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['KENYA DATA PROTECTION ACT (ODPC) COMPLIANCE AUDIT TRAIL']);
            fputcsv($file, ['Generated at: ' . now()->toDateTimeString(), 'School ID: ' . auth()->user()->school_id]);
            fputcsv($file, []);

            fputcsv($file, [
                '#',
                'TIMESTAMP (EAT)',
                'STAFF USER',
                'STAFF EMAIL',
                'ACTION',
                'RESOURCE TYPE',
                'STUDENT ADMISSION NO',
                'STUDENT NAME',
                'IP ADDRESS',
                'CONTEXT / DETAILS',
            ]);

            foreach ($logs as $i => $log) {
                $studentName = $log->student ? ($log->student->first_name . ' ' . $log->student->last_name) : 'N/A';
                fputcsv($file, [
                    $i + 1,
                    $log->created_at?->format('Y-m-d H:i:s') ?? '-',
                    $log->user?->name ?? 'System',
                    $log->user?->email ?? '-',
                    $log->action,
                    $log->resource_type,
                    $log->student?->admission_no ?? 'N/A',
                    $studentName,
                    $log->ip_address ?? '127.0.0.1',
                    $log->details ?? '-',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
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
