<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(10)->by($request->ip());
        });

        RateLimiter::for('public-admission', function (Request $request) {
            return Limit::perMinute(30)->by($request->ip());
        });

        if (class_exists(\App\Policies\FinanceReportPolicy::class) && class_exists(\App\Http\Controllers\SchoolAdmin\ReportController::class)) {
            Gate::policy(\App\Http\Controllers\SchoolAdmin\ReportController::class, \App\Policies\FinanceReportPolicy::class);
        }
        if (config('app.env') === 'production' || isset($_SERVER['HTTP_X_FORWARDED_PROTO'])) {
            URL::forceScheme('https');
        }

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = strtolower((string) $request->input('email')) . '|' . $request->ip();
            return Limit::perMinute(5)->by($throttleKey);
        });

        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });
    }
}