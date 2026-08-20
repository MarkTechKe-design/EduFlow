<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Routing\Controller as BaseController;

abstract class Controller extends BaseController
{
    use AuthorizesRequests;

    /**
     * Return the school_id for the current session.
     * For school-scoped users it comes from their profile.
     * For super-admin (school_id = null) fall back to the first school.
     */
    protected function getSchoolId(): int
    {
        $user = auth()->user();

        abort_if(! $user || $user->hasRole('super-admin') || ! $user->school_id, 403);

        $school = \App\Models\School::query()->findOrFail($user->school_id);

        abort_unless($school->status === 'active', 403);

        return (int) $school->id;
    }
}
