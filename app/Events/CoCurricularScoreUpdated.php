<?php

namespace App\Events;

use App\Models\ActivityFixture;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CoCurricularScoreUpdated implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $schoolId;
    public int $fixtureId;
    public ?int $teamAScore;
    public ?int $teamBScore;
    public string $outcome;
    public ?int $winnerTeamId;
    public string $updatedAt;

    /**
     * Create a new event instance.
     */
    public function __construct(ActivityFixture $fixture)
    {
        $this->schoolId     = (int) $fixture->school_id;
        $this->fixtureId    = (int) $fixture->id;
        $this->teamAScore   = $fixture->team_a_score;
        $this->teamBScore   = $fixture->team_b_score;
        $this->outcome      = (string) $fixture->outcome;
        $this->winnerTeamId = $fixture->winner_team_id;
        $this->updatedAt    = now()->toIso8601String();
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("cocurricular-school.{$this->schoolId}"),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'ScoreUpdated';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'school_id'      => $this->schoolId,
            'fixture_id'     => $this->fixtureId,
            'team_a_score'   => $this->teamAScore,
            'team_b_score'   => $this->teamBScore,
            'outcome'        => $this->outcome,
            'winner_team_id' => $this->winnerTeamId,
            'updated_at'     => $this->updatedAt,
        ];
    }
}