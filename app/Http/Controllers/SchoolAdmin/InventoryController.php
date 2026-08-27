<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\Asset;
use App\Models\Department;
use App\Models\InventoryCategory;
use App\Models\InventoryIssue;
use App\Models\InventoryItem;
use App\Models\InventoryPurchase;
use App\Models\Staff;
use App\Models\Student;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryController extends Controller
{
    

    public function index(Request $request): Response
    {
        $sid = $this->getSchoolId();

        $items = InventoryItem::with('category:id,name')
            ->where('school_id', $sid)
            ->when($request->search, fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->when($request->category_id && $request->category_id !== 'all', fn ($q) => $q->where('category_id', $request->category_id))
            ->orderBy('name')
            ->paginate(15, ['*'], 'items_page')
            ->withQueryString();

        $issues = InventoryIssue::with('item:id,name,unit')
            ->where('school_id', $sid)
            ->when($request->issue_status && $request->issue_status !== 'all', fn ($q) => $q->where('status', $request->issue_status))
            ->latest('issue_date')
            ->paginate(15, ['*'], 'issues_page')
            ->withQueryString();

        $purchases = InventoryPurchase::with('item:id,name,unit')
            ->where('school_id', $sid)
            ->latest('purchase_date')
            ->paginate(15, ['*'], 'purchases_page')
            ->withQueryString();

        $assets = Asset::where('school_id', $sid)
            ->when($request->asset_search, function ($q, $s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('asset_code', 'like', "%{$s}%")
                  ->orWhere('location', 'like', "%{$s}%");
            })
            ->when($request->asset_status && $request->asset_status !== 'all', fn ($q) => $q->where('status', $request->asset_status))
            ->orderBy('name')
            ->paginate(15, ['*'], 'assets_page')
            ->withQueryString();

        $categories = InventoryCategory::where('school_id', $sid)->orderBy('name')->get(['id', 'name']);
        $departments = Department::where('school_id', $sid)->orderBy('name')->get(['id', 'name', 'code']);
        $staffList = Staff::where('school_id', $sid)->where('status', 'active')->orderBy('first_name')->get(['id', 'first_name', 'last_name', 'emp_id']);
        $allItems = InventoryItem::where('school_id', $sid)->where('is_active', true)->orderBy('name')->get(['id', 'name', 'unit', 'current_stock', 'minimum_stock']);

        $totalItems = InventoryItem::where('school_id', $sid)->count();
        $lowStockCount = InventoryItem::where('school_id', $sid)->whereColumn('current_stock', '<=', 'minimum_stock')->count();
        $totalAssetCost = Asset::where('school_id', $sid)->sum('purchase_price');
        $totalAssetValuation = Asset::where('school_id', $sid)->sum('current_value');
        $activeIssuesCount = InventoryIssue::where('school_id', $sid)->where('status', 'issued')->count();

        $stats = [
            'total_items'         => $totalItems,
            'low_stock_count'     => $lowStockCount,
            'total_asset_cost'    => (float) $totalAssetCost,
            'total_asset_value'   => (float) $totalAssetValuation,
            'active_store_issues' => $activeIssuesCount,
        ];

        return Inertia::render('SchoolAdmin/Inventory/Index', [
            'items'       => $items,
            'issues'      => $issues,
            'purchases'   => $purchases,
            'assets'      => $assets,
            'categories'  => $categories,
            'departments' => $departments,
            'staffList'   => $staffList,
            'allItems'    => $allItems,
            'stats'       => $stats,
            'filters'     => $request->only('search', 'category_id', 'issue_status', 'asset_search', 'asset_status'),
        ]);
    }

    public function categories(Request $request): Response
    {
        return $this->index($request);
    }

    public function items(Request $request): Response
    {
        return $this->index($request);
    }

    public function purchases(Request $request): Response
    {
        return $this->index($request);
    }

    public function issues(Request $request): Response
    {
        return $this->index($request);
    }

    public function assets(Request $request): Response
    {
        return $this->index($request);
    }

    public function showAsset(Asset $asset): Response
    {
        $sid = $this->getSchoolId();
        abort_unless((int) $asset->school_id === $sid, 404);

        return Inertia::render('SchoolAdmin/Inventory/AssetDetail', [
            'asset' => $asset,
        ]);
    }

    public function storeCategory(Request $request): RedirectResponse
    {
        $sid = $this->getSchoolId();

        $validated = $request->validate([
            'name'        => 'required|string|max:100',
            'description' => 'nullable|string|max:255',
        ]);

        $validated['school_id'] = $sid;
        InventoryCategory::create($validated);

        return redirect()->route('school.inventory.categories')
            ->with('success', 'Category created successfully.');
    }

    public function destroyCategory(InventoryCategory $inventoryCategory): RedirectResponse
    {
        $sid = $this->getSchoolId();
        abort_unless((int) $inventoryCategory->school_id === $sid, 404);

        $inventoryCategory->delete();

        return redirect()->route('school.inventory.categories')
            ->with('success', 'Category deleted.');
    }

    public function storeItem(Request $request): RedirectResponse
    {
        $sid = $this->getSchoolId();

        $validated = $request->validate([
            'category_id'   => 'required|integer',
            'name'          => 'required|string|max:255',
            'unit'          => 'required|string|max:50',
            'minimum_stock' => 'required|numeric|min:0',
            'description'   => 'nullable|string',
        ]);

        InventoryCategory::where('school_id', $sid)->findOrFail($validated['category_id']);

        $validated['school_id'] = $sid;
        $validated['current_stock'] = 0;
        $validated['is_active'] = true;

        InventoryItem::create($validated);

        return redirect()->route('school.inventory.items')
            ->with('success', 'Item registered successfully.');
    }

    public function updateItem(Request $request, InventoryItem $inventoryItem): RedirectResponse
    {
        $sid = $this->getSchoolId();
        abort_unless((int) $inventoryItem->school_id === $sid, 404);

        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'unit'          => 'required|string|max:50',
            'minimum_stock' => 'required|numeric|min:0',
        ]);

        $inventoryItem->update($validated);

        return redirect()->route('school.inventory.items')
            ->with('success', 'Item updated.');
    }

    public function destroyItem(InventoryItem $inventoryItem): RedirectResponse
    {
        $sid = $this->getSchoolId();
        abort_unless((int) $inventoryItem->school_id === $sid, 404);

        $inventoryItem->delete();

        return redirect()->route('school.inventory.items')
            ->with('success', 'Item deleted.');
    }

    public function storePurchase(Request $request): RedirectResponse
    {
        $sid = $this->getSchoolId();

        $validated = $request->validate([
            'item_id'       => 'required|integer',
            'purchase_date' => 'required|date',
            'quantity'      => 'required|numeric|min:0.01',
            'unit_price'    => 'required|numeric|min:0',
            'supplier_name' => 'nullable|string|max:255',
            'invoice_no'    => 'nullable|string|max:100',
        ]);

        $item = InventoryItem::where('school_id', $sid)->findOrFail($validated['item_id']);

        $validated['school_id'] = $sid;
        $validated['total_price'] = (float) $validated['quantity'] * (float) $validated['unit_price'];

        InventoryPurchase::create($validated);
        $item->increment('current_stock', (float) $validated['quantity']);

        return redirect()->route('school.inventory.purchases')
            ->with('success', 'Stock purchase recorded.');
    }

    public function storeIssue(Request $request): RedirectResponse
    {
        $sid = $this->getSchoolId();

        $validated = $request->validate([
            'item_id'        => 'required|integer',
            'issued_to_type' => 'required|string',
            'issued_to_id'   => 'nullable|integer',
            'issued_to_name' => 'nullable|string|max:255',
            'quantity'       => 'required|numeric|min:0.01',
            'issue_date'     => 'required|date',
            'remarks'        => 'nullable|string',
        ]);

        $item = InventoryItem::where('school_id', $sid)->findOrFail($validated['item_id']);

        if (!empty($validated['issued_to_id'])) {
            if ($validated['issued_to_type'] === 'staff') {
                Staff::where('school_id', $sid)->findOrFail($validated['issued_to_id']);
            } elseif ($validated['issued_to_type'] === 'student') {
                Student::where('school_id', $sid)->findOrFail($validated['issued_to_id']);
            }
        }

        $validated['school_id'] = $sid;
        $validated['status'] = 'issued';

        InventoryIssue::create($validated);
        $item->decrement('current_stock', (float) $validated['quantity']);

        return redirect()->route('school.inventory.issues')
            ->with('success', 'Item issued successfully.');
    }

    public function returnIssue(Request $request, InventoryIssue $inventoryIssue): RedirectResponse
    {
        $sid = $this->getSchoolId();
        abort_unless((int) $inventoryIssue->school_id === $sid, 404);

        $returnedQty = (float) $request->input('returned_quantity', $inventoryIssue->quantity);
        $returnDate = $request->input('return_date', now()->toDateString());

        $inventoryIssue->update([
            'status'            => 'returned',
            'return_date'       => $returnDate,
            'returned_quantity' => $returnedQty,
        ]);

        if ($inventoryIssue->item) {
            $inventoryIssue->item->increment('current_stock', $returnedQty);
        }

        return redirect()->route('school.inventory.issues')
            ->with('success', 'Issue marked as returned.');
    }

    public function storeAsset(Request $request): RedirectResponse
    {
        $sid = $this->getSchoolId();

        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'category'       => 'required|string|max:100',
            'purchase_price' => 'required|numeric|min:0',
            'current_value'  => 'required|numeric|min:0',
        ]);

        $validated['school_id'] = $sid;
        $validated['status'] = 'active';

        Asset::create($validated);

        return redirect()->route('school.inventory.assets')
            ->with('success', 'Asset recorded successfully.');
    }

    public function updateAsset(Request $request, Asset $asset): RedirectResponse
    {
        $sid = $this->getSchoolId();
        abort_unless((int) $asset->school_id === $sid, 404);

        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'current_value' => 'required|numeric|min:0',
        ]);

        $asset->update($validated);

        return redirect()->route('school.inventory.assets')
            ->with('success', 'Asset updated.');
    }

    public function destroyAsset(Asset $asset): RedirectResponse
    {
        $sid = $this->getSchoolId();
        abort_unless((int) $asset->school_id === $sid, 404);

        $asset->delete();

        return redirect()->route('school.inventory.assets')
            ->with('success', 'Asset deleted.');
    }

    public function storeAssetMaintenance(Request $request, Asset $asset): RedirectResponse
    {
        $sid = $this->getSchoolId();
        abort_unless((int) $asset->school_id === $sid, 404);

        $request->validate([
            'date'        => 'required|date',
            'description' => 'required|string|max:500',
        ]);

        return redirect()->route('school.inventory.assets')
            ->with('success', 'Maintenance record created.');
    }
}