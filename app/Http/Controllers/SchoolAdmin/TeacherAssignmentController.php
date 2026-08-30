<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Staff;
use App\Models\Subject;
use App\Models\TeacherAssignment;
use App\Services\OdpcAuditService;
use App\Services\TeacherResponsibilityService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TeacherAssignmentController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = auth()->user()->school_id;

        $academicYears = AcademicYear::where('school_id', $schoolId)->orderByDesc('id')->get();
        $selectedYearId = $request->input('academic_year_id', TeacherResponsibilityService::getActiveAcademicYearId($schoolId));

        $classes = SchoolClass::where('school_id', $schoolId)->with('sections')->get();
        $subjects = Subject::where('school_id', $schoolId)->get();
        $teachers = Staff::where('school_id', $schoolId)->where('status', 'active')->orderBy('first_name')->get();

        $query = TeacherAssignment::where('school_id', $schoolId)
            ->with([
                'staff:id,first_name,last_name,emp_id,phone',
                'schoolClass:id,name',
                'section:id,name',
                'subject:id,name,code',
                'academicYear:id,name',
            ]);

        if ($selectedYearId) {
            $query->where('academic_year_id', $selectedYearId);
        }

        if ($request->filled('staff_id') && $request->staff_id !== 'all') {
            $query->where('staff_id', $request->staff_id);
        }

        if ($request->filled('class_id') && $request->class_id !== 'all') {
            $query->where('class_id', $request->class_id);
        }

        if ($request->filled('assignment_type') && $request->assignment_type !== 'all') {
            $query->where('assignment_type', $request->assignment_type);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $assignments = $query->orderByDesc('status')
            ->orderBy('class_id')
            ->paginate(25)
            ->withQueryString();

        $unassignedDiagnostics = TeacherResponsibilityService::detectUnassignedCurriculum($schoolId, (int)$selectedYearId);

        return Inertia::render('SchoolAdmin/Teachers/Assignments/Index', [
            'assignments'           => $assignments,
            'academicYears'         => $academicYears,
            'classes'               => $classes,
            'subjects'              => $subjects,
            'teachers'              => $teachers,
            'unassignedDiagnostics' => $unassignedDiagnostics,
            'filters'               => [
                'academic_year_id' => (string)$selectedYearId,
                'staff_id'         => $request->input('staff_id', ''),
                'class_id'         => $request->input('class_id', ''),
                'assignment_type'  => $request->input('assignment_type', ''),
                'status'           => $request->input('status', 'active'),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;

        $validated = $request->validate([
            'staff_id'         => 'required|exists:staff,id',
            'academic_year_id' => 'required|exists:academic_years,id',
            'class_id'         => 'required|exists:classes,id',
            'section_id'       => 'nullable|exists:sections,id',
            'subject_id'       => 'nullable|exists:subjects,id',
            'assignment_type'  => 'required|in:class_teacher,co_class_teacher,subject_teacher,hod,cbc_coordinator',
            'term'             => 'nullable|string|max:20',
            'start_date'       => 'required|date',
            'end_date'         => 'nullable|date|after_or_equal:start_date',
            'remarks'          => 'nullable|string|max:500',
        ]);

        $staff = Staff::where('school_id', $schoolId)->findOrFail($validated['staff_id']);

        // Collision Check 1: Primary Class Teacher collision
        if ($validated['assignment_type'] === 'class_teacher') {
            $existingCt = TeacherAssignment::where('school_id', $schoolId)
                ->where('academic_year_id', $validated['academic_year_id'])
                ->where('class_id', $validated['class_id'])
                ->where('section_id', $validated['section_id'] ?? null)
                ->where('assignment_type', 'class_teacher')
                ->where('status', 'active')
                ->first();

            if ($existingCt) {
                return redirect()->back()->withErrors([
                    'assignment_type' => "Collision Detected: {$existingCt->staff?->first_name} {$existingCt->staff?->last_name} is already the active Class Teacher for this class/stream. Please transfer or conclude the existing assignment first.",
                ]);
            }
        }

        // Collision Check 2: Duplicate Subject Teacher assignment
        if ($validated['assignment_type'] === 'subject_teacher' && !empty($validated['subject_id'])) {
            $duplicate = TeacherAssignment::where('school_id', $schoolId)
                ->where('staff_id', $validated['staff_id'])
                ->where('academic_year_id', $validated['academic_year_id'])
                ->where('class_id', $validated['class_id'])
                ->where('section_id', $validated['section_id'] ?? null)
                ->where('subject_id', $validated['subject_id'])
                ->where('status', 'active')
                ->exists();

            if ($duplicate) {
                return redirect()->back()->withErrors([
                    'subject_id' => 'This teacher is already actively assigned to this subject/learning area for this class.',
                ]);
            }
        }

        $assignment = TeacherAssignment::create([
            'school_id'         => $schoolId,
            'staff_id'          => $validated['staff_id'],
            'user_id'           => $staff->user_id,
            'academic_year_id'  => $validated['academic_year_id'],
            'class_id'          => $validated['class_id'],
            'section_id'        => $validated['section_id'] ?? null,
            'subject_id'        => $validated['subject_id'] ?? null,
            'assignment_type'   => $validated['assignment_type'],
            'term'              => $validated['term'] ?? null,
            'start_date'        => $validated['start_date'],
            'end_date'          => $validated['end_date'] ?? null,
            'status'            => 'active',
            'assigned_by'       => auth()->id(),
            'remarks'           => $validated['remarks'] ?? null,
        ]);

        OdpcAuditService::log(
            'CREATE',
            'teacher_assignment',
            null,
            (string)$assignment->id,
            [
                'teacher'         => "{$staff->first_name} {$staff->last_name}",
                'assignment_type' => $assignment->assignment_type,
                'class_id'        => $assignment->class_id,
            ]
        );

        return redirect()->back()->with('success', 'Teaching responsibility successfully assigned.');
    }

    /**
     * Transfer or conclude an assignment while preserving historical records.
     */
    public function concludeOrTransfer(Request $request, TeacherAssignment $assignment): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;
        if ($assignment->school_id !== $schoolId && !auth()->user()->hasRole('super-admin')) {
            abort(403);
        }

        $validated = $request->validate([
            'action'             => 'required|in:end,transfer',
            'end_date'           => 'required|date',
            'replacement_staff_id' => 'nullable|required_if:action,transfer|exists:staff,id',
            'remarks'            => 'nullable|string|max:500',
        ]);

        DB::transaction(function () use ($assignment, $validated, $schoolId) {
            // Conclude old assignment with exact historical bounds
            $assignment->update([
                'end_date' => $validated['end_date'],
                'status'   => $validated['action'] === 'transfer' ? 'transferred' : 'ended',
                'remarks'  => trim(($assignment->remarks ?? '') . "\n" . ($validated['remarks'] ?? 'Closed/Transferred on ' . now()->toDateString())),
            ]);

            // If transferring, create new assignment record for replacement teacher
            if ($validated['action'] === 'transfer' && !empty($validated['replacement_staff_id'])) {
                $replacementStaff = Staff::where('school_id', $schoolId)->findOrFail($validated['replacement_staff_id']);

                TeacherAssignment::create([
                    'school_id'        => $schoolId,
                    'staff_id'         => $replacementStaff->id,
                    'user_id'          => $replacementStaff->user_id,
                    'academic_year_id' => $assignment->academic_year_id,
                    'class_id'         => $assignment->class_id,
                    'section_id'       => $assignment->section_id,
                    'subject_id'       => $assignment->subject_id,
                    'assignment_type'  => $assignment->assignment_type,
                    'term'             => $assignment->term,
                    'start_date'       => $validated['end_date'], // Starts upon transfer
                    'status'           => 'active',
                    'assigned_by'      => auth()->id(),
                    'remarks'          => "Transferred from previous teacher: {$assignment->staff?->first_name} {$assignment->staff?->last_name}",
                ]);
            }
        });

        return redirect()->back()->with('success', 'Assignment status updated with complete historical preservation.');
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
