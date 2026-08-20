<?php

namespace App\Http\Controllers;

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
            ->with(['schoolClass:id,name', 'section:id,name']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('admission_no', 'like', "%{$search}%")
                  ->orWhere('nemis_upi', 'like', "%{$search}%");
            });
        }

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->input('class_id'));
        }

        if ($request->filled('section_id')) {
            $query->where('section_id', $request->input('section_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $students = $query->orderBy('admission_no')->paginate(15)->withQueryString();

        $classes = SchoolClass::where('school_id', $schoolId)
            ->orderBy('numeric_name')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Students/Index', [
            'students' => $students,
            'classes'  => $classes,
            'filters'  => $request->only(['search', 'class_id', 'section_id', 'status']),
        ]);
    }

    public function create(): Response
    {
        $schoolId = auth()->user()->school_id;
        $classes = SchoolClass::where('school_id', $schoolId)
            ->with('sections:id,class_id,name')
            ->orderBy('numeric_name')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Students/Create', [
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
            'nemis_upi'         => ['nullable', 'string', 'max:30'],
            'assessment_no'     => ['nullable', 'string', 'max:30'],
            'class_id'          => ['nullable', 'integer', 'exists:classes,id'],
            'section_id'        => ['nullable', 'integer', 'exists:sections,id'],
            'gender'            => ['required', 'in:male,female'],
            'dob'               => ['nullable', 'date'],
            'admission_date'    => ['nullable', 'date'],
            'guardian_name'     => ['nullable', 'string', 'max:150'],
            'guardian_phone'    => ['nullable', 'string', 'max:30'],
            'guardian_relation' => ['nullable', 'string', 'max:50'],
            'phone'             => ['nullable', 'string', 'max:30'],
            'email'             => ['nullable', 'email', 'max:150'],
            'address'           => ['nullable', 'string', 'max:255'],
            'medical_info'      => ['nullable', 'string'],
            'status'            => ['required', 'in:active,inactive,transferred,graduated'],
        ]);

        if (empty($validated['admission_no'])) {
            $count = Student::where('school_id', $schoolId)->count() + 1;
            $validated['admission_no'] = 'ADM-' . date('Y') . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
        }

        $validated['school_id'] = $schoolId;
        $student = Student::create($validated);

        return redirect()->route('students.show', $student->id)->with('success', 'Student enrolled successfully.');
    }

    public function show(Student $student): Response
    {
        $schoolId = auth()->user()->school_id;
        if ($student->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        $student->load(['schoolClass', 'section', 'documents.uploader']);

        return Inertia::render('Students/Show', [
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

        return Inertia::render('Students/Edit', [
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
            'nemis_upi'         => ['nullable', 'string', 'max:30'],
            'assessment_no'     => ['nullable', 'string', 'max:30'],
            'class_id'          => ['nullable', 'integer', 'exists:classes,id'],
            'section_id'        => ['nullable', 'integer', 'exists:sections,id'],
            'gender'            => ['required', 'in:male,female'],
            'dob'               => ['nullable', 'date'],
            'admission_date'    => ['nullable', 'date'],
            'guardian_name'     => ['nullable', 'string', 'max:150'],
            'guardian_phone'    => ['nullable', 'string', 'max:30'],
            'guardian_relation' => ['nullable', 'string', 'max:50'],
            'phone'             => ['nullable', 'string', 'max:30'],
            'email'             => ['nullable', 'email', 'max:150'],
            'address'           => ['nullable', 'string', 'max:255'],
            'medical_info'      => ['nullable', 'string'],
            'status'            => ['required', 'in:active,inactive,transferred,graduated'],
        ]);

        $student->update($validated);

        return redirect()->route('students.show', $student->id)->with('success', 'Student record updated.');
    }

    public function destroy(Student $student): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;
        if ($student->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        $student->delete();

        return redirect()->route('students.index')->with('success', 'Student record archived.');
    }

    // --- BULK IMPORT & EXPORT METHODS ---

    public function importView(): Response
    {
        return Inertia::render('Students/Import');
    }

    public function downloadTemplate(StudentImportExportService $service): HttpResponse
    {
        $csv = $service->generateTemplateCsv();
        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="EduFlow_Student_Import_Template.csv"',
        ]);
    }

    public function previewImport(Request $request, StudentImportExportService $service)
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);

        $schoolId = auth()->user()->school_id;
        $path = $request->file('file')->getRealPath();
        $preview = $service->parseAndPreview($path, $schoolId);

        return response()->json($preview);
    }

    public function processImport(Request $request, StudentImportExportService $service): RedirectResponse
    {
        $request->validate([
            'records' => ['required', 'array'],
        ]);

        $schoolId = auth()->user()->school_id;
        $results = $service->commitImport($request->input('records'), $schoolId);

        return redirect()->route('students.index')
            ->with('success', "Import completed: {$results['imported']} new learners added, {$results['updated']} updated.");
    }

    public function export(Request $request, StudentImportExportService $service): HttpResponse
    {
        $schoolId = auth()->user()->school_id;
        $query = Student::where('school_id', $schoolId);

        if ($request->filled('class_id'))   $query->where('class_id', $request->input('class_id'));
        if ($request->filled('section_id')) $query->where('section_id', $request->input('section_id'));
        if ($request->filled('status'))     $query->where('status', $request->input('status'));

        $csv = $service->exportCsv($query);

        return response($csv, 200, [
            'Content-Type'        => 'text/csv',
            'Content-Disposition' => 'attachment; filename="EduFlow_Students_' . date('Ymd_His') . '.csv"',
        ]);
    }

    // --- STUDENT DOCUMENT VAULT ---

    public function uploadDocument(Request $request, Student $student): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;
        if ($student->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        $validated = $request->validate([
            'title'         => ['required', 'string', 'max:150'],
            'document_type' => ['required', 'string', 'in:birth_certificate,transfer_form,assessment_report,medical,other'],
            'document'      => ['required', 'file', 'mimes:pdf,jpg,jpeg,png,webp', 'max:10240'],
        ]);

        $file = $request->file('document');
        $filePath = $file->store("schools/{$schoolId}/students/{$student->id}/documents", 'local');

        StudentDocument::create([
            'school_id'     => $schoolId,
            'student_id'    => $student->id,
            'title'         => $validated['title'],
            'document_type' => $validated['document_type'],
            'file_path'     => $filePath,
            'file_name'     => $file->getClientOriginalName(),
            'file_size'     => $file->getSize(),
            'mime_type'     => $file->getClientMimeType(),
            'uploaded_by'   => auth()->id(),
        ]);

        return back()->with('success', 'Document uploaded securely.');
    }

    public function downloadDocument(Student $student, StudentDocument $document): StreamedResponse
    {
        $schoolId = auth()->user()->school_id;
        if (($student->school_id !== $schoolId || $document->student_id !== $student->id) && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        if (!Storage::disk('local')->exists($document->file_path)) {
            abort(404, 'Document file not found.');
        }

        return Storage::disk('local')->download($document->file_path, $document->file_name);
    }

    public function deleteDocument(Student $student, StudentDocument $document): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;
        if (($student->school_id !== $schoolId || $document->student_id !== $student->id) && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        Storage::disk('local')->delete($document->file_path);
        $document->delete();

        return back()->with('success', 'Document deleted.');
    }
}