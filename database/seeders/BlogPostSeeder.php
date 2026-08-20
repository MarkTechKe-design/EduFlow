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
                'excerpt'           => 'How to streamline formative strand evaluations, manage 4-tier performance rubrics, and generate Ministry of Education compliant termly broadsheets.',
                'body'              => '<p>The rollout of Junior Secondary School (JSS) under Kenya’s Competency-Based Curriculum has shifted academic assessment from purely summative percentages to multi-dimensional strand rubrics.</p><h3>1. The 4-Tier Rubric Framework</h3><p>Teachers evaluate learners across four core performance bands: <strong>Exceeding Expectation (EE)</strong>, <strong>Meeting Expectation (ME)</strong>, <strong>Approaching Expectation (AE)</strong>, and <strong>Below Expectation (BE)</strong>.</p><h3>2. Automating Report Compilation</h3><p>EduFlow automates continuous evaluation strand tracking, saving teachers over 15 hours per class during end-of-term reporting.</p>',
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
                'excerpt'           => 'Why modern Kenyan schools are replacing paper bank slips and manual cash ledgers with instant Daraja API Paybill integration.',
                'body'              => '<p>Manual fee reconciliation is one of the most error-prone workflows in school administration. When parents deposit tuition into school bank accounts without clear student admission numbers, bursars spend days tracing unallocated funds.</p><h3>Direct Paybill & Till Integration</h3><p>EduFlow connects directly to Safaricom Daraja API endpoints, validating student admission numbers in real time and generating instant digital receipts for parents.</p>',
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
                'excerpt'           => 'Key legal safeguards regarding student PII, NEMIS Unique Personal Identifiers, and institutional data processor obligations.',
                'body'              => '<p>Under the Kenya Data Protection Act No. 24 of 2019, educational institutions must ensure that student biometric data, academic records, and guardian contact details are stored securely with strict role-based access controls.</p><h3>Multi-Tenant Cloud Isolation</h3><p>EduFlow guarantees tenant-level database isolation, ensuring institutional archives remain completely private to each school.</p>',
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
                'excerpt'           => 'Analyzing how targeted SMS notifications reduce tuition arrears by up to 35% across primary and secondary schools.',
                'body'              => '<p>Clear communication between schools and parents is essential for timely fee collections. Automated SMS alerts for attendance, fee balances, and academic events keep guardians informed throughout the term.</p>',
                'category'          => 'School Operations',
                'author_name'       => 'EduFlow Operations',
                'status'            => 'published',
                'is_featured'       => false,
                'read_time_minutes' => 3,
                'published_at'      => now()->subDays(14),
            ],
        ];

        foreach ($posts as $data) {
            BlogPost::updateOrCreate(['slug' => $data['slug']], $data);
        }
    }
}