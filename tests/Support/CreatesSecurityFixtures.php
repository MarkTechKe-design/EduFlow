<?php

namespace Tests\Support;

use App\Models\School;
use App\Models\SchoolSubscription;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

trait CreatesSecurityFixtures
{
    protected function createSecuritySchool(array $attributes = []): School
    {
        $withSubscription = $attributes['with_subscription'] ?? true;
        unset($attributes['with_subscription']);

        $school = School::query()->create(array_merge([
            'name' => 'Security Test School',
            'slug' => 'security-test-school-' . uniqid(),
            'country' => 'KE',
            'timezone' => 'Africa/Nairobi',
            'currency' => 'KES',
            'language' => 'en',
            'status' => 'active',
            'verification_status' => 'verified',
        ], $attributes));

        if ($withSubscription) {
            $this->createSecuritySubscription($school);
        }

        return $school;
    }

    protected function createSecuritySubscription(School $school, array $attributes = []): SchoolSubscription
    {
        $packageId = $attributes['package_id'] ?? null;

        if (! $packageId && Schema::hasTable('packages')) {
            $package = DB::table('packages')->first();
            if (! $package) {
                $pkgData = [
                    'name' => 'Standard Security Test Plan',
                    'slug' => 'security-test-plan-' . uniqid(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                if (Schema::hasColumn('packages', 'is_active')) $pkgData['is_active'] = 1;
                if (Schema::hasColumn('packages', 'is_public')) $pkgData['is_public'] = 1;
                if (Schema::hasColumn('packages', 'price_monthly')) $pkgData['price_monthly'] = 0;
                if (Schema::hasColumn('packages', 'price_yearly')) $pkgData['price_yearly'] = 0;
                if (Schema::hasColumn('packages', 'max_students')) $pkgData['max_students'] = 500;
                if (Schema::hasColumn('packages', 'max_staff')) $pkgData['max_staff'] = 50;
                if (Schema::hasColumn('packages', 'trial_days')) $pkgData['trial_days'] = 14;

                $packageId = DB::table('packages')->insertGetId($pkgData);
            } else {
                $packageId = $package->id;
            }
        }

        $subData = array_merge([
            'school_id' => $school->id,
            'package_id' => $packageId,
            'lifecycle_status' => 'active',
            'status' => 'active',
            'billing_cycle' => 'yearly',
            'start_date' => now()->subDay(),
            'end_date' => now()->addYear(),
        ], $attributes);

        return SchoolSubscription::withoutGlobalScopes()->create($subData);
    }

    protected function createSecurityUser(?School $school = null, array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'school_id' => $school?->id,
            'status' => 'active',
        ], $attributes));
    }
}