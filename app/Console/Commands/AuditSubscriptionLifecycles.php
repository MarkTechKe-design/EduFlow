<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\SchoolSubscription;
use App\Models\School;
use App\Models\User;
use App\Mail\SubscriptionReminderMail;
use App\Mail\SubscriptionExpiredMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AuditSubscriptionLifecycles extends Command
{
    protected $signature = 'eduflow:audit-subscriptions';
    protected $description = 'Audit active school subscriptions, send proactive Canva-style renewal reminders (T-7/T-3/T-1), and enforce grace periods.';

    public function handle(): int
    {
        $this->info("Starting EduFlow Subscription Lifecycle Audit at " . now()->toDateTimeString());

        $now = Carbon::now();

        // 1. Proactive Renewal Warnings (7 Days, 3 Days, 1 Day before expiry)
        $reminderMilestones = [7, 3, 1];

        foreach ($reminderMilestones as $days) {
            $targetDate = $now->copy()->addDays($days)->toDateString();

            $expiringSubs = SchoolSubscription::query()
                ->where('lifecycle_status', 'active')
                ->whereDate('end_date', $targetDate)
                ->with(['school', 'package'])
                ->get();

            $this->info("Found {$expiringSubs->count()} subscriptions expiring in {$days} days ({$targetDate}).");

            foreach ($expiringSubs as $sub) {
                if (!$sub->school) continue;

                $adminEmail = $sub->school->email ?? User::where('school_id', $sub->school_id)->first()?->email;
                $adminUser = User::where('school_id', $sub->school_id)->first();

                if ($adminEmail) {
                    try {
                        Mail::to($adminEmail)->send(new SubscriptionReminderMail($sub->school, $sub, $days, $sub->package, $adminUser));
                        $this->line(" -> Dispatched {$days}-day reminder to {$adminEmail} for {$sub->school->name}");
                    } catch (\Throwable $e) {
                        $this->error(" -> Failed to send reminder: " . $e->getMessage());
                    }
                }
            }
        }

        // 2. Identify Expired Subscriptions (Past end_date and past 3-day grace period)
        $expiredThreshold = $now->copy()->subDays(3);

        $overdueSubs = SchoolSubscription::query()
            ->where('lifecycle_status', 'active')
            ->where('end_date', '<', $now)
            ->with(['school', 'package'])
            ->get();

        foreach ($overdueSubs as $sub) {
            if (!$sub->school) continue;

            $endDate = Carbon::parse($sub->end_date);

            // If past grace period, lock workspace
            if ($endDate->lt($expiredThreshold)) {
                $sub->update(['lifecycle_status' => 'expired']);
                $sub->school->update(['status' => 'suspended']);
                $this->warn(" -> Locked overdue tenant {$sub->school->name} (expired on {$sub->end_date})");
            }

            // Send expiration notice
            $adminEmail = $sub->school->email ?? User::where('school_id', $sub->school_id)->first()?->email;
            if ($adminEmail) {
                try {
                    Mail::to($adminEmail)->send(new SubscriptionExpiredMail($sub->school, $sub, $sub->package));
                    $this->line(" -> Dispatched expiry notice to {$adminEmail} for {$sub->school->name}");
                } catch (\Throwable $e) {
                    $this->error(" -> Failed to send expiry mail: " . $e->getMessage());
                }
            }
        }

        $this->info("Subscription audit completed successfully.");
        return Command::SUCCESS;
    }
}