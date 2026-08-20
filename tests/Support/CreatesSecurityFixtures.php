<?php

namespace Tests\Support;

use App\Models\School;
use App\Models\User;

trait CreatesSecurityFixtures
{
    protected function createSecuritySchool(array $attributes = []): School
    {
        return School::query()->create(array_merge([
            'name' => 'Security Test School',
            'slug' => 'security-test-school-' . uniqid(),
            'country' => 'KE',
            'timezone' => 'Africa/Nairobi',
            'currency' => 'KES',
            'language' => 'en',
            'status' => 'active',
        ], $attributes));
    }

    protected function createSecurityUser(?School $school = null, array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'school_id' => $school?->id,
            'status' => 'active',
        ], $attributes));
    }
}
