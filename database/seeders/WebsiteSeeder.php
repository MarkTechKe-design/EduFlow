<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\WebsitePage;
use App\Models\WebsitePageSection;
use App\Services\WebsiteContentService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class WebsiteSeeder extends Seeder
{
    public function run(): void
    {
        $userId = User::query()->value('id');

        $pages = [
            '/' => [
                'title'           => 'School operations, beautifully connected',
                'slug'            => 'home',
                'public_id'       => (string) Str::uuid(),
                'is_home'         => true,
                'seo_description' => 'EduFlow brings admissions, academics, finance, communication, and school operations into one connected platform.',
            ],
            '/features' => [
                'title'           => 'Built for the whole school',
                'slug'            => 'features',
                'public_id'       => (string) Str::uuid(),
                'is_home'         => false,
                'seo_description' => 'Explore the systems powering everyday school work: finance, CBC assessment, learner records, and family engagement.',
            ],
            '/pricing' => [
                'title'           => 'Predictable plans for growing schools',
                'slug'            => 'pricing',
                'public_id'       => (string) Str::uuid(),
                'is_home'         => false,
                'seo_description' => 'Clear pricing designed around school size, with migration support and reliable service.',
            ],
            '/contact' => [
                'title'           => 'Talk to our team',
                'slug'            => 'contact',
                'public_id'       => (string) Str::uuid(),
                'is_home'         => false,
                'seo_description' => 'Start a conversation about onboarding your school or migrating your records.',
            ],
        ];

        foreach ($pages as $path => $attributes) {
            $page = WebsitePage::updateOrCreate(
                ['path' => $path],
                array_merge($attributes, [
                    'template'     => 'standard',
                    'status'       => 'published',
                    'published_at' => now(),
                    'created_by'   => $userId,
                    'updated_by'   => $userId,
                ])
            );

            if ($path === '/') {
                $sections = [
                    // 1. Hero
                    ['block_type' => 'hero', 'identifier' => 'hero', 'sort_order' => 10, 'content' => [
                        'eyebrow' => 'The operating system for ambitious schools',
                        'title'   => 'Give every school team a clearer way forward.',
                        'body'    => 'EduFlow connects the work behind learning—from admissions and academics to finance, communication, and family support—in one calm, reliable workspace.',
                    ]],

                    // 2. Quick Highlights Strip
                    ['block_type' => 'content', 'identifier' => 'home-quick-highlights', 'sort_order' => 15, 'content' => [
                        'badge'      => 'Built for Kenyan Schools',
                        'title'      => 'One dashboard for the work schools do every day',
                        'subtitle'   => 'EduFlow supports real school operations across student records, fees and billing, attendance, CBC exams, and parent communication.',
                        'highlights' => [
                            ['title' => 'Core Free', 'desc' => 'platform access'],
                            ['title' => 'Excel Import', 'desc' => 'migration support'],
                            ['title' => 'CBC Ready', 'desc' => 'assessment workflows'],
                            ['title' => 'M-Pesa', 'desc' => 'fee workflows'],
                            ['title' => 'Role-Based', 'desc' => 'school access control'],
                        ],
                    ]],

                    // 3. Connected Operations Flow
                    ['block_type' => 'features', 'identifier' => 'connected-work', 'sort_order' => 20, 'content' => [
                        'heading' => 'One connected workspace for the whole school.',
                        'items'   => [
                            ['icon' => '01', 'title' => 'Bring the work together', 'body' => 'Keep student records, schedules, communication, payments, and daily operations connected across teams.'],
                            ['icon' => '02', 'title' => 'Stay aligned every week', 'body' => 'Make term planning, fee tracking, and student milestones clear to everyone who needs them.'],
                            ['icon' => '03', 'title' => 'Build on solid foundations', 'body' => 'A dependable data core that grows from simple attendance to full institutional reporting.'],
                        ],
                    ]],

                    // 4. Efficiency Matrix Table
                    ['block_type' => 'content', 'identifier' => 'home-efficiency-matrix', 'sort_order' => 25, 'content' => [
                        'badge'    => 'Efficiency Matters',
                        'title'    => 'Why Schools Are Moving to EduFlow',
                        'subtitle' => 'Compare the speed and accuracy of a digital school management system against traditional manual methods.',
                        'rows'     => [
                            ['feature' => 'Fee Tracking', 'digital' => 'Automated billing & SMS reminders', 'manual' => 'Paper ledgers & manual calls'],
                            ['feature' => 'Report Cards', 'digital' => 'Instant CBC/8-4-4 generation', 'manual' => 'Days of manual tabulation'],
                            ['feature' => 'Attendance', 'digital' => 'Digital logs + Instant SMS alerts', 'manual' => 'Paper registers, no parent alerts'],
                            ['feature' => 'Data Search', 'digital' => 'Search records in 2 seconds', 'manual' => 'Digging through filing cabinets'],
                            ['feature' => 'Parent Access', 'digital' => 'Anytime mobile portal access', 'manual' => 'Limited to physical visits/calls'],
                        ],
                    ]],

                    // 5. Multi-Curriculum Types Banner
                    ['block_type' => 'content', 'identifier' => 'home-curriculum-types', 'sort_order' => 28, 'content' => [
                        'badge'    => 'Built for Kenyan Schools',
                        'title'    => 'Every school type. Every curriculum. Every campus.',
                        'subtitle' => 'From small CBC primaries to multi-campus secondary institutions, EduFlow configures around how your school actually runs.',
                        'presets'  => [
                            [
                                'title'   => 'CBC Primary & Junior',
                                'bullets' => ['Junior School (Grade 7–9)', 'Formative learning area templates', 'Strand-level rubric assessment'],
                            ],
                            [
                                'title'   => 'Secondary Schools',
                                'bullets' => ['Form 1–4 stream scheduling', '8-4-4 and CBC transition support', 'Mock exam broadsheet tabulation'],
                            ],
                            [
                                'title'   => 'Day & Boarding Schools',
                                'bullets' => ['Dormitory bed allocation', 'Evening prep attendance logs', 'Bus route & transport manifests'],
                            ],
                            [
                                'title'   => 'Multi-Campus Groups',
                                'bullets' => ['Central institutional oversight', 'Independent campus database scoping', 'Consolidated financial reports'],
                            ],
                        ],
                    ]],

                    // 6. Continuous Term Lifecycle
                    ['block_type' => 'content', 'identifier' => 'home-term-lifecycle', 'sort_order' => 32, 'content' => [
                        'badge'    => 'Continuous Operations',
                        'title'    => 'Setup is just the beginning',
                        'subtitle' => 'EduFlow powers your institution across the full academic cycle—from term opening to fee closing, grading, and rollover.',
                        'steps'    => [
                            ['num' => '1', 'title' => 'Bio-Data Enrollment', 'desc' => 'Import learners, stream allocations, and student bio-data files.'],
                            ['num' => '2', 'title' => 'Fee Structure Setup', 'desc' => 'Configure termly tuition, boarding, transport, and extra charges.'],
                            ['num' => '3', 'title' => 'Daraja M-Pesa Matching', 'desc' => 'Automated reconciliation connects mobile receipts directly to student ledgers.'],
                            ['num' => '4', 'title' => 'Formative CBC Grading', 'desc' => 'Teachers record classroom assessments across standard 4-band rubrics.'],
                            ['num' => '5', 'title' => 'Attendance & Alerts', 'desc' => 'Daily morning roll call logs with automated SMS notifications for absences.'],
                            ['num' => '6', 'title' => 'Campus & Hostel Logistics', 'desc' => 'Coordinate dormitory bed capacity, meal tracking, and transport routes.'],
                            ['num' => '7', 'title' => 'Broadsheet Verification', 'desc' => 'Admin review and official sign-off on termly broadsheet scorecards.'],
                            ['num' => '8', 'title' => 'Term Rollover & Reports', 'desc' => 'Publish final report cards and roll student balances forward seamlessly.'],
                        ],
                    ]],

                    // 7. Operational Control Tools
                    ['block_type' => 'content', 'identifier' => 'home-operational-control', 'sort_order' => 34, 'content' => [
                        'badge'    => 'Operations',
                        'title'    => 'Built for real school operations',
                        'subtitle' => 'Managing a school requires dependable day-to-day administrative tools—engineered around the staff who run the institution.',
                        'tools'    => [
                            ['title' => 'Complete Audit Trail', 'desc' => 'Immutable activity records of fee adjustments, mark alterations, and system logins.'],
                            ['title' => 'Teacher Absence Tracking', 'desc' => 'Mark teacher attendance in seconds and manage classroom coverage seamlessly.'],
                            ['title' => 'Bulk Excel Import', 'desc' => 'Bring in student registers, fee structures, and past records without manual retyping.'],
                            ['title' => 'Multi-Tenant Isolation', 'desc' => 'Strict database-level workspace boundaries ensuring complete institutional privacy.'],
                            ['title' => 'Draft Broadsheet Safety', 'desc' => 'Calculated broadsheets remain drafts until reviewed and approved by administrators.'],
                            ['title' => 'Real-Time M-Pesa Callbacks', 'desc' => 'Instant ledger reconciliation and immediate SMS receipts upon verified settlement.'],
                            ['title' => 'Mobile-Optimized Portal', 'desc' => 'Classroom roll call and formative rubric grading directly on teachers’ phones.'],
                            ['title' => 'Term Rollover Continuity', 'desc' => 'Seamlessly advance student streams and carry forward fee balances into the new term.'],
                        ],
                    ]],

                    // 8. Outcomes & Verified Metrics
                    ['block_type' => 'content', 'identifier' => 'home-outcomes-metrics', 'sort_order' => 36, 'content' => [
                        'badge'    => 'Outcomes',
                        'title'    => 'The numbers schools actually feel',
                        'subtitle' => 'Built on verified technical foundations to ensure speed, compliance, and peace of mind.',
                        'metrics'  => [
                            ['value' => '4 Bands', 'label' => 'CBC Assessment Rubrics', 'desc' => 'Native support for standard EE, ME, AE, and BE performance levels.'],
                            ['value' => '0 Bleed', 'label' => 'Multi-Tenant Isolation', 'desc' => 'Strict database scoping guarantees 100% data separation between schools.'],
                            ['value' => 'Real-Time', 'label' => 'M-Pesa Reconciliation', 'desc' => 'Direct Safaricom Daraja callback matching to student fee ledgers.'],
                            ['value' => '100%', 'label' => 'Institutional Ownership', 'desc' => 'Your school retains exclusive administrative control over all records.'],
                            ['value' => '3 Terms', 'label' => 'Kenyan Calendar Alignment', 'desc' => 'Built for standard Term 1, 2, and 3 academic and fee collection cycles.'],
                        ],
                    ]],

                    // 9. Stats Proof
                    ['block_type' => 'stats', 'identifier' => 'proof', 'sort_order' => 38, 'content' => [
                        'items' => [
                            ['value' => '24/7', 'label' => 'Access for your school community'],
                            ['value' => '1', 'label' => 'Connected source of truth'],
                            ['value' => '100%', 'label' => 'Visibility across academic terms'],
                        ],
                    ]],

                    // 10. Guided 5-Step Onboarding
                    ['block_type' => 'content', 'identifier' => 'home-guided-onboarding', 'sort_order' => 40, 'content' => [
                        'badge'       => 'Guided Onboarding',
                        'title'       => 'Digitize Your School in 5 Simple Steps',
                        'subtitle'    => 'No heavy IT intervention required. Our guided setup flow gets your school online and ready to operate in under 5 minutes.',
                        'button_text' => 'Start Your 5-Minute Setup',
                        'button_url'  => '/contact',
                        'steps'       => [
                            ['num' => '1', 'title' => 'School Details', 'desc' => 'Enter your school\'s official name and registration type.'],
                            ['num' => '2', 'title' => 'Basic Info', 'desc' => 'Define your student population and curriculum (CBC/8-4-4).'],
                            ['num' => '3', 'title' => 'Location & Verification', 'desc' => 'Verify your county and operational address securely.'],
                            ['num' => '4', 'title' => 'Principal & Branding', 'desc' => 'Set administrator access and upload your school crest.'],
                            ['num' => '5', 'title' => 'Review & Launch', 'desc' => 'Confirm details and instantly access your dashboard.'],
                        ],
                    ]],

                    // 11. Plans / Pricing
                    ['block_type' => 'pricing', 'identifier' => 'plans', 'sort_order' => 42, 'content' => [
                        'heading'      => 'A plan for the way you work today.',
                        'body'         => 'Start with the foundations and add capability as your school grows.',
                        'button_label' => 'Choose this plan',
                    ]],

                    // 12. Resources & Scale Guides
                    ['block_type' => 'content', 'identifier' => 'home-resources-guides', 'sort_order' => 45, 'content' => [
                        'badge'       => 'Resources',
                        'title'       => 'Expert Guides to Help You Scale',
                        'subtitle'    => 'Practical guides on student records, school fees management, report cards, parent communication, and digital school operations.',
                        'button_text' => 'Visit Knowledge Base',
                        'button_url'  => '/contact',
                        'guides'      => [
                            ['title' => 'Best School Management System in Kenya (2026 Guide)', 'desc' => 'How to evaluate school management software in Kenya for records, fees, exams, SMS, and parent access.'],
                            ['title' => 'How to Manage School Fees, Billing, and Receipts Digitally', 'desc' => 'Practical steps to move from fee spreadsheets to structured billing, payments, receipts, and statements.'],
                            ['title' => 'How to Replace Spreadsheets with Student Information Software', 'desc' => 'A rollout path for digital student records, attendance, exams, and report cards.'],
                        ],
                    ]],

                    // 13. FAQs
                    ['block_type' => 'faq', 'identifier' => 'questions', 'sort_order' => 50, 'content' => [
                        'heading' => 'Questions, answered clearly.',
                        'items'   => [
                            ['question' => 'Can EduFlow support multiple schools?', 'answer' => 'Yes. The platform is designed for organizations that need tenant isolation, central oversight, and school-level operations.'],
                            ['question' => 'How does data migration work?', 'answer' => 'We help you import your existing student records, fee ledgers, and academic structures smoothly.'],
                            ['question' => 'Is our school data secure?', 'answer' => 'Yes. We employ role-based permissions, strict tenant boundaries, and encrypted connections across all modules.'],
                        ],
                    ]],

                    // 14. Action Banner (PLACED AFTER FAQS)
                    ['block_type' => 'content', 'identifier' => 'home-action-banner', 'sort_order' => 60, 'content' => [
                        'title'       => 'Ready to take control of your school?',
                        'subtitle'    => 'Join schools across Kenya using EduFlow to eliminate paperwork, speed up reporting, and collect fees without the stress. No setup fees. Works immediately.',
                        'footer_note' => 'Used by schools across Nairobi, Kiambu, and beyond. Set up in 10 minutes.',
                        'primary_btn' => 'Start Free Now',
                        'primary_url' => '/contact',
                        'demo_btn'    => 'Book a Demo',
                        'demo_url'    => '/contact',
                        'whatsapp'    => '254700000000',
                    ]],
                ];

                WebsitePageSection::where('website_page_id', $page->id)->forceDelete();

                foreach ($sections as $section) {
                    WebsitePageSection::create(
                        array_merge($section, [
                            'website_page_id' => $page->id,
                            'is_enabled'      => true,
                            'created_by'      => $userId,
                            'updated_by'      => $userId,
                        ])
                    );
                }
            }
        }

        app(WebsiteContentService::class)->forgetPage('/');
    }
}