<?php

namespace Database\Seeders;

use App\Models\WebsitePage;
use App\Models\WebsitePageSection;
use App\Services\WebsiteContentService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class WebsiteLegalSeeder extends Seeder
{
    public function run(): void
    {
        $contentService = app(WebsiteContentService::class);

        $documents = [
            [
                'path'            => '/privacy',
                'slug'            => 'privacy',
                'title'           => 'Privacy Policy',
                'seo_title'       => 'Privacy Policy | EduFlow Kenya School Management Platform',
                'seo_description' => 'Learn how EduFlow handles personal information within its school management platform, including educational records, account information, communications, security, retention and data protection responsibilities.',
                'template'        => 'standard',
                'status'          => 'published',
                'is_home'         => false,
                'published_at'    => now(),
                'sections'        => [
                    [
                        'identifier' => 'privacy-introduction',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 1.0',
                            'title'    => '1. Introduction and Operational Scope',
                            'subtitle' => 'Framework governing educational data processing on the EduFlow platform.',
                            'body'     => "1.1 Purpose of this Policy\nEduFlow provides web-based educational management and institutional administration software for primary, junior, and secondary schools in Kenya. This Privacy Policy explains how personal and institutional data is collected, stored, processed, and safeguarded when schools, administrators, teachers, bursars, parents, guardians, and learners access the platform.\n\n1.2 Platform Operations\nThis policy covers all integrated modules within the EduFlow suite, including learner admissions, CBC academic progress tracking, fee billing and reconciliation, morning roll-call attendance, hostel room allocations, vehicle transport manifests, and institutional SMS notifications.",
                        ],
                        'sort_order' => 1,
                    ],
                    [
                        'identifier' => 'privacy-roles-and-responsibilities',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 2.0',
                            'title'    => '2. Institutional Roles and Data Governance',
                            'subtitle' => 'Demarcation of responsibilities under the Kenya Data Protection Act, 2019.',
                            'body'     => "2.1 The Subscribing School as Data Controller\nEducational institutions subscribing to EduFlow determine the lawful purpose and operational basis for collecting learner files, parent contact records, teacher details, and tuition payments. The school is responsible for maintaining lawful consent, managing student admission documentation, and ensuring institutional compliance with national education regulations.\n\n2.2 EduFlow as Technology Provider and Data Processor\nEduFlow operates as a technology provider and data processor, executing data workflows strictly in accordance with the subscribing school's operational instructions. EduFlow does not sell, rent, monetize, or disclose student or institutional records to third-party advertisers or data brokers.",
                        ],
                        'sort_order' => 2,
                    ],
                    [
                        'identifier' => 'privacy-data-categories',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 3.0',
                            'title'    => '3. Categories of Information Processed',
                            'subtitle' => 'Summary of institutional, learner, guardian, and financial data records.',
                            'body'     => "3.1 Learner Identification and Academic Records\nInformation managed within school workspaces may include learner full names, admission numbers, date of birth, gender, class streams, National Assessment identification numbers, NEMIS/UPI records, competency assessments, and report card broadsheets.\n\n3.2 Parent and Guardian Contact Details\nPrimary and secondary guardian names, phone numbers utilized for official school SMS alerts, email addresses, relationship descriptions, and student pick-up authorizations.\n\n3.3 Educator and Staff Profiles\nStaff names, employment designations, Teacher Service Commission (TSC) numbers where recorded, assigned subject allocations, payroll structures, and institutional login credentials.\n\n3.4 Financial and Accounting Data\nTuition fee schedules, student payment history, unallocated mobile money transactions, invoice balance statements, and M-Pesa transaction reference numbers.",
                        ],
                        'sort_order' => 3,
                    ],
                    [
                        'identifier' => 'privacy-purposes-workflows',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 4.0',
                            'title'    => '4. Purpose of Data Handling and Platform Workflows',
                            'subtitle' => 'How educational information is utilized during day-to-day school operations.',
                            'body'     => "4.1 Academic Assessment and CBC Progress\nProcessing formative and summative rubric scoring across learning areas to compile standardized termly report cards and class ranking summaries aligned with Ministry of Education curriculum guidelines.\n\n4.2 Fee Billing and Automated Payment Matching\nGenerating student invoices, tracking term fee balances, and automatically matching incoming mobile money payments with student ledgers to eliminate manual bank slip reconciliation errors.\n\n4.3 Learner Welfare and Operational Safety\nRecording morning roll-call attendance, tracking hostel boarding allocations, managing library book circulation, and maintaining bus route rosters for student safety.",
                        ],
                        'sort_order' => 4,
                    ],
                    [
                        'identifier' => 'privacy-integrations-sms-mpesa',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 5.0',
                            'title'    => '5. Communications, Telecommunications and Payment Gateways',
                            'subtitle' => 'Third-party infrastructure utilized for mobile money and messaging.',
                            'body'     => "5.1 M-Pesa Mobile Money Reconciliation\nWhen payments are submitted via Safaricom M-Pesa, EduFlow receives automated transaction notification webhooks containing the transaction reference, amount, timestamp, and payer phone number. EduFlow does not collect, process, or store personal banking PINs or payment passwords.\n\n5.2 Transactional SMS Messaging\nGuardian phone numbers configured by the school are used to deliver essential transactional messages, including fee payment receipts, unexpected absence alerts, emergency school notices, and academic release updates.",
                        ],
                        'sort_order' => 5,
                    ],
                    [
                        'identifier' => 'privacy-security-tenancy',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 6.0',
                            'title'    => '6. Data Protection and Multi-Tenant Isolation',
                            'subtitle' => 'Technical safeguards preventing unauthorized cross-institution access.',
                            'body'     => "6.1 Logical Multi-Tenant Scoping\nEduFlow employs application-level tenant isolation middleware. Every database query is strictly scoped to the authenticated school context, preventing any school from accessing another institution's student records, fee statements, or staff profiles.\n\n6.2 Encryption and Access Verification\nAll communications between web browsers and EduFlow servers are secured using Transport Layer Security (TLS). User passwords and integration secret keys are cryptographically hashed and encrypted at rest.",
                        ],
                        'sort_order' => 6,
                    ],
                    [
                        'identifier' => 'privacy-subject-rights',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 7.0',
                            'title'    => '7. Data Subject Rights and Administrative Support',
                            'subtitle' => 'Procedures for accessing, rectifying, and managing personal records.',
                            'body'     => "7.1 Submitting Inquiries\nIn accordance with the Kenya Data Protection Act, 2019, parents, guardians, educators, and adult learners have rights to review, correct, or request updates to their personal records. Because the school is the Data Controller, requests should be submitted directly to the school administration.\n\n7.2 Administrative Self-Service Tools\nEduFlow provides subscribing school administrators with administrative management tools to rectify inaccurate learner profiles, update parent contact details, and export student history broadsheets upon legitimate request.",
                        ],
                        'sort_order' => 7,
                    ],
                    [
                        'identifier' => 'privacy-retention-closure',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 8.0',
                            'title'    => '8. Data Retention, Workspace Closure and Policy Updates',
                            'subtitle' => 'Lifecycle management of institutional data and policy amendments.',
                            'body'     => "8.1 Retention During Active Subscription\nStudent records, attendance histories, and accounting ledgers are maintained during the active subscription term to satisfy institutional record-keeping and statutory reporting requirements.\n\n8.2 Account Closure and Data Portability\nUpon non-renewal or subscription termination, schools are provided access to export student broadsheets, enrollment registries, and financial archives. Workspaces are subsequently decommissioned in accordance with standard data cleanup procedures.\n\n8.3 Policy Amendments\nEduFlow may periodically update this Privacy Policy to reflect platform enhancements or regulatory changes. Updated versions will be published on this page with an updated revision date.",
                        ],
                        'sort_order' => 8,
                    ],
                ],
            ],
            [
                'path'            => '/cookies',
                'slug'            => 'cookies',
                'title'           => 'Cookie Policy',
                'seo_title'       => 'Cookie Policy | EduFlow School Operations Platform',
                'seo_description' => 'Understand how EduFlow uses essential session cookies and security tokens to maintain secure school portal access and data integrity.',
                'template'        => 'standard',
                'status'          => 'published',
                'is_home'         => false,
                'published_at'    => now(),
                'sections'        => [
                    [
                        'identifier' => 'cookies-overview',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 1.0',
                            'title'    => '1. Overview of Cookies and Web Storage',
                            'subtitle' => 'How lightweight browser tokens support secure portal operations.',
                            'body'     => "1.1 What Are Cookies\nCookies and browser local storage items are small data tokens placed on your device when you browse web applications. They allow platforms to verify active logins, maintain navigation states, and protect accounts from unauthorized session tampering.\n\n1.2 Operational Purpose\nEduFlow uses cookies strictly to enable portal functionality, maintain user authentication, and enforce security safeguards. EduFlow does not utilize third-party tracking cookies or behavioral advertising networks.",
                        ],
                        'sort_order' => 1,
                    ],
                    [
                        'identifier' => 'cookies-essential-session',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 2.0',
                            'title'    => '2. Essential Authentication and Session Cookies',
                            'subtitle' => 'Required identifiers for user access and role validation.',
                            'body'     => "2.1 Session Continuity\nWhen school administrators, teachers, bursars, parents, or students log in, an encrypted session cookie is established. This cookie allows you to navigate between modules without re-entering credentials on every page.\n\n2.2 Tenant Context Binding\nSession cookies bind the authenticated user to their specific school workspace, ensuring that all operations remain within the appropriate institutional boundaries.",
                        ],
                        'sort_order' => 2,
                    ],
                    [
                        'identifier' => 'cookies-security-csrf',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 3.0',
                            'title'    => '3. Security and CSRF Protection Tokens',
                            'subtitle' => 'Safeguards defending against unauthorized request forgery.',
                            'body'     => "3.1 Cross-Site Request Forgery Protection\nEduFlow issues a unique Cross-Site Request Forgery (XSRF-TOKEN) cookie for every authenticated session. This token confirms that sensitive actions (such as fee recording, mark submissions, or user password resets) originate genuinely from your active browser session.\n\n3.2 Automatic Expiration\nSession cookies are configured with inactivity timeout limits to protect unattended workstations in staffrooms, bursar offices, and computer laboratories.",
                        ],
                        'sort_order' => 3,
                    ],
                    [
                        'identifier' => 'cookies-preferences-storage',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 4.0',
                            'title'    => '4. Interface Preferences and Local Storage',
                            'subtitle' => 'Preserving layout configurations for improved daily usability.',
                            'body'     => "4.1 User Interface Preferences\nLocal browser storage is used to remember non-sensitive interface preferences, such as sidebar navigation state, table display densities, and active list filter selections.\n\n4.2 Asset Caching\nCaching interface components locally reduces bandwidth consumption on mobile networks and improves page loading speeds during peak school hours.",
                        ],
                        'sort_order' => 4,
                    ],
                    [
                        'identifier' => 'cookies-browser-controls',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 5.0',
                            'title'    => '5. Managing Cookies and Disabling Controls',
                            'subtitle' => 'Browser settings and their impact on portal accessibility.',
                            'body'     => "5.1 Browser Cookie Management\nYou can manage, block, or delete cookies via your web browser settings. Most modern desktop and mobile browsers provide controls within their privacy and security preferences.\n\n5.2 Impact of Blocking Essential Cookies\nBecause EduFlow relies on session cookies and security tokens to authenticate users and prevent request forgery, disabling cookies will prevent successful login and normal portal operation.",
                        ],
                        'sort_order' => 5,
                    ],
                ],
            ],
            [
                'path'            => '/terms',
                'slug'            => 'terms',
                'title'           => 'Terms of Service',
                'seo_title'       => 'Terms of Service | EduFlow School Operations Suite',
                'seo_description' => 'User rights, acceptable use policies, account governance, and administrative responsibilities governing access to the EduFlow educational platform.',
                'template'        => 'standard',
                'status'          => 'published',
                'is_home'         => false,
                'published_at'    => now(),
                'sections'        => [
                    [
                        'identifier' => 'terms-acceptance-authority',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 1.0',
                            'title'    => '1. Acceptance of Terms and Institutional Authority',
                            'subtitle' => 'Contractual agreement governing platform use.',
                            'body'     => "1.1 Binding Agreement\nBy accessing or using EduFlow, you agree to comply with these Terms of Service. If you are registering an account on behalf of a school, educational board, or corporate entity, you represent and warrant that you have the legal authority to bind that institution.\n\n1.2 Authorized User Groups\nAccess is granted to authorized school administrators, bursars, teachers, support staff, parents, guardians, and enrolled learners whose accounts are created and managed by a subscribing educational institution.",
                        ],
                        'sort_order' => 1,
                    ],
                    [
                        'identifier' => 'terms-workspace-management',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 2.0',
                            'title'    => '2. Workspace Governance and Account Administration',
                            'subtitle' => 'School responsibilities for user provisioning and credential management.',
                            'body'     => "2.1 Workspace Oversight\nEach subscribing institution is provisioned with a dedicated school workspace. Designated school administrators are responsible for managing staff user accounts, assigning role permissions, and ensuring that user records remain accurate and up to date.\n\n2.2 Account Security Obligations\nUsers must maintain the confidentiality of their login credentials. Users must promptly notify school administrators and EduFlow if unauthorized account access or credential loss is suspected.",
                        ],
                        'sort_order' => 2,
                    ],
                    [
                        'identifier' => 'terms-acceptable-use',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 3.0',
                            'title'    => '3. Acceptable Use and Prohibited Activities',
                            'subtitle' => 'Standards of conduct and system integrity rules.',
                            'body'     => "3.1 Permitted Operational Purpose\nEduFlow may be utilized exclusively for lawful educational management, student record maintenance, academic grading, institutional financial reconciliation, and official school communications.\n\n3.2 Prohibited Activities\nUsers agree not to:\n- Attempt to breach tenant scoping boundaries or access data belonging to another school.\n- Upload malicious software, automated scraping scripts, or vulnerability probing tools.\n- Use institutional SMS gateways for unsolicited commercial messages, unauthorized bulk messaging, or non-educational content.\n- Impersonate another user or misrepresent institutional authority.",
                        ],
                        'sort_order' => 3,
                    ],
                    [
                        'identifier' => 'terms-data-ownership-ip',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 4.0',
                            'title'    => '4. Customer Data Ownership and Intellectual Property',
                            'subtitle' => 'Clear distinction between customer records and platform software assets.',
                            'body'     => "4.1 School Data Ownership\nThe subscribing institution retains exclusive ownership of all student academic marks, exam broadsheets, fee accounting registers, guardian contact lists, and institutional files uploaded to its workspace. EduFlow claims no ownership rights over customer data.\n\n4.2 EduFlow Intellectual Property\nThe software architecture, user interfaces, database designs, branding, logos, algorithms, and documentation of EduFlow are the exclusive intellectual property of EduFlow and its licensors.",
                        ],
                        'sort_order' => 4,
                    ],
                    [
                        'identifier' => 'terms-integrations-third-party',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 5.0',
                            'title'    => '5. Third-Party Telecom and Financial Integrations',
                            'subtitle' => 'Operating through telecommunications networks and mobile money gateways.',
                            'body'     => "5.1 Mobile Money Reconciliations\nFee management features integrate with mobile money payment gateways, including Safaricom Daraja M-Pesa. EduFlow records verified transaction notifications to update school ledgers, but operates as a software provider and not as a deposit-taking financial institution or bank.\n\n5.2 External Network Dependencies\nEduFlow is not responsible for transaction transmission delays, telecommunication network outages, or carrier-level gateway downtimes originating outside our direct infrastructure.",
                        ],
                        'sort_order' => 5,
                    ],
                    [
                        'identifier' => 'terms-availability-support',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 6.0',
                            'title'    => '6. Platform Availability, Maintenance and Technical Support',
                            'subtitle' => 'Operational standards and helpdesk communication channels.',
                            'body'     => "6.1 System Availability and Upgrades\nEduFlow is engineered for high reliability during active school hours. Routine system maintenance, feature updates, and security patches are scheduled during off-peak windows where practical.\n\n6.2 Customer Helpdesk Assistance\nSubscribing schools receive technical support via designated email and telephone channels to assist with system configurations, onboarding, data imports, and troubleshooting.",
                        ],
                        'sort_order' => 6,
                    ],
                    [
                        'identifier' => 'terms-termination-disputes',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 7.0',
                            'title'    => '7. Account Termination, Governing Law and Dispute Handling',
                            'subtitle' => 'Contract conclusion terms and Kenyan legal jurisdiction.',
                            'body'     => "7.1 Account Suspension\nEduFlow reserves the right to suspend or restrict workspace access in the event of material terms violations, overdue subscription accounts, or actions threatening platform security.\n\n7.2 Governing Law\nThese Terms of Service are governed by and construed in accordance with the Laws of the Republic of Kenya. Any legal disputes arising from platform use shall be resolved through amicable consultation, and where unresolved, the competent courts in Kenya.",
                        ],
                        'sort_order' => 7,
                    ],
                ],
            ],
            [
                'path'            => '/saas-terms',
                'slug'            => 'saas-terms',
                'title'           => 'SaaS Agreement',
                'seo_title'       => 'Master SaaS Agreement | EduFlow Educational Platform',
                'seo_description' => 'Master software-as-a-service subscription agreement defining cloud hosting, workspace provisioning, package tiers, and data stewardship for schools.',
                'template'        => 'standard',
                'status'          => 'published',
                'is_home'         => false,
                'published_at'    => now(),
                'sections'        => [
                    [
                        'identifier' => 'saas-purpose-framework',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 1.0',
                            'title'    => '1. Master SaaS Framework and Service Scope',
                            'subtitle' => 'Contractual framework for cloud-hosted educational software.',
                            'body'     => "1.1 Master SaaS Agreement\nThis Software-as-a-Service (SaaS) Agreement establishes the commercial and technical terms under which EduFlow provides cloud-hosted school management software to subscribing educational institutions (\"Customer\").\n\n1.2 Cloud Delivery Model\nEduFlow delivers software capabilities over the internet via modern web browsers, eliminating the requirement for schools to procure, host, or maintain on-premise application servers.",
                        ],
                        'sort_order' => 1,
                    ],
                    [
                        'identifier' => 'saas-provisioning-modules',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 2.0',
                            'title'    => '2. Tenant Provisioning, Modules and User Capacities',
                            'subtitle' => 'Workspace configuration and institutional feature enablement.',
                            'body'     => "2.1 Workspace Provisioning\nUpon subscription activation, EduFlow provisions a dedicated tenant workspace configured with the student capacity tiers, staff seats, and active functional modules (e.g. CBC assessments, fee tracking, hostel management, transport routing, SMS messaging) designated in the Customer subscription package.\n\n2.2 Administrative Control\nThe Customer maintains operational control over user enrollment, class configuration, grading criteria, and fee structure setup within its workspace.",
                        ],
                        'sort_order' => 2,
                    ],
                    [
                        'identifier' => 'saas-availability-backups',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 3.0',
                            'title'    => '3. Availability Targets, Maintenance and Data Backups',
                            'subtitle' => 'System reliability practices and disaster recovery preparations.',
                            'body'     => "3.1 Operational Availability\nEduFlow is architected for dependable operational availability throughout the academic term, excluding scheduled maintenance windows and third-party telecom infrastructure interruptions.\n\n3.2 Automated Database Backups\nEduFlow executes automated database backups stored across secure cloud repositories to protect institutional continuity and enable recovery in the event of system failover.",
                        ],
                        'sort_order' => 3,
                    ],
                    [
                        'identifier' => 'saas-billing-subscriptions',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 4.0',
                            'title'    => '4. Subscription Packages, Invoicing and Renewals',
                            'subtitle' => 'Commercial terms, invoicing schedules, and package management.',
                            'body'     => "4.1 Subscription Fees\nSubscription pricing is determined by active package tiers, student enrollment counts, and configured modules as agreed in the applicable service order.\n\n4.2 Invoicing and Account Good Standing\nSubscription invoices are issued termly or annually in advance. Access to active workspace modules and SMS gateway quotas is maintained while the Customer's billing account remains in good standing.",
                        ],
                        'sort_order' => 4,
                    ],
                    [
                        'identifier' => 'saas-confidentiality-data',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 5.0',
                            'title'    => '5. Confidentiality and Data Protection Obligations',
                            'subtitle' => 'Mutual commitments safeguarding institutional and platform data.',
                            'body'     => "5.1 Confidential Information\nBoth parties agree to protect proprietary and confidential information disclosed during the subscription relationship. Learner academic marks, financial accounts, and platform infrastructure designs shall not be disclosed to unauthorized third parties.\n\n5.2 Data Processing Compliance\nEduFlow processes customer records solely to deliver the agreed SaaS capabilities in accordance with applicable data protection principles under Kenyan law.",
                        ],
                        'sort_order' => 5,
                    ],
                    [
                        'identifier' => 'saas-portability-termination',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 6.0',
                            'title'    => '6. Subscription Term, Non-Renewal and Data Portability',
                            'subtitle' => 'Agreement lifecycle and data export provisions.',
                            'body'     => "6.1 Agreement Term\nThis Agreement remains in effect for the duration of the Customer subscription term and renews automatically unless written notice of non-renewal is provided prior to the expiration date.\n\n6.2 Data Portability\nUpon non-renewal or subscription conclusion, the Customer is entitled to export its complete student registries, assessment broadsheets, and fee ledgers via standard CSV and PDF export tools during an agreed transition window.",
                        ],
                        'sort_order' => 6,
                    ],
                    [
                        'identifier' => 'saas-liability-jurisdiction',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 7.0',
                            'title'    => '7. Limitation of Liability and Kenyan Jurisdiction',
                            'subtitle' => 'Risk allocation and legal resolution framework.',
                            'body'     => "7.1 Liability Boundaries\nTo the maximum extent permitted by law, neither party shall be liable for indirect, incidental, or consequential damages. EduFlow's total aggregate liability arising under this Agreement shall not exceed the subscription fees paid by the Customer in the preceding twelve (12) months.\n\n7.2 Legal Jurisdiction\nThis Agreement is governed by the Laws of Kenya, with legal proceedings subject to the jurisdiction of the competent courts in Kenya.",
                        ],
                        'sort_order' => 7,
                    ],
                ],
            ],
            [
                'path'            => '/security',
                'slug'            => 'security',
                'title'           => 'Security Controls',
                'seo_title'       => 'Security Architecture & Controls | EduFlow',
                'seo_description' => 'Detailed technical overview of EduFlow multi-tenant data isolation, cryptographic safeguards, role permissions, and institutional audit logging.',
                'template'        => 'standard',
                'status'          => 'published',
                'is_home'         => false,
                'published_at'    => now(),
                'sections'        => [
                    [
                        'identifier' => 'security-principles',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 1.0',
                            'title'    => '1. Security Principles and Defense in Depth',
                            'subtitle' => 'Foundational security architecture protecting school databases.',
                            'body'     => "1.1 Multi-Layered Protection\nEduFlow applies a multi-layered security architecture designed to safeguard school records against unauthorized access, data alteration, and service interruptions. Controls are enforced across application routing, database query scoping, authentication, and session handling.\n\n1.2 Principle of Least Privilege\nUser permissions and administrative rights are restricted strictly to authorized functional requirements, minimizing risk across all school operational workflows.",
                        ],
                        'sort_order' => 1,
                    ],
                    [
                        'identifier' => 'security-tenant-isolation',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 2.0',
                            'title'    => '2. Multi-Tenant Scoping and Logical Data Isolation',
                            'subtitle' => 'Architectural separation preventing cross-school data access.',
                            'body'     => "2.1 Programmatic Context Scoping\nEduFlow enforces tenant-scoping middleware on every database query. All student records, marksheets, fee ledgers, and staff profiles are bound strictly to the authenticated school context.\n\n2.2 Cross-Tenant Isolation\nThis architectural separation prevents users from one educational institution from viewing, querying, or modifying the records of any other school hosted on the platform.",
                        ],
                        'sort_order' => 2,
                    ],
                    [
                        'identifier' => 'security-auth-credentials',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 3.0',
                            'title'    => '3. Authentication, Password Hashing and Session Security',
                            'subtitle' => 'Robust credential management and rate-limiting controls.',
                            'body'     => "3.1 Cryptographic Password Storage\nUser passwords are never stored in plaintext. Passwords are cryptographically transformed using modern, memory-hard hashing algorithms with unique cryptographic salts.\n\n3.2 Brute-Force Rate Limiting\nAuthentication endpoints feature automated rate limiting that throttles repeated failed login attempts, mitigating automated credential stuffing attacks.\n\n3.3 Secure Session Tokens\nSession cookies are issued with HTTP-only and Secure flags, preventing client-side script interception and safeguarding active portal sessions.",
                        ],
                        'sort_order' => 3,
                    ],
                    [
                        'identifier' => 'security-rbac-authorization',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 4.0',
                            'title'    => '4. Role-Based Access Control and Privilege Tiers',
                            'subtitle' => 'Granular authorization boundaries tailored to school staff hierarchies.',
                            'body'     => "4.1 Segregated Role Hierarchy\nThe platform enforces strict role-based access control (RBAC):\n- School Administrators manage institutional configurations, academic terms, and staff accounts.\n- Teachers record CBC strand rubric scores and manage homework submissions.\n- Bursars and Accountants access fee collections, unallocated queues, and financial reports.\n- Parents and Students access read-only portal views of performance broadsheets, fee balances, and timetables.\n\n4.2 Explicit Authorization Gates\nEvery administrative action verifies that the authenticated user possesses verified permission before altering records in the database.",
                        ],
                        'sort_order' => 4,
                    ],
                    [
                        'identifier' => 'security-api-integrations',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 5.0',
                            'title'    => '5. Integration Safeguards and Secret Key Encryption',
                            'subtitle' => 'Protecting telecom webhooks and mobile payment gateways.',
                            'body'     => "5.1 Encrypted Secrets Storage\nThird-party integration secrets, including Safaricom Daraja API keys and SMS gateway credentials configured by schools, are encrypted at rest within the database.\n\n5.2 Webhook Signature Validation\nIncoming payment and messaging webhooks are validated to ensure payloads originate genuinely from verified telecom providers before updating student fee ledgers.",
                        ],
                        'sort_order' => 5,
                    ],
                    [
                        'identifier' => 'security-audit-disclosure',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 6.0',
                            'title'    => '6. Institutional Audit Trails and Responsible Disclosure',
                            'subtitle' => 'Activity tracking and security issue reporting protocols.',
                            'body'     => "6.1 System Activity Audit Logs\nEduFlow logs critical institutional events—including user logins, fee collections, grade modifications, and settings updates—with timestamps and user identities for internal audit compliance.\n\n6.2 Responsible Disclosure\nSecurity researchers and school IT coordinators who discover potential vulnerabilities are invited to report findings directly to our technical desk at support@eduflow.co.ke. We review and remediate verified reports promptly.",
                        ],
                        'sort_order' => 6,
                    ],
                ],
            ],
            [
                'path'            => '/disclaimer',
                'slug'            => 'disclaimer',
                'title'           => 'Legal Disclaimer',
                'seo_title'       => 'Legal & Regulatory Disclaimer | EduFlow Platform',
                'seo_description' => 'Important operational disclosures, CBC curriculum advisory notes, and technology boundaries for schools using EduFlow.',
                'template'        => 'standard',
                'status'          => 'published',
                'is_home'         => false,
                'published_at'    => now(),
                'sections'        => [
                    [
                        'identifier' => 'disclaimer-technology-scope',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 1.0',
                            'title'    => '1. Technology Platform Scope and Administrative Boundaries',
                            'subtitle' => 'Defining the operational boundaries of EduFlow software.',
                            'body'     => "1.1 Management Software Tool\nEduFlow is an educational management software platform designed to assist schools with administrative workflows, record-keeping, and communications. The platform is provided as an operational tool and does not constitute formal statutory oversight.\n\n1.2 Institutional Autonomy\nSubscribing schools operate independently and remain solely responsible for establishing their own admissions policies, academic grading rules, disciplinary codes, and fee payment schedules.",
                        ],
                        'sort_order' => 1,
                    ],
                    [
                        'identifier' => 'disclaimer-curriculum-guidelines',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 2.0',
                            'title'    => '2. National Curriculum Guidelines and Academic Verification',
                            'subtitle' => 'Advisory notes regarding Ministry of Education curriculum standards.',
                            'body'     => "2.1 Curriculum Frameworks\nEduFlow assessment templates are built to assist schools in executing Competency-Based Curriculum (CBC) rubric grading. However, official national curriculum frameworks, examination syllabi, and grading standards are established exclusively by the Ministry of Education and the Kenya Institute of Curriculum Development (KICD).\n\n2.2 Teacher Verification of Scores\nSchools and teachers remain responsible for reviewing and verifying all student assessment scores, broadsheets, and report cards for accuracy prior to distributing results to parents or educational authorities.",
                        ],
                        'sort_order' => 2,
                    ],
                    [
                        'identifier' => 'disclaimer-financial-fiduciary',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 3.0',
                            'title'    => '3. Financial, Bookkeeping and Fiduciary Clarifications',
                            'subtitle' => 'Bookkeeping workflow support vs. professional accounting advisory.',
                            'body'     => "3.1 Bookkeeping Workflow Assistance\nFee collection registers, balance statements, and invoice reports generated by EduFlow are intended to assist school bursars with administrative bookkeeping. They do not constitute formal financial audits, banking certifications, or statutory tax advice.\n\n3.2 School Fiduciary Responsibilities\nSchool boards of management retain fiduciary responsibility for reconciling bank accounts, authorizing fee waivers, managing unallocated receipts, and complying with national tax obligations.",
                        ],
                        'sort_order' => 3,
                    ],
                    [
                        'identifier' => 'disclaimer-telecom-networks',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 4.0',
                            'title'    => '4. Cellular, M-Pesa and SMS Network Dependencies',
                            'subtitle' => 'Operational reliance on external telecommunications infrastructure.',
                            'body'     => "4.1 Third-Party Telecommunications Channels\nEduFlow integrates with cellular networks and payment switches (including Safaricom M-Pesa and licensed SMS aggregators) to match mobile payments and dispatch parent alerts.\n\n4.2 Gateway Downtimes and Latency\nEduFlow is not responsible for delayed SMS deliveries, mobile money processing latency, or telecom network outages originating outside our direct application infrastructure.",
                        ],
                        'sort_order' => 4,
                    ],
                    [
                        'identifier' => 'disclaimer-liability-contacts',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Clause 5.0',
                            'title'    => '5. Limitation of Responsibility and Support Inquiries',
                            'subtitle' => 'Operational discretion and contact channels for governance questions.',
                            'body'     => "5.1 Institutional Discretion\nSchools utilize EduFlow features at their own discretion. While we continuously strive for technical accuracy, high reliability, and software quality, EduFlow makes no express warranties beyond our formal subscription commitments.\n\n5.2 Governance and Support Desk\nFor questions regarding platform governance, institutional terms, or compliance disclosures, please contact the EduFlow technical desk at support@eduflow.co.ke.",
                        ],
                        'sort_order' => 5,
                    ],
                ],
            ],
            [
                'path'            => '/governance',
                'slug'            => 'governance',
                'title'           => 'Governance Framework',
                'seo_title'       => 'Institutional Governance Framework | EduFlow',
                'seo_description' => 'Comprehensive overview of EduFlow institutional governance, compliance standards, and legal charters for Kenyan schools.',
                'template'        => 'standard',
                'status'          => 'published',
                'is_home'         => false,
                'published_at'    => now(),
                'sections'        => [
                    [
                        'identifier' => 'governance-overview',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Overview',
                            'title'    => '1. Kenyan Institutional Governance Framework',
                            'subtitle' => 'Comprehensive compliance standards and legal charters for educational technology.',
                            'body'     => "1.1 Institutional Governance Architecture\nEduFlow operates under a structured governance framework designed to promote transparency, institutional autonomy, and data protection across Kenyan primary, junior, and secondary schools.\n\n1.2 The Governance Charters\nThe EduFlow governance suite comprises six foundational documents:\n- Privacy Policy (/privacy) — Data protection principles and learner record safeguards.\n- Cookie Policy (/cookies) — Disclosures regarding session security and authentication tokens.\n- Terms of Service (/terms) — Acceptable use policies and user role responsibilities.\n- SaaS Agreement (/saas-terms) — Master cloud subscription agreement and service terms.\n- Security Controls (/security) — Technical overview of tenant isolation and cryptographic safeguards.\n- Legal Disclaimer (/disclaimer) — Scope boundaries, curriculum notes, and fiduciary disclosures.",
                        ],
                        'sort_order' => 1,
                    ],
                    [
                        'identifier' => 'governance-commitments',
                        'block_type' => 'legal',
                        'content'    => [
                            'badge'    => 'Principles',
                            'title'    => '2. Core Governance Principles',
                            'subtitle' => 'Foundational standards guiding platform development and operations.',
                            'body'     => "2.1 Data Controller Independence\nSubscribing educational institutions retain complete ownership and controller authority over their student files, academic broadsheets, and financial ledgers.\n\n2.2 Transparency and Security\nEduFlow maintains logical tenant isolation, cryptographically hashed credentials, and system audit logs to support institutional oversight.\n\n2.3 Regulatory Alignment\nOur platform workflows are designed to support schools in meeting their operational obligations under the Kenya Data Protection Act, 2019 and Ministry of Education guidelines.",
                        ],
                        'sort_order' => 2,
                    ],
                ],
            ],
        ];

        foreach ($documents as $docData) {
            $sections = $docData['sections'] ?? [];
            unset($docData['sections']);

            $existing = WebsitePage::where('path', $docData['path'])->first();
            $docData['public_id'] = $existing?->public_id ?? (string) Str::uuid();

            $page = WebsitePage::updateOrCreate(
                ['path' => $docData['path']],
                $docData
            );

            // Prune old sections for this page to ensure clean replacement
            WebsitePageSection::where('website_page_id', $page->id)->forceDelete();

            // Insert authoritative sections
            foreach ($sections as $secData) {
                WebsitePageSection::create([
                    'website_page_id' => $page->id,
                    'identifier'      => $secData['identifier'],
                    'block_type'      => $secData['block_type'] ?? 'legal',
                    'content'         => $secData['content'] ?? [],
                    'sort_order'      => $secData['sort_order'] ?? 1,
                    'is_enabled'      => true,
                ]);
            }

            // Invalidate service cache
            $contentService->forgetPage($docData['path']);
        }
    }
}