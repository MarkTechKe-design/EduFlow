<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            AdminSeeder::class,
            RolePermissionSeeder::class,
            PackageSeeder::class,
            WebsitePageSeeder::class,
            WebsiteLegalSeeder::class,
            WebsiteAboutSeeder::class,
            WebsiteSeeder::class,
            FaqSeeder::class,
            DemoUserSeeder::class,
            SchoolSetupSeeder::class,
            StudentSeeder::class,
            StaffSeeder::class,
            AttendanceSeeder::class,
            TimetableSeeder::class,
            ExamSeeder::class,
            FeeSeeder::class,
            HRSeeder::class,
            LibrarySeeder::class,
            InventorySeeder::class,
            TransportSeeder::class,
            HostelSeeder::class,
            HomeworkSeeder::class,
            CommunicationSeeder::class,
            BlogPostSeeder::class,
        ]);

        // Auto-verify all seeded users to bypass email verification prompts
        User::withoutGlobalScopes()
            ->whereNull('email_verified_at')
            ->update(['email_verified_at' => now()]);
    }
}