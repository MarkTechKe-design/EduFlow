<?php

namespace Database\Seeders;

use App\Models\WebsitePage;
use App\Models\WebsitePageSection;
use App\Services\WebsiteContentService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class WebsiteAboutSeeder extends Seeder
{
    public function run(): void
    {
        $contentService = app(WebsiteContentService::class);

        $aboutPageData = [
            'path'            => '/about',
            'slug'            => 'about',
            'title'           => 'Built for the people behind great schools',
            'seo_title'       => 'About EduFlow | School Management Platform for Kenya',
            'seo_description' => 'Learn about EduFlow, a unified school management platform designed to help Kenyan educational institutions organize academics, finance, communication, and daily operations in one connected environment.',
            'template'        => 'standard',
            'status'          => 'published',
            'is_home'         => false,
            'published_at'    => now(),
        ];

        $sections = [
            [
                'identifier' => 'about-hero',
                'block_type' => 'hero',
                'content'    => [
                    'badge'     => 'Built for the people behind great schools',
                    'title'     => 'We watched real schools drown in admin—so we built one calm system.',
                    'subtitle'  => 'School administration requires coordinating academic grading, fee collections, attendance, and parent communication in one reliable platform.',
                    'body'      => "EduFlow brings vital educational workflows into a clear, unified digital workspace, replacing fragmented paper registers and standalone spreadsheets with dependable everyday tools.",
                    'image_url' => '/storage/media/about/img-4221-N6iK9L.JPG',
                    'image_alt' => 'EduFlow school campus environment',
                ],
                'sort_order' => 1,
            ],
            [
                'identifier' => 'about-at-a-glance',
                'block_type' => 'content',
                'content'    => [
                    'badge'     => 'At a Glance',
                    'title'     => 'Built on Verified Technical Standards',
                    'subtitle'  => 'Key architectural pillars powering daily school operations.',
                    'facts'     => [
                        ['label' => 'Multi-Tenant Scoping', 'desc' => 'Database records strictly scoped to authenticated school instances.'],
                        ['label' => 'Role-Based Permissions', 'desc' => 'Granular operational boundaries for leadership, bursars, and teachers.'],
                        ['label' => 'CBC Assessment Aligned', 'desc' => 'Native 4-band performance evaluation across EE, ME, AE, and BE levels.'],
                        ['label' => 'Automated M-Pesa Daraja', 'desc' => 'Direct Paybill and Till callback matching to individual student ledgers.'],
                        ['label' => 'School-Controlled Records', 'desc' => 'Complete institutional authority over all student files and academic records.'],
                    ],
                ],
                'sort_order' => 2,
            ],
            [
                'identifier' => 'about-why-we-built-this',
                'block_type' => 'content',
                'content'    => [
                    'badge'     => 'Why We Built This',
                    'title'     => 'Software designed around the daily realities of school administration',
                    'subtitle'  => 'EduFlow is designed around the reality that running an institution requires multiple specialized workflows to agree with each other.',
                    'body'      => "When fee receipts live in one mobile account, examination marks on separate broadsheets, and student contact lists in isolated books, administration becomes fragmented. EduFlow provides a single operational environment where school data remains structured, connected, and accessible.",
                ],
                'sort_order' => 3,
            ],
            [
                'identifier' => 'about-the-switch',
                'block_type' => 'content',
                'content'    => [
                    'badge'     => 'The Switch',
                    'title'     => 'From fragmented administrative tasks to a unified workspace',
                    'subtitle'  => 'How moving to EduFlow replaces manual overhead with connected clarity.',
                    'before'    => [
                        'Payment receipts verified manually against bank and mobile statements.',
                        'Termly examination marks compiled by hand across multiple subject sheets.',
                        'Student admission files and guardian phone numbers duplicated each term.',
                        'Delayed parent notifications regarding fee balances and attendance notices.',
                    ],
                    'after'     => [
                        'Real-time automated M-Pesa Daraja matching directly to student ledgers.',
                        'Digital CBC rubric assessment with automatic broadsheet tabulation.',
                        'Centralized student profiles preserving bio-data and historical records.',
                        'Instant SMS receipts and official term notices delivered without delay.',
                    ],
                ],
                'sort_order' => 4,
            ],
            [
                'identifier' => 'about-mission-vision',
                'block_type' => 'content',
                'content'    => [
                    'badge'          => 'Direction & Purpose',
                    'mission_title'  => 'Our Mission',
                    'mission_body'   => 'To simplify school administration by uniting academic assessment tracking, fee reconciliation, and student attendance into a single collaborative platform.',
                    'vision_title'   => 'Our Vision',
                    'vision_body'    => 'An educational operational standard where institutions manage their daily workflows with clarity, accuracy, and dependable data continuity.',
                ],
                'sort_order' => 5,
            ],
            [
                'identifier' => 'about-values',
                'block_type' => 'content',
                'content'    => [
                    'badge'     => 'Our Values',
                    'title'     => 'Five operational principles guiding our development',
                    'subtitle'  => 'The foundational standards built into every EduFlow module.',
                    'values'    => [
                        ['title' => 'Clarity', 'desc' => 'Academic records and financial data must be transparent, well-organized, and easily interpretable.'],
                        ['title' => 'Practicality', 'desc' => 'We engineer software that solves real administrative bottlenecks without unnecessary complexity.'],
                        ['title' => 'Institutional Ownership', 'desc' => 'Subscribing institutions retain exclusive control and administrative stewardship over their records.'],
                        ['title' => 'Security Consciousness', 'desc' => 'Multi-layered protection, strict database tenant isolation, and granular role permissions.'],
                        ['title' => 'Human-Centred Design', 'desc' => 'Technology designed to assist teachers and bursars, empowering professional human decision-making.'],
                    ],
                ],
                'sort_order' => 6,
            ],
            [
                'identifier' => 'about-pain-points',
                'block_type' => 'content',
                'content'    => [
                    'badge'     => 'Sound Familiar?',
                    'title'     => 'Everyday friction we help schools resolve',
                    'subtitle'  => 'Common administrative challenges addressed across the platform.',
                    'points'    => [
                        ['title' => 'Fees don’t match M-Pesa and the ledger', 'desc' => 'Money arrives across various reference codes; reconciling payments manually takes hours of administrative time.'],
                        ['title' => 'Marks live on paper and disparate sheets', 'desc' => 'Term broadsheet preparation creates bottlenecks when scores are scattered across individual teacher registers.'],
                        ['title' => 'Re-copying student and guardian lists', 'desc' => 'Class streams and parent contact lists get rewritten manually at the start of every academic term.'],
                        ['title' => 'Generating administrative summaries', 'desc' => 'School leadership requires accurate enrollment and collection numbers without chasing physical ledger books.'],
                    ],
                ],
                'sort_order' => 7,
            ],
            [
                'identifier' => 'about-lifecycle-steps',
                'block_type' => 'content',
                'content'    => [
                    'badge'        => 'Operational Lifecycle',
                    'title'        => 'Term onboarding and continuous daily management',
                    'subtitle'     => 'A structured operational sequence from term opening to end-of-term closing.',
                    'setup_steps'  => [
                        ['num' => '1', 'title' => 'Enroll & Structure', 'desc' => 'Import student bio-data, class streams, and configured fee structures.'],
                        ['num' => '2', 'title' => 'Configure Ledgers', 'desc' => 'Link M-Pesa Daraja Paybill/Till endpoints and assign staff workspace roles.'],
                    ],
                    'daily_steps'  => [
                        ['num' => '3', 'title' => 'Daily Administration', 'desc' => 'Log morning roll calls, continuous CBC assessment strands, and incoming fee settlements.'],
                        ['num' => '4', 'title' => 'Review & Publish', 'desc' => 'Administrative validation of termly broadsheets prior to publishing parent report cards.'],
                    ],
                    'control_note' => 'Administrative Control: Automated calculations assist daily workflows, but official student records and broadsheets require authorized sign-off.',
                ],
                'sort_order' => 8,
            ],
            [
                'identifier' => 'about-platform-showcase',
                'block_type' => 'content',
                'content'    => [
                    'badge'        => 'Platform Capabilities',
                    'title'        => 'One unified operating environment for whole-school management',
                    'subtitle'     => 'Core administrative modules operating from a shared institutional data source.',
                    'capabilities' => [
                        ['title' => 'Fee Management & Ledgers', 'desc' => 'Customizable fee structures, student ledger statements, and unallocated transaction queues.'],
                        ['title' => 'Learner Administration', 'desc' => 'Centralized student bio-data files, class stream placements, and historical performance tracking.'],
                        ['title' => 'CBC Academic Grading', 'desc' => 'Formative rubric tracking across learning areas with automated broadsheet score tabulation.'],
                        ['title' => 'Attendance & Roll Call', 'desc' => 'Daily roll call logging with administrative visibility into termly attendance patterns.'],
                    ],
                    'image_url'    => '/storage/media/about/img-4223-AFQSDw.JPG',
                    'image_alt'    => 'EduFlow platform dashboard modules preview',
                ],
                'sort_order' => 9,
            ],
            [
                'identifier' => 'about-mobile-experience',
                'block_type' => 'content',
                'content'    => [
                    'badge'     => 'Mobile Workflows',
                    'title'     => 'Practical mobile access where school activities happen',
                    'subtitle'  => 'Designed to support classroom teachers and guardians on standard mobile devices.',
                    'roles'     => [
                        ['title' => 'Classroom Teachers', 'desc' => 'Log attendance roll calls and input formative assessment marks directly from a phone between lessons.'],
                        ['title' => 'Parents & Guardians', 'desc' => 'Receive instant SMS fee payment receipts and review student term progress reports securely.'],
                        ['title' => 'School Leadership', 'desc' => 'Access real-time collection summaries and student enrollment statistics from anywhere.'],
                    ],
                ],
                'sort_order' => 10,
            ],
            [
                'identifier' => 'about-who-it-is-for',
                'block_type' => 'content',
                'content'    => [
                    'badge'     => 'User Roles',
                    'title'     => 'Tailored interfaces designed around school responsibilities',
                    'subtitle'  => 'Granular workspaces matching the day-to-day duties of the entire school community.',
                    'groups'    => [
                        ['role' => 'School Leadership', 'accent' => 'emerald', 'desc' => 'Comprehensive oversight of student enrollments, fee collections, and staff allocations.'],
                        ['role' => 'Teachers & Educators', 'accent' => 'sky', 'desc' => 'Streamlined entry of CBC formative rubrics, assignment tracking, and attendance logs.'],
                        ['role' => 'Bursars & Accountants', 'accent' => 'amber', 'desc' => 'Fee structure definitions, mobile transaction matching, and official ledger accounting.'],
                        ['role' => 'Parents & Guardians', 'accent' => 'teal', 'desc' => 'Direct visibility into academic reports, fee balance statements, and official school alerts.'],
                    ],
                ],
                'sort_order' => 11,
            ],
            [
                'identifier' => 'about-kenyan-specific',
                'block_type' => 'hero',
                'content'    => [
                    'badge'     => 'Kenyan Educational Context',
                    'title'     => 'Built specifically for Kenyan school operations',
                    'subtitle'  => 'Engineered around national curriculum frameworks, local payment gateways, and term structures.',
                    'points'    => [
                        'Structured alignment with Kenyan academic terms (Term 1, Term 2, and Term 3).',
                        'Native 4-band CBC assessment rubrics: Exceeding (EE), Meeting (ME), Approaching (AE), and Below (BE) Expectation.',
                        'Direct integration with Safaricom Daraja M-Pesa for Paybill and Till fee collection reconciliation.',
                        'Flexible operational modules tailored for day, boarding, and mixed educational institutions.',
                    ],
                    'image_url' => '/storage/media/about/img-4223-k4HmPo.JPG',
                    'image_alt' => 'Kenyan school operations and campus management',
                ],
                'sort_order' => 12,
            ],
            [
                'identifier' => 'about-team',
                'block_type' => 'content',
                'content'    => [
                    'badge'        => 'The Team',
                    'title'        => 'Product & Technical Leadership',
                    'subtitle'     => 'Engineers and educational designers working directly on school operations.',
                    'team_members' => [
                        [
                            'name'         => 'Core Platform & Architecture',
                            'role'         => 'Systems Infrastructure',
                            'bio'          => 'Focused on multi-tenant database reliability, secure data boundaries, and API integrations.',
                            'contribution' => 'Maintains database scoping, permission enforcement, and automated Daraja payment pipelines.',
                            'image_url'    => '/storage/media/about/img-4221-N6iK9L.JPG',
                            'email'        => 'engineering@eduflow.co.ke',
                            'phone'        => '+254700000000',
                            'whatsapp'     => '254700000000',
                            'linkedin'     => 'https://linkedin.com/company/eduflow',
                        ],
                        [
                            'name'         => 'Educational Design & Workflows',
                            'role'         => 'Curriculum & Experience',
                            'bio'          => 'Translating complex school administration requirements into intuitive web interfaces.',
                            'contribution' => 'Designs CBC rubric grading workflows, broadsheet tabulation, and student attendance modules.',
                            'image_url'    => '/storage/media/about/img-4223-AFQSDw.JPG',
                            'email'        => 'support@eduflow.co.ke',
                            'phone'        => '+254700000000',
                            'whatsapp'     => '254700000000',
                            'linkedin'     => 'https://linkedin.com/company/eduflow',
                        ],
                    ],
                ],
                'sort_order' => 13,
            ],
            [
                'identifier' => 'about-trust',
                'block_type' => 'content',
                'content'    => [
                    'badge'     => 'Data Trust & Stewardship',
                    'title'     => 'Designed around institutional data responsibility',
                    'subtitle'  => 'Rigorous technical boundaries safeguarding sensitive school records.',
                    'pillars'   => [
                        ['title' => 'Multi-Tenant Database Scoping', 'desc' => 'Every query is strictly isolated to the authenticated institution, preventing cross-school data exposure.'],
                        ['title' => 'Role-Based Permissions', 'desc' => 'Staff permissions are strictly compartmentalized so users only access tools relevant to their duties.'],
                        ['title' => 'Institutional Sovereignty', 'desc' => 'The subscribing school maintains complete administrative control over all student files and financial statements.'],
                    ],
                ],
                'sort_order' => 14,
            ],
            [
                'identifier' => 'about-cta',
                'block_type' => 'content',
                'content'    => [
                    'badge'     => 'Get Started',
                    'title'     => 'Explore what EduFlow can do for your school',
                    'subtitle'  => 'Connect your academic grading, fee reconciliation, and parent communication in one workspace.',
                    'body'      => "Contact our team today to request a platform walkthrough or speak with our educational technology specialists at support@eduflow.co.ke.",
                    'button'    => 'Get in Touch',
                ],
                'sort_order' => 15,
            ],
        ];

        $existing = WebsitePage::where('path', $aboutPageData['path'])->first();
        $aboutPageData['public_id'] = $existing?->public_id ?? (string) Str::uuid();

        $page = WebsitePage::updateOrCreate(
            ['path' => $aboutPageData['path']],
            $aboutPageData
        );

        WebsitePageSection::where('website_page_id', $page->id)->forceDelete();

        foreach ($sections as $secData) {
            WebsitePageSection::create([
                'website_page_id' => $page->id,
                'identifier'      => $secData['identifier'],
                'block_type'      => $secData['block_type'],
                'content'         => $secData['content'],
                'sort_order'      => $secData['sort_order'],
                'is_enabled'      => true,
            ]);
        }

        $contentService->forgetPage($aboutPageData['path']);
    }
}