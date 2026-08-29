<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            RolePermissionSeeder::class,
            PackageSeeder::class,
            MultiSchoolTenantSeeder::class,
            AcademicAndStudentRelationalSeeder::class,
            FinancialAndHRSeeder::class,
            AssessmentCoCurricularAndLogisticsSeeder::class,
            WebsiteSeeder::class,
            WebsitePageSeeder::class,
            WebsiteAboutSeeder::class,
            WebsiteLegalSeeder::class,
            BlogPostSeeder::class,
            FaqSeeder::class,
        ]);
    }
}