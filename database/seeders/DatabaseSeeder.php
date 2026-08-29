<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

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
    }
        // Auto-verify all seeded users to bypass email verification
        \App\Models\User::withoutGlobalScopes()
            ->whereNull('email_verified_at')
            ->update(['email_verified_at' => now()]);
        \App\Models\User::withoutGlobalScopes()->whereNull('email_verified_at')->update(['email_verified_at' => now()]);
    }
