<?php

namespace App\Jobs;

use App\Models\SchoolSetting;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendSmsBlast implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 180;

    public function __construct(
        public readonly array  $recipients,
        public readonly string $message,
        public readonly int    $schoolId,
    ) {}

    public function handle(): void
    {
        if (empty($this->recipients)) {
            return;
        }

        $settings = SchoolSetting::allFor($this->schoolId);
        $provider = $settings['sms_provider'] ?? 'africas_talking';

        // 1. Normalize and deduplicate Kenyan mobile numbers
        $normalizedPhones = [];
        foreach ($this->recipients as $rawPhone) {
            $digits = preg_replace('/[^0-9]/', '', (string)$rawPhone);
            if (empty($digits)) continue;

            if (str_starts_with($digits, '0')) {
                $phone = '254' . substr($digits, 1);
            } elseif (str_starts_with($digits, '254')) {
                $phone = $digits;
            } elseif (strlen($digits) === 9) {
                $phone = '254' . $digits;
            } else {
                $phone = $digits;
            }

            if (strlen($phone) >= 10 && strlen($phone) <= 14) {
                $normalizedPhones[] = $phone;
            }
        }

        $uniquePhones = array_values(array_unique($normalizedPhones));
        if (empty($uniquePhones)) {
            Log::warning('SMS Blast skipped: No valid recipients after normalization.', ['school_id' => $this->schoolId]);
            return;
        }

        // 2. Dispatch in chunks to prevent payload bottlenecks
        $chunks = array_chunk($uniquePhones, 100);

        foreach ($chunks as $batch) {
            try {
                if ($provider === 'africas_talking') {
                    $username = $settings['sms_username'] ?? 'sandbox';
                    $apiKey   = $settings['sms_api_key'] ?? '';
                    $senderId = $settings['sms_sender_id'] ?? '';

                    if (empty($apiKey)) {
                        Log::error('Africa\'s Talking dispatch failed: Missing API Key', ['school_id' => $this->schoolId]);
                        continue;
                    }

                    $endpoint = ($username === 'sandbox')
                        ? 'https://api.sandbox.africastalking.com/version1/messaging'
                        : 'https://api.africastalking.com/version1/messaging';

                    $formattedList = array_map(fn($p) => '+' . $p, $batch);

                    $payload = [
                        'username' => $username,
                        'to'       => implode(',', $formattedList),
                        'message'  => $this->message,
                    ];

                    if (!empty($senderId)) {
                        $payload['from'] = $senderId;
                    }

                    $response = Http::asForm()
                        ->withHeaders([
                            'apiKey' => $apiKey,
                            'Accept' => 'application/json',
                        ])
                        ->timeout(30)
                        ->post($endpoint, $payload);

                    Log::info('Africa\'s Talking SMS blast dispatched', [
                        'school_id' => $this->schoolId,
                        'count'     => count($batch),
                        'status'    => $response->status(),
                    ]);
                } elseif ($provider === 'advanta') {
                    $partnerId = $settings['sms_partner_id'] ?? '';
                    $apiKey    = $settings['sms_api_key'] ?? '';
                    $shortcode = $settings['sms_sender_id'] ?? '';

                    if (empty($partnerId) || empty($apiKey)) {
                        Log::error('Advanta dispatch failed: Missing credentials', ['school_id' => $this->schoolId]);
                        continue;
                    }

                    foreach ($batch as $phone) {
                        Http::timeout(15)->post('https://quicksms.advantasms.com/api/services/sendsms/', [
                            'partnerID' => $partnerId,
                            'apikey'    => $apiKey,
                            'mobile'    => $phone,
                            'message'   => $this->message,
                            'shortcode' => $shortcode,
                            'pass_type' => 'plain',
                        ]);
                    }
                } elseif ($provider === 'mobitech') {
                    $apiKey    = $settings['sms_api_key'] ?? '';
                    $serviceId = $settings['sms_service_id'] ?? '0';
                    $senderId  = $settings['sms_sender_id'] ?? '';

                    if (empty($apiKey)) {
                        Log::error('Mobitech dispatch failed: Missing API key', ['school_id' => $this->schoolId]);
                        continue;
                    }

                    foreach ($batch as $phone) {
                        Http::withHeaders(['h_api_key' => $apiKey])
                            ->timeout(15)
                            ->post('https://api.mobitechtechnologies.com/sms/sendsms', [
                                'mobile'        => $phone,
                                'response_type' => 'json',
                                'sender_name'   => $senderId ?: '23107',
                                'service_id'    => (int)$serviceId,
                                'message'       => $this->message,
                            ]);
                    }
                }
            } catch (\Throwable $e) {
                Log::error('SMS Blast batch dispatch exception.', [
                    'school_id' => $this->schoolId,
                    'provider'  => $provider,
                    'error'     => $e->getMessage(),
                ]);

                throw $e;
            }
        }
    }
}