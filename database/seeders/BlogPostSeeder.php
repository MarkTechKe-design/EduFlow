<?php

namespace Database\Seeders;

use App\Models\BlogPost;
use Illuminate\Database\Seeder;

class BlogPostSeeder extends Seeder
{
    public function run(): void
    {
        $posts = [
            [
                'title'             => 'Mastering CBC Rubric Grading: A Practical Guide for Junior School Teachers',
                'slug'              => 'mastering-cbc-rubric-grading-junior-school',
                'excerpt'           => 'How to streamline formative strand evaluations, manage 4-tier performance rubrics, and generate Ministry of Education compliant termly broadsheets without administrative burnout.',
                'body'              => 'The rollout of Junior Secondary School under Kenya competency-based curriculum has shifted academic assessment from purely summative percentage scores to multi-dimensional strand rubrics. For teachers managing large classrooms, mastering this framework requires structured workflows and consistent evidence gathering.' . PHP_EOL . PHP_EOL .
                                      '1. Understanding the 4-Tier Performance Framework' . PHP_EOL .
                                      'Teachers evaluate learners across four core performance bands: Exceeding Expectation, Meeting Expectation, Approaching Expectation, and Below Expectation. Rather than relying on a single end-of-term exam, formative assessment tracks learner growth across specific learning strands throughout the academic term.' . PHP_EOL . PHP_EOL .
                                      '2. Capturing Observable Evidence' . PHP_EOL .
                                      'Effective rubric grading depends on documenting observable learner competencies during practical activities, group projects, and class assignments. Teachers should maintain concise observation notes that link directly to specific curriculum outcomes.' . PHP_EOL . PHP_EOL .
                                      '3. Compiling Termly Broadsheets' . PHP_EOL .
                                      'Converting continuous formative evaluations into official termly reports can be time-consuming when managed manually. Digital tools help streamline strand tracking, allowing educators to compile broadsheets and generate progress reports efficiently while saving valuable instructional hours.' . PHP_EOL . PHP_EOL .
                                      '4. Best Practices for Junior School Educators' . PHP_EOL .
                                      'Maintain transparent evaluation criteria so learners understand what is expected in each competency band. Keep assessment records regularly updated rather than attempting to compile observations at the very end of the term. This ensures higher accuracy and fairer evaluations for every student.',
                'category'          => 'CBC Academics',
                'author_name'       => 'Mark Ochieng Oduor',
                'status'            => 'published',
                'is_featured'       => true,
                'read_time_minutes' => 5,
                'published_at'      => now()->subDays(2),
            ],
            [
                'title'             => 'Eliminating Fee Reconciliation Headaches with Automated M-Pesa STK Push',
                'slug'              => 'eliminating-fee-reconciliation-mpesa-stk-push',
                'excerpt'           => 'Why modern Kenyan schools are replacing paper bank slips and manual cash ledgers with instant Daraja API Paybill integration and automated student account crediting.',
                'body'              => 'Manual school fee reconciliation remains one of the most tedious and error-prone administrative workflows in Kenyan educational institutions. When parents deposit tuition and incidental fees into school bank accounts without clear student admission numbers or names, bursars spend days tracing unallocated funds.' . PHP_EOL . PHP_EOL .
                                      '1. The Challenges of Traditional Fee Collection' . PHP_EOL .
                                      'Relying on manual bank deposits, physical cash, and paper receipts creates significant reconciliation friction. Bursars must cross-reference bank statements with physical ledgers, often leading to delayed receipting and frustrated parents standing in queues.' . PHP_EOL . PHP_EOL .
                                      '2. Direct Daraja API Paybill Integration' . PHP_EOL .
                                      'Integrating M-Pesa Paybill or Till numbers directly with school management systems transforms fee collection. When a parent initiates payment, automated STK push prompts can pre-populate student admission numbers, ensuring funds are instantly routed and posted to the correct ledger.' . PHP_EOL . PHP_EOL .
                                      '3. Real-Time Balance Updates and Digital Receipts' . PHP_EOL .
                                      'Automated payment processing immediately updates student fee balances and generates digital receipts sent directly via SMS or email. This eliminates clerical errors and provides absolute transparency for both school administrators and parents.' . PHP_EOL . PHP_EOL .
                                      '4. Best Practices for School Bursars' . PHP_EOL .
                                      'Encourage parents to use designated school payment channels equipped with instant validation. Regularly review unallocated suspense accounts to resolve mismatched transactions before the end of each term.',
                'category'          => 'Finance & Payments',
                'author_name'       => 'EduFlow Finance Desk',
                'status'            => 'published',
                'is_featured'       => false,
                'read_time_minutes' => 4,
                'published_at'      => now()->subDays(5),
            ],
            [
                'title'             => 'Kenya Data Protection Act (2019): What Every School Administrator Must Know',
                'slug'              => 'kenya-data-protection-act-2019-school-compliance',
                'excerpt'           => 'Key legal safeguards regarding student PII, NEMIS unique personal identifiers, admission records, and institutional data processor obligations under Kenyan law.',
                'body'              => 'Educational institutions in Kenya handle vast amounts of sensitive personal data every day, including student academic records, medical profiles, guardian contacts, and biometric information. Under the Data Protection Act No. 24 of 2019, schools have a legal obligation to handle this information with strict confidentiality and security.' . PHP_EOL . PHP_EOL .
                                      '1. Understanding Personally Identifiable Information in Schools' . PHP_EOL .
                                      'School records contain sensitive identifiers such as birth certificate numbers, NEMIS unique personal identifiers, and home addresses. Protecting these records from unauthorized access is both a legal requirement and a moral duty for school leadership.' . PHP_EOL . PHP_EOL .
                                      '2. Implementing Role-Based Access Controls' . PHP_EOL .
                                      'Not every staff member requires access to every institutional record. Implementing principle-of-least-privilege access ensures that teachers, accountants, and administrative staff only view information necessary for their specific operational duties.' . PHP_EOL . PHP_EOL .
                                      '3. Secure Cloud Infrastructure and Multi-Tenant Isolation' . PHP_EOL .
                                      'Modern school management platforms must guarantee tenant-level data isolation, ensuring that institutional archives remain completely private and secure against unauthorized cross-school data exposure.' . PHP_EOL . PHP_EOL .
                                      '4. Practical Steps for Compliance' . PHP_EOL .
                                      'Review institutional data collection policies to ensure parents and guardians are informed about how their children data is utilized. Maintain audit logs of system access to monitor administrative activity and protect against data breaches.',
                'category'          => 'Governance',
                'author_name'       => 'Compliance Engineering',
                'status'            => 'published',
                'is_featured'       => false,
                'read_time_minutes' => 6,
                'published_at'      => now()->subDays(10),
            ],
            [
                'title'             => 'Parent Engagement in the Digital Age: How SMS Gateways Improve Fee Recovery',
                'slug'              => 'parent-engagement-sms-gateways-fee-recovery',
                'excerpt'           => 'Analyzing how targeted, automated SMS notifications for attendance, academic performance, and fee balances improve institutional communication and financial health.',
                'body'              => 'Strong communication between educational institutions and parents is essential for student success and timely fee collections. Traditional paper circulars often get lost in school bags or reach guardians too late, leading to communication gaps and delayed tuition payments.' . PHP_EOL . PHP_EOL .
                                      '1. The Role of Proactive Communication' . PHP_EOL .
                                      'Parents appreciate being kept informed about their children academic progress, attendance records, and upcoming school events. Timely updates build trust and foster a collaborative relationship between home and school.' . PHP_EOL . PHP_EOL .
                                      '2. Automated SMS Alerts for Fee Balances' . PHP_EOL .
                                      'Sending polite, automated SMS reminders regarding fee balances and payment deadlines helps parents plan their finances ahead of time. This proactive approach significantly reduces end-of-term financial panic and tuition arrears.' . PHP_EOL . PHP_EOL .
                                      '3. Balancing Frequency and Tone' . PHP_EOL .
                                      'Effective messaging should be respectful, concise, and informative. Avoid bombarding guardians with excessive alerts; instead, focus on scheduled attendance updates, performance summaries, and verified payment acknowledgments.' . PHP_EOL . PHP_EOL .
                                      '4. Enhancing Overall School Administration' . PHP_EOL .
                                      'Integrating SMS gateways directly with school administration platforms ensures that messages are dispatched instantly and accurately, keeping parents engaged throughout the entire academic term.',
                'category'          => 'School Operations',
                'author_name'       => 'EduFlow Operations',
                'status'            => 'published',
                'is_featured'       => false,
                'read_time_minutes' => 3,
                'published_at'      => now()->subDays(14),
            ],
        ];

        // Clean replacement: truncate existing posts and insert exact 4 core articles
        BlogPost::truncate();

        foreach ($posts as $data) {
            BlogPost::create($data);
        }
    }
}