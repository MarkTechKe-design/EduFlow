<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\WebsitePage;
use App\Models\WebsitePageSection;
use App\Services\WebsiteContentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class WebsitePageController extends Controller
{
    public function __construct(private readonly WebsiteContentService $website)
    {
    }

    public function index(): Response
    {
        $this->authorize('viewAny', WebsitePage::class);

        return Inertia::render('SuperAdmin/Website/Pages/Index', [
            'pages' => WebsitePage::query()
                ->with(['sections' => fn ($q) => $q->orderBy('sort_order')])
                ->withCount('sections')
                ->orderByRaw('is_home DESC, id ASC')
                ->paginate(30)
                ->withQueryString(),
            'templates' => [
                ['value' => 'standard', 'label' => 'Standard CMS Page'],
                ['value' => 'home', 'label' => 'Homepage Layout'],
                ['value' => 'features', 'label' => 'Features & Capabilities'],
                ['value' => 'pricing', 'label' => 'Plans & Pricing Matrix'],
                ['value' => 'about', 'label' => 'About Us & Mission'],
                ['value' => 'contact', 'label' => 'Contact & Consultation'],
                ['value' => 'legal', 'label' => 'Legal & Governance Suite'],
                ['value' => 'faq', 'label' => 'Frequently Asked Questions'],
            ],
            'availableBlockTypes' => [
                ['value' => 'hero', 'label' => 'Hero Banner Block'],
                ['value' => 'feature_showcase', 'label' => 'Feature Showcase'],
                ['value' => 'role_experience', 'label' => 'Role Workspaces'],
                ['value' => 'pricing_table', 'label' => 'Pricing Table'],
                ['value' => 'faq', 'label' => 'FAQ Accordion Section'],
                ['value' => 'custom_content', 'label' => 'Custom Rich Content / HTML'],
                ['value' => 'cta', 'label' => 'Call to Action Banner'],
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $this->authorize('create', WebsitePage::class);
        $data = $this->validated($request);
        $data['created_by'] = $request->user()->id;
        $data['updated_by'] = $request->user()->id;
        $data['slug'] = $data['slug'] ?: Str::slug($data['title']);
        $data['path'] = $this->website->normalizePath($data['path'] ?: '/' . $data['slug']);
        
        $page = WebsitePage::create($data);
        $this->website->forgetPage($page->path);

        return back()->with('success', 'Website page created successfully.');
    }

    public function update(Request $request, WebsitePage $websitePage): RedirectResponse
    {
        $this->authorize('update', $websitePage);
        $data = $this->validated($request, $websitePage->id);
        $data['updated_by'] = $request->user()->id;
        $data['slug'] = $data['slug'] ?: Str::slug($data['title']);
        $data['path'] = $this->website->normalizePath($data['path'] ?: '/' . $data['slug']);
        
        $oldPath = $websitePage->path;
        $websitePage->update($data);
        
        $this->website->forgetPage($oldPath);
        $this->website->forgetPage($websitePage->path);

        return back()->with('success', 'Website page updated successfully.');
    }

    public function saveSection(Request $request, WebsitePage $websitePage): RedirectResponse
    {
        $this->authorize('update', $websitePage);

        $validated = $request->validate([
            'id'          => 'nullable|exists:website_page_sections,id',
            'block_type'  => 'required|string|max:60',
            'identifier'  => 'nullable|string|max:100',
            'heading'     => 'nullable|string|max:255',
            'subheading'  => 'nullable|string|max:500',
            'body'        => 'nullable|string',
            'content'     => 'nullable|array',
            'sort_order'  => 'nullable|integer|min:0',
            'is_enabled'  => 'boolean',
        ]);

        $contentPayload = $validated['content'] ?? [];
        if (!empty($validated['heading'])) {
            $contentPayload['heading'] = $validated['heading'];
        }
        if (!empty($validated['subheading'])) {
            $contentPayload['subheading'] = $validated['subheading'];
        }
        if (!empty($validated['body'])) {
            $contentPayload['body'] = $validated['body'];
        }

        if (!empty($validated['id'])) {
            $section = $websitePage->sections()->findOrFail($validated['id']);
            $section->update([
                'block_type' => $validated['block_type'],
                'identifier' => $validated['identifier'] ?? $section->identifier,
                'content'    => $contentPayload,
                'sort_order' => $validated['sort_order'] ?? $section->sort_order,
                'is_enabled' => $validated['is_enabled'] ?? true,
                'updated_by' => $request->user()->id,
            ]);
        } else {
            $websitePage->sections()->create([
                'block_type' => $validated['block_type'],
                'identifier' => $validated['identifier'] ?? Str::slug($validated['block_type'] . '-' . Str::random(4)),
                'content'    => $contentPayload,
                'sort_order' => $validated['sort_order'] ?? ($websitePage->sections()->max('sort_order') + 1),
                'is_enabled' => $validated['is_enabled'] ?? true,
                'created_by' => $request->user()->id,
                'updated_by' => $request->user()->id,
            ]);
        }

        $this->website->forgetPage($websitePage->path);

        return back()->with('success', 'Page section saved successfully.');
    }

    public function deleteSection(WebsitePage $websitePage, WebsitePageSection $section): RedirectResponse
    {
        $this->authorize('update', $websitePage);
        abort_if($section->website_page_id !== $websitePage->id, 403, 'Section does not belong to this page.');
        
        $section->delete();
        $this->website->forgetPage($websitePage->path);

        return back()->with('success', 'Page section removed.');
    }

    public function publish(WebsitePage $websitePage): RedirectResponse
    {
        $this->authorize('publish', $websitePage);
        $websitePage->update([
            'status'       => 'published',
            'published_at' => now(),
            'updated_by'   => request()->user()->id
        ]);
        $this->website->forgetPage($websitePage->path);

        return back()->with('success', 'Website page published.');
    }

    public function destroy(WebsitePage $websitePage): RedirectResponse
    {
        $this->authorize('delete', $websitePage);
        abort_if($websitePage->is_home, 422, 'The homepage cannot be deleted.');
        
        $path = $websitePage->path;
        $websitePage->delete();
        $this->website->forgetPage($path);

        return back()->with('success', 'Website page archived.');
    }

    private function validated(Request $request, ?int $ignoreId = null): array
    {
        $pathRule = 'required|string|max:255|unique:website_pages,path' . ($ignoreId ? ',' . $ignoreId : '');

        return $request->validate([
            'title'           => 'required|string|max:180',
            'slug'            => 'nullable|string|max:180',
            'path'            => $pathRule,
            'template'        => 'required|string|max:60',
            'status'          => 'required|in:draft,published,archived',
            'is_home'         => 'boolean',
            'published_at'    => 'nullable|date',
            'unpublished_at'  => 'nullable|date|after:published_at',
            'seo_title'       => 'nullable|string|max:180',
            'seo_description' => 'nullable|string|max:1000',
            'canonical_url'   => 'nullable|url|max:500',
            'og_image_path'   => 'nullable|string|max:500',
            'robots_index'    => 'boolean',
            'robots_follow'   => 'boolean',
            'structured_data' => 'nullable|array',
        ]);
    }
}