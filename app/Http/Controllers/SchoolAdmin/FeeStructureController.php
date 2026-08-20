<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\FeeCategory;
use App\Models\FeeStructure;
use App\Models\SchoolClass;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FeeStructureController extends Controller
{
    public function __construct()
    {
        $this->authorizeResource(FeeStructure::class, 'feeStructure');
    }

    public function index(Request $request)
    {
        $sid = $this->getSchoolId();
        $this->assertFilterOwnership($request, $sid);

        $structures = FeeStructure::with(['schoolClass:id,name', 'feeCategory:id,name,type'])
            ->when($request->class_id, fn ($q) => $q->where('class_id', $request->class_id))
            ->when($request->category_id, fn ($q) => $q->where('fee_category_id', $request->category_id))
            ->when($request->academic_year, fn ($q) => $q->where('academic_year', $request->academic_year))
            ->orderBy('academic_year', 'desc')
            ->orderByRaw('(SELECT numeric_name FROM classes WHERE classes.id = fee_structures.class_id) ASC')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('SchoolAdmin/Fees/Structures', [
            'structures' => $structures,
            'classes' => SchoolClass::where('school_id', $sid)->orderBy('numeric_name')->get(['id', 'name']),
            'categories' => FeeCategory::where('school_id', $sid)->where('is_active', true)->orderBy('name')->get(['id', 'name', 'type']),
            'filters' => $request->only('class_id', 'category_id', 'academic_year'),
            'currentYear' => '2025-2026',
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'class_id' => 'required|integer',
            'fee_category_id' => 'required|integer',
            'academic_year' => 'required|string|max:20',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'nullable|date',
            'frequency' => 'required|in:monthly,quarterly,annual,one_time',
            'description' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $sid = $this->getSchoolId();
        $this->assertRelatedOwnership($data, $sid);

        FeeStructure::create(array_merge($data, [
            'school_id' => $sid,
            'is_active' => $data['is_active'] ?? true,
        ]));

        return back()->with('success', 'Fee structure created.');
    }

    public function update(Request $request, FeeStructure $feeStructure)
    {
        $data = $request->validate([
            'class_id' => 'required|integer',
            'fee_category_id' => 'required|integer',
            'academic_year' => 'required|string|max:20',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'nullable|date',
            'frequency' => 'required|in:monthly,quarterly,annual,one_time',
            'description' => 'nullable|string|max:255',
            'is_active' => 'boolean',
        ]);

        $this->assertRelatedOwnership($data, $this->getSchoolId());
        $feeStructure->update($data);

        return back()->with('success', 'Fee structure updated.');
    }

    public function destroy(FeeStructure $feeStructure)
    {
        $feeStructure->delete();

        return back()->with('success', 'Fee structure deleted.');
    }

    private function assertFilterOwnership(Request $request, int $schoolId): void
    {
        if ($request->filled('class_id')) {
            $this->assertClassOwnership((int) $request->class_id, $schoolId);
        }
        if ($request->filled('category_id')) {
            $this->assertCategoryOwnership((int) $request->category_id, $schoolId);
        }
    }

    private function assertRelatedOwnership(array $data, int $schoolId): void
    {
        $this->assertClassOwnership((int) $data['class_id'], $schoolId);
        $this->assertCategoryOwnership((int) $data['fee_category_id'], $schoolId);
    }

    private function assertClassOwnership(int $classId, int $schoolId): void
    {
        abort_unless(SchoolClass::withoutGlobalScopes()->whereKey($classId)->where('school_id', $schoolId)->exists(), 404);
    }

    private function assertCategoryOwnership(int $categoryId, int $schoolId): void
    {
        abort_unless(FeeCategory::withoutGlobalScopes()->whereKey($categoryId)->where('school_id', $schoolId)->exists(), 404);
    }
}