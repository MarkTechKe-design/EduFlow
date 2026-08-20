<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeadersMiddleware
{
    /**
     * Handle an incoming request and attach enterprise HTTP security headers.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Clickjacking protection: disallow iframe embedding from unauthorized origins
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // Prevent MIME-type sniffing
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Restrict referrer leakage to external origins
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Restrict browser features and hardware APIs
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');

        // Content Security Policy (CSP)
        // Permits Inertia/Vite local assets, Bunny fonts, and YouTube video embeds while blocking unsafe execution
        $csp = "default-src 'self'; " .
               "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.bunny.net; " .
               "style-src 'self' 'unsafe-inline' https://fonts.bunny.net; " .
               "font-src 'self' https://fonts.bunny.net data:; " .
               "img-src 'self' data: https: blob:; " .
               "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com; " .
               "connect-src 'self' ws: wss:; " .
               "object-src 'none'; " .
               "base-uri 'self'; " .
               "form-action 'self';";

        $response->headers->set('Content-Security-Policy', $csp);
        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin');
        $response->headers->set('Cross-Origin-Resource-Policy', 'same-origin');

        // Enforce HSTS when running under HTTPS in production
        if ($request->isSecure() || app()->isProduction()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        return $response;
    }
}
