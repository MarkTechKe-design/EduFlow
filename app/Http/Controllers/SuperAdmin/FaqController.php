<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFaqRequest;
use App\Http\Requests\UpdateFaqRequest;
use App\Models\Faq;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class FaqController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Faq::query()->with(['creator:id,name', 'updater:id,name']);

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('question', 'like', "%{$search}%")
                  ->orWhere('answer', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $faqs = $query->orderBy('sort_order', 'asc')
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString();

        $categories = Faq::select('category')->distinct()->pluck('category');

        return Inertia::render('SuperAdmin/Faq/Index', [
            'faqs' => $faqs,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category', 'status']),
        ]);
    }

    public function store(StoreFaqRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $validated['created_by'] = $request->user()->id;
        $validated['updated_by'] = $request->user()->id;

        if (!isset($validated['sort_order'])) {
            $validated['sort_order'] = (Faq::max('sort_order') ?? 0) + 1;
        }

        Faq::create($validated);

        return redirect()->route('super-admin.faqs.index')
            ->with('success', 'FAQ question created successfully.');
    }

    public function update(UpdateFaqRequest $request, Faq $faq): RedirectResponse
    {
        $validated = $request->validated();
        $validated['updated_by'] = $request->user()->id;

        $faq->update($validated);

        return redirect()->route('super-admin.faqs.index')
            ->with('success', 'FAQ question updated successfully.');
    }

    public function destroy(Faq $faq): RedirectResponse
    {
        $faq->delete();

        return redirect()->route('super-admin.faqs.index')
            ->with('success', 'FAQ question deleted successfully.');
    }

    public function togglePublish(Faq $faq): RedirectResponse
    {
        $newStatus = $faq->status === 'published' ? 'draft' : 'published';
        $faq->update([
            'status' => $newStatus,
            'published_at' => $newStatus === 'published' ? now() : $faq->published_at,
            'updated_by' => auth()->id(),
        ]);

        return redirect()->back()
            ->with('success', "FAQ status updated to {$newStatus}.");
    }

    public function toggleHomepage(Faq $faq): RedirectResponse
    {
        $faq->update([
            'is_featured_on_homepage' => !$faq->is_featured_on_homepage,
            'updated_by' => auth()->id(),
        ]);

        return redirect()->back()
            ->with('success', 'Homepage visibility updated.');
    }

    public function reorder(Request $request): RedirectResponse
    {
        $request->validate([
            'orders' => ['required', 'array'],
            'orders.*.id' => ['required', 'exists:faqs,id'],
            'orders.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        foreach ($request->input('orders') as $item) {
            Faq::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        return redirect()->back()->with('success', 'Display order saved successfully.');
    }
}