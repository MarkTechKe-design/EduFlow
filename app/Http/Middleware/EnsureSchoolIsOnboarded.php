<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSchoolIsOnboarded
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user || $user->hasRole('super-admin') || empty($user->school_id)) {
            return $next($request);
        }

        $school = $user->school ?? \App\Models\School::find($user->school_id);

        if ($school && is_null($school->onboarding_completed_at)) {
            if (!$request->is('onboarding*') && !$request->is('logout')) {
                return redirect()->route('onboarding');
            }
        }

        return $next($request);
    }
}