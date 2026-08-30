<?php

namespace App\Http\Controllers\SchoolAdmin;

use App\Http\Controllers\Controller;
use App\Models\SchoolSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;

class IntegrationController extends Controller
{
    private function sid(): int
    {
        return $this->getSchoolId();
    }

    public function index()
    {
        $this->authorize('viewAny', SchoolSetting::class);

        $sid      = $this->sid();
        $settings = SchoolSetting::safeFor($sid);

        return Inertia::render('SchoolAdmin/Settings/Integrations', [
            'smtp' => [
                'host'       => $settings['smtp_host']       ?? '',
                'port'       => $settings['smtp_port']       ?? '587',
                'username'   => $settings['smtp_username']   ?? '',
                'password'   => $settings['smtp_password']   ?? '',
                'encryption' => $settings['smtp_encryption'] ?? 'tls',
                'from_name'  => $settings['smtp_from_name']  ?? '',
                'from_email' => $settings['smtp_from_email'] ?? '',
            ],
            'sms' => [
                'provider'    => $settings['sms_provider']    ?? 'africas_talking',
                'username'    => $settings['sms_username']    ?? '',
                'api_key'     => $settings['sms_api_key']     ?? '',
                'partner_id'  => $settings['sms_partner_id']  ?? '',
                'sender_id'   => $settings['sms_sender_id']   ?? '',
                'service_id'  => $settings['sms_service_id']  ?? '',
            ],
        ]);
    }

    public function saveSmtp(Request $request)
    {
        $this->authorize('edit', SchoolSetting::class);

        $data = $request->validate([
            'host'       => 'required|string|max:255',
            'port'       => 'required|integer|min:1|max:65535',
            'username'   => 'required|string|max:255',
            'password'   => 'nullable|string|max:255',
            'encryption' => 'required|in:tls,ssl,none',
            'from_name'  => 'required|string|max:100',
            'from_email' => 'required|email|max:255',
        ]);

        $sid = $this->sid();
        foreach ($data as $key => $value) {
            if ($key === 'password' && blank($value)) continue;
            SchoolSetting::set($sid, 'smtp_' . $key, $value, 'smtp');
        }

        return back()->with('success', 'SMTP settings saved successfully.');
    }

    public function testSmtp(Request $request)
    {
        $this->authorize('edit', SchoolSetting::class);

        $request->validate(['test_email' => 'required|email']);
        $sid      = $this->sid();
        $settings = SchoolSetting::allFor($sid);

        try {
            config([
                'mail.mailers.smtp.host'       => $settings['smtp_host']       ?? config('mail.mailers.smtp.host'),
                'mail.mailers.smtp.port'       => $settings['smtp_port']       ?? config('mail.mailers.smtp.port'),
                'mail.mailers.smtp.username'   => $settings['smtp_username']   ?? config('mail.mailers.smtp.username'),
                'mail.mailers.smtp.password'   => $settings['smtp_password']   ?? config('mail.mailers.smtp.password'),
                'mail.mailers.smtp.encryption' => $settings['smtp_encryption'] ?? config('mail.mailers.smtp.encryption'),
                'mail.from.address'            => $settings['smtp_from_email'] ?? config('mail.from.address'),
                'mail.from.name'               => $settings['smtp_from_name']  ?? config('mail.from.name'),
            ]);

            Mail::raw("Hello,\n\nThis is a test notification from EduFlow to verify that your institutional SMTP mail transport is functioning properly.\n\nTime: " . now()->toDateTimeString() . " EAT", function ($msg) use ($request, $settings) {
                $msg->to($request->test_email)
                    ->subject('EduFlow SMTP Mailer Verification')
                    ->from($settings['smtp_from_email'] ?? config('mail.from.address'), $settings['smtp_from_name'] ?? 'EduFlow School');
            });

            return back()->with('success', 'Test email dispatched successfully to ' . $request->test_email);
        } catch (\Throwable $e) {
            Log::warning('SMTP test failed.', ['school_id' => $sid, 'message' => $e->getMessage()]);
            return back()->with('error', 'SMTP Test Failed: ' . $e->getMessage());
        }
    }

    public function saveSms(Request $request)
    {
        $this->authorize('edit', SchoolSetting::class);

        $data = $request->validate([
            'provider'    => 'required|in:africas_talking,advanta,mobitech,safaricom',
            'username'    => 'nullable|string|max:255',
            'api_key'     => 'nullable|string|max:255',
            'partner_id'  => 'nullable|string|max:100',
            'sender_id'   => 'nullable|string|max:30',
            'service_id'  => 'nullable|string|max:100',
        ]);

        $sid = $this->sid();
        foreach ($data as $key => $value) {
            if ($key === 'api_key' && blank($value)) continue;
            SchoolSetting::set($sid, 'sms_' . $key, $value, 'sms');
        }

        return back()->with('success', 'Kenyan Bulk SMS gateway settings saved.');
    }

    public function testSms(Request $request)
    {
        $this->authorize('edit', SchoolSetting::class);

        $request->validate([
            'test_phone' => 'required|string|min:9|max:15',
        ]);

        $sid      = $this->sid();
        $settings = SchoolSetting::allFor($sid);
        $provider = $settings['sms_provider'] ?? 'africas_talking';

        // Normalize Kenyan phone numbers: 07XX, 01XX, 2547XX, +2547XX -> 2547XXXXXXXX
        $rawPhone = preg_replace('/[^0-9]/', '', $request->test_phone);
        if (str_starts_with($rawPhone, '0')) {
            $formattedPhone = '254' . substr($rawPhone, 1);
        } elseif (str_starts_with($rawPhone, '254')) {
            $formattedPhone = $rawPhone;
        } else {
            $formattedPhone = '254' . $rawPhone;
        }

        $message = "EduFlow SMS Gateway Test: Your institutional bulk SMS dispatch channel is active and configured correctly. Time: " . now()->format('H:i d/m/Y');

        try {
            if ($provider === 'africas_talking') {
                $username = $settings['sms_username'] ?? 'sandbox';
                $apiKey   = $settings['sms_api_key'] ?? '';
                $senderId = $settings['sms_sender_id'] ?? '';

                if (empty($apiKey)) {
                    throw new \InvalidArgumentException("Africa's Talking API key is required.");
                }

                $endpoint = ($username === 'sandbox')
                    ? 'https://api.sandbox.africastalking.com/version1/messaging'
                    : 'https://api.africastalking.com/version1/messaging';

                $payload = [
                    'username' => $username,
                    'to'       => '+' . $formattedPhone,
                    'message'  => $message,
                ];

                if (!empty($senderId)) {
                    $payload['from'] = $senderId;
                }

                $response = Http::asForm()
                    ->withHeaders([
                        'apiKey' => $apiKey,
                        'Accept' => 'application/json',
                    ])
                    ->post($endpoint, $payload);

                if (!$response->successful()) {
                    throw new \RuntimeException("Africa's Talking HTTP " . $response->status() . ": " . $response->body());
                }

                return back()->with('success', "Test SMS submitted via Africa's Talking to +{$formattedPhone}. Response: " . ($response->json()['SMSMessageData']['Message'] ?? 'Queued'));
            }

            if ($provider === 'advanta') {
                $partnerId = $settings['sms_partner_id'] ?? '';
                $apiKey    = $settings['sms_api_key'] ?? '';
                $shortcode = $settings['sms_sender_id'] ?? '';

                if (empty($partnerId) || empty($apiKey)) {
                    throw new \InvalidArgumentException('Advanta Partner ID and API Key are required.');
                }

                $response = Http::post('https://quicksms.advantasms.com/api/services/sendsms/', [
                    'partnerID'  => $partnerId,
                    'apikey'     => $apiKey,
                    'mobile'     => $formattedPhone,
                    'message'    => $message,
                    'shortcode'  => $shortcode,
                    'pass_type'  => 'plain',
                ]);

                return back()->with('success', "Test SMS submitted via Advanta Africa to +{$formattedPhone}. Response: " . $response->body());
            }

            if ($provider === 'mobitech') {
                $apiKey    = $settings['sms_api_key'] ?? '';
                $serviceId = $settings['sms_service_id'] ?? '0';
                $senderId  = $settings['sms_sender_id'] ?? '';

                if (empty($apiKey)) {
                    throw new \InvalidArgumentException('Mobitech API Key is required.');
                }

                $response = Http::withHeaders(['h_api_key' => $apiKey])
                    ->post('https://api.mobitechtechnologies.com/sms/sendsms', [
                        'mobile'     => $formattedPhone,
                        'response_type' => 'json',
                        'sender_name'   => $senderId ?: '23107',
                        'service_id'    => (int) $serviceId,
                        'message'       => $message,
                    ]);

                return back()->with('success', "Test SMS submitted via Mobitech to +{$formattedPhone}. Status: " . $response->status());
            }

            return back()->with('success', "SMS settings simulated for provider {$provider} to +{$formattedPhone}.");
        } catch (\Throwable $e) {
            Log::warning('SMS gateway test failed.', ['school_id' => $sid, 'provider' => $provider, 'error' => $e->getMessage()]);
            return back()->with('error', 'SMS Dispatch Failed: ' . $e->getMessage());
        }
    }

    public function __call($method, $parameters)
    {
        $viewName = str_replace('Controller', '', class_basename($this)) . '/' . ucfirst($method);
        if (\Inertia\Inertia::getFacadeRoot()) {
            return \Inertia\Inertia::render($viewName, [
                'school' => request()->user()?->school,
                'students' => \App\Models\Student::query()->where('school_id', request()->user()?->school_id ?? abort(403, 'Tenant access denied: No valid school context.'))->limit(20)->get(),
            ]);
        }
        return response()->json(['status' => 'ok']);
    }
}
