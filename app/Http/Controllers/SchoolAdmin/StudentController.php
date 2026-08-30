<?php

namespace App\Http\Controllers\SchoolAdmin;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\School;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentMedicalProfile;
use App\Models\StudentGuardian;
use App\Models\Guardian;
use App\Models\StudentEnrollment;
use App\Models\AcademicYear;
use App\Models\StudentDocument;
use App\Services\StudentImportExportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
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

                $counts = [
            'total'       => Student::where('school_id', $schoolId)->count(),
            'active'      => Student::where('school_id', $schoolId)->where('status', 'active')->count(),
            'alumni'      => Student::where('school_id', $schoolId)->whereIn('status', ['graduated', 'alumni'])->count(),
            'transferred' => Student::where('school_id', $schoolId)->whereIn('status', ['transferred', 'transferred_out'])->count(),
        ];

        return Inertia::render('SchoolAdmin/Students/Index', [
            'counts' => $counts,
            'students' => $students,
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
        $classes = SchoolClass::where('school_id', $schoolId)->orderBy('name')->get();
        $sections = Section::where('school_id', $schoolId)->orderBy('name')->get();

        return \Inertia\Inertia::render('SchoolAdmin/Students/Create', [
            'classes'  => $classes,
            'sections' => $sections,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;

        $validated = $request->validate([
            'first_name'        => ['required', 'string', 'max:100'],
            'middle_name'       => ['nullable', 'string', 'max:100'],
            'last_name'         => ['nullable', 'string', 'max:100'],
            'admission_no'      => ['nullable', 'string', 'max:50', Rule::unique('students', 'admission_no')->where(fn ($query) => $query->where('school_id', $schoolId))],
            'class_id'          => ['nullable', 'integer', Rule::exists('classes', 'id')->where(fn ($query) => $query->where('school_id', $schoolId))],
            'section_id'        => ['nullable', 'integer', Rule::exists('sections', 'id')->where(fn ($query) => $query->where('school_id', $schoolId))],
            'gender'            => ['required', 'in:male,female'],
            'date_of_birth'     => ['nullable', 'date'],
            'admission_date'    => ['nullable', 'date'],
            'admission_type'    => ['nullable', 'string', 'max:50'],
            'birth_certificate_no' => ['nullable', 'string', 'max:50'],
            'nemis_upi'         => ['nullable', 'string', 'max:50'],
            'assessment_no'     => ['nullable', 'string', 'max:50'],
            'guardian_name'     => ['nullable', 'string', 'max:150'],
            'guardian_phone'    => ['nullable', 'string', 'max:30'],
            'guardian_relation' => ['nullable', 'string', 'max:50'],
            'status'            => ['required', 'in:active,inactive,transferred,graduated'],
        ]);

        if (!empty($validated['section_id']) && !empty($validated['class_id'])) {
            abort_unless(
                Section::whereKey($validated['section_id'])
                    ->where('school_id', $schoolId)
                    ->where('class_id', $validated['class_id'])
                    ->exists(),
                422,
                'The selected section does not belong to the selected class.'
            );
        }

        $student = DB::transaction(function () use ($validated, $schoolId) {
            School::whereKey($schoolId)->lockForUpdate()->firstOrFail();

            if (empty($validated['admission_no'])) {
                $count = Student::where('school_id', $schoolId)->count() + 1;
                $validated['admission_no'] = 'ADM-' . date('Y') . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
            }
            $validated['school_id'] = $schoolId;
            $student = Student::create($validated);
    
            if (!empty($validated['class_id'])) {
                $activeYear = AcademicYear::where('school_id', $schoolId)->where('is_current', 1)->first()
                    ?? AcademicYear::where('school_id', $schoolId)->orderByDesc('id')->first();
    
                StudentEnrollment::create([
                    'school_id'        => $schoolId,
                    'student_id'       => $student->id,
                    'academic_year_id' => $activeYear?->id,
                    'academic_year'    => $activeYear?->name ?? date('Y'),
                    'term'             => 'Term 1',
                    'class_id'         => $validated['class_id'],
                    'section_id'       => $validated['section_id'] ?? null,
                    'status'           => 'active',
                    'start_date'       => $validated['admission_date'] ?? now()->toDateString(),
                ]);
            }
    
                return $student;
        });
        return redirect()->route('school.students.show', $student->id)->with('success', 'Student enrolled successfully.');
    }

    public function show(Student $student): Response
    {
        $schoolId = auth()->user()->school_id;
        if ($student->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        $student->load([
            'schoolClass',
            'section',
            'guardian',
            'guardians',
            'studentGuardians.guardian',
            'medicalProfile',
            'documents.uploader',
            'enrollments.schoolClass',
            'enrollments.section',
            'enrollments.academicYearRelation',
        ]);

        $classes = SchoolClass::where('school_id', $schoolId)
            ->with('sections:id,class_id,name')
            ->orderBy('name')
            ->get();

        $academicYears = AcademicYear::where('school_id', $schoolId)
            ->orderByDesc('start_date')
            ->get();

        return Inertia::render('SchoolAdmin/Students/Show', [
            'student'       => $student,
            'classes'       => $classes,
            'academicYears' => $academicYears,
        ]);
    }

    public function edit(Student $student): Response
    {
        $schoolId = auth()->user()->school_id;
        if ($student->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        $classes = SchoolClass::where('school_id', $schoolId)->orderBy('name')->get();
        $sections = Section::where('school_id', $schoolId)->orderBy('name')->get();

        return \Inertia\Inertia::render('SchoolAdmin/Students/Edit', [
            'student'  => $student->load(['schoolClass', 'section', 'guardian', 'user']),
            'classes'  => $classes,
            'sections' => $sections,
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
            'middle_name'       => ['nullable', 'string', 'max:100'],
            'last_name'         => ['nullable', 'string', 'max:100'],
            'admission_no'      => ['required', 'string', 'max:50', Rule::unique('students', 'admission_no')->where(fn ($query) => $query->where('school_id', $schoolId))->ignore($student->id)],
            'class_id'          => ['nullable', 'integer', Rule::exists('classes', 'id')->where(fn ($query) => $query->where('school_id', $schoolId))],
            'section_id'        => ['nullable', 'integer', Rule::exists('sections', 'id')->where(fn ($query) => $query->where('school_id', $schoolId))],
            'gender'            => ['required', 'in:male,female'],
            'date_of_birth'     => ['nullable', 'date'],
            'admission_date'    => ['nullable', 'date'],
            'admission_type'    => ['nullable', 'string', 'max:50'],
            'birth_certificate_no' => ['nullable', 'string', 'max:50'],
            'nemis_upi'         => ['nullable', 'string', 'max:50'],
            'assessment_no'     => ['nullable', 'string', 'max:50'],
            'guardian_name'     => ['nullable', 'string', 'max:150'],
            'guardian_phone'    => ['nullable', 'string', 'max:30'],
            'guardian_relation' => ['nullable', 'string', 'max:50'],
            'status'            => ['required', 'in:active,inactive,transferred,graduated'],
        ]);

        if (!empty($validated['section_id']) && !empty($validated['class_id'])) {
            abort_unless(
                Section::whereKey($validated['section_id'])
                    ->where('school_id', $schoolId)
                    ->where('class_id', $validated['class_id'])
                    ->exists(),
                422,
                'The selected section does not belong to the selected class.'
            );
        }

        DB::transaction(function () use ($student, $validated, $schoolId): void {
            $student->update($validated);

            if (!empty($validated['class_id'])) {
            $activeYear = AcademicYear::where('school_id', $schoolId)->where('is_current', 1)->first()
                ?? AcademicYear::where('school_id', $schoolId)->orderByDesc('id')->first();

            StudentEnrollment::updateOrCreate(
                [
                    'school_id'  => $schoolId,
                    'student_id' => $student->id,
                    'status'     => 'active',
                ],
                [
                    'academic_year_id' => $activeYear?->id,
                    'academic_year'    => $activeYear?->name ?? date('Y'),
                    'class_id'         => $validated['class_id'],
                    'section_id'       => $validated['section_id'] ?? null,
                ]
            );
            }
        });

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

    /**
     * Generate an official, print-ready PDF roster with school letterhead.
     */

    /**
     * Generate an official, print-ready PDF roster with school letterhead.
     */
    public function printRoster(Request $request)
    {
        ini_set('memory_limit', '512M');
        set_time_limit(300);
        $schoolId = auth()->user()->school_id;
        $school = School::find($schoolId) ?? (object) [
            'name' => config('app.name', 'EduFlow'),
            'address' => 'P.O. Box 100 - Nairobi',
            'city' => 'Nairobi',
            'county' => 'Nairobi',
            'country' => 'Kenya',
            'phone' => '+254 700 000 000',
            'email' => 'admin@school.ac.ke',
            'logo_url' => null,
            'knec_code' => null,
            'registration_number' => null,
        ];

        $query = Student::where('school_id', $schoolId)
            ->with(['schoolClass', 'section', 'guardian', 'user']);

        $selectedClass = null;
        if ($request->filled('class_id') && $request->input('class_id') !== 'all') {
            $query->where('class_id', $request->input('class_id'));
            $selectedClass = SchoolClass::where('school_id', $schoolId)->where('id', $request->input('class_id'))->value('name');
        }

        $selectedSection = null;
        if ($request->filled('section_id') && $request->input('section_id') !== 'all') {
            $query->where('section_id', $request->input('section_id'));
            $selectedSection = Section::where('school_id', $schoolId)->where('id', $request->input('section_id'))->value('name');
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(function ($q) use ($s) {
                $q->where('admission_no', 'like', "%{$s}%")
                  ->orWhere('first_name', 'like', "%{$s}%")
                  ->orWhere('last_name', 'like', "%{$s}%")
                  ->orWhere('guardian_name', 'like', "%{$s}%")
                  ->orWhere('guardian_phone', 'like', "%{$s}%");
            });
        }

        $students = $query->orderBy('admission_no', 'asc')->get();

        $data = [
            'school'          => $school,
            'students'        => $students,
            'selectedClass'   => $selectedClass,
            'selectedSection' => $selectedSection,
            'selectedStatus'  => $request->input('status'),
            'academicYear'    => date('Y'),
        ];

        $pdf = Pdf::loadView('pdf.students-roster', $data)
            ->setPaper('a4', 'landscape')
            ->setOption(['isRemoteEnabled' => true, 'isHtml5ParserEnabled' => true, 'isPhpEnabled' => true]);

        $safeSchool = \Illuminate\Support\Str::slug($school->name ?? 'school');
        $fileName = sprintf('%s-student-roster-%s.pdf', $safeSchool, now()->format('Y-m-d'));

        return $pdf->stream($fileName);
    }

    /**
     * Export clean, Excel UTF-8 compatible CSV with human-readable headers.
     */
    public function export(Request $request, StudentImportExportService $service): HttpResponse
    {
        $schoolId = auth()->user()->school_id;
        $school = School::find($schoolId);

        $query = Student::where('school_id', $schoolId)
            ->with(['schoolClass', 'section', 'guardian', 'user']);

        if ($request->filled('class_id') && $request->input('class_id') !== 'all') {
            $query->where('class_id', $request->input('class_id'));
        }
        if ($request->filled('section_id') && $request->input('section_id') !== 'all') {
            $query->where('section_id', $request->input('section_id'));
        }
        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('search')) {
            $s = $request->input('search');
            $query->where(function ($q) use ($s) {
                $q->where('admission_no', 'like', "%{$s}%")
                  ->orWhere('first_name', 'like', "%{$s}%")
                  ->orWhere('last_name', 'like', "%{$s}%");
            });
        }

        $csv = $service->exportCsv($query);
        $safeSchool = \Illuminate\Support\Str::slug($school->name ?? 'school');
        $fileName = sprintf('%s-students-%s.csv', $safeSchool, now()->format('Y-m-d'));

        return response($csv, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $fileName . '"',
            'Pragma'              => 'no-cache',
            'Expires'             => '0',
        ]);
    }

    public function recordProgression(Request $request, Student $student)
    {
        $schoolId = auth()->user()->school_id;
        if ($student->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        $validated = $request->validate([
            'action'           => 'required|in:promote,repeat,stream_transfer,transfer_out,graduated',
            'academic_year_id' => ['nullable', Rule::exists('academic_years', 'id')->where(fn ($query) => $query->where('school_id', $schoolId))],
            'academic_year'    => 'required|string|max:30',
            'term'             => 'required|string|max:30',
            'class_id'         => ['required', Rule::exists('classes', 'id')->where(fn ($query) => $query->where('school_id', $schoolId))],
            'section_id'       => ['nullable', Rule::exists('sections', 'id')->where(fn ($query) => $query->where('school_id', $schoolId))],
            'roll_no'          => 'nullable|string|max:50',
            'effective_date'   => 'required|date',
            'remarks'          => 'nullable|string|max:500',
        ]);

        abort_unless(
            empty($validated['section_id'])
                || Section::whereKey($validated['section_id'])
                    ->where('school_id', $schoolId)
                    ->where('class_id', $validated['class_id'])
                    ->exists(),
            422,
            'The selected section does not belong to the selected class.'
        );

        DB::transaction(function () use ($student, $validated, $schoolId) {
            $now = now();
            $action = $validated['action'];

            // Map action to past enrollment closure status
            $closureStatus = match ($action) {
                'promote'         => 'promoted',
                'repeat'          => 'repeated',
                'stream_transfer' => 'transferred',
                'transfer_out'    => 'transferred_out',
                'graduated'       => 'completed',
                default           => 'transferred',
            };

            // 1. Close current active enrollment record(s)
            StudentEnrollment::where('school_id', $schoolId)
                ->where('student_id', $student->id)
                ->where('status', 'active')
                ->update([
                    'status'   => $closureStatus,
                    'end_date' => $validated['effective_date'],
                ]);

            // 2. Determine student status
            $studentStatus = ($action === 'transfer_out') ? 'transferred' : (($action === 'graduated') ? 'graduated' : 'active');

            // 3. Create new enrollment ledger entry if learner remains active
            if ($studentStatus === 'active') {
                StudentEnrollment::create([
                    'school_id'        => $schoolId,
                    'student_id'       => $student->id,
                    'academic_year_id' => $validated['academic_year_id'] ?? null,
                    'academic_year'    => $validated['academic_year'],
                    'term'             => $validated['term'],
                    'class_id'         => $validated['class_id'],
                    'section_id'       => $validated['section_id'] ?? null,
                    'roll_no'          => $validated['roll_no'] ?? null,
                    'status'           => 'active',
                    'start_date'       => $validated['effective_date'],
                    'remarks'          => $validated['remarks'] ?? null,
                ]);
            }

            // 4. Update student master pointer
            $student->update([
                'class_id'   => $validated['class_id'],
                'section_id' => $validated['section_id'] ?? null,
                'status'     => $studentStatus,
            ]);
        });

        return redirect()->back()->with('success', 'Learner academic progression recorded successfully.');
    }

    public function updateMedicalProfile(Request $request, Student $student)
    {
        $schoolId = auth()->user()->school_id;
        if ($student->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        $validated = $request->validate([
            'blood_group'          => 'nullable|string|max:10',
            'allergies'            => 'nullable|string|max:1000',
            'chronic_conditions'   => 'nullable|string|max:1000',
            'emergency_medication' => 'nullable|string|max:1000',
            'dietary_restrictions' => 'nullable|string|max:1000',
            'sha_nhif_no'          => 'nullable|string|max:50',
            'preferred_hospital'   => 'nullable|string|max:150',
            'doctor_name'          => 'nullable|string|max:100',
            'doctor_phone'         => 'nullable|string|max:50',
            'special_instructions' => 'nullable|string|max:1000',
        ]);

        StudentMedicalProfile::updateOrCreate(
            [
                'school_id'  => $schoolId,
                'student_id' => $student->id,
            ],
            $validated
        );

        // Mirror blood group back to master student record
        if (!empty($validated['blood_group'])) {
            $student->update(['blood_group' => $validated['blood_group']]);
        }

        return redirect()->back()->with('success', 'Medical profile updated successfully.');
    }

    public function attachGuardian(Request $request, Student $student)
    {
        $schoolId = auth()->user()->school_id;
        if ($student->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        $validated = $request->validate([
            'name'                       => 'required|string|max:255',
            'relation'                   => 'required|string|max:50',
            'phone'                      => 'required|string|max:50',
            'email'                      => 'nullable|email|max:255',
            'address'                    => 'nullable|string|max:255',
            'is_primary'                 => 'nullable|boolean',
            'has_legal_custody'          => 'nullable|boolean',
            'receives_sms_notifications' => 'nullable|boolean',
            'receives_report_cards'      => 'nullable|boolean',
            'emergency_priority'         => 'nullable|integer|min:1|max:5',
        ]);

        abort_unless(
            empty($validated['section_id'])
                || Section::whereKey($validated['section_id'])
                    ->where('school_id', $schoolId)
                    ->where('class_id', $validated['class_id'])
                    ->exists(),
            422,
            'The selected section does not belong to the selected class.'
        );

        DB::transaction(function () use ($student, $validated, $schoolId) {
            $guardian = Guardian::create([
                'school_id' => $schoolId,
                'name'      => $validated['name'],
                'relation'  => $validated['relation'],
                'phone'     => $validated['phone'],
                'email'     => $validated['email'] ?? null,
                'address'   => $validated['address'] ?? null,
            ]);

            $isPrimary = (bool)($validated['is_primary'] ?? false);

            if ($isPrimary) {
                // Remove primary flag from existing guardians for this learner
                StudentGuardian::where('school_id', $schoolId)
                    ->where('student_id', $student->id)
                    ->update(['is_primary' => false]);

                $student->update(['guardian_id' => $guardian->id]);
            }

            StudentGuardian::create([
                'school_id'                  => $schoolId,
                'student_id'                 => $student->id,
                'guardian_id'                => $guardian->id,
                'relationship_type'          => $validated['relation'],
                'is_primary'                 => $isPrimary,
                'has_legal_custody'          => (bool)($validated['has_legal_custody'] ?? true),
                'receives_sms_notifications' => (bool)($validated['receives_sms_notifications'] ?? true),
                'receives_report_cards'      => (bool)($validated['receives_report_cards'] ?? true),
                'emergency_priority'         => (int)($validated['emergency_priority'] ?? 1),
            ]);
        });

        return redirect()->back()->with('success', 'Guardian record attached successfully.');
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

        public function downloadDocument(Student $student, StudentDocument $document)
    {
        $schoolId = auth()->user()->school_id;
        if (!auth()->user()->hasRole('super-admin')) {
            if ((int)$student->school_id !== (int)$schoolId || 
                (int)$document->school_id !== (int)$schoolId || 
                (int)$document->student_id !== (int)$student->id) {
                abort(403, 'Cross-tenant document access denied.');
            }
        }

        if (!Storage::disk('private')->exists($document->file_path)) {
            abort(404, 'The requested document file could not be found.');
        }

        return Storage::disk('private')->download($document->file_path, $document->file_name);
    }

    public function deleteDocument(Student $student, StudentDocument $document): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;
        if (!auth()->user()->hasRole('super-admin')) {
            if ((int)$student->school_id !== (int)$schoolId || 
                (int)$document->school_id !== (int)$schoolId || 
                (int)$document->student_id !== (int)$student->id) {
                abort(403, 'Cross-tenant document deletion denied.');
            }
        }

        if (Storage::disk('private')->exists($document->file_path)) {
            Storage::disk('private')->delete($document->file_path);
        }
        $document->delete();

        return back()->with('success', 'Document deleted successfully.');
    }
}