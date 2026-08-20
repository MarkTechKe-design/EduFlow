<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentDocument;
use App\Services\StudentImportExportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StudentController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = auth()->user()->school_id;

        $query = Student::where('school_id', $schoolId)
            ->with(['class:id,name', 'section:id,name', 'guardian:id,name,phone']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('admission_no', 'like', "%{$search}%")
                  ->orWhere('nemis_upi', 'like', "%{$search}%");
            });
        }

        if ($request->filled('class_id') && $request->input('class_id') !== 'all') {
            $query->where('class_id', $request->input('class_id'));
        }

        if ($request->filled('section_id') && $request->input('section_id') !== 'all') {
            $query->where('section_id', $request->input('section_id'));
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        $students = $query->latest()->paginate(20)->withQueryString();

        // Metrics
        $totalStudents = Student::where('school_id', $schoolId)->count();
        $activeStudents = Student::where('school_id', $schoolId)->where('status', 'active')->count();
        $alumniStudents = Student::where('school_id', $schoolId)->where('status', 'graduated')->count();
        $transferredStudents = Student::where('school_id', $schoolId)->where('status', 'transferred')->count();

        // Academic levels & Streams
        $classes = SchoolClass::where('school_id', $schoolId)
            ->orderBy('numeric_name')
            ->orderBy('name')
            ->get(['id', 'name']);

        $sections = Section::where('school_id', $schoolId)
            ->orderBy('name')
            ->get(['id', 'class_id', 'name']);

        return Inertia::render('SchoolAdmin/Students/Index', [
            'students' => [
                'data' => $students->items(),
                'meta' => [
                    'total'        => $students->total(),
                    'per_page'     => $students->perPage(),
                    'current_page' => $students->currentPage(),
                    'last_page'    => $students->lastPage(),
                    'from'         => $students->firstItem(),
                    'to'           => $students->lastItem(),
                    'links'        => $students->linkCollection()->toArray(),
                ],
            ],
            'classes'  => $classes,
            'sections' => $sections,
            'metrics'  => [
                'total'       => $totalStudents,
                'active'      => $activeStudents,
                'alumni'      => $alumniStudents,
                'transferred' => $transferredStudents,
            ],
            'filters'  => [
                'search'     => $request->input('search', ''),
                'class_id'   => $request->input('class_id', 'all'),
                'section_id' => $request->input('section_id', 'all'),
                'status'     => $request->input('status', 'all'),
            ],
            'capabilities' => [
                'import' => auth()->user()->can('students.create'),
                'export' => auth()->user()->can('students.export'),
            ],
        ]);
    }

    public function importView(): Response
    {
        $this->authorize('create', Student::class);

        return Inertia::render('SchoolAdmin/Students/Import');
    }

    public function downloadTemplate(StudentImportExportService $service): HttpResponse
    {
        $this->authorize('create', Student::class);

        return response($service->generateTemplateCsv(), 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="EduFlow_Student_Import_Template.csv"',
        ]);
    }

    public function previewImport(Request $request, StudentImportExportService $service)
    {
        $this->authorize('create', Student::class);
        $request->validate(['file' => ['required', 'file', 'mimes:csv,txt', 'max:10240']]);

        return response()->json($service->parseAndPreview(
            $request->file('file')->getRealPath(),
            auth()->user()->school_id,
        ));
    }

    public function processImport(Request $request, StudentImportExportService $service): RedirectResponse
    {
        $this->authorize('create', Student::class);
        $records = $request->validate(['records' => ['required', 'array']])['records'];
        $results = $service->commitImport($records, auth()->user()->school_id);

        return redirect()->route('school.students.index')->with(
            'success',
            "Import completed: {$results['imported']} new learners added, {$results['updated']} updated."
        );
    }

    public function create(): Response
    {
        $schoolId = auth()->user()->school_id;
        $classes = SchoolClass::where('school_id', $schoolId)
            ->with('sections:id,class_id,name')
            ->orderBy('numeric_name')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('SchoolAdmin/Students/Create', [
            'classes' => $classes,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;

        $validated = $request->validate([
            'first_name'        => ['required', 'string', 'max:100'],
            'last_name'         => ['nullable', 'string', 'max:100'],
            'admission_no'      => ['nullable', 'string', 'max:50'],
            'class_id'          => ['nullable', 'integer', 'exists:classes,id'],
            'section_id'        => ['nullable', 'integer', 'exists:sections,id'],
            'gender'            => ['required', 'in:male,female'],
            'date_of_birth'     => ['nullable', 'date'],
            'admission_date'    => ['nullable', 'date'],
            'guardian_name'     => ['nullable', 'string', 'max:150'],
            'guardian_phone'    => ['nullable', 'string', 'max:30'],
            'guardian_relation' => ['nullable', 'string', 'max:50'],
            'status'            => ['required', 'in:active,inactive,transferred,graduated'],
        ]);

        if (empty($validated['admission_no'])) {
            $count = Student::where('school_id', $schoolId)->count() + 1;
            $validated['admission_no'] = 'ADM-' . date('Y') . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
        }

        $validated['school_id'] = $schoolId;
        $student = Student::create($validated);

        return redirect()->route('school.students.show', $student->id)->with('success', 'Student enrolled successfully.');
    }

    public function show(Student $student): Response
    {
        $schoolId = auth()->user()->school_id;
        if ($student->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        $student->load(['class', 'section', 'guardian', 'documents.uploader']);

        return Inertia::render('SchoolAdmin/Students/Show', [
            'student' => $student,
        ]);
    }

    public function edit(Student $student): Response
    {
        $schoolId = auth()->user()->school_id;
        if ($student->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        $classes = SchoolClass::where('school_id', $schoolId)
            ->with('sections:id,class_id,name')
            ->orderBy('numeric_name')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('SchoolAdmin/Students/Edit', [
            'student' => $student,
            'classes' => $classes,
        ]);
    }

    public function update(Request $request, Student $student): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;
        if ($student->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        $validated = $request->validate([
            'first_name'        => ['required', 'string', 'max:100'],
            'last_name'         => ['nullable', 'string', 'max:100'],
            'admission_no'      => ['required', 'string', 'max:50'],
            'class_id'          => ['nullable', 'integer', 'exists:classes,id'],
            'section_id'        => ['nullable', 'integer', 'exists:sections,id'],
            'gender'            => ['required', 'in:male,female'],
            'date_of_birth'     => ['nullable', 'date'],
            'admission_date'    => ['nullable', 'date'],
            'guardian_name'     => ['nullable', 'string', 'max:150'],
            'guardian_phone'    => ['nullable', 'string', 'max:30'],
            'guardian_relation' => ['nullable', 'string', 'max:50'],
            'status'            => ['required', 'in:active,inactive,transferred,graduated'],
        ]);

        $student->update($validated);

        return redirect()->route('school.students.show', $student->id)->with('success', 'Student record updated.');
    }

    public function destroy(Student $student): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;
        if ($student->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        $student->delete();

        return redirect()->route('school.students.index')->with('success', 'Student record archived.');
    }

    public function export(Request $request, StudentImportExportService $service): HttpResponse
    {
        $schoolId = auth()->user()->school_id;
        $query = Student::where('school_id', $schoolId);

        if ($request->filled('class_id') && $request->input('class_id') !== 'all') {
            $query->where('class_id', $request->input('class_id'));
        }
        if ($request->filled('section_id') && $request->input('section_id') !== 'all') {
            $query->where('section_id', $request->input('section_id'));
        }
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        $csv = $service->exportCsv($query);

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="EduFlow_Students_' . date('Ymd_His') . '.csv"',
        ]);
    }
}