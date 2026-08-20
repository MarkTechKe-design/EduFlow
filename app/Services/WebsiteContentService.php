<?php

namespace App\Services;

use App\Models\PlatformSetting;
use App\Models\WebsiteMenu;
use App\Models\WebsitePage;
use App\Models\WebsiteRedirect;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;

class WebsiteContentService
{
    public function publishedPage(string $path): ?WebsitePage
    {
        $path = $this->normalizePath($path);
        if (! Schema::hasTable('website_pages')) {
            return null;
        }

        $cacheKey = 'website.page.' . md5($path);
        $cached = Cache::get($cacheKey);
        if (! is_int($cached) && ! is_null($cached)) {
            Cache::forget($cacheKey);
        }

        $pageId = Cache::remember(
            $cacheKey,
            now()->addMinutes(5),
            fn () => WebsitePage::query()->published()->where('path', $path)->value('id')
        );

        return $pageId ? WebsitePage::query()
            ->published()
            ->whereKey($pageId)
            ->with(['sections' => fn ($query) => $query
                ->where('is_enabled', true)
                ->where(fn ($q) => $q->whereNull('starts_at')->orWhere('starts_at', '<=', now()))
                ->where(fn ($q) => $q->whereNull('ends_at')->orWhere('ends_at', '>', now()))
                ->orderBy('sort_order')])
            ->first() : null;
    }
    public function redirectFor(string $path): ?WebsiteRedirect
    {
        if (! Schema::hasTable('website_redirects')) {
            return null;
        }

        return WebsiteRedirect::query()->where('from_path', $this->normalizePath($path))
            ->where('is_active', true)->first();
    }

    public function menu(string $location): array
    {
        if (! Schema::hasTable('website_menus')) {
            return [];
        }

        $menu = WebsiteMenu::query()->where('location', $location)->where('is_active', true)
            ->with(['items' => fn ($query) => $query->where('is_visible', true)->orderBy('sort_order')])
            ->first();

        if (! $menu) {
            return [];
        }

        $items = $menu->items->groupBy('parent_id');
        $build = function ($parentId) use (&$build, $items): array {
            return ($items->get($parentId, collect()))->map(fn ($item) => [
                'id' => $item->id,
                'label' => $item->label,
                'url' => $this->safeUrl($item->url),
                'route_name' => $item->route_name,
                'target' => $item->target,
                'icon' => $item->icon,
                'children' => $build($item->id),
            ])->values()->all();
        };

        return $build(null);
    }

    public function branding(): array
    {
        if (! Schema::hasTable('platform_settings')) {
            return ['name' => config('app.name', 'EduFlow')];
        }

        $settings = PlatformSetting::allFor();

        return [
            'name' => $settings['platform_name'] ?? config('app.name', 'EduFlow'),
            'support_email' => $settings['support_email'] ?? null,
            'support_phone' => $settings['support_phone'] ?? null,
            'footer_copyright' => $settings['footer_copyright'] ?? null,
            'logo_url' => ! empty($settings['platform_logo']) ? asset('storage/' . $settings['platform_logo']) : null,
            'favicon_url' => ! empty($settings['platform_favicon']) ? asset('storage/' . $settings['platform_favicon']) : null,
            'primary' => $settings['brand_primary'] ?? '#0F766E',
            'secondary' => $settings['brand_secondary'] ?? '#14B8A6',
            'accent' => $settings['brand_accent'] ?? '#0EA5E9',
        ];
    }

    public function normalizePath(string $path): string
    {
        $path = '/' . trim(parse_url($path, PHP_URL_PATH) ?: '/', '/');
        return $path === '//' ? '/' : $path;
    }

    public function safeUrl(?string $url): ?string
    {
        if (blank($url)) {
            return null;
        }

        $url = trim($url);
        $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));

        if (str_starts_with($url, '//') || in_array($scheme, ['javascript', 'data', 'vbscript'], true)) {
            return null;
        }

        if ($scheme === '') {
            return str_starts_with($url, '/') ? $url : null;
        }

        return in_array($scheme, ['http', 'https'], true) ? $url : null;
    }

    public function forgetPage(string $path): void
    {
        Cache::forget('website.page.' . md5($this->normalizePath($path)));
    }
}
