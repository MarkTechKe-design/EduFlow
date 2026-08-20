<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class FaqSeeder extends Seeder
{
    public function run(): void
    {
        $faqs = [
            // 1. GETTING STARTED
            [
                'question' => 'What is EduFlow?',
                'answer' => 'EduFlow is a multi-tenant school operations platform engineered for Kenyan institutions. It integrates student biodata, CBC continuous assessment rubrics, Lipa na M-Pesa fee balancing, morning attendance registers, parent communications, and NEMIS/KNEC data exports into a unified workspace.',
                'category' => 'Getting Started',
                'status' => 'published',
                'is_featured_on_homepage' => true,
                'sort_order' => 1,
            ],
            [
                'question' => 'Who is EduFlow designed for?',
                'answer' => 'EduFlow provides dedicated workspaces for School Administrators, Directors, Bursars, Subject Teachers, Parents, Students, and Platform Super Administrators. Each user role accesses a tailored interface with strict permission boundaries.',
                'category' => 'Getting Started',
                'status' => 'published',
                'is_featured_on_homepage' => false,
                'sort_order' => 2,
            ],
            [
                'question' => 'How does a school get started with EduFlow?',
                'answer' => 'An administrator registers the institution via the Setup My School portal, selects an operational plan, and receives a dedicated tenant workspace. Setup involves configuring the academic year and term structure, setting up classes and streams, and importing student and staff biodata.',
                'category' => 'Getting Started',
                'status' => 'published',
                'is_featured_on_homepage' => false,
                'sort_order' => 3,
            ],
            [
                'question' => 'Does a school need technical expertise to use EduFlow?',
                'answer' => 'No. EduFlow is a cloud-based web application with clean, role-specific interfaces that require no software installation or server maintenance. Teachers and bursars can perform daily operations directly from web browsers on smartphones, tablets, or laptops.',
                'category' => 'Getting Started',
                'status' => 'published',
                'is_featured_on_homepage' => false,
                'sort_order' => 4,
            ],

            // 2. SCHOOL MANAGEMENT
            [
                'question' => 'Can EduFlow manage student and staff biodata?',
                'answer' => 'Yes. Authorized school administrators can manage comprehensive student profiles (including NEMIS UPI, birth certificates, guardian linkages, medical notes, and admission numbers) as well as staff profiles with TSC numbers, assigned subjects, and teaching responsibilities.',
                'category' => 'School Management',
                'status' => 'published',
                'is_featured_on_homepage' => false,
                'sort_order' => 5,
            ],
            [
                'question' => 'Can schools configure academic years, terms, and streams?',
                'answer' => 'Yes. The platform supports dynamic academic years (e.g. 2026), 3-term calendars, multiple grades (Playgroup through Grade 12), and customizable stream configurations (e.g. Blue, Green, Red).',
                'category' => 'School Management',
                'status' => 'published',
                'is_featured_on_homepage' => false,
                'sort_order' => 6,
            ],
            [
                'question' => 'Can a school administrator access records from another school?',
                'answer' => 'No. EduFlow enforces strict database-level tenant isolation (BelongsToSchool scope). Every query is constrained to the authenticated school_id, preventing any cross-school data visibility.',
                'category' => 'School Management',
                'status' => 'published',
                'is_featured_on_homepage' => false,
                'sort_order' => 7,
            ],

            // 3. STUDENTS & PARENTS
            [
                'question' => 'Can one parent account be linked to multiple children?',
                'answer' => 'Yes. The Parent Portal includes a multi-child switcher allowing guardians with multiple learners in different grades or streams to view fee balances, roll-call attendance, and CBC performance reports from a single login.',
                'category' => 'Students & Parents',
                'status' => 'published',
                'is_featured_on_homepage' => false,
                'sort_order' => 8,
            ],
            [
                'question' => 'What can parents and students see in their portals?',
                'answer' => 'Parents view term fee statements, payment histories, daily roll-call attendance, published CBC report cards, and school circulars. Students view their weekly lesson timetables, homework assignments with submission countdowns, and published examination scores.',
                'category' => 'Students & Parents',
                'status' => 'published',
                'is_featured_on_homepage' => false,
                'sort_order' => 9,
            ],

            // 4. TEACHERS & ACADEMICS
            [
                'question' => 'What tools are available in the Teacher Workspace?',
                'answer' => 'Teachers have a dedicated classroom cockpit featuring daily lesson timetables, period roll-call registers, homework assignment creation, continuous assessment mark entry, and CBC rubric grading for assigned classes.',
                'category' => 'Teachers & Academics',
                'status' => 'published',
                'is_featured_on_homepage' => false,
                'sort_order' => 10,
            ],
            [
                'question' => 'Can teachers mark attendance from mobile phones?',
                'answer' => 'Yes. The attendance interface is fully mobile-optimized, allowing teachers to record morning or period roll-calls in seconds directly from mobile browser screens in the classroom.',
                'category' => 'Teachers & Academics',
                'status' => 'published',
                'is_featured_on_homepage' => false,
                'sort_order' => 11,
            ],

            // 5. CBC & KENYAN EDUCATION
            [
                'question' => 'How does EduFlow support Kenyan CBC assessment rubrics?',
                'answer' => 'EduFlow natively incorporates Kenya\'s Competency Based Curriculum (CBC) evaluation standard across all learning areas and strands. Teachers record formative and summative scores using the 4 national performance levels: Exceeding Expectations (EE), Meeting Expectations (ME), Approaching Expectations (AE), and Below Expectations (BE).',
                'category' => 'CBC & Academics',
                'status' => 'published',
                'is_featured_on_homepage' => true,
                'sort_order' => 12,
            ],
            [
                'question' => 'Can schools export NEMIS UPI and KNEC-formatted assessment reports?',
                'answer' => 'Yes. Assessment summaries and student registers can be generated and exported in standard formats ready for KNEC CBA portal uploads and NEMIS validation.',
                'category' => 'CBC & Academics',
                'status' => 'published',
                'is_featured_on_homepage' => false,
                'sort_order' => 13,
            ],

            // 6. FEES & FINANCE
            [
                'question' => 'How does EduFlow manage fee structures and balances?',
                'answer' => 'Bursars can configure term fee structures across grade levels, bill student accounts individually or in batches, record bank deposits and cash receipts, track outstanding arrears, and generate real-time institutional collection summaries in KES.',
                'category' => 'Fees & Finance',
                'status' => 'published',
                'is_featured_on_homepage' => false,
                'sort_order' => 14,
            ],
            [
                'question' => 'Are fee figures displayed in Kenyan Shillings (KES)?',
                'answer' => 'Yes. All financial modules, fee invoices, payment receipts, and executive dashboards use Kenyan Shillings (KES) currency formatting exclusively.',
                'category' => 'Fees & Finance',
                'status' => 'published',
                'is_featured_on_homepage' => false,
                'sort_order' => 15,
            ],

            // 7. M-PESA & PAYMENTS
            [
                'question' => 'How does automated Lipa na M-Pesa fee reconciliation work?',
                'answer' => 'EduFlow integrates directly with Safaricom Daraja API. When a parent pays via Paybill or Buy Goods Till (using the student admission number as account reference), transactions are received via secure webhooks, validated, balanced against the fee invoice in real time, and confirmed with an instant SMS receipt.',
                'category' => 'M-Pesa & Payments',
                'status' => 'published',
                'is_featured_on_homepage' => true,
                'sort_order' => 16,
            ],
            [
                'question' => 'What happens if an M-Pesa transaction cannot be matched automatically?',
                'answer' => 'Unmatched payments (e.g. if an invalid admission number was typed by the sender) are routed to the Bursar\'s Reconcile Queue for one-click assignment to the correct student ledger without data loss.',
                'category' => 'M-Pesa & Payments',
                'status' => 'published',
                'is_featured_on_homepage' => false,
                'sort_order' => 17,
            ],

            // 8. DATA IMPORT & MIGRATION
            [
                'question' => 'Can we import student and parent data from Excel or CSV files?',
                'answer' => 'Yes. EduFlow provides built-in spreadsheet import templates for student biodata, guardian phone numbers, and starting fee balances. The system validates all fields before committing records to the school database.',
                'category' => 'Data Import',
                'status' => 'published',
                'is_featured_on_homepage' => false,
                'sort_order' => 18,
            ],

            // 9. SECURITY & PRIVACY
            [
                'question' => 'Is learner data compliant with the Kenya Data Protection Act (DPA)?',
                'answer' => 'Yes. EduFlow adheres to the Kenya Data Protection Act through strict tenant database isolation, encrypted HTTP cookies, role-based authorization, rate-limited login endpoints, and comprehensive audit logs for sensitive academic and financial modifications.',
                'category' => 'Security & Privacy',
                'status' => 'published',
                'is_featured_on_homepage' => true,
                'sort_order' => 19,
            ],
            [
                'question' => 'Does changing the browser URL allow access to other students or schools?',
                'answer' => 'No. Backend Laravel policies and tenant query scopes enforce authorization on every request regardless of what ID is passed in the URL. Unauthorized queries fail immediately with 403 Forbidden.',
                'category' => 'Security & Privacy',
                'status' => 'published',
                'is_featured_on_homepage' => false,
                'sort_order' => 20,
            ],

            // 10. PLATFORM & ADMINISTRATION
            [
                'question' => 'What does the Super Admin Command Center manage?',
                'answer' => 'The Super Admin manages cross-tenant platform health, school provisioning, SaaS subscription packages, module toggles, global CMS content (FAQs and Blog), and system security audit trails.',
                'category' => 'Platform & Admin',
                'status' => 'published',
                'is_featured_on_homepage' => false,
                'sort_order' => 21,
            ],

            // 11. PRICING & SUBSCRIPTIONS
            [
                'question' => 'What subscription plans are available for schools?',
                'answer' => 'EduFlow offers three tiers: Foundation Tier (KES 0 for 30-day evaluation, up to 300 students), Standard CBC Campus (KES 4,500/month per campus, up to 1,200 students with M-Pesa sync and SMS alerts), and Enterprise Multi-School (KES 9,500/month for school groups and multi-branch networks).',
                'category' => 'Pricing & Plans',
                'status' => 'published',
                'is_featured_on_homepage' => false,
                'sort_order' => 22,
            ],
        ];

        foreach ($faqs as $item) {
            Faq::updateOrCreate(
                ['question' => $item['question']],
                array_merge($item, ['slug' => Str::slug($item['question'])])
            );
        }
    }
}