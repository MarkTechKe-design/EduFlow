<?php

namespace Tests\Feature;

use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class BlogTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_user_can_view_published_blog_index(): void
    {
        $post = BlogPost::create([
            'title' => 'Public Test Article Unique ' . uniqid(),
            'slug' => 'public-test-article-' . uniqid(),
            'excerpt' => 'This is a test excerpt.',
            'body' => 'Test body content for public index.',
            'category' => 'Testing',
            'status' => 'published',
            'published_at' => now(),
        ]);

        $response = $this->get('/blog');

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Public/Blog/Index')
            ->has('posts')
            ->where('posts.data.0.title', $post->title)
            ->where('posts.data.0.excerpt', 'This is a test excerpt.')
        );
    }

    public function test_public_user_can_view_published_blog_show_page_with_all_features(): void
    {
        $slug = 'detailed-test-article-' . uniqid();
        BlogPost::create([
            'title' => 'Detailed Test Article',
            'slug' => $slug,
            'excerpt' => 'Detailed excerpt description.',
            'body' => 'Check out [EduFlow](https://eduflow.co.ke) for more info.',
            'category' => 'Testing',
            'author_name' => 'Test Author',
            'source_name' => 'Ministry of Education',
            'source_url' => 'https://education.go.ke',
            'gallery_images' => ['https://example.com/gallery1.jpg'],
            'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'meta_title' => 'Custom SEO Title',
            'meta_description' => 'Custom SEO meta description for testing.',
            'status' => 'published',
            'published_at' => now(),
        ]);

        $response = $this->get('/blog/' . $slug);

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Public/Blog/Show')
            ->has('post')
            ->where('post.title', 'Detailed Test Article')
            ->where('post.excerpt', 'Detailed excerpt description.')
            ->where('post.source_name', 'Ministry of Education')
            ->where('post.source_url', 'https://education.go.ke')
            ->where('post.gallery_images', ['https://example.com/gallery1.jpg'])
            ->where('post.video_url', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ')
            ->where('post.meta_title', 'Custom SEO Title')
            ->where('post.meta_description', 'Custom SEO meta description for testing.')
            ->where('post.body', 'Check out [EduFlow](https://eduflow.co.ke) for more info.')
        );
    }

    public function test_mp4_video_article_is_publicly_accessible(): void
    {
        $slug = 'mp4-article-' . uniqid();
        BlogPost::create([
            'title' => 'MP4 Video Article',
            'slug' => $slug,
            'body' => 'Article body with MP4 video.',
            'category' => 'Testing',
            'video_url' => 'https://example.com/video.mp4',
            'media_type' => 'video',
            'status' => 'published',
            'published_at' => now(),
        ]);

        $response = $this->get('/blog/' . $slug);

        $response->assertStatus(200);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('Public/Blog/Show')
            ->where('post.title', 'MP4 Video Article')
            ->where('post.video_url', 'https://example.com/video.mp4')
            ->where('post.media_type', 'video')
        );
    }

    public function test_public_user_cannot_view_draft_blog_post(): void
    {
        $slug = 'draft-test-article-' . uniqid();
        BlogPost::create([
            'title' => 'Draft Test Article',
            'slug' => $slug,
            'body' => 'Test body content for draft page.',
            'category' => 'Testing',
            'status' => 'draft',
        ]);

        $response = $this->get('/blog/' . $slug);

        $response->assertStatus(404);
    }

    public function test_unauthorized_user_cannot_access_super_admin_blog_cms(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/super-admin/blogs');

        $response->assertStatus(403);
    }
}