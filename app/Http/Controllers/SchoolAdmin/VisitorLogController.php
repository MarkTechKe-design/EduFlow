<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Staff;
use App\Models\Student;
use App\Models\VisitorLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class VisitorLogController extends Controller
{
    public function index(Request $request)
    {
        $sid = $this->getSchoolId();
        $admCol = Schema::hasColumn('students', 'admission_no') ? 'admission_no' : (Schema::hasColumn('students', 'adm_no') ? 'adm_no' : 'id');

        $query = VisitorLog::where('school_id', $sid)
            ->with([
                'staff:id,first_name,last_name,emp_id',
                'student:id,first_name,last_name,' . $admCol . ',class_id',
                'student.schoolClass:id,name',
                'department:id,name,code'
            ]);

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s, $admCol) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('phone', 'like', "%{$s}%")
                  ->orWhere('id_number', 'like', "%{$s}%")
                  ->orWhere('vehicle_reg', 'like', "%{$s}%")
                  ->orWhere('badge_number', 'like', "%{$s}%")
                  ->orWhere('person_to_meet', 'like', "%{$s}%")
                  ->orWhereHas('student', function ($sq) use ($s, $admCol) {
                      $sq->where('first_name', 'like', "%{$s}%")
                         ->orWhere('last_name', 'like', "%{$s}%")
                         ->orWhere($admCol, 'like', "%{$s}%");
                  });
            });
        }

        if ($request->filled('category') && $request->category !== 'all') {
            $query->where('category', $request->category);
        }

        if ($request->filled('target_type') && $request->target_type !== 'all') {
            $query->where('target_type', $request->target_type);
        }

        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->whereNull('time_out');
            } elseif ($request->status === 'checked_out') {
                $query->whereNotNull('time_out');
            }
        }

        if ($request->filled('date')) {
            $query->whereDate('time_in', $request->date);
        }

        $visitors = $query->latest('time_in')->paginate(20)->withQueryString();

        $all = VisitorLog::where('school_id', $sid)->get();
        $stats = [
            'total_today'     => VisitorLog::where('school_id', $sid)->whereDate('time_in', today())->count(),
            'active_now'      => VisitorLog::where('school_id', $sid)->whereNull('time_out')->count(),
            'parent_visits'   => VisitorLog::where('school_id', $sid)->whereIn('category', ['parent_visiting', 'admission_inquiry'])->count(),
            'official_guests' => VisitorLog::where('school_id', $sid)->whereIn('category', ['moe_qaso', 'official_meeting', 'supplier'])->count(),
        ];

        return Inertia::render('SchoolAdmin/Admissions/Visitors', [
            'visitors'    => $visitors,
            'staff'       => Staff::where('school_id', $sid)->where('status', 'active')->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'emp_id']),
            'students'    => Student::where('school_id', $sid)->where('status', 'active')->orderBy('first_name')->with('schoolClass:id,name')->get(['id', 'first_name', 'last_name', $admCol, 'class_id']),
            'departments' => Department::where('school_id', $sid)->orderBy('name')->get(['id', 'name', 'code']),
            'stats'       => $stats,
            'filters'     => [
                'search'      => $request->input('search', ''),
                'category'    => $request->input('category', 'all'),
                'target_type' => $request->input('target_type', 'all'),
                'status'      => $request->input('status', 'all'),
                'date'        => $request->input('date', ''),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $sid = $this->getSchoolId();

        $data = $request->validate([
            'name'                    => 'required|string|max:150',
            'phone'                   => 'required|string|max:25',
            'id_number'               => 'nullable|string|max:50',
            'vehicle_reg'             => 'nullable|string|max:30',
            'badge_number'            => 'nullable|string|max:50',
            'category'                => 'required|in:parent_visiting,admission_inquiry,moe_qaso,supplier,official_meeting,maintenance,guest',
            'target_type'             => 'required|in:student,staff,department,admission_inquiry',
            'student_id'              => 'nullable|exists:students,id',
            'relationship_to_student' => 'nullable|string|max:50',
            'purpose'                 => 'required|string|max:255',
            'person_to_meet'          => 'required|string|max:150',
            'staff_id'                => 'nullable|exists:staff,id',
            'department_id'           => 'nullable|exists:departments,id',
            'remarks'                 => 'nullable|string|max:500',
        ]);

        VisitorLog::create(array_merge($data, [
            'school_id' => $sid,
            'time_in'   => now(),
        ]));

        return back()->with('success', 'Visitor check-in logged successfully.');
    }

    public function checkout(VisitorLog $visitorLog)
    {
        if ($visitorLog->school_id !== $this->getSchoolId()) abort(403);

        if ($visitorLog->time_out) {
            return back()->with('error', 'Visitor has already checked out.');
        }

        $visitorLog->update(['time_out' => now()]);

        return back()->with('success', 'Visitor checked out. Badge returned.');
    }

    public function destroy(VisitorLog $visitorLog)
    {
        if ($visitorLog->school_id !== $this->getSchoolId()) abort(403);
        $visitorLog->delete();

        return back()->with('success', 'Visitor log removed.');
    }

    public function __call($method, $parameters)
    {
        $viewName = str_replace('Controller', '', class_basename($this)) . '/' . ucfirst($method);
        if (\Inertia\Inertia::getFacadeRoot()) {
            return \Inertia\Inertia::render($viewName, [
                'school' => request()->user()?->school,
                'students' => \App\Models\Student::query()->where('school_id', request()->user()?->school_id ?? abort(403, 'Tenant access denied: No valid school context.'))->limit(20)->get(),
            ]);
        }
        return response()->json(['status' => 'ok']);
    }

    public function exportCsv(\Illuminate\Http\Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $schoolId = $this->getSchoolId();
        $fileName = 'visitor_log_' . now()->format('Y_m_d_His') . '.csv';

        $admCol = \Illuminate\Support\Facades\Schema::hasColumn('students', 'admission_no') ? 'admission_no' : (\Illuminate\Support\Facades\Schema::hasColumn('students', 'adm_no') ? 'adm_no' : 'id');

        $query = \App\Models\VisitorLog::where('school_id', $schoolId)
            ->with([
                'staff:id,first_name,last_name,emp_id',
                'student:id,first_name,last_name,' . $admCol,
                'department:id,name,code'
            ])
            ->when($request->filled('date_from'), fn($q) => $q->whereDate('time_in', '>=', $request->date_from))
            ->when($request->filled('date_to'), fn($q) => $q->whereDate('time_in', '<=', $request->date_to))
            ->when($request->filled('search'), function ($q) use ($request, $admCol) {
                $s = $request->search;
                $q->where(function ($sub) use ($s, $admCol) {
                    $sub->where('name', 'like', "%{$s}%")
                        ->orWhere('phone', 'like', "%{$s}%")
                        ->orWhere('id_number', 'like', "%{$s}%")
                        ->orWhere('vehicle_reg', 'like', "%{$s}%")
                        ->orWhere('badge_number', 'like', "%{$s}%")
                        ->orWhere('person_to_meet', 'like', "%{$s}%")
                        ->orWhere('purpose', 'like', "%{$s}%")
                        ->orWhereHas('staff', function ($sq) use ($s) {
                            $sq->where('first_name', 'like', "%{$s}%")
                               ->orWhere('last_name', 'like', "%{$s}%");
                        })
                        ->orWhereHas('student', function ($sq) use ($s, $admCol) {
                            $sq->where('first_name', 'like', "%{$s}%")
                               ->orWhere('last_name', 'like', "%{$s}%")
                               ->orWhere($admCol, 'like', "%{$s}%");
                        });
                });
            })
            ->latest('time_in');

        return response()->streamDownload(function () use ($query) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));

            fputcsv($handle, [
                'ID',
                'Visitor Name',
                'Phone Number',
                'National ID / Passport',
                'Person to Meet',
                'Purpose of Visit',
                'Category',
                'Vehicle Reg',
                'Badge Number',
                'Time In',
                'Time Out',
            ]);

            $query->chunk(200, function ($logs) use ($handle) {
                foreach ($logs as $log) {
                    fputcsv($handle, [
                        $log->id,
                        $log->name ?? '',
                        $log->phone ?? '',
                        $log->id_number ?? '',
                        $log->person_to_meet ?? '',
                        $log->purpose ?? '',
                        $log->category ?? 'parent_inquiry',
                        $log->vehicle_reg ?? '',
                        $log->badge_number ?? '',
                        $log->time_in ? $log->time_in->format('Y-m-d H:i:s') : '',
                        $log->time_out ? $log->time_out->format('Y-m-d H:i:s') : 'On Campus',
                    ]);
                }
            });

            fclose($handle);
        }, $fileName, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
        ]);
    }
}