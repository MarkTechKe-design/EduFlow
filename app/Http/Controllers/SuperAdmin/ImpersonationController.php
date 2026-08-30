<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ImpersonationController extends Controller
{
    /**
     * Super Admin impersonates the primary administrator of a target school.
     */
    public function impersonate(Request $request, School $school): RedirectResponse
    {
        $superAdmin = $request->user();

        if (!$superAdmin->hasRole('super-admin')) {
            abort(403, 'Unauthorized. Only Super Admins can access tenant portals.');
        }

        // Find primary school admin or principal
        $targetUser = User::where('school_id', $school->id)
            ->whereHas('roles', fn ($q) => $q->whereIn('name', ['school-admin', 'principal']))
            ->first();

        if (!$targetUser) {
            // Fallback: any user belonging to this school
            $targetUser = User::where('school_id', $school->id)->first();
        }

        if (!$targetUser) {
            return back()->with('error', "No administrator user account found for \"{$school->name}\".");
        }

        // Store original Super Admin ID in session
        session()->put('impersonated_by', $superAdmin->id);
        session()->put('impersonated_school_name', $school->name);

        Auth::login($targetUser);

        if (function_exists('activity')) {
            activity()
                ->causedBy($superAdmin)
                ->performedOn($school)
                ->log("Super Admin impersonated school admin [{$targetUser->email}] for {$school->name}");
        }

        return redirect()->route('dashboard')->with('success', "You are now managing {$school->name} as {$targetUser->name}.");
    }

    /**
     * Exit impersonation mode and return back to Super Admin console.
     */
    public function leave(Request $request): RedirectResponse
    {
        $originalAdminId = session()->get('impersonated_by');

        if (!$originalAdminId) {
            return redirect()->route('dashboard');
        }

        $superAdmin = User::findOrFail($originalAdminId);

        session()->forget(['impersonated_by', 'impersonated_school_name']);

        Auth::login($superAdmin);

        return redirect()->route('super-admin.dashboard')->with('success', 'Returned to Super Admin Platform Console.');
    }
}