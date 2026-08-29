<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            MultiSchoolTenantSeeder::class,
            AcademicAndStudentRelationalSeeder::class,
            FinancialAndHRSeeder::class,
            AssessmentCoCurricularAndLogisticsSeeder::class,
        ]);
    }
}