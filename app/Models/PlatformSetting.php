<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformSetting extends Model
{
    protected $fillable = ['key', 'value', 'group'];

    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::query()->where('key', $key)->first();
        if (!$setting || $setting->value === null) {
            return $default;
        }

        return static::decodeValue($key, $setting->value);
    }

    public static function set(string $key, mixed $value, string $group = 'general'): void
    {
        static::updateOrCreate(
            ['key' => $key],
            [
                'value' => static::encodeValue($key, $value),
                'group' => $group,
            ]
        );
    }

    public static function allFor(?string $group = null): array
    {
        $query = static::query();
        if ($group) {
            $query->where('group', $group);
        }

        return $query->get()
            ->mapWithKeys(fn($item) => [$item->key => static::decodeValue($item->key, $item->value)])
            ->toArray();
    }

    protected static function encodeValue(string $key, mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if (is_array($value) || is_object($value)) {
            return json_encode($value, JSON_UNESCAPED_SLASHES);
        }

        if (is_bool($value)) {
            return $value ? '1' : '0';
        }

        return (string) $value;
    }

    protected static function decodeValue(string $key, ?string $value): mixed
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim($value);
        if (str_starts_with($trimmed, '{') || str_starts_with($trimmed, '[')) {
            $decoded = json_decode($trimmed, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $decoded;
            }
        }

        return $value;
    }
}