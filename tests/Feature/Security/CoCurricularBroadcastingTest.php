<?php

namespace Tests\Feature\Security;

use App\Events\CoCurricularScoreUpdated;
use App\Models\Activity;
use App\Models\ActivityCategory;
use App\Models\ActivityFixture;
use App\Models\ActivityTeam;
use App\Models\CocurricularEvent;
use App\Models\School;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CoCurricularBroadcastingTest extends TestCase
{
    use RefreshDatabase;

    private School $schoolA;
    private School $schoolB;
    private User $coachA;
    private User $coachB;
    private ActivityFixture $fixtureA;

    protected function setUp(): void
    {
        parent::setUp();

        $this->schoolA = School::create([
            'name'   => 'Broadcasting Test School A',
            'slug'   => 'broadcasting-school-a-' . uniqid(),
            'status' => 'active',
        ]);

        $this->schoolB = School::create([
            'name'   => 'Broadcasting Test School B',
            'slug'   => 'broadcasting-school-b-' . uniqid(),
            'status' => 'active',
        ]);

        Permission::firstOrCreate(['name' => 'activities.results', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'activities.manage', 'guard_name' => 'web']);
        Permission::firstOrCreate(['name' => 'activities.view', 'guard_name' => 'web']);

        $coachRole = Role::firstOrCreate(['name' => 'teacher', 'guard_name' => 'web']);

        $this->coachA = User::factory()->create([
            'school_id' => $this->schoolA->id,
            'status'    => 'active',
        ]);
        $this->coachA->assignRole($coachRole);
        $this->coachA->givePermissionTo('activities.results');

        $this->coachB = User::factory()->create([
            'school_id' => $this->schoolB->id,
            'status'    => 'active',
        ]);
        $this->coachB->assignRole($coachRole);
        $this->coachB->givePermissionTo('activities.results');

        $catA = ActivityCategory::create(['school_id' => $this->schoolA->id, 'name' => 'Sports']);
        $actA = Activity::create(['school_id' => $this->schoolA->id, 'category_id' => $catA->id, 'name' => 'Soccer', 'type' => 'team_vs_team']);
        $evtA = CocurricularEvent::create(['school_id' => $this->schoolA->id, 'activity_id' => $actA->id, 'title' => 'Cup Match', 'start_date' => now()->toDateString()]);
        $teamA1 = ActivityTeam::create(['school_id' => $this->schoolA->id, 'activity_id' => $actA->id, 'name' => 'Lions']);
        $teamA2 = ActivityTeam::create(['school_id' => $this->schoolA->id, 'activity_id' => $actA->id, 'name' => 'Tigers']);

        $this->fixtureA = ActivityFixture::create([
            'school_id'    => $this->schoolA->id,
            'event_id'     => $evtA->id,
            'activity_id'  => $actA->id,
            'team_a_id'    => $teamA1->id,
            'team_b_id'    => $teamA2->id,
            'scheduled_at' => now(),
            'stage'        => 'Final',
        ]);
    }

    public function test_quick_score_dispatches_cocurricular_score_updated_event(): void
    {
        Event::fake([CoCurricularScoreUpdated::class]);

        $response = $this->actingAs($this->coachA)->postJson("/school/cocurricular/field-entry/fixtures/{$this->fixtureA->id}/quick-score", [
            'team_a_score' => 3,
            'team_b_score' => 1,
            'outcome'      => 'team_a_win',
        ]);

        $response->assertOk();

        Event::assertDispatched(CoCurricularScoreUpdated::class, function (CoCurricularScoreUpdated $event) {
            return $event->schoolId === $this->schoolA->id
                && $event->fixtureId === $this->fixtureA->id
                && $event->teamAScore === 3
                && $event->teamBScore === 1
                && $event->outcome === 'team_a_win';
        });
    }

    public function test_event_payload_contains_correct_broadcast_data(): void
    {
        $this->fixtureA->update([
            'team_a_score' => 4,
            'team_b_score' => 2,
            'outcome'      => 'team_a_win',
        ]);

        $event = new CoCurricularScoreUpdated($this->fixtureA->fresh());

        $channels = $event->broadcastOn();
        $this->assertCount(1, $channels);
        $this->assertEquals("private-cocurricular-school.{$this->schoolA->id}", $channels[0]->name);

        $payload = $event->broadcastWith();
        $this->assertEquals($this->schoolA->id, $payload['school_id']);
        $this->assertEquals($this->fixtureA->id, $payload['fixture_id']);
        $this->assertEquals(4, $payload['team_a_score']);
        $this->assertEquals(2, $payload['team_b_score']);
    }

    public function test_cross_tenant_quick_score_does_not_dispatch_event_for_foreign_school(): void
    {
        Event::fake([CoCurricularScoreUpdated::class]);

        $response = $this->actingAs($this->coachB)->postJson("/school/cocurricular/field-entry/fixtures/{$this->fixtureA->id}/quick-score", [
            'team_a_score' => 2,
            'team_b_score' => 2,
            'outcome'      => 'draw',
        ]);

        $this->assertTrue(
            in_array($response->status(), [403, 404], true),
            'Cross-tenant mutation must fail closed (403 Forbidden or 404 Not Found due to tenant scope).'
        );
        Event::assertNotDispatched(CoCurricularScoreUpdated::class);
    }
}