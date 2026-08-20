<?php

namespace Database\Seeders;

use App\Models\Package;
use App\Models\PackageModule;
use Illuminate\Database\Seeder;

class PackageSeeder extends Seeder
{
    public function run(): void
    {
        $packages = [
            [
                'name'           => 'Starter Academy',
                'badge'          => 'AVAILABLE PLAN',
                'slug'           => 'starter-academy',
                'description'    => 'Essential CBC grading, student records, and basic attendance for growing primary and pre-primary schools.',
                'price_monthly'  => 4500.00,
                'price_yearly'   => 45000.00,
                'trial_days'     => 14,
                'max_students'   => 300,
                'max_staff'      => 25,
                'storage_gb'     => 10,
                'sort_order'     => 1,
                'is_active'      => true,
                'is_popular'     => false,
                'is_public'      => true,
                'features'       => [
                    'Up to 300 Enrolled Students',
                    'CBC Formative & Summative Rubric Grading',
                    'Official Ministry Report Card Exports',
                    'Parent Contact SMS Broadcasts',
                    'Daily Student & Staff Attendance Roll Call',
                    'Standard Email & Ticket Support',
                ],
                'modules'        => ['academics', 'attendance', 'communication'],
            ],
            [
                'name'           => 'Standard CBC School',
                'badge'          => 'POPULAR CHOICE',
                'slug'           => 'standard-cbc-school',
                'description'    => 'Complete operations engine with automated M-Pesa fee reconciliation, hostels, and staff payroll.',
                'price_monthly'  => 8500.00,
                'price_yearly'   => 85000.00,
                'trial_days'     => 14,
                'max_students'   => 1000,
                'max_staff'      => 80,
                'storage_gb'     => 50,
                'sort_order'     => 2,
                'is_active'      => true,
                'is_popular'     => true,
                'is_public'      => true,
                'features'       => [
                    'Up to 1,000 Enrolled Students',
                    'Automated M-Pesa Daraja Paybill / Till Reconciliation',
                    'Full CBC Junior School (Grade 7-9) Assessment Suite',
                    'Library Catalog & Barcode Book Circulation',
                    'Hostel & Boarding Room Allocations',
                    'Fleet Transport Routes & Vehicle Manifests',
                    'Staff HR & Automated Payslip Generation',
                    'Dedicated Account Manager Support',
                ],
                'modules'        => ['academics', 'attendance', 'finance', 'library', 'hostel', 'transport', 'communication'],
            ],
            [
                'name'           => 'Enterprise Multi-Campus',
                'badge'          => 'INSTITUTIONAL PLAN',
                'slug'           => 'enterprise-multi-campus',
                'description'    => 'Advanced governance, custom domain branding, high-volume capacity, and multi-branch synchronization.',
                'price_monthly'  => 18000.00,
                'price_yearly'   => 180000.00,
                'trial_days'     => 14,
                'max_students'   => 5000,
                'max_staff'      => 300,
                'storage_gb'     => 200,
                'sort_order'     => 3,
                'is_active'      => true,
                'is_popular'     => false,
                'is_public'      => true,
                'features'       => [
                    'Unlimited Enrolled Students & Multiple Branches',
                    'Custom Domain & Dedicated Platform Subdomain',
                    'Custom SMS Sender ID (Alphanumeric)',
                    'Direct Bank API & Multi-Paybill Split Settlement',
                    'Encrypted Virtual Classrooms (Jitsi Integration)',
                    'Priority 24/7 Phone & On-Site Engineering Support',
                    'Full Kenya DPA 2019 Audit Vault & Log Archival',
                ],
                'modules'        => ['academics', 'attendance', 'finance', 'library', 'hostel', 'transport', 'communication', 'virtual_class', 'multi_campus'],
            ],
        ];

        foreach ($packages as $pkgData) {
            $modules = $pkgData['modules'] ?? [];
            unset($pkgData['modules']);

            $pkg = Package::updateOrCreate(['slug' => $pkgData['slug']], $pkgData);

            PackageModule::where('package_id', $pkg->id)->delete();
            foreach ($modules as $moduleSlug) {
                PackageModule::create([
                    'package_id'  => $pkg->id,
                    'module_slug' => $moduleSlug,
                ]);
            }
        }
    }
}