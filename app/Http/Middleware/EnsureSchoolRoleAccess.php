<?php

namespace App\Http\Middleware;

use App\Models\School;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSchoolRoleAccess
{
    private const SCHOOL_ROLES = [
        'school-admin',
        'principal',
        'teacher',
        'accountant',
        'librarian',
        'receptionist',
        'driver',
        'warden',
        'store-manager',
        'student',
        'parent',
        'guardian',
        'board-member',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->hasRole('super-admin') || ! $user->school_id) {
            abort(403, 'Unauthorized school workspace context.');
        }

        if (! $user->hasAnyRole(self::SCHOOL_ROLES)) {
            abort(403, 'User does not possess a valid school workspace role.');
        }

        $school = School::query()->find($user->school_id);
        if (! $school) {
            abort(404, 'School tenant not found.');
        }

        if ($school->status !== 'active') {
            abort(403, 'School tenant is suspended or inactive.');
        }

        $routeName = $request->route()?->getName() ?? '';

        if ($user->hasRole('driver') && ! str_starts_with($routeName, 'school.transport.')) {
            abort(403, 'Driver access is restricted to transport operations.');
        }

        return $next($request);
    }
}