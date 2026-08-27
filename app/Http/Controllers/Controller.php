<?php

namespace App\Http\Controllers;

use App\Models\School;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Routing\Controller as BaseController;

abstract class Controller extends BaseController
{
    use AuthorizesRequests;

    /**
     * Return the validated active school_id for the current session.
     */
    protected function getSchoolId(): int
    {
        $user = auth()->user();

        abort_if(! $user || $user->hasRole('super-admin') || ! $user->school_id, 403);

        $school = School::query()->find($user->school_id);
        if (! $school) {
            abort(404, 'School tenant not found.');
        }

        abort_unless($school->status === 'active', 403);

        return (int) $school->id;
    }
}