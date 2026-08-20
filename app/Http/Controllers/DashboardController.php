<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        if ($user->hasRole('super-admin')) {
            return Inertia::render('SuperAdmin/Dashboard');
        }

        if ($user->hasRole('student')) {
            return Inertia::render('Student/Dashboard');
        }

        if ($user->hasRole('parent')) {
            return Inertia::render('Parent/Dashboard');
        }

        // Default to School Admin / Teacher / Staff Dashboard
        return Inertia::render('SchoolAdmin/Dashboard', [
            'role' => $user->getRoleNames()->first(),
        ]);
    }
}