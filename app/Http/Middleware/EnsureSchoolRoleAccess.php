<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSchoolRoleAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $routeName = $request->route()?->getName() ?? '';

        // Driver permissions are intentionally limited to the existing transport workspace.
        if ($user?->hasRole('driver') && ! str_starts_with($routeName, 'school.transport.')) {
            abort(403);
        }

        return $next($request);
    }
}
