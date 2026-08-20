<?php

namespace App\Http\Controllers;

use App\Models\Faq;
use App\Services\WebsiteContentService;
use Inertia\Inertia;
use Inertia\Response;

class PublicFaqController extends Controller
{
    public function __construct(private readonly WebsiteContentService $website){}

    public function index(): Response
    {
        $faqs = Faq::published()
            ->select(['id', 'question', 'slug', 'answer', 'category', 'is_featured_on_homepage', 'sort_order'])
            ->get();

        $categories = $faqs->pluck('category')->unique()->values();

        return Inertia::render('Public/Faq', [
            'faqs' => $faqs,
            'categories' => $categories,
            'navigation' => $this->website->menu('header'),
            'footerNavigation' => $this->website->menu('footer'),
            'branding' => $this->website->branding(),
        ]);
    }
}