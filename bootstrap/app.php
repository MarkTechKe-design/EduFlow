<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
                $trustedProxies = env('TRUSTED_PROXIES');
        if ($trustedProxies) {
            $proxies = array_filter(array_map('trim', explode(',', $trustedProxies)));
                    $trustedProxies = env('TRUSTED_PROXIES');
        if ($trustedProxies) {
            $proxies = array_filter(array_map('trim', explode(',', $trustedProxies)));
            $middleware->trustProxies(at: $proxies);
        } else {
            $middleware->trustProxies(at: []);
        }
        } else {
                    $trustedProxies = env('TRUSTED_PROXIES');
        if ($trustedProxies) {
            $proxies = array_filter(array_map('trim', explode(',', $trustedProxies)));
            $middleware->trustProxies(at: $proxies);
        } else {
            $middleware->trustProxies(at: []);
        }
        }
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->alias([
            'active'             => \App\Http\Middleware\EnsureUserIsActive::class,
            'active.account'     => \App\Http\Middleware\EnsureActiveAccount::class,
            'module'             => \App\Http\Middleware\EnsureModuleEnabled::class,
            'school-role'        => \App\Http\Middleware\EnsureSchoolRoleAccess::class,
            'school.onboarded'   => \App\Http\Middleware\EnsureSchoolIsOnboarded::class,
            'role'               => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission'         => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();