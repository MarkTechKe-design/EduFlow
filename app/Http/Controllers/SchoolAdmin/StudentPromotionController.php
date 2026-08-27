<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class StudentPromotionController extends Controller
{
    public function index(Request $request): Response
    {
        $schoolId = auth()->user()->school_id;

        // 1. Fetch Academic Years
        $academicYears = AcademicYear::where('school_id', $schoolId)
            ->orderByDesc('is_current')
            ->orderByDesc('id')
            ->get(['id', 'name', 'is_current', 'start_date', 'end_date']);

        $currentYear = $academicYears->firstWhere('is_current', true) ?? $academicYears->first();
        $targetYearId = $request->input('target_academic_year_id')
            ? (int)$request->input('target_academic_year_id')
            : ($academicYears->firstWhere('is_current', false)?->id ?? $currentYear?->id);

        // 2. Fetch Classes with Sections ordered by Kenyan progression sequence
        $classes = SchoolClass::where('school_id', $schoolId)
            ->with(['sections' => fn ($q) => $q->orderBy('name')])
            ->orderBy('numeric_name')
            ->orderBy('name')
            ->get(['id', 'name', 'numeric_name']);

        // 3. Compute Class-by-Class Rollover Status Matrix
        $rolloverMatrix = [];
        if ($targetYearId) {
            foreach ($classes as $cls) {
                $totalActive = Student::where('school_id', $schoolId)
                    ->where('class_id', $cls->id)
                    ->where('status', 'active')
                    ->count();

                $promotedToTarget = StudentEnrollment::where('school_id', $schoolId)
                    ->where('academic_year_id', $targetYearId)
                    ->whereIn('student_id', function ($query) use ($schoolId, $cls) {
                        $query->select('id')
                            ->from('students')
                            ->where('school_id', $schoolId)
                            ->where('class_id', $cls->id);
                    })
                    ->count();

                $pct = $totalActive > 0 ? min(100, round(($promotedToTarget / $totalActive) * 100)) : 100;
                
                $status = 'pending';
                if ($pct >= 100 && $totalActive > 0) {
                    $status = 'completed';
                } elseif ($pct > 0) {
                    $status = 'in_progress';
                } elseif ($totalActive === 0) {
                    $status = 'empty';
                }

                $rolloverMatrix[] = [
                    'class_id'     => $cls->id,
                    'class_name'   => $cls->name,
                    'numeric_rank' => $cls->numeric_name,
                    'total_active' => $totalActive,
                    'promoted'     => $promotedToTarget,
                    'percentage'   => $pct,
                    'status'       => $status,
                ];
            }
        }

        $sourceClassId = $request->input('source_class_id');
        $sourceSectionId = $request->input('source_section_id');

        // 4. Fetch Active Learners for Selected Source Cohort
        $students = [];
        if ($sourceClassId && $sourceClassId !== 'all') {
            $studentQuery = Student::where('school_id', $schoolId)
                ->where('class_id', $sourceClassId)
                ->where('status', 'active')
                ->with(['schoolClass:id,name,numeric_name', 'section:id,name', 'guardian:id,name,phone'])
                ->orderBy('admission_no');

            if ($sourceSectionId && $sourceSectionId !== 'all') {
                $studentQuery->where('section_id', $sourceSectionId);
            }

            $students = $studentQuery->get();
        }

        return Inertia::render('SchoolAdmin/Students/Promote', [
            'academicYears'  => $academicYears,
            'classes'        => $classes,
            'students'       => $students,
            'rolloverMatrix' => $rolloverMatrix,
            'filters'        => [
                'source_class_id'         => $sourceClassId ?: '',
                'source_section_id'       => $sourceSectionId ?: '',
                'source_academic_year_id' => $request->input('source_academic_year_id', ''),
                'target_academic_year_id' => $targetYearId ? (string)$targetYearId : '',
            ],
        ]);
    }

    public function promote(Request $request): RedirectResponse
    {
        $schoolId = auth()->user()->school_id;

        $validated = $request->validate([
            'source_academic_year_id' => 'nullable|exists:academic_years,id',
            'target_academic_year_id' => 'required|exists:academic_years,id',
            'target_academic_year'    => 'required|string|max:30',
            'target_term'             => 'required|string|max:30',
            'effective_date'          => 'required|date',
            'promotions'              => 'required|array|min:1',
            'promotions.*.student_id' => 'required|exists:students,id',
            'promotions.*.action'     => 'required|in:promote,repeat,stream_transfer,transfer_out,graduated,skip',
            'promotions.*.target_class_id'   => 'nullable|exists:classes,id',
            'promotions.*.target_section_id' => 'nullable|exists:sections,id',
            'promotions.*.roll_no'           => 'nullable|string|max:50',
            'promotions.*.remarks'           => 'nullable|string|max:255',
        ]);

        $promotedCount = 0;
        $repeatedCount = 0;
        $graduatedCount = 0;
        $transferredCount = 0;

        DB::transaction(function () use ($validated, $schoolId, &$promotedCount, &$repeatedCount, &$graduatedCount, &$transferredCount) {
            $effectiveDate = $validated['effective_date'];
            $targetYearId = (int)$validated['target_academic_year_id'];
            $targetYear = $validated['target_academic_year'];
            $targetTerm = $validated['target_term'];

            foreach ($validated['promotions'] as $item) {
                $action = $item['action'];
                if ($action === 'skip') {
                    continue;
                }

                $student = Student::where('school_id', $schoolId)->where('id', $item['student_id'])->first();
                if (!$student) {
                    continue;
                }

                $targetClassId = !empty($item['target_class_id']) ? (int)$item['target_class_id'] : $student->class_id;
                $targetSectionId = !empty($item['target_section_id']) ? (int)$item['target_section_id'] : $student->section_id;

                $closureStatus = match ($action) {
                    'promote'         => 'promoted',
                    'repeat'          => 'repeated',
                    'stream_transfer' => 'transferred',
                    'transfer_out'    => 'transferred_out',
                    'graduated'       => 'completed',
                    default           => 'transferred',
                };

                // 1. Close current active enrollment with terminal status
                StudentEnrollment::where('school_id', $schoolId)
                    ->where('student_id', $student->id)
                    ->where('status', 'active')
                    ->update([
                        'status'   => $closureStatus,
                        'end_date' => $effectiveDate,
                    ]);

                // 2. Determine target student directory status
                $newStudentStatus = match ($action) {
                    'transfer_out' => 'transferred',
                    'graduated'    => 'graduated',
                    default        => 'active',
                };

                // 3. Create target enrollment if student remains active (idempotent protection)
                if ($newStudentStatus === 'active') {
                    StudentEnrollment::updateOrCreate(
                        [
                            'school_id'        => $schoolId,
                            'student_id'       => $student->id,
                            'academic_year_id' => $targetYearId,
                        ],
                        [
                            'academic_year' => $targetYear,
                            'term'          => $targetTerm,
                            'class_id'      => $targetClassId,
                            'section_id'    => $targetSectionId,
                            'roll_no'       => $item['roll_no'] ?? null,
                            'status'        => 'active',
                            'start_date'    => $effectiveDate,
                            'remarks'       => $item['remarks'] ?? 'Bulk academic progression',
                        ]
                    );

                    $student->update([
                        'class_id'   => $targetClassId,
                        'section_id' => $targetSectionId,
                        'status'     => 'active',
                    ]);
                } else {
                    $student->update([
                        'status' => $newStudentStatus,
                    ]);
                }

                match ($action) {
                    'promote'         => $promotedCount++,
                    'repeat'          => $repeatedCount++,
                    'graduated'       => $graduatedCount++,
                    'transfer_out'    => $transferredCount++,
                    default           => null,
                };
            }
        });

        $summary = sprintf(
            'Batch promotion processed: %d promoted, %d repeated, %d graduated, %d transferred.',
            $promotedCount,
            $repeatedCount,
            $graduatedCount,
            $transferredCount
        );

        return redirect()->route('school.students.promote', [
            'target_academic_year_id' => $validated['target_academic_year_id'],
        ])->with('success', $summary);
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
