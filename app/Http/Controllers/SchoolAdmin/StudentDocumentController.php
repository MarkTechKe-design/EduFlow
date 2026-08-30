<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentDocument;
use App\Services\OdpcAuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class StudentDocumentController extends Controller
{
    public function store(Request $request, Student $student): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;
        if ($student->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        $validated = $request->validate([
            'title'           => 'required|string|max:150',
            'category'        => 'required|in:birth_certificate,medical_report,immunization_card,transfer_letter,nemis_cert,special_needs,academic_dossier,general',
            'description'     => 'nullable|string|max:500',
            'file'            => 'required|file|max:10240|mimes:pdf,jpg,jpeg,png,doc,docx', // 10MB max
            'is_confidential' => 'boolean',
        ]);

        $uploadedFile = $request->file('file');
        $extension = $uploadedFile->getClientOriginalExtension();
        $storedName = sprintf('doc_%d_%d_%s.%s', $schoolId, $student->id, uniqid(), $extension);
        
        $path = $uploadedFile->storeAs('private_documents', $storedName, 'private');

        $doc = StudentDocument::create([
            'school_id'       => $schoolId,
            'student_id'      => $student->id,
            'title'           => $validated['title'],
            'category'        => $validated['category'],
            'description'     => $validated['description'] ?? null,
            'file_path'       => $path,
            'file_type'       => $uploadedFile->getClientMimeType(),
            'file_size'       => $uploadedFile->getSize(),
            'is_confidential' => $request->boolean('is_confidential', true),
            'uploaded_by'     => auth()->id(),
        ]);

        OdpcAuditService::log(
            'UPLOAD',
            'student_document',
            $student->id,
            (string)$doc->id,
            ['title' => $doc->title, 'category' => $doc->category]
        );

        return redirect()->back()->with('success', 'Document securely archived in the student vault.');
    }

    public function download(StudentDocument $document): BinaryFileResponse|StreamedResponse
    {
        $schoolId = auth()->user()->school_id;
        if ($document->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        // Audited access logging under ODPC regulations
        OdpcAuditService::log(
            'DOWNLOAD',
            'student_document',
            $document->student_id,
            (string)$document->id,
            ['title' => $document->title, 'category' => $document->category]
        );

        $fullPath = storage_path('app/' . $document->file_path);
        if (!file_exists($fullPath)) {
            abort(404, 'The requested document file could not be found in storage.');
        }

        return response()->download($fullPath, $document->title . '.' . pathinfo($fullPath, PATHINFO_EXTENSION));
    }

    public function destroy(StudentDocument $document): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;
        if ($document->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        OdpcAuditService::log(
            'DELETE',
            'student_document',
            $document->student_id,
            (string)$document->id,
            ['title' => $document->title, 'category' => $document->category]
        );

        if (Storage::disk('private')->exists($document->file_path)) {
            Storage::disk('private')->delete($document->file_path);
        }

        $document->delete();

        return redirect()->back()->with('success', 'Document removed from vault.');
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
}
