<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\WebsitePage;
use App\Models\WebsitePageSection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class WebsitePageSectionController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'website_page_id' => 'required|exists:website_pages,id',
            'identifier'      => 'required|string|max:80',
            'block_type'      => 'required|string|max:50',
            'content'         => 'nullable|array',
            'settings'        => 'nullable|array',
            'sort_order'      => 'nullable|integer|min:0',
            'is_enabled'      => 'boolean',
        ]);

        $validated['created_by'] = auth()->id();

        WebsitePageSection::create($validated);

        return back()->with('success', 'Section block added successfully.');
    }

    public function update(Request $request, WebsitePageSection $section): RedirectResponse
    {
        $validated = $request->validate([
            'identifier' => 'required|string|max:80',
            'block_type' => 'required|string|max:50',
            'content'    => 'nullable|array',
            'settings'   => 'nullable|array',
            'sort_order' => 'nullable|integer|min:0',
            'is_enabled' => 'boolean',
        ]);

        $validated['updated_by'] = auth()->id();

        $section->update($validated);

        return back()->with('success', 'Section block updated successfully.');
    }

    public function destroy(WebsitePageSection $section): RedirectResponse
    {
        $section->delete();

        return back()->with('success', 'Section block removed.');
    }
}