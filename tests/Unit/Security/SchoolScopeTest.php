<?php

namespace Tests\Unit\Security;

use App\Models\Announcement;
use App\Models\Holiday;
use App\Models\School;
use App\Models\SchoolClass;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Tests\Support\SecurityTestCase;

class SchoolScopeTest extends SecurityTestCase
{
    public function test_school_a_user_only_retrieves_school_a_records(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $user = $this->createSecurityUser($schoolA);
        $holidayA = $this->createHoliday($schoolA, 'School A Holiday');
        $this->createHoliday($schoolB, 'School B Holiday');

        $this->actingAs($user);

        $this->assertAuthenticatedAs($user);
        $this->assertSame([$holidayA->id], Holiday::query()->pluck('id')->all());
    }

    public function test_school_b_user_only_retrieves_school_b_records(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $user = $this->createSecurityUser($schoolB);
        $this->createHoliday($schoolA, 'School A Holiday');
        $holidayB = $this->createHoliday($schoolB, 'School B Holiday');

        $this->actingAs($user);

        $this->assertAuthenticatedAs($user);
        $this->assertSame([$holidayB->id], Holiday::query()->pluck('id')->all());
    }

    public function test_cross_school_lookup_by_id_returns_no_record(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $user = $this->createSecurityUser($schoolA);
        $holidayB = $this->createHoliday($schoolB, 'School B Holiday');

        $this->actingAs($user);

        $this->assertAuthenticatedAs($user);
        $this->assertNull(Holiday::query()->find($holidayB->id));
    }

    public function test_cross_school_update_does_not_change_the_other_school_record(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $user = $this->createSecurityUser($schoolA);
        $holidayB = $this->createHoliday($schoolB, 'Original School B Holiday');

        $this->actingAs($user);

        $this->assertAuthenticatedAs($user);
        $updated = Holiday::query()->whereKey($holidayB->id)->update(['name' => 'Changed by School A']);

        $this->assertSame(0, $updated);
        $this->assertDatabaseHas('holidays', [
            'id' => $holidayB->id,
            'name' => 'Original School B Holiday',
        ]);
    }

    public function test_cross_school_delete_does_not_remove_the_other_school_record(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $user = $this->createSecurityUser($schoolA);
        $holidayB = $this->createHoliday($schoolB, 'School B Holiday');

        $this->actingAs($user);

        $this->assertAuthenticatedAs($user);
        $deleted = Holiday::query()->whereKey($holidayB->id)->delete();

        $this->assertSame(0, $deleted);
        $this->assertDatabaseHas('holidays', ['id' => $holidayB->id]);
    }

    public function test_soft_deleted_cross_school_records_cannot_be_restored(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $user = $this->createSecurityUser($schoolA);
        $classB = $this->createSchoolClass($schoolB, 'School B Class');
        $classB->delete();

        $this->actingAs($user);

        $this->assertAuthenticatedAs($user);
        $restored = SchoolClass::query()->whereKey($classB->id)->restore();

        $this->assertSame(0, $restored);
        $this->assertSoftDeleted('classes', ['id' => $classB->id]);
    }

    public function test_new_records_receive_the_authenticated_users_school_id(): void
    {
        $school = $this->createSecuritySchool();
        $user = $this->createSecurityUser($school);

        $this->actingAs($user);

        $this->assertAuthenticatedAs($user);
        $holiday = Holiday::query()->create([
            'name' => 'Automatically Owned Holiday',
            'date' => '2026-12-25',
        ]);

        $this->assertSame($school->id, $holiday->school_id);
        $this->assertDatabaseHas('holidays', [
            'id' => $holiday->id,
            'school_id' => $school->id,
        ]);
    }

    public function test_submitted_school_id_cannot_override_authenticated_ownership(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $user = $this->createSecurityUser($schoolA);

        $this->actingAs($user);

        $this->assertAuthenticatedAs($user);
        $holiday = Holiday::query()->create([
            'school_id' => $schoolB->id,
            'name' => 'Submitted Foreign Ownership',
            'date' => '2026-12-25',
        ]);

        $this->assertSame($schoolA->id, $holiday->school_id);
        $this->assertDatabaseHas('holidays', [
            'id' => $holiday->id,
            'school_id' => $schoolA->id,
        ]);
    }

    public function test_school_id_cannot_be_changed_after_creation(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $user = $this->createSecurityUser($schoolA);
        $holiday = $this->createHoliday($schoolA, 'Immutable Ownership Holiday');

        $this->actingAs($user);

        $this->assertAuthenticatedAs($user);
        $holiday->update(['school_id' => $schoolB->id]);

        $this->assertDatabaseHas('holidays', [
            'id' => $holiday->id,
            'school_id' => $schoolA->id,
        ]);
    }

    public function test_missing_tenant_context_fails_closed(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $this->createHoliday($schoolA, 'School A Holiday');
        $this->createHoliday($schoolB, 'School B Holiday');

        $this->assertGuest();
        $this->assertCount(0, Holiday::query()->get());
    }

    public function test_unauthenticated_users_cannot_retrieve_tenant_scoped_records(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $this->createHoliday($schoolA, 'School A Holiday');
        $this->createHoliday($schoolB, 'School B Holiday');

        $this->assertGuest();
        $this->assertEmpty(Holiday::query()->pluck('id')->all());
    }

    public function test_relationships_do_not_reintroduce_another_schools_records(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $userA = $this->createSecurityUser($schoolA, ['email' => 'school-a@example.test']);
        $userB = $this->createSecurityUser($schoolB, ['email' => 'school-b@example.test']);
        $announcement = $this->createAnnouncement($schoolA, $userB, 'School A Announcement');

        $this->actingAs($userA);

        $this->assertAuthenticatedAs($userA);
        $loaded = Announcement::query()->with('author')->findOrFail($announcement->id);

        $this->assertNull($loaded->author);
    }

    public function test_pagination_remains_tenant_scoped(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $user = $this->createSecurityUser($schoolA);
        $this->createHoliday($schoolA, 'School A Holiday One');
        $this->createHoliday($schoolA, 'School A Holiday Two');
        $this->createHoliday($schoolB, 'School B Holiday');

        $this->actingAs($user);

        $this->assertAuthenticatedAs($user);
        $page = Holiday::query()->orderBy('id')->paginate(1);

        $this->assertSame(2, $page->total());
        $this->assertCount(1, $page->items());
        $this->assertSame($schoolA->id, $page->items()[0]->school_id);
    }

    public function test_counts_remain_tenant_scoped(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $user = $this->createSecurityUser($schoolA);
        $this->createHoliday($schoolA, 'School A Holiday One');
        $this->createHoliday($schoolA, 'School A Holiday Two');
        $this->createHoliday($schoolB, 'School B Holiday');

        $this->actingAs($user);

        $this->assertAuthenticatedAs($user);
        $this->assertSame(2, Holiday::query()->count());
    }

    public function test_aggregate_queries_remain_tenant_scoped(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $user = $this->createSecurityUser($schoolA);
        $this->createSchoolClass($schoolA, 'School A Class One', 10);
        $this->createSchoolClass($schoolA, 'School A Class Two', 20);
        $this->createSchoolClass($schoolB, 'School B Class', 999);

        $this->actingAs($user);

        $this->assertAuthenticatedAs($user);
        $this->assertSame(30, SchoolClass::query()->sum('capacity'));
    }

    public function test_search_remains_tenant_scoped(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $user = $this->createSecurityUser($schoolA);
        $this->createHoliday($schoolA, 'School A Holiday');
        $this->createHoliday($schoolB, 'School B Holiday');

        $this->actingAs($user);

        $this->assertAuthenticatedAs($user);
        $results = Holiday::query()->where('name', 'like', '%School B%')->get();

        $this->assertCount(0, $results);
    }

    public function test_sorting_remains_tenant_scoped(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $user = $this->createSecurityUser($schoolA);
        $this->createHoliday($schoolA, 'Zulu Holiday');
        $this->createHoliday($schoolA, 'Alpha Holiday');
        $this->createHoliday($schoolB, 'Aardvark Holiday');

        $this->actingAs($user);

        $this->assertAuthenticatedAs($user);
        $names = Holiday::query()->orderBy('name')->pluck('name')->all();

        $this->assertSame(['Alpha Holiday', 'Zulu Holiday'], $names);
    }

    public function test_export_queries_remain_tenant_scoped(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $user = $this->createSecurityUser($schoolA);
        $this->createHoliday($schoolA, 'School A Holiday');
        $this->createHoliday($schoolB, 'School B Holiday');

        $this->actingAs($user);

        $this->assertAuthenticatedAs($user);
        $exportRows = Holiday::query()->get()->map(fn (Holiday $holiday) => [
            'id' => $holiday->id,
            'school_id' => $holiday->school_id,
        ]);

        $this->assertCount(1, $exportRows);
        $this->assertSame($schoolA->id, $exportRows->first()['school_id']);
    }

    public function test_without_global_scopes_explicitly_bypasses_tenant_scope(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $user = $this->createSecurityUser($schoolA);
        $this->createHoliday($schoolA, 'School A Holiday');
        $this->createHoliday($schoolB, 'School B Holiday');

        $this->actingAs($user);

        $this->assertAuthenticatedAs($user);
        $this->assertCount(1, Holiday::query()->get());
        $this->assertCount(2, Holiday::withoutGlobalScopes()->get());
    }

    public function test_platform_super_admin_has_global_tenant_visibility(): void
    {
        [$schoolA, $schoolB] = $this->createTwoSchools();
        $superAdmin = $this->createSecurityUser(null, ['email' => 'super-admin@example.test']);
        $this->createHoliday($schoolA, 'School A Holiday');
        $this->createHoliday($schoolB, 'School B Holiday');
        $superAdmin->assignRole(Role::firstOrCreate([
            'name' => 'super-admin',
            'guard_name' => 'web',
        ]));

        $this->actingAs($superAdmin);

        $this->assertAuthenticatedAs($superAdmin);
        $this->assertCount(2, Holiday::query()->get());
        $this->assertCount(2, Holiday::withoutGlobalScopes()->get());
    }

    /** @return array{0: School, 1: School} */
    private function createTwoSchools(): array
    {
        return [
            $this->createSecuritySchool(['name' => 'School A']),
            $this->createSecuritySchool(['name' => 'School B']),
        ];
    }

    private function createHoliday(School $school, string $name): Holiday
    {
        return Holiday::query()->create([
            'school_id' => $school->id,
            'name' => $name,
            'date' => '2026-12-25',
        ]);
    }

    private function createSchoolClass(School $school, string $name, int $capacity = 30): SchoolClass
    {
        return SchoolClass::query()->create([
            'school_id' => $school->id,
            'name' => $name,
            'capacity' => $capacity,
        ]);
    }

    private function createAnnouncement(School $school, User $author, string $title): Announcement
    {
        return Announcement::query()->create([
            'school_id' => $school->id,
            'author_id' => $author->id,
            'title' => $title,
            'body' => 'Security scope test announcement.',
            'audience' => 'all',
        ]);
    }
}
