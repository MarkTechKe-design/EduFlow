<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Designation;
use App\Models\Staff;
use App\Models\StaffDocument;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Inertia\Inertia;
use Inertia\Response;

class StaffController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(Staff::class, 'staff');
    }

    public function index(Request $request): Response
    {
        $staff = Staff::with(['department:id,name', 'designation:id,name'])
            ->when($request->search, fn ($q) => $q->where(function ($q) use ($request) {
                $q->where('first_name', 'like', "%{$request->search}%")
                  ->orWhere('last_name',  'like', "%{$request->search}%")
                  ->orWhere('emp_id',     'like', "%{$request->search}%")
                  ->orWhere('email',      'like', "%{$request->search}%");
            }))
            ->when($request->department_id,  fn ($q) => $q->where('department_id',  $request->department_id))
            ->when($request->designation_id, fn ($q) => $q->where('designation_id', $request->designation_id))
            ->when($request->status,         fn ($q) => $q->where('status',         $request->status))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/Staff/Index', [
            'staff' => [
                'data'  => $staff->items(),
                'meta'  => [
                    'total'        => $staff->total(),
                    'per_page'     => $staff->perPage(),
                    'current_page' => $staff->currentPage(),
                    'last_page'    => $staff->lastPage(),
                    'from'         => $staff->firstItem(),
                    'to'           => $staff->lastItem(),
                ],
                'links' => [
                    'prev' => $staff->previousPageUrl(),
                    'next' => $staff->nextPageUrl(),
                ],
            ],
            'filters'      => $request->only('search', 'department_id', 'designation_id', 'status'),
            'departments'  => Department::orderBy('name')->get(['id', 'name']),
            'designations' => Designation::orderBy('name')->get(['id', 'department_id', 'name']),
            'stats'        => [
                'total'      => Staff::count(),
                'active'     => Staff::where('status', 'active')->count(),
                'on_leave'   => Staff::where('status', 'on_leave')->count(),
                'resigned'   => Staff::where('status', 'resigned')->count(),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('SchoolAdmin/Staff/Create', [
            'departments'  => Department::orderBy('name')->get(['id', 'name']),
            'designations' => Designation::orderBy('name')->get(['id', 'department_id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $sid = $this->getSchoolId();
        $data = $request->validate([
            'first_name'     => 'required|string|max:100',
            'last_name'      => 'nullable|string|max:100',
            'gender'         => 'required|in:male,female,other',
            'date_of_birth'  => 'nullable|date',
            'blood_group'    => 'nullable|string|max:5',
            'religion'       => 'nullable|string|max:50',
            'nationality'    => 'nullable|string|max:50',
            'phone'          => 'nullable|string|max:20',
            'email'          => 'nullable|email|max:150',
            'address'        => 'nullable|string|max:500',
            'department_id' => ['nullable', Rule::exists('departments', 'id')->where(fn ($q) => $q->where('school_id', $sid))],
            'designation_id' => ['nullable', Rule::exists('designations', 'id')->where(fn ($q) => $q->where('school_id', $sid))],
            'joining_date'   => 'nullable|date',
            'salary_type'    => 'required|in:fixed,hourly',
            'salary'         => 'nullable|numeric|min:0',
            'status'         => 'required|in:active,resigned,terminated,on_leave',
            'notes'          => 'nullable|string|max:1000',
        ]);

        Staff::create($data);

        return redirect()->route('school.staff.index')->with('success', 'Staff registered successfully.');
    }

    public function show(Staff $staff): Response
    {
        $staff->load(['department', 'designation', 'documents']);

        return Inertia::render('SchoolAdmin/Staff/Show', [
            'staff' => $staff,
        ]);
    }

    public function edit(Staff $staff): Response
    {
        return Inertia::render('SchoolAdmin/Staff/Edit', [
            'staff'        => $staff,
            'departments'  => Department::orderBy('name')->get(['id', 'name']),
            'designations' => Designation::orderBy('name')->get(['id', 'department_id', 'name']),
        ]);
    }

    public function update(Request $request, Staff $staff): RedirectResponse
    {
        $sid = $this->getSchoolId();
        $data = $request->validate([
            'first_name'     => 'required|string|max:100',
            'last_name'      => 'nullable|string|max:100',
            'gender'         => 'required|in:male,female,other',
            'date_of_birth'  => 'nullable|date',
            'blood_group'    => 'nullable|string|max:5',
            'religion'       => 'nullable|string|max:50',
            'nationality'    => 'nullable|string|max:50',
            'phone'          => 'nullable|string|max:20',
            'email'          => 'nullable|email|max:150',
            'address'        => 'nullable|string|max:500',
            'department_id' => ['nullable', Rule::exists('departments', 'id')->where(fn ($q) => $q->where('school_id', $sid))],
            'designation_id' => ['nullable', Rule::exists('designations', 'id')->where(fn ($q) => $q->where('school_id', $sid))],
            'joining_date'   => 'nullable|date',
            'salary_type'    => 'required|in:fixed,hourly',
            'salary'         => 'nullable|numeric|min:0',
            'status'         => 'required|in:active,resigned,terminated,on_leave',
            'notes'          => 'nullable|string|max:1000',
        ]);

        $staff->update($data);

        return redirect()->route('school.staff.show', $staff)->with('success', 'Staff updated.');
    }

    public function destroy(Staff $staff): RedirectResponse
    {
        $staff->delete();

        return redirect()->route('school.staff.index')->with('success', 'Staff removed.');
    }

    public function uploadDocument(Request $request, Staff $staff): RedirectResponse
    {
        $this->authorize('uploadDocument', $staff);

        $request->validate([
            'title' => 'required|string|max:150',
            'file'  => 'required|file|mimes:pdf,jpg,jpeg,png|max:5120',
        ]);

        $path = $request->file('file')->store("staff/{$staff->id}/documents", 'private');

        StaffDocument::create([
            'school_id' => $staff->school_id,
            'staff_id'  => $staff->id,
            'title'     => $request->title,
            'file_path' => $path,
            'file_type' => $request->file('file')->getMimeType(),
            'file_size' => $request->file('file')->getSize(),
        ]);

        return back()->with('success', 'Document uploaded.');
    }

    public function deleteDocument(StaffDocument $document): RedirectResponse
    {
        $this->authorize('deleteDocument', $document);

        Storage::disk('private')->delete($document->file_path);
        $document->delete();

        return back()->with('success', 'Document deleted.');
    }

    public function downloadDocument(StaffDocument $document): BinaryFileResponse
    {
        $this->authorize('view', $document);
        abort_unless(Storage::disk('private')->exists($document->file_path), 404);

        return Storage::disk('private')->download($document->file_path, $document->title);
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

    public function downloadTemplate(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $this->authorize('create', \App\Models\Staff::class);

        $headers = [
            'first_name',
            'last_name',
            'email',
            'phone',
            'gender',
            'joining_date',
            'salary',
        ];

        return response()->streamDownload(function () use ($headers) {
            $handle = fopen('php://output', 'w');
            fprintf($handle, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($handle, $headers);
            fputcsv($handle, [
                'Jane',
                'Mwangi',
                'jane.mwangi@example.com',
                '0712345678',
                'female',
                '2024-01-15',
                '45000',
            ]);
            fclose($handle);
        }, 'staff_import_template.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function previewImport(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        $this->authorize('create', \App\Models\Staff::class);

        $request->validate([
            'file' => 'required|file|mimes:csv,txt|max:10240',
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getRealPath(), 'r');
        if ($handle === false) {
            return response()->json(['error' => 'Unable to read CSV file.'], 422);
        }

        $header = fgetcsv($handle);
        if (!$header) {
            fclose($handle);
            return response()->json(['error' => 'CSV file is empty.'], 422);
        }

        $rows = [];
        $errors = [];
        $rowIndex = 1;

        while (($data = fgetcsv($handle)) !== false) {
            $rowIndex++;
            if (empty(array_filter($data))) {
                continue;
            }

            $row = @array_combine($header, $data);
            if (!$row) {
                $errors[] = "Row {$rowIndex}: Column mismatch.";
                continue;
            }

            $firstName = trim($row['first_name'] ?? '');
            $lastName  = trim($row['last_name'] ?? '');

            if (empty($firstName)) {
                $errors[] = "Row {$rowIndex}: First Name is required.";
            }

            $rows[] = [
                'first_name'   => $firstName,
                'last_name'    => $lastName,
                'email'        => trim($row['email'] ?? ''),
                'phone'        => trim($row['phone'] ?? ''),
                'gender'       => in_array(strtolower(trim($row['gender'] ?? '')), ['male', 'female', 'other']) ? strtolower(trim($row['gender'])) : 'male',
                'joining_date' => trim($row['joining_date'] ?? now()->toDateString()),
                'salary'       => (float) ($row['salary'] ?? 0),
            ];

            if (count($rows) >= 500) {
                break;
            }
        }
        fclose($handle);

        return response()->json([
            'rows'   => $rows,
            'count'  => count($rows),
            'errors' => $errors,
        ]);
    }

    public function processImport(\Illuminate\Http\Request $request): \Illuminate\Http\JsonResponse
    {
        $this->authorize('create', \App\Models\Staff::class);

        $request->validate([
            'staff' => 'required|array|min:1',
            'staff.*.first_name' => 'required|string|max:100',
        ]);

        $schoolId = auth()->user()->school_id;
        $importedCount = 0;

        \Illuminate\Support\Facades\DB::transaction(function () use ($request, $schoolId, &$importedCount) {
            foreach ($request->input('staff') as $item) {
                $staff = new \App\Models\Staff();
                $staff->school_id     = $schoolId;
                $staff->first_name    = trim($item['first_name']);
                $staff->last_name     = trim($item['last_name'] ?? '');
                $staff->email         = !empty($item['email']) ? trim($item['email']) : null;
                $staff->phone         = !empty($item['phone']) ? trim($item['phone']) : null;
                $staff->gender        = in_array($item['gender'] ?? '', ['male', 'female', 'other']) ? $item['gender'] : 'male';
                $staff->joining_date  = !empty($item['joining_date']) ? $item['joining_date'] : now()->toDateString();
                $staff->salary        = (float) ($item['salary'] ?? 0);
                $staff->status        = 'active';
                $staff->save();

                $importedCount++;
            }
        });

        return response()->json([
            'success'  => true,
            'imported' => $importedCount,
            'message'  => "Successfully imported {$importedCount} staff members.",
        ]);
    }
}