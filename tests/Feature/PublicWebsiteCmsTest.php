<?php

namespace Tests\Feature;

use App\Models\WebsitePage;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicWebsiteCmsTest extends TestCase
{
    use RefreshDatabase;

    public function test_published_page_and_sections_are_loaded_by_the_public_renderer(): void
    {
        $page = WebsitePage::create([
            'title' => 'Admissions',
            'slug' => 'admissions',
            'path' => '/admissions',
            'template' => 'standard',
            'status' => 'published',
            'published_at' => now(),
            'seo_title' => 'Admissions | EduFlow',
            'seo_description' => 'Admissions information.',
        ]);
        $page->sections()->create([
            'block_type' => 'hero',
            'identifier' => 'hero',
            'content' => ['title' => 'Start your application', 'body' => 'Apply with confidence.'],
            'sort_order' => 10,
            'is_enabled' => true,
        ]);

        $this->get('/admissions')
            ->assertOk()
            ->assertInertia(fn ($view) => $view
                ->component('Public/WebsitePage')
                ->where('page.title', 'Admissions')
                ->where('page.sections.0.block_type', 'hero'));
    }

    public function test_public_lead_endpoint_persists_a_valid_submission(): void
    {
        $this->from('/about')->post('/contact', [
            'form_type' => 'consultation',
            'name' => 'Amina Wanjiku',
            'email' => 'amina@example.test',
            'organization' => 'Nairobi Hills Academy',
            'message' => 'Please arrange a platform consultation.',
        ])->assertRedirect('/about');

        $this->assertDatabaseHas('website_leads', [
            'type' => 'consultation',
            'email' => 'amina@example.test',
            'organization' => 'Nairobi Hills Academy',
        ]);
    }
}
