<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use App\Models\User;
use App\Services\WebsiteContentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LoginController extends Controller
{
    public function create(Request $request): Response
    {
        if (Auth::check()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        $bg = PlatformSetting::get('login_background');
        $noticeEnabled = PlatformSetting::get('login_notice_enabled');
        $branding = app(WebsiteContentService::class)->branding();

        return Inertia::render('Auth/Login', [
            'status' => session('status'),
            'canResetPassword' => Route::has('password.request'),
            'branding' => [
                'name'          => $branding['name'] ?? config('app.name', 'EduFlow'),
                'support_phone' => $branding['support_phone'] ?? '+254 718 178521',
                'support_email' => $branding['support_email'] ?? 'support@eduflow.co.ke',
            ],
            'visualConfig' => [
                'imageUrl'            => filled($bg) ? asset('storage/' . $bg) : null,
                'title'               => (string) PlatformSetting::get('login_title', 'Empowering Kenyan schools to educate, empower, and excel.'),
                'subtitle'            => (string) PlatformSetting::get('login_subtitle', 'All-in-one school operations platform with secure multi-tenant isolation, role-based access, and real-time insights.'),
                'notificationText'    => (string) PlatformSetting::get('login_notice_text', 'Grade 7 CBC Assessment Rubrics Approved'),
                'notificationSubtext' => (string) PlatformSetting::get('login_notice_subtext', 'Term 2 continuous evaluation scores validated for 12 learning areas.'),
                'notificationEnabled' => is_null($noticeEnabled) ? true : filter_var($noticeEnabled, FILTER_VALIDATE_BOOLEAN),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email'    => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $remember = $request->boolean('remember');

        $user = User::where('email', $credentials['email'])->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        if (isset($user->status) && $user->status !== 'active') {
            throw ValidationException::withMessages([
                'email' => __('Your account is ' . $user->status . '. Please contact administration.'),
            ]);
        }

        Auth::login($user, $remember);
        $request->session()->regenerate();

        $updateData = ['last_login_at' => now()];
        if (Schema::hasColumn('users', 'last_login_ip')) {
            $updateData['last_login_ip'] = $request->ip();
        }
        $user->forceFill($updateData)->save();

        if (function_exists('activity')) {
            activity()
                ->causedBy($user)
                ->performedOn($user)
                ->log('User logged in');
        } elseif (Schema::hasTable('activity_log')) {
            DB::table('activity_log')->insert([
                'log_name'    => 'auth',
                'description' => 'User logged in',
                'causer_type' => get_class($user),
                'causer_id'   => $user->id,
                'created_at'  => now(),
                'updated_at'  => now(),
            ]);
        }

        return redirect()->intended(route('dashboard'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}