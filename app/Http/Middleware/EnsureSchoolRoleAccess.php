<?php

namespace App\Http\Middleware;

use App\Models\School;
use App\Models\SchoolSubscription;
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

        if ($school->verification_status === 'rejected') {
            abort(403, 'School institution registration has been rejected by platform administration.');
        }

        $hasEntitlement = SchoolSubscription::withoutGlobalScopes()
            ->where('school_id', $school->id)
            ->whereIn('lifecycle_status', ['trial', 'active', 'grace_period'])
            ->where(function ($query): void {
                $query->whereNull('end_date')->orWhereDate('end_date', '>=', today());
            })
            ->exists();
        abort_unless($hasEntitlement, 403, 'School subscription is not active.');

        $routeName = $request->route()?->getName() ?? '';
        if ($school->verification_status !== 'verified'
            && ! in_array($routeName, ['onboarding', 'onboarding.update'], true)) {
            abort(403, 'School institution registration is awaiting verification.');
        }

        if ($user->hasRole('driver') && ! str_starts_with($routeName, 'school.transport.')) {
            abort(403, 'Driver access is restricted to transport operations.');
        }

        return $next($request);
    }
}