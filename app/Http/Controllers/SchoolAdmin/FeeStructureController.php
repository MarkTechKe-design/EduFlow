<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\FeeCategory;
use App\Models\FeeStructure;
use App\Models\FeeVoteHead;
use App\Models\SchoolClass;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class FeeStructureController extends Controller
{
    public function index(Request $request): Response
    {
        $sid = $this->getSchoolId();

        $structures = FeeStructure::with(['schoolClass:id,name', 'category:id,name', 'items.voteHead'])
            ->where('school_id', $sid)
            ->when($request->class_id, fn ($q, $c) => $q->where('class_id', $c))
            ->when($request->fee_category_id, fn ($q, $cat) => $q->where('fee_category_id', $cat))
            ->when($request->term, fn ($q, $t) => $q->where('term', $t))
            ->when($request->academic_year, fn ($q, $y) => $q->where('academic_year', $y))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        $classes = SchoolClass::where('school_id', $sid)->orderBy('numeric_name')->get(['id', 'name']);
        $categories = FeeCategory::where('school_id', $sid)->where('is_active', true)->orderBy('name')->get(['id', 'name']);
        
        $academicYears = Schema::hasTable('academic_years')
            ? AcademicYear::where('school_id', $sid)->orderByDesc('id')->get(['id', 'name'])
            : collect([['id' => 1, 'name' => '2026']]);

        $voteHeads = Schema::hasTable('fee_vote_heads')
            ? FeeVoteHead::where('school_id', $sid)->where('is_active', true)->get(['id', 'name', 'code'])
            : collect();

        return Inertia::render('SchoolAdmin/Fees/Structures', [
            'structures'    => $structures,
            'classes'       => $classes,
            'categories'    => $categories,
            'academicYears' => $academicYears,
            'voteHeads'     => $voteHeads,
            'filters'       => $request->only('class_id', 'fee_category_id', 'term', 'academic_year'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $sid = $this->getSchoolId();

        $data = $request->validate([
            'class_id'        => 'required|integer',
            'fee_category_id' => 'nullable|integer',
            'academic_year'   => 'nullable|string|max:20',
            'term'            => 'nullable|string|max:20',
            'title'           => 'nullable|string|max:150',
            'amount'          => 'nullable|numeric|min:0',
            'due_date'        => 'nullable|date',
            'frequency'       => 'nullable|string|max:50',
            'description'     => 'nullable|string|max:255',
        ]);

        $this->assertClassOwnership((int) $data['class_id'], $sid);
        if (!empty($data['fee_category_id'])) {
            $this->assertCategoryOwnership((int) $data['fee_category_id'], $sid);
        } else {
            $defaultCat = FeeCategory::firstOrCreate(['school_id' => $sid, 'name' => 'General Tuition'], ['type' => 'tuition', 'is_active' => true]);
            $data['fee_category_id'] = $defaultCat->id;
        }

        $data['school_id'] = $sid;
        $data['academic_year'] = $data['academic_year'] ?? '2026';
        $data['frequency'] = $data['frequency'] ?? 'per_term';
        $data['amount'] = $data['amount'] ?? 0;
        $data['total_amount'] = $data['amount'];
        $data['title'] = $data['title'] ?? 'Term Fee Structure';

        FeeStructure::create($data);

        return back()->with('success', 'Fee structure created successfully.');
    }

    public function update(Request $request, FeeStructure $feeStructure): RedirectResponse
    {
        $sid = $this->getSchoolId();
        abort_unless((int) $feeStructure->school_id === (int) $sid, 404);

        $data = $request->validate([
            'class_id'        => 'required|integer',
            'fee_category_id' => 'nullable|integer',
            'academic_year'   => 'nullable|string|max:20',
            'term'            => 'nullable|string|max:20',
            'title'           => 'nullable|string|max:150',
            'amount'          => 'required|numeric|min:0',
            'due_date'        => 'nullable|date',
            'frequency'       => 'nullable|string|max:50',
            'description'     => 'nullable|string|max:255',
        ]);

        $this->assertClassOwnership((int) $data['class_id'], $sid);
        if (!empty($data['fee_category_id'])) {
            $this->assertCategoryOwnership((int) $data['fee_category_id'], $sid);
        }

        $data['total_amount'] = $data['amount'];
        $feeStructure->update($data);

        return back()->with('success', 'Fee structure updated successfully.');
    }

    public function destroy(FeeStructure $feeStructure): RedirectResponse
    {
        $sid = $this->getSchoolId();
        abort_unless((int) $feeStructure->school_id === (int) $sid, 404);

        $feeStructure->delete();

        return back()->with('success', 'Fee structure removed.');
    }

    private function assertClassOwnership(int $classId, int $schoolId): void
    {
        abort_unless(
            SchoolClass::withoutGlobalScopes()->whereKey($classId)->where('school_id', $schoolId)->exists(),
            404
        );
    }

    private function assertCategoryOwnership(int $categoryId, int $schoolId): void
    {
        abort_unless(
            FeeCategory::withoutGlobalScopes()->whereKey($categoryId)->where('school_id', $schoolId)->exists(),
            404
        );
    }
}