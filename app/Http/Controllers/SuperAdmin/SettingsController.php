<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\PlatformSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', PlatformSetting::class);

        $settings = PlatformSetting::query()->get()->pluck('value', 'key')->toArray();

        $registerBgs = PlatformSetting::get('register_backgrounds');
        if (is_string($registerBgs)) {
            $registerBgs = json_decode($registerBgs, true) ?? [$registerBgs];
        }
        $registerBgs = is_array($registerBgs) ? array_values(array_filter($registerBgs)) : [];

        $registerBgUrls = array_map(fn($path) => [
            'path' => $path,
            'url'  => asset('storage/' . $path),
        ], $registerBgs);

        return Inertia::render('SuperAdmin/Settings/Index', [
            'settings'       => $settings,
            'logoUrl'        => !empty($settings['platform_logo']) ? asset('storage/' . $settings['platform_logo']) : null,
            'faviconUrl'     => !empty($settings['platform_favicon']) ? asset('storage/' . $settings['platform_favicon']) : null,
            'loginBgUrl'     => !empty($settings['login_background']) ? asset('storage/' . $settings['login_background']) : null,
            'registerBgUrls' => $registerBgUrls,
        ]);
    }

    public function saveGeneral(Request $request): RedirectResponse
    {
        return $this->updateGeneral($request);
    }

    public function updateGeneral(Request $request): RedirectResponse
    {
        $this->authorize('edit', PlatformSetting::class);

        $request->validate([
            'platform_name'          => 'required|string|max:100',
            'support_email'          => 'nullable|email|max:150',
            'support_phone'          => 'nullable|string|max:40',
            'footer_copyright'       => 'nullable|string|max:300',
            'logo'                   => 'nullable|file|mimes:png,jpg,jpeg,svg,webp|max:2048',
            'favicon'                => 'nullable|file|mimes:ico,png,svg,webp,jpg,jpeg|max:1024',
            'login_background'       => 'nullable|file|mimes:jpg,jpeg,png,webp,svg|max:5120',
            'register_backgrounds'   => 'nullable',
            'register_backgrounds.*' => 'nullable|file|mimes:jpg,jpeg,png,webp|max:5120',
        ]);

        foreach (['platform_name', 'support_email', 'support_phone', 'footer_copyright'] as $key) {
            if ($request->has($key)) {
                PlatformSetting::set($key, $request->input($key), 'general');
            }
        }

        if ($request->hasFile('logo')) {
            $old = PlatformSetting::get('platform_logo');
            if ($old && Storage::disk('public')->exists($old)) {
                Storage::disk('public')->delete($old);
            }
            PlatformSetting::set('platform_logo', $request->file('logo')->store('platform', 'public'), 'general');
        }

        if ($request->hasFile('favicon')) {
            $old = PlatformSetting::get('platform_favicon');
            if ($old && Storage::disk('public')->exists($old)) {
                Storage::disk('public')->delete($old);
            }
            PlatformSetting::set('platform_favicon', $request->file('favicon')->store('platform', 'public'), 'general');
        }

        if ($request->hasFile('login_background')) {
            $old = PlatformSetting::get('login_background');
            if ($old && Storage::disk('public')->exists($old)) {
                Storage::disk('public')->delete($old);
            }
            PlatformSetting::set('login_background', $request->file('login_background')->store('branding', 'public'), 'general');
        }

        if ($request->hasFile('register_backgrounds')) {
            $existing = PlatformSetting::get('register_backgrounds');
            if (is_string($existing)) {
                $existing = json_decode($existing, true) ?? [$existing];
            }
            $existing = is_array($existing) ? $existing : [];

            $files = $request->file('register_backgrounds');
            if (!is_array($files)) {
                $files = [$files];
            }

            foreach ($files as $file) {
                if ($file && $file->isValid()) {
                    $existing[] = $file->store('branding/register', 'public');
                }
            }
            PlatformSetting::set('register_backgrounds', array_values(array_unique(array_filter($existing))), 'general');
        }

        return back()->with('success', 'Platform identity settings saved successfully.');
    }

    public function deleteRegisterBackground(Request $request): RedirectResponse
    {
        $this->authorize('edit', PlatformSetting::class);

        $request->validate(['path' => 'required|string']);
        $path = $request->input($path);

        $existing = PlatformSetting::get('register_backgrounds');
        if (is_string($existing)) {
            $existing = json_decode($existing, true) ?? [$existing];
        }
        $existing = is_array($existing) ? $existing : [];

        if (in_array($path, $existing, true)) {
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
            $updated = array_values(array_diff($existing, [$path]));
            PlatformSetting::set('register_backgrounds', $updated, 'general');
        }

        return back()->with('success', 'Registration background slide removed.');
    }

    public function savePayment(Request $request): RedirectResponse
    {
        return $this->updatePayment($request);
    }

    public function updatePayment(Request $request): RedirectResponse
    {
        $this->authorize('edit', PlatformSetting::class);

        $request->validate([
            'paystack_key'      => 'nullable|string|max:255',
            'paystack_secret'   => 'nullable|string|max:255',
            'paystack_webhook'  => 'nullable|string|max:255',
            'payment_currency'  => 'nullable|string|max:10',
        ]);

        foreach (['paystack_key', 'paystack_secret', 'paystack_webhook', 'payment_currency'] as $key) {
            if ($request->has($key)) {
                PlatformSetting::set($key, $request->input($key), 'payment');
            }
        }

        return back()->with('success', 'Payment gateway settings saved successfully.');
    }

    public function saveSmtp(Request $request): RedirectResponse
    {
        return $this->updateSmtp($request);
    }

    public function updateSmtp(Request $request): RedirectResponse
    {
        $this->authorize('edit', PlatformSetting::class);

        $request->validate([
            'platform_mail_host'         => 'nullable|string|max:150',
            'platform_mail_port'         => 'nullable|integer',
            'platform_mail_username'     => 'nullable|string|max:150',
            'platform_mail_password'     => 'nullable|string|max:255',
            'platform_mail_encryption'   => 'nullable|string|max:20',
            'platform_mail_from_address' => 'nullable|email|max:150',
            'platform_mail_from_name'    => 'nullable|string|max:150',
        ]);

        $keys = [
            'platform_mail_host',
            'platform_mail_port',
            'platform_mail_username',
            'platform_mail_password',
            'platform_mail_encryption',
            'platform_mail_from_address',
            'platform_mail_from_name',
        ];

        foreach ($keys as $key) {
            if ($request->has($key)) {
                PlatformSetting::set($key, $request->input($key), 'smtp');
            }
        }

        return back()->with('success', 'Platform SMTP configuration saved successfully.');
    }

    public function saveTemplate(Request $request): RedirectResponse
    {
        $this->authorize('edit', PlatformSetting::class);

        $request->validate([
            'template_key' => 'required|string|in:welcome_school,subscription_expiry,trial_ending,invoice,password_reset',
            'subject'      => 'required|string|max:255',
            'body'         => 'required|string|max:5000',
        ]);

        $key = $request->input('template_key');
        PlatformSetting::set("tpl_{$key}_subject", $request->input('subject'), 'notification_template');
        PlatformSetting::set("tpl_{$key}_body", $request->input('body'), 'notification_template');

        return back()->with('success', 'Notification template saved successfully.');
    }

    public function saveLocalization(Request $request): RedirectResponse
    {
        return $this->updateLocalization($request);
    }

    public function updateLocalization(Request $request): RedirectResponse
    {
        $this->authorize('edit', PlatformSetting::class);

        $request->validate([
            'default_timezone' => 'nullable|string|max:60',
            'default_currency' => 'nullable|string|max:10',
            'default_language' => 'nullable|string|max:10',
            'date_format'      => 'nullable|string|max:30',
        ]);

        foreach (['default_timezone', 'default_currency', 'default_language', 'date_format'] as $key) {
            if ($request->has($key)) {
                PlatformSetting::set($key, $request->input($key), 'localization');
            }
        }

        return back()->with('success', 'Localization settings saved successfully.');
    }

    public function saveMaintenance(Request $request): RedirectResponse
    {
        return $this->updateMaintenance($request);
    }

    public function updateMaintenance(Request $request): RedirectResponse
    {
        $this->authorize('edit', PlatformSetting::class);

        $request->validate([
            'maintenance_mode' => 'nullable|boolean',
            'maintenance_msg'  => 'nullable|string|max:500',
        ]);

        PlatformSetting::set('maintenance_mode', (bool) $request->input('maintenance_mode', false), 'maintenance');
        if ($request->has('maintenance_msg')) {
            PlatformSetting::set('maintenance_msg', $request->input('maintenance_msg'), 'maintenance');
        }

        return back()->with('success', 'Maintenance settings saved successfully.');
    }

    public function saveStorage(Request $request): RedirectResponse
    {
        return $this->updateStorage($request);
    }

    public function updateStorage(Request $request): RedirectResponse
    {
        $this->authorize('edit', PlatformSetting::class);

        $request->validate([
            'upload_max_mb'         => 'nullable|integer|min:1|max:500',
            'storage_per_school_gb' => 'nullable|integer|min:1|max:1000',
            'allowed_extensions'    => 'nullable|string|max:500',
        ]);

        foreach (['upload_max_mb', 'storage_per_school_gb', 'allowed_extensions'] as $key) {
            if ($request->has($key)) {
                PlatformSetting::set($key, $request->input($key), 'storage');
            }
        }

        return back()->with('success', 'Storage limits saved successfully.');
    }

    public function saveAudit(Request $request): RedirectResponse
    {
        return $this->updateAudit($request);
    }

    public function updateAudit(Request $request): RedirectResponse
    {
        $this->authorize('edit', PlatformSetting::class);

        $request->validate([
            'retention_days' => 'nullable|integer|min:7|max:3650',
        ]);

        if ($request->has('retention_days')) {
            PlatformSetting::set('retention_days', $request->input('retention_days'), 'audit');
        }

        return back()->with('success', 'Audit settings saved successfully.');
    }
}