<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" suppressHydrationWarning>
    <head>
        <meta name="csrf-token" content="{{ csrf_token() }}">
    @php
        $favicon = \App\Models\PlatformSetting::get('platform_favicon');
    @endphp
    @if($favicon)
        <link rel="icon" href="{{ asset('storage/' . $favicon) }}">
    @else
        <link rel="icon" href="{{ asset('favicon.svg') }}" type="image/svg+xml">
        <link rel="alternate icon" href="{{ asset('favicon.ico') }}">
    @endif
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title inertia>{{ config('app.name', 'EduFlow') }}</title>
        @php
            $configuredFavicon = app(\App\Services\WebsiteContentService::class)->branding()['favicon_url'] ?? null;
        @endphp
        <link id="app-favicon" rel="icon" type="image/svg+xml" href="{{ $configuredFavicon ?: asset('favicon.svg') }}" />
        <script type="text/javascript">
            window.Ziggy = @json((new \Tighten\Ziggy\Ziggy)->toArray());
        </script>
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
            <!-- Modern Typography Engine -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>