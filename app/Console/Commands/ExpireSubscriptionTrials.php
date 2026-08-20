<?php

namespace App\Console\Commands;

use App\Services\SubscriptionLifecycleService;
use Illuminate\Console\Command;

class ExpireSubscriptionTrials extends Command
{
    protected $signature = 'subscriptions:expire-trials';
    protected $description = 'Move expired school trials through the subscription lifecycle service';

    public function handle(SubscriptionLifecycleService $lifecycle): int
    {
        $this->info("Expired {$lifecycle->expireTrials()} trial subscription(s).");
        return self::SUCCESS;
    }
}
