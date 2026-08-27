<?php

namespace App\Support\Authorization;

use App\Models\User;
use Illuminate\Support\Facades\Route;

class LandingRouteResolver
{
    public function resolve(User $user): string
    {
        if (method_exists($user, 'hasRole') && $user->hasRole('super-admin') && ! $user->school_id) {
            return Route::has('super-admin.dashboard') ? 'super-admin.dashboard' : 'dashboard';
        }

        if (method_exists($user, 'hasRole') && $user->hasRole('student')) {
            return Route::has('student.dashboard') ? 'student.dashboard' : 'dashboard';
        }

        if (method_exists($user, 'hasRole') && $user->hasRole('parent')) {
            return Route::has('parent.dashboard') ? 'parent.dashboard' : 'dashboard';
        }

        return 'dashboard';
    }
}