<?php

namespace App\Services;

use App\Models\SchoolSubscription;
use App\Models\SubscriptionAuditLog;
use App\Models\User;
use Illuminate\Database\DatabaseManager;
use Illuminate\Validation\ValidationException;

class SubscriptionLifecycleService
{
    public const STATUSES = ['pending', 'trial', 'active', 'grace_period', 'expired', 'suspended', 'cancelled', 'archived'];

    private const TRANSITIONS = [
        'pending' => ['trial', 'active', 'cancelled'], 'trial' => ['active', 'grace_period', 'expired', 'cancelled'],
        'active' => ['grace_period', 'suspended', 'cancelled', 'archived'], 'grace_period' => ['active', 'expired', 'suspended', 'cancelled'],
        'expired' => ['active', 'suspended', 'archived'], 'suspended' => ['active', 'cancelled', 'archived'],
        'cancelled' => ['active', 'archived'], 'archived' => [],
    ];

    public function __construct(private readonly DatabaseManager $database) {}

    public function transition(SchoolSubscription $subscription, string $to, ?User $actor = null, array $metadata = []): SchoolSubscription
    {
        if (! in_array($to, self::STATUSES, true)) throw ValidationException::withMessages(['status' => 'Unsupported subscription status.']);
        return $this->database->transaction(function () use ($subscription, $to, $actor, $metadata): SchoolSubscription {
            // Webhooks may run without an authenticated user. Keep the explicit
            // tenant predicate here so lifecycle transitions remain tenant-safe.
            $locked = SchoolSubscription::withoutGlobalScopes()
                ->whereKey($subscription->id)
                ->where('school_id', $subscription->school_id)
                ->lockForUpdate()
                ->firstOrFail();
            $from = $locked->lifecycle_status ?: $locked->status;
            if ($from !== $to && ! in_array($to, self::TRANSITIONS[$from] ?? [], true)) {
                throw ValidationException::withMessages(['status' => "Cannot transition a subscription from {$from} to {$to}."]);
            }
            $legacyStatus = ['pending' => 'trial', 'trial' => 'trial', 'active' => 'active', 'grace_period' => 'active', 'expired' => 'expired', 'suspended' => 'suspended', 'cancelled' => 'expired', 'archived' => 'expired'][$to];
            $locked->forceFill(['lifecycle_status' => $to, 'status' => $legacyStatus, 'cancelled_at' => $to === 'cancelled' ? now() : $locked->cancelled_at, 'archived_at' => $to === 'archived' ? now() : $locked->archived_at])->save();
            SubscriptionAuditLog::create(['school_subscription_id' => $locked->id, 'school_id' => $locked->school_id, 'actor_id' => $actor?->id, 'from_status' => $from, 'to_status' => $to, 'metadata' => $metadata]);
            return $locked->fresh(['package']);
        });
    }

    public function expireTrials(): int
    {
        $count = 0;
        SchoolSubscription::query()->whereIn('lifecycle_status', ['trial', ''])->whereDate('trial_ends_at', '<', now())->each(function (SchoolSubscription $subscription) use (&$count): void {
            $this->transition($subscription, 'expired', null, ['reason' => 'trial_expired']); $count++;
        });
        return $count;
    }
}
