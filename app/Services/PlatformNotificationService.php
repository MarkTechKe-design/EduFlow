<?php

namespace App\Services;

use App\Models\PlatformSetting;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class PlatformNotificationService
{
    private const DEFAULT_TEMPLATES = [
        'welcome_school' => [
            'subject' => 'Welcome to {{platform_name}} - {{school_name}} Account Active',
            'body'    => "Hello,\n\nWelcome to {{platform_name}}! Your institution {{school_name}} has been registered.\n\nAdmin Email: {{admin_email}}\nSign In: {{login_url}}\n\nBest regards,\nThe {{platform_name}} Team",
        ],
        'subscription_expiry' => [
            'subject' => '{{platform_name}}: Subscription Expiring Soon for {{school_name}}',
            'body'    => "Hello,\n\nYour subscription for {{school_name}} ({{plan_name}}) is expiring on {{expiry_date}}.\n\nRenew your plan: {{renew_url}}\n\nThank you,\n{{platform_name}}",
        ],
        'trial_ending' => [
            'subject' => '{{platform_name}}: 3 Days Remaining on Your Free Trial',
            'body'    => "Hello,\n\nThe 14-day free trial for {{school_name}} ends on {{trial_end_date}}.\n\nTo ensure uninterrupted service, verify your billing details: {{upgrade_url}}\n\nRegards,\n{{platform_name}}",
        ],
        'invoice' => [
            'subject' => 'Payment Receipt: {{plan_name}} ({{amount}})',
            'body'    => "Hello,\n\nWe received your payment of {{amount}} for {{school_name}} ({{plan_name}}).\n\nView invoice: {{invoice_url}}\n\nThank you for choosing {{platform_name}}.",
        ],
        'password_reset' => [
            'subject' => 'Reset Your {{platform_name}} Password',
            'body'    => "Hello {{user_name}},\n\nYou requested a password reset. Click the link below (valid for {{expires_in}} minutes):\n\n{{reset_url}}\n\nIf you did not make this request, you can safely ignore this message.",
        ],
    ];

    public function configureDynamicSmtp(): void
    {
        $host = PlatformSetting::get('platform_mail_host');
        $port = PlatformSetting::get('platform_mail_port') ?: 587;
        $username = PlatformSetting::get('platform_mail_username');
        $password = PlatformSetting::get('platform_mail_password');
        $encryption = PlatformSetting::get('platform_mail_encryption') ?: 'tls';
        $fromAddress = PlatformSetting::get('platform_mail_from_address') ?: config('mail.from.address');
        $fromName = PlatformSetting::get('platform_mail_from_name') ?: (PlatformSetting::get('platform_name') ?: config('mail.from.name'));

        if (filled($host)) {
            Config::set('mail.mailers.smtp.host', $host);
            Config::set('mail.mailers.smtp.port', (int) $port);
            Config::set('mail.mailers.smtp.username', $username);
            Config::set('mail.mailers.smtp.password', $password);
            Config::set('mail.mailers.smtp.encryption', $encryption);
            Config::set('mail.from.address', $fromAddress);
            Config::set('mail.from.name', $fromName);
        }
    }

    public function getTemplate(string $templateKey): array
    {
        $subject = PlatformSetting::get("tpl_{$templateKey}_subject");
        $body = PlatformSetting::get("tpl_{$templateKey}_body");

        $default = self::DEFAULT_TEMPLATES[$templateKey] ?? [
            'subject' => 'Notification from ' . (PlatformSetting::get('platform_name') ?: 'EduFlow'),
            'body'    => '',
        ];

        return [
            'subject' => filled($subject) ? $subject : $default['subject'],
            'body'    => filled($body) ? $body : $default['body'],
        ];
    }

    public function send(string $templateKey, string $recipientEmail, array $data = []): bool
    {
        try {
            $this->configureDynamicSmtp();

            $platformName = PlatformSetting::get('platform_name') ?: 'EduFlow';
            $data['platform_name'] = $platformName;

            $template = $this->getTemplate($templateKey);
            $subject = $this->interpolate($template['subject'], $data);
            $body = $this->interpolate($template['body'], $data);

            Mail::raw($body, function ($message) use ($recipientEmail, $subject) {
                $message->to($recipientEmail)->subject($subject);
            });

            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to send platform notification [{$templateKey}] to {$recipientEmail}: " . $e->getMessage());
            return false;
        }
    }

    private function interpolate(string $text, array $data): string
    {
        foreach ($data as $key => $value) {
            $text = str_replace('{{' . $key . '}}', (string) $value, $text);
        }
        return $text;
    }
}