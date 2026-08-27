<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\FeeCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FeeCategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $sid = $this->getSchoolId();

        $categories = FeeCategory::where('school_id', $sid)
            ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->withCount('feeStructures')
            ->orderBy('name')
            ->get();

        return Inertia::render('SchoolAdmin/Fees/Categories', [
            'categories' => $categories,
            'filters'    => $request->only('search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $sid = $this->getSchoolId();

        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'type'        => 'nullable|string|max:50',
            'description' => 'nullable|string|max:255',
            'is_active'   => 'boolean',
        ]);

        $data['school_id'] = $sid;
        $data['type'] = $data['type'] ?? 'tuition';
        $data['is_active'] = $data['is_active'] ?? true;

        FeeCategory::create($data);

        return back()->with('success', 'Fee category created successfully.');
    }

    public function edit(FeeCategory $feeCategory): Response
    {
        $this->assertCategoryOwnership($feeCategory);

        return Inertia::render('SchoolAdmin/Fees/CategoryEdit', [
            'category' => $feeCategory,
        ]);
    }

    public function update(Request $request, FeeCategory $feeCategory): RedirectResponse
    {
        $this->assertCategoryOwnership($feeCategory);

        $data = $request->validate([
            'name'        => 'required|string|max:100',
            'type'        => 'nullable|string|max:50',
            'description' => 'nullable|string|max:255',
            'is_active'   => 'boolean',
        ]);

        $feeCategory->update($data);

        return back()->with('success', 'Fee category updated successfully.');
    }

    public function destroy(FeeCategory $feeCategory): RedirectResponse
    {
        $this->assertCategoryOwnership($feeCategory);

        if ($feeCategory->feeStructures()->exists()) {
            return back()->withErrors(['error' => 'Cannot delete a fee category linked to active fee structures.']);
        }

        $feeCategory->delete();

        return back()->with('success', 'Fee category deleted.');
    }

    private function assertCategoryOwnership(FeeCategory $feeCategory): void
    {
        abort_unless((int) $feeCategory->school_id === (int) $this->getSchoolId(), 404);
    }
}