<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


use App\Services\SubscriptionLifecycleService;
use Illuminate\Support\Facades\Schedule;

Artisan::command('subscriptions:expire-trials', function (SubscriptionLifecycleService $lifecycle) { $this->info('Expired ' . $lifecycle->expireTrials() . ' trial subscription(s).'); })->purpose('Move expired school trials through the subscription lifecycle service');
Schedule::command('subscriptions:expire-trials')->dailyAt('01:15');
Schedule::command('subscriptions:charge-trials')->dailyAt('00:05')->withoutOverlapping()->runInBackground();




Schedule::command('eduflow:audit-subscriptions')->dailyAt('06:00');
