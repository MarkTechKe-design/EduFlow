<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Route;

class LandingRouteResolver
{
    public function resolve(User $user): string
    {
        if ($user->hasRole('super-admin') && !$user->school_id) {
            if (Route::has('super-admin.dashboard')) {
                return 'super-admin.dashboard';
            }
            return 'super-admin.settings.index';
        }

        if ($user->hasRole('student')) {
            if (Route::has('student.dashboard')) {
                return 'student.dashboard';
            }
        }

        if ($user->hasRole('parent')) {
            if (Route::has('parent.dashboard')) {
                return 'parent.dashboard';
            }
        }

        if ($user->hasAnyRole(['school-admin', 'principal', 'teacher', 'accountant'])) {
            if (Route::has('school.reports.dashboard')) {
                return 'school.reports.dashboard';
            }
            if (Route::has('school.students.index')) {
                return 'school.students.index';
            }
        }

        if (Route::has('dashboard')) {
            return 'dashboard';
        }

        return 'home';
    }
}