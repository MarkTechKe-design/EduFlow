<?php

namespace Database\Seeders;

use App\Models\WebsitePage;
use App\Models\WebsitePageSection;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class WebsitePageSeeder extends Seeder
{
    public function run(): void
    {
        $pages = [
            [
                'path'            => '/',
                'slug'            => 'home',
                'title'           => 'School operations, beautifully connected',
                'seo_title'       => 'EduFlow — Kenya CBC School Operations & Management Platform',
                'seo_description' => 'All-in-one school management platform for Kenyan institutions with CBC grading, M-Pesa fee reconciliation, and SMS communications.',
                'template'        => 'standard',
                'status'          => 'published',
                'is_home'         => true,
                'published_at'    => now(),
                'sections'        => [
                    [
                        'identifier'  => 'hero',
                        'block_type'  => 'hero',
                        'content'     => [
                            'title'    => 'School operations, beautifully connected.',
                            'subtitle' => 'Empowering Kenyan schools with multi-tenant isolation, real-time M-Pesa tracking, and CBC academic grading.',
                            'body'     => '<p>EduFlow is built ground-up to simplify daily school administration, from admissions and termly report broadsheets to driver transport manifests.</p>',
                        ],
                        'sort_order'  => 1,
                    ],
                ],
            ],
            [
                'path'            => '/features',
                'slug'            => 'features',
                'title'           => 'Everything your school needs to move forward',
                'seo_title'       => 'Features — EduFlow CBC School Operations Suite',
                'seo_description' => 'Explore the comprehensive toolset built for CBC evaluation, automated M-Pesa STK reconciliations, hostel allocations, and parent SMS updates.',
                'template'        => 'standard',
                'status'          => 'published',
                'is_home'         => false,
                'published_at'    => now(),
                'sections'        => [
                    [
                        'identifier'  => 'academics',
                        'block_type'  => 'feature',
                        'content'     => [
                            'title'    => 'CBC Rubric Grading & Assessment Engine',
                            'subtitle' => 'Formative & Summative strand scoring aligned with Ministry of Education standards.',
                            'body'     => '<h3>4-Tier Performance Bands</h3><p>Evaluate learner competencies across Exceeding Expectation (EE), Meeting Expectation (ME), Approaching Expectation (AE), and Below Expectation (BE) with auto-compiled broadsheets.</p>',
                        ],
                        'sort_order'  => 1,
                    ],
                    [
                        'identifier'  => 'finance',
                        'block_type'  => 'feature',
                        'content'     => [
                            'title'    => 'Automated M-Pesa Daraja Fee Reconciliation',
                            'subtitle' => 'Direct Safaricom Paybill & Till integration eliminates manual bank slip tracing.',
                            'body'     => '<p>Parents receive instant SMS confirmation receipts upon payment, and student tuition ledgers update automatically in real time.</p>',
                        ],
                        'sort_order'  => 2,
                    ],
                    [
                        'identifier'  => 'operations',
                        'block_type'  => 'feature',
                        'content'     => [
                            'title'    => 'Hostel, Transport & Asset Logistics',
                            'subtitle' => 'Full visibility over boarding occupancy, bus fleet manifests, and library catalog circulation.',
                            'body'     => '<p>Assign rooms, track dormitory capacities, route vehicles with driver rosters, and manage school inventory depreciation seamlessly.</p>',
                        ],
                        'sort_order'  => 3,
                    ],
                    [
                        'identifier'  => 'communication',
                        'block_type'  => 'feature',
                        'content'     => [
                            'title'    => 'Instant Parent SMS & Notifications',
                            'subtitle' => 'High-throughput alphanumeric SMS gateway for roll-call alerts, fee reminders, and announcements.',
                            'body'     => '<p>Schedule targeted broadcasts by grade, stream, or boarding house with automated delivery status monitoring.</p>',
                        ],
                        'sort_order'  => 4,
                    ],
                ],
            ],
            [
                'path'            => '/about',
                'slug'            => 'about',
                'title'           => 'Built for the people behind great schools',
                'seo_title'       => 'About EduFlow — Transforming African Educational Infrastructure',
                'seo_description' => 'Learn how EduFlow empowers administrators, teachers, parents, and students across Kenya with robust, secure cloud technology.',
                'template'        => 'standard',
                'status'          => 'published',
                'is_home'         => false,
                'published_at'    => now(),
                'sections'        => [
                    [
                        'identifier'  => 'mission',
                        'block_type'  => 'rich_text',
                        'content'     => [
                            'title'    => 'Our Core Mission',
                            'subtitle' => 'To modernize educational administration through intuitive, reliable, and secure software.',
                            'body'     => '<p>We believe school leadership should spend less time balancing paper ledgers and compiling report cards, and more time focusing on student success and institutional growth.</p>',
                        ],
                        'sort_order'  => 1,
                    ],
                    [
                        'identifier'  => 'values',
                        'block_type'  => 'rich_text',
                        'content'     => [
                            'title'    => 'Security, Tenancy & Compliance',
                            'subtitle' => 'Strict tenant-level database isolation and alignment with Kenya Data Protection Act (2019).',
                            'body'     => '<p>Student records and financial transactions remain strictly protected within an encrypted environment backed by continuous security activity auditing.</p>',
                        ],
                        'sort_order'  => 2,
                    ],
                ],
            ],
            [
                'path'            => '/privacy',
                'slug'            => 'privacy',
                'title'           => 'Privacy Policy',
                'seo_title'       => 'Privacy Policy — EduFlow Platform',
                'seo_description' => 'Official privacy policy and student data processing disclosures under the Kenya Data Protection Act (2019).',
                'template'        => 'standard',
                'status'          => 'published',
                'is_home'         => false,
                'published_at'    => now(),
                'sections'        => [
                    [
                        'identifier'  => 'data_collection',
                        'block_type'  => 'legal',
                        'content'     => [
                            'title'    => '1. Information We Collect and Process',
                            'subtitle' => 'Institutional, student, guardian, and staff data processed on behalf of subscribing schools.',
                            'body'     => '<p>EduFlow acts as a data processor on behalf of educational institutions. Data collected includes student identification (NEMIS/UPI), guardian contact details, attendance records, and academic assessments.</p>',
                        ],
                        'sort_order'  => 1,
                    ],
                    [
                        'identifier'  => 'data_protection_act',
                        'block_type'  => 'legal',
                        'content'     => [
                            'title'    => '2. Compliance with Kenya Data Protection Act (2019)',
                            'subtitle' => 'Adherence to statutory principles governing personal data rights and consent.',
                            'body'     => '<p>All personal data is processed lawfully, transparently, and strictly for institutional educational management. Data subjects hold the right to access, rectify, or request deletion through their school administration.</p>',
                        ],
                        'sort_order'  => 2,
                    ],
                ],
            ],
            [
                'path'            => '/cookies',
                'slug'            => 'cookies',
                'title'           => 'Cookie Policy',
                'seo_title'       => 'Cookie Policy — EduFlow Platform',
                'seo_description' => 'Details regarding session cookies, CSRF security tokens, and user preference caching.',
                'template'        => 'standard',
                'status'          => 'published',
                'is_home'         => false,
                'published_at'    => now(),
                'sections'        => [
                    [
                        'identifier'  => 'essential_cookies',
                        'block_type'  => 'legal',
                        'content'     => [
                            'title'    => '1. Essential Authentication Cookies',
                            'subtitle' => 'Cookies strictly required for secure user logins and multi-tenant routing.',
                            'body'     => '<p>EduFlow uses encrypted HTTP-only session cookies and CSRF tokens to safeguard authenticated requests against cross-site scripting and unauthorized session hijacking.</p>',
                        ],
                        'sort_order'  => 1,
                    ],
                ],
            ],
            [
                'path'            => '/terms',
                'slug'            => 'terms',
                'title'           => 'Terms of Service',
                'seo_title'       => 'Terms of Service — EduFlow School Operations Platform',
                'seo_description' => 'User rights, acceptable use policies, and administrative responsibilities on EduFlow.',
                'template'        => 'standard',
                'status'          => 'published',
                'is_home'         => false,
                'published_at'    => now(),
                'sections'        => [
                    [
                        'identifier'  => 'authorized_use',
                        'block_type'  => 'legal',
                        'content'     => [
                            'title'    => '1. Acceptable Use & Account Security',
                            'subtitle' => 'Institutional account governance and credential protection.',
                            'body'     => '<p>Authorized school personnel are responsible for safeguarding their login credentials and ensuring all student information uploaded complies with national education regulations.</p>',
                        ],
                        'sort_order'  => 1,
                    ],
                ],
            ],
            [
                'path'            => '/saas-terms',
                'slug'            => 'saas-terms',
                'title'           => 'SaaS Agreement',
                'seo_title'       => 'SaaS Master Subscription Agreement — EduFlow',
                'seo_description' => 'Service level agreements, 99.9% uptime commitments, billing terms, and data escrow.',
                'template'        => 'standard',
                'status'          => 'published',
                'is_home'         => false,
                'published_at'    => now(),
                'sections'        => [
                    [
                        'identifier'  => 'sla',
                        'block_type'  => 'legal',
                        'content'     => [
                            'title'    => '1. Service Level Agreement (SLA) & Availability',
                            'subtitle' => '99.9% uptime commitment for core academic and finance portals.',
                            'body'     => '<p>EduFlow guarantees high platform availability with automated daily backups, secure cloud failover, and prompt technical support resolution windows.</p>',
                        ],
                        'sort_order'  => 1,
                    ],
                ],
            ],
            [
                'path'            => '/security',
                'slug'            => 'security',
                'title'           => 'Security Controls',
                'seo_title'       => 'Security Architecture & Controls — EduFlow',
                'seo_description' => 'Comprehensive overview of EduFlow cryptographic safeguards, tenant isolation, and audit vault.',
                'template'        => 'standard',
                'status'          => 'published',
                'is_home'         => false,
                'published_at'    => now(),
                'sections'        => [
                    [
                        'identifier'  => 'encryption',
                        'block_type'  => 'legal',
                        'content'     => [
                            'title'    => '1. Cryptographic Standards & Isolation',
                            'subtitle' => 'AES-256 at rest, TLS 1.3 in transit, and row-level tenant separation.',
                            'body'     => '<p>Every school database query is scoped strictly through tenant context middleware, preventing cross-institution data leakage. All sensitive credentials and M-Pesa API keys are stored encrypted.</p>',
                        ],
                        'sort_order'  => 1,
                    ],
                ],
            ],
            [
                'path'            => '/disclaimer',
                'slug'            => 'disclaimer',
                'title'           => 'Legal Disclaimer',
                'seo_title'       => 'Legal & Regulatory Disclaimer — EduFlow',
                'seo_description' => 'Regulatory positioning regarding Ministry of Education guidelines and third-party telecom integrations.',
                'template'        => 'standard',
                'status'          => 'published',
                'is_home'         => false,
                'published_at'    => now(),
                'sections'        => [
                    [
                        'identifier'  => 'regulatory_notice',
                        'block_type'  => 'legal',
                        'content'     => [
                            'title'    => '1. Regulatory Compliance & Guidelines',
                            'subtitle' => 'Ministry of Education curriculum frameworks and telecom payment settlement.',
                            'body'     => '<p>EduFlow provides workflow management technology and does not replace official national examinations or direct banking institution fiduciary obligations.</p>',
                        ],
                        'sort_order'  => 1,
                    ],
                ],
            ],
        ];

        foreach ($pages as $pageData) {
            $sections = $pageData['sections'] ?? [];
            unset($pageData['sections']);

            $page = WebsitePage::updateOrCreate(['path' => $pageData['path']], $pageData);

            foreach ($sections as $sectionData) {
                WebsitePageSection::updateOrCreate(
                    [
                        'website_page_id' => $page->id,
                        'identifier'      => $sectionData['identifier'],
                    ],
                    [
                        'website_page_id' => $page->id,
                        'block_type'      => $sectionData['block_type'] ?? 'rich_text',
                        'identifier'      => $sectionData['identifier'],
                        'content'         => $sectionData['content'] ?? [],
                        'sort_order'      => $sectionData['sort_order'] ?? 1,
                        'is_enabled'      => true,
                    ]
                );
            }
        }
    }
}