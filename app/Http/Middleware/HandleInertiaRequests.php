<?php

namespace App\Http\Middleware;

use App\Support\Navigation\NavigationRegistry;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function __construct(private NavigationRegistry $navigation) {}

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        $shared = array_merge(parent::share($request), [
            'auth' => [
                'user'        => $user,
                'roles'       => $user ? $user->getRoleNames()->toArray() : [],
            'branding' => [
                'name' => \App\Models\PlatformSetting::get('platform_name', config('app.name', 'EduFlow')),
                'logo' => ($logo = \App\Models\PlatformSetting::get('platform_logo')) ? asset('storage/' . $logo) : null,
                'logo_url' => ($logo = \App\Models\PlatformSetting::get('platform_logo')) ? asset('storage/' . $logo) : null,
                'favicon' => ($fav = \App\Models\PlatformSetting::get('platform_favicon')) ? asset('storage/' . $fav) : null,
                'favicon_url' => ($fav = \App\Models\PlatformSetting::get('platform_favicon')) ? asset('storage/' . $fav) : null,
                'login_background' => ($bg = \App\Models\PlatformSetting::get('login_background')) ? asset('storage/' . $bg) : null,
                'support_phone' => \App\Models\PlatformSetting::get('support_phone'),
                'support_email' => \App\Models\PlatformSetting::get('support_email'),
            ],
                'permissions' => $user ? $user->getAllPermissions()->pluck('name')->toArray() : [],
            ],
            'navigation' => $user ? $this->navigation->for($user) : [],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
            ],
        ]);

        // Only attach school tenant prop when authenticated user is bound to a school
        if ($user && $user->school_id && $user->school) {
            $shared['school'] = [
                'id'       => $user->school->id,
                'name'     => $user->school->name,
                'slug'     => $user->school->slug,
                'currency' => $user->school->currency ?? 'KES',
                'logo'     => $user->school->logo_url,
            ];
        }

        return $shared;
    }
}