<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\WebsiteMenu;
use App\Models\WebsiteMenuItem;
use App\Models\WebsitePage;
use App\Models\WebsitePageSection;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class WebsiteSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::role('super-admin')->first() ?? User::first();
        if (! $admin) {
            return;
        }

        $pages = [
            '/' => ['title' => 'School operations, beautifully connected', 'slug' => 'home', 'public_id' => (string) Str::uuid(), 'is_home' => true, 'seo_description' => 'EduFlow brings admissions, academics, finance, communication, and school operations into one connected platform.'],
            '/features' => ['title' => 'Everything your school needs to move forward', 'slug' => 'features', 'seo_description' => 'Explore the connected tools that help school teams work with clarity.'],
            '/pricing' => ['title' => 'Plans that grow with your school', 'slug' => 'pricing', 'seo_description' => 'Choose a flexible EduFlow plan for your school community.'],
            '/faq' => ['title' => 'Frequently asked questions', 'slug' => 'faq', 'seo_description' => 'Answers about EduFlow implementation, security, and support.'],
            '/about' => ['title' => 'Built for the people behind great schools', 'slug' => 'about', 'seo_description' => 'Learn how EduFlow helps education teams spend less time stitching systems together.'],
            '/privacy' => ['title' => 'Privacy policy', 'slug' => 'privacy', 'seo_description' => 'How EduFlow handles information entrusted to the platform.'],
            '/terms' => ['title' => 'Terms of service', 'slug' => 'terms', 'seo_description' => 'The terms that govern use of the EduFlow platform.'],
        ];

        foreach ($pages as $path => $attributes) {
            $page = WebsitePage::updateOrCreate(
                ['public_id' => (string) Str::uuid(), 'path' => $path],
                array_merge($attributes, [
                    'template' => 'standard',
                    'status' => 'published',
                    'published_at' => now(),
                    'robots_index' => true,
                    'robots_follow' => true,
                    'created_by' => $admin->id,
                    'updated_by' => $admin->id,
                ])
            );

            if ($path === '/') {
                $this->seedHomeSections($page, $admin->id);
            } elseif ($page->sections()->count() === 0) {
                $page->sections()->create([
                    'block_type' => 'rich_text',
                    'identifier' => 'intro',
                    'content' => ['heading' => $attributes['title'], 'body' => $attributes['seo_description']],
                    'sort_order' => 10,
                    'is_enabled' => true,
                    'created_by' => $admin->id,
                    'updated_by' => $admin->id,
                ]);
            }
        }

        $this->seedMenu('header', [
            ['label' => 'Features', 'url' => '/features', 'sort_order' => 10],
            ['label' => 'Pricing', 'url' => '/pricing', 'sort_order' => 20],
            ['label' => 'About', 'url' => '/about', 'sort_order' => 30],
            ['label' => 'Sign in', 'url' => '/login', 'sort_order' => 40],
        ]);
        $this->seedMenu('footer', [
            ['label' => 'FAQ', 'url' => '/faq', 'sort_order' => 10],
            ['label' => 'Privacy', 'url' => '/privacy', 'sort_order' => 20],
            ['label' => 'Terms', 'url' => '/terms', 'sort_order' => 30],
        ]);
    }

    private function seedHomeSections(WebsitePage $page, int $userId): void
    {
        $sections = [
            ['block_type' => 'hero', 'identifier' => 'hero', 'sort_order' => 10, 'content' => [
                'eyebrow' => 'The operating system for ambitious schools',
                'title' => 'Give every school team a clearer way forward.',
                'body' => 'EduFlow connects the work behind learning—from admissions and academics to finance, communication, and family support—in one calm, reliable workspace.',
                'primary_label' => 'Start your journey', 'primary_url' => '/register',
                'secondary_label' => 'Explore the platform', 'secondary_url' => '/features',
            ]],
            ['block_type' => 'features', 'identifier' => 'connected-work', 'sort_order' => 20, 'content' => [
                'heading' => 'One connected workspace for the whole school.',
                'items' => [
                    ['icon' => '01', 'title' => 'Bring the work together', 'body' => 'Keep student records, schedules, communication, payments, and daily operations connected across teams.'],
                    ['icon' => '02', 'title' => 'Make confident decisions', 'body' => 'Turn live operational data into clear signals for leaders, teachers, and support teams.'],
                    ['icon' => '03', 'title' => 'Create better experiences', 'body' => 'Give families and staff simple, dependable ways to engage with the school community.'],
                ],
            ]],
            ['block_type' => 'stats', 'identifier' => 'proof', 'sort_order' => 30, 'content' => [
                'items' => [
                    ['value' => '24/7', 'label' => 'Access for your school community'],
                    ['value' => '1', 'label' => 'Connected source of truth'],
                    ['value' => '100%', 'label' => 'Built around your workflows'],
                    ['value' => '∞', 'label' => 'Room to grow with your school'],
                ],
            ]],
            ['block_type' => 'pricing', 'identifier' => 'plans', 'sort_order' => 40, 'content' => [
                'heading' => 'A plan for the way you work today.',
                'body' => 'Start with the foundations and add capability as your school grows.',
                'button_label' => 'Choose this plan',
            ]],
            ['block_type' => 'faq', 'identifier' => 'questions', 'sort_order' => 50, 'content' => [
                'heading' => 'Questions, answered clearly.',
                'items' => [
                    ['question' => 'Can EduFlow support multiple schools?', 'answer' => 'Yes. The platform is designed for organizations that need tenant isolation, central oversight, and school-level operations.'],
                    ['question' => 'Can we start with only the modules we need?', 'answer' => 'Yes. Packages and module access can be configured around your current operating model.'],
                    ['question' => 'How do we get support?', 'answer' => 'Your team can use the support channels configured by your platform administrator.'],
                ],
            ]],
            ['block_type' => 'cta', 'identifier' => 'next-step', 'sort_order' => 60, 'content' => [
                'heading' => 'Ready to make school operations feel simpler?',
                'body' => 'Bring your team into one connected platform.',
                'button_label' => 'Create your workspace', 'button_url' => '/register',
            ]],
        ];

        foreach ($sections as $section) {
            WebsitePageSection::updateOrCreate(
                ['website_page_id' => $page->id, 'identifier' => $section['identifier']],
                array_merge($section, ['is_enabled' => true, 'created_by' => $userId, 'updated_by' => $userId])
            );
        }
    }

    private function seedMenu(string $location, array $items): void
    {
        $menu = WebsiteMenu::updateOrCreate(['location' => $location], ['name' => Str::headline($location), 'is_active' => true]);
        foreach ($items as $item) {
            WebsiteMenuItem::updateOrCreate(
                ['website_menu_id' => $menu->id, 'label' => $item['label']],
                array_merge($item, ['is_visible' => true])
            );
        }
    }
}
