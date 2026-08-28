<?php

namespace Tests\Feature;

use App\Models\WebsitePage;
use Database\Seeders\WebsiteAboutSeeder;
use Database\Seeders\WebsiteLegalSeeder;
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

    public function test_public_about_us_page_renders_authoritative_cms_sections(): void
    {
        $this->seed(WebsiteAboutSeeder::class);

        $response = $this->get('/about');

        $response->assertOk()
            ->assertInertia(fn ($view) => $view
                ->component('Public/WebsitePage')
                ->where('page.path', '/about')
                ->where('page.status', 'published')
                ->has('page.sections', 15)
                ->where('page.sections.0.identifier', 'about-hero')
                ->where('page.sections.1.identifier', 'about-at-a-glance')
                ->where('page.sections.2.identifier', 'about-why-we-built-this')
                ->where('page.sections.3.identifier', 'about-the-switch')
                ->where('page.sections.4.identifier', 'about-mission-vision')
                ->where('page.sections.5.identifier', 'about-values')
                ->where('page.sections.6.identifier', 'about-pain-points')
                ->where('page.sections.7.identifier', 'about-lifecycle-steps')
                ->where('page.sections.8.identifier', 'about-platform-showcase')
                ->where('page.sections.9.identifier', 'about-mobile-experience')
                ->where('page.sections.10.identifier', 'about-who-it-is-for')
                ->where('page.sections.11.identifier', 'about-kenyan-specific')
                ->where('page.sections.12.identifier', 'about-team')
                ->where('page.sections.13.identifier', 'about-trust')
                ->where('page.sections.14.identifier', 'about-cta')
            );
    }

    public function test_public_governance_suite_pages_are_accessible(): void
    {
        $this->seed(WebsiteLegalSeeder::class);

        $routes = ['/privacy', '/cookies', '/terms', '/saas-terms', '/security', '/disclaimer', '/governance'];

        foreach ($routes as $route) {
            $this->get($route)
                ->assertOk()
                ->assertInertia(fn ($view) => $view
                    ->component('Public/WebsitePage')
                    ->where('page.status', 'published')
                );
        }
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