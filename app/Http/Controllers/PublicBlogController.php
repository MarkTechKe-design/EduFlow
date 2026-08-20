<?php

namespace App\Http\Controllers;

use App\Models\BlogPost;
use App\Services\WebsiteContentService;
use Inertia\Inertia;
use Inertia\Response;

class PublicBlogController extends Controller
{
    public function __construct(private readonly WebsiteContentService $website){}

    public function index(): Response
    {
        $posts = BlogPost::published()
            ->select(['id', 'title', 'slug', 'excerpt', 'category', 'featured_image', 'author_name', 'read_time_minutes', 'published_at', 'is_featured'])
            ->paginate(9);

        $featuredPost = BlogPost::featured()->first();
        $categories = BlogPost::published()->reorder('category', 'asc')->distinct()->pluck('category');

        return Inertia::render('Public/Blog/Index', [
            'posts' => $posts,
            'featuredPost' => $featuredPost,
            'categories' => $categories,
            'navigation' => $this->website->menu('header'),
            'footerNavigation' => $this->website->menu('footer'),
            'branding' => $this->website->branding(),
        ]);
    }

    public function show(string $slug): Response
    {
        $post = BlogPost::published()
            ->where('slug', $slug)
            ->firstOrFail();

        $relatedPosts = BlogPost::published()
            ->where('id', '!=', $post->id)
            ->where('category', $post->category)
            ->limit(3)
            ->get(['id', 'title', 'slug', 'excerpt', 'category', 'read_time_minutes', 'published_at']);

        return Inertia::render('Public/Blog/Show', [
            'post' => $post,
            'relatedPosts' => $relatedPosts,
            'navigation' => $this->website->menu('header'),
            'footerNavigation' => $this->website->menu('footer'),
            'branding' => $this->website->branding(),
        ]);
    }
}