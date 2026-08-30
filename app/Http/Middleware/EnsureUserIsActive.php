<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && isset($user->status) && in_array(strtolower($user->status), ['inactive', 'suspended', 'disabled', 'banned'])) {
            if ($request->expectsJson() || $request->is('school/*') || $request->is('api/*')) {
                abort(403, 'Your account is inactive. Please contact support.');
            }

            auth()->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'Your account is inactive. Please contact support.',
            ]);
        }

        return $next($request);
    }
}