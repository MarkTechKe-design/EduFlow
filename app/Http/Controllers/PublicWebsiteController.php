<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Models\Faq;
use App\Models\Package;
use App\Models\WebsiteLead;
use App\Services\WebsiteContentService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class PublicWebsiteController extends Controller
{
    public function __construct(private readonly WebsiteContentService $website)
    {
    }

    public function page(Request $request): Response|RedirectResponse
    {
        $path = $this->website->normalizePath('/' . ltrim($request->path(), '/'));
        if ($path === '/.' || $path === '/index.php') {
            $path = '/';
        }

        if ($redirect = $this->website->redirectFor($path)) {
            $target = $this->website->safeUrl($redirect->to_url);
            if ($target !== null) {
                return redirect($target, $redirect->status_code);
            }
        }

        $page = $this->website->publishedPage($path);

        return Inertia::render('Public/WebsitePage', [
            'page' => $page,
            'homepageFaqs' => Schema::hasTable('faqs')
                ? Faq::query()->published()->featuredOnHomepage()->orderBy('sort_order')->get(['id', 'question', 'answer', 'category', 'slug'])
                : collect(),
            'packages' => Schema::hasTable('packages')
                ? Package::query()->where('is_active', true)->where('is_public', true)->with('modules')->orderBy('price_monthly')->get()
                : collect(),
            'coupons' => Schema::hasTable('coupons')
                ? Coupon::query()->where('is_active', true)->where(fn ($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))->get(['id', 'code', 'type', 'value', 'description', 'expires_at'])
                : collect(),
            'navigation' => $this->website->menu('header'),
            'footerNavigation' => $this->website->menu('footer'),
            'branding' => $this->website->branding(),
            'requestedPath' => $path,
        ]);
    }

    public function lead(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'form_type' => 'required|in:contact,consultation,demo,quote,newsletter,support',
            'name' => 'required|string|max:150',
            'email' => 'required|email|max:180',
            'phone' => 'nullable|string|max:40',
            'organization' => 'nullable|string|max:180',
            'message' => 'nullable|string|max:5000',
        ]);

        $key = 'website-lead:' . hash('sha256', strtolower($data['email']) . '|' . ($request->ip() ?? 'unknown'));
        if (RateLimiter::tooManyAttempts($key, 5)) {
            abort(429, 'Too many requests. Please try again later.');
        }
        RateLimiter::hit($key, 3600);

        WebsiteLead::create([
            'type' => $data['form_type'],
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'organization' => $data['organization'] ?? null,
            'message' => $data['message'] ?? null,
            'payload' => $request->except(['name', 'email', 'phone', 'organization', 'message', 'form_type']),
            'source' => $request->headers->get('referer'),
            'ip_hash' => hash_hmac('sha256', $request->ip() ?? 'unknown', (string) config('app.key')),
            'user_agent' => $request->userAgent(),
        ]);

        return back()->with('success', 'Thanks. Your request has been received.');
    }
}