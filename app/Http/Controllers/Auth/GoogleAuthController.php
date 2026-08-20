<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

class GoogleAuthController extends Controller
{
    public function redirect(): RedirectResponse
    {
        if (blank(config('services.google.client_id'))) {
            return redirect()->route('login')->withErrors([
                'email' => 'Google Sign-In is not configured for this environment.',
            ]);
        }

        return Socialite::driver('google')->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (Throwable $e) {
            return redirect()->route('login')->withErrors([
                'email' => 'Google authentication failed or was cancelled.',
            ]);
        }

        $email = strtolower(trim((string) $googleUser->getEmail()));

        // Security: DO NOT automatically create users. Find existing linked school account.
        $user = User::where('email', $email)->first();

        if (! $user) {
            return redirect()->route('login')->withErrors([
                'email' => 'No active EduFlow account found with this Google email. Please sign in with your school credentials.',
            ]);
        }

        if (isset($user->status) && $user->status === 'suspended') {
            return redirect()->route('login')->withErrors([
                'email' => 'This account is currently deactivated. Please contact your school administrator.',
            ]);
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        return redirect()->intended(route(app(\App\Support\Authorization\LandingRouteResolver::class)->resolve($user)));
    }
}