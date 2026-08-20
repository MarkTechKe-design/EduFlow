<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SystemHealthController extends Controller
{
    public function index()
    {
        $checks = [
            $this->check('Application', 'ok', config('app.name', 'EduFlow') . ' is running', [
                'environment' => config('app.env'),
                'debug' => (bool) config('app.debug'),
                'php' => PHP_VERSION,
                'laravel' => app()->version(),
            ]),
            $this->databaseCheck(),
            $this->cacheCheck(),
            $this->storageCheck(),
            $this->queueCheck(),
        ];

        return Inertia::render('SuperAdmin/SystemHealth/Index', [
            'checks' => $checks,
            'generatedAt' => now()->toIso8601String(),
        ]);
    }

    private function databaseCheck(): array
    {
        $started = microtime(true);
        try {
            DB::select('select 1');
            return $this->check('Database', 'ok', 'Connection available', [
                'driver' => config('database.default'),
                'latency_ms' => round((microtime(true) - $started) * 1000, 2),
            ]);
        } catch (\Throwable $exception) {
            return $this->check('Database', 'error', 'Connection unavailable', ['error' => $exception->getMessage()]);
        }
    }

    private function cacheCheck(): array
    {
        $key = 'platform-health:' . bin2hex(random_bytes(8));
        try {
            Cache::put($key, 'ok', 10);
            $available = Cache::get($key) === 'ok';
            Cache::forget($key);
            return $this->check('Cache', $available ? 'ok' : 'warning', $available ? 'Read/write available' : 'Read/write verification failed', [
                'driver' => config('cache.default'),
            ]);
        } catch (\Throwable $exception) {
            return $this->check('Cache', 'error', 'Connection unavailable', ['error' => $exception->getMessage()]);
        }
    }

    private function storageCheck(): array
    {
        $path = 'health-checks/' . bin2hex(random_bytes(8)) . '.txt';
        try {
            $disk = Storage::disk('public');
            $written = $disk->put($path, 'ok');
            $disk->delete($path);

            return $this->check('Storage', $written ? 'ok' : 'warning', $written ? 'Read/write available' : 'Write verification failed', [
                'disk' => config('filesystems.default'),
            ]);
        } catch (\Throwable $exception) {
            return $this->check('Storage', 'error', 'Configured disk unavailable', ['error' => $exception->getMessage()]);
        }
    }

    private function queueCheck(): array
    {
        $connection = config('queue.default');
        return $this->check('Queue', $connection === 'sync' ? 'warning' : 'ok', $connection === 'sync' ? 'Synchronous queue configured' : 'Queue connection configured', [
            'connection' => $connection,
        ]);
    }

    private function check(string $name, string $status, string $message, array $details = []): array
    {
        return compact('name', 'status', 'message', 'details');
    }
}