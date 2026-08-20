<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BlogController extends Controller
{
    public function index(Request $request): Response
    {
        $query = BlogPost::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%")
                  ->orWhere('author_name', 'like', "%{$search}%")
                  ->orWhere('source_name', 'like', "%{$search}%");
            });
        }

        $posts = $query->orderBy('id', 'desc')->paginate(20)->withQueryString();
        $categories = BlogPost::select('category')->distinct()->pluck('category')->filter()->values();

        return Inertia::render('SuperAdmin/Blog/Index', [
            'posts' => $posts,
            'categories' => $categories,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title'             => ['required', 'string', 'max:255'],
            'excerpt'           => ['nullable', 'string', 'max:600'],
            'body'              => ['required', 'string'],
            'category'          => ['required', 'string', 'max:100'],
            'author_name'       => ['nullable', 'string', 'max:150'],
            'source_name'       => ['nullable', 'string', 'max:255'],
            'source_url'        => ['nullable', 'url', 'max:500'],
            'featured_image'    => ['nullable', 'string', 'max:500'],
            'gallery_images'    => ['nullable', 'array'],
            'gallery_images.*'  => ['nullable', 'string', 'max:500'],
            'video_url'         => ['nullable', 'string', 'max:500'],
            'media_type'        => ['nullable', 'in:image,video'],
            'status'            => ['required', 'in:draft,published,archived'],
            'is_featured'       => ['required', 'boolean'],
            'read_time_minutes' => ['nullable', 'integer', 'min:1'],
        ]);

        $validated['created_by'] = $request->user()->id;
        $validated['updated_by'] = $request->user()->id;

        BlogPost::create($validated);

        return redirect()->route('super-admin.blogs.index')
            ->with('success', 'Article published successfully.');
    }

    public function update(Request $request, BlogPost $blog): RedirectResponse
    {
        $validated = $request->validate([
            'title'             => ['required', 'string', 'max:255'],
            'excerpt'           => ['nullable', 'string', 'max:600'],
            'body'              => ['required', 'string'],
            'category'          => ['required', 'string', 'max:100'],
            'author_name'       => ['nullable', 'string', 'max:150'],
            'source_name'       => ['nullable', 'string', 'max:255'],
            'source_url'        => ['nullable', 'url', 'max:500'],
            'featured_image'    => ['nullable', 'string', 'max:500'],
            'gallery_images'    => ['nullable', 'array'],
            'gallery_images.*'  => ['nullable', 'string', 'max:500'],
            'video_url'         => ['nullable', 'string', 'max:500'],
            'media_type'        => ['nullable', 'in:image,video'],
            'status'            => ['required', 'in:draft,published,archived'],
            'is_featured'       => ['required', 'boolean'],
            'read_time_minutes' => ['nullable', 'integer', 'min:1'],
        ]);

        $validated['updated_by'] = $request->user()->id;
        $blog->update($validated);

        return redirect()->route('super-admin.blogs.index')
            ->with('success', 'Article updated successfully.');
    }

    public function destroy(BlogPost $blog): RedirectResponse
    {
        $blog->delete();

        return redirect()->route('super-admin.blogs.index')
            ->with('success', 'Article removed.');
    }
}