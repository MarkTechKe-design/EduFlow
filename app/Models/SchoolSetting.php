<?php

namespace App\Models;

use App\Traits\BelongsToSchool;
use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class SchoolSetting extends Model
{
    use BelongsToSchool;

    protected $table = 'school_settings';

    protected $fillable = ['school_id', 'key', 'value', 'group'];

    /** @var list<string> */
    private const SECRET_KEYS = [
        'smtp_password',
        'sms_auth_token',
        'sms_api_key',
        'sms_api_secret',
    ];

    /**
     * Get a setting value for a school.
     */
    public static function get(int $schoolId, string $key, mixed $default = null): mixed
    {
        $value = static::where('school_id', $schoolId)->where('key', $key)->value('value');

        return $value === null ? $default : static::decodeValue($key, $value);
    }

    /**
     * Set a setting value for a school.
     */
    public static function set(int $schoolId, string $key, mixed $value, string $group = 'general'): void
    {
        static::updateOrCreate(
            ['school_id' => $schoolId, 'key' => $key],
            ['value' => static::encodeValue($key, $value), 'group' => $group],
        );
    }

    /**
     * Get all settings for a school as a flat key->value array.
     */
    public static function allFor(int $schoolId): array
    {
        return static::where('school_id', $schoolId)->get(['key', 'value'])
            ->mapWithKeys(fn (self $setting) => [$setting->key => static::decodeValue($setting->key, $setting->value)])
            ->all();
    }

    /** Return settings safe for a browser response. */
    public static function safeFor(int $schoolId): array
    {
        $settings = static::allFor($schoolId);

        foreach (self::SECRET_KEYS as $key) {
            if (array_key_exists($key, $settings)) {
                $settings[$key] = filled($settings[$key]) ? '********' : '';
            }
        }

        return $settings;
    }

    public static function isSecretKey(string $key): bool
    {
        return in_array($key, self::SECRET_KEYS, true);
    }

    private static function encodeValue(string $key, mixed $value): mixed
    {
        return self::isSecretKey($key) && filled($value)
            ? Crypt::encryptString((string) $value)
            : $value;
    }

    private static function decodeValue(string $key, mixed $value): mixed
    {
        if (! self::isSecretKey($key) || blank($value)) {
            return $value;
        }

        try {
            return Crypt::decryptString((string) $value);
        } catch (DecryptException) {
            // Preserve compatibility with credentials saved before encryption was added.
            return $value;
        }
    }
}
