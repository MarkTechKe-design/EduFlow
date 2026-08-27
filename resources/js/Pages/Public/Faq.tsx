import React, { useState, useMemo, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Search, ChevronDown, HelpCircle, ArrowRight, RotateCcw, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

export interface FaqItem {
    id: number;
    question: string;
    answer: string;
    category: string | { title?: string; category?: string; name?: string };
    slug?: string;
    is_featured_on_homepage?: boolean;
}

interface Props {
    faqs: FaqItem[];
    categories?: (string | { title?: string; category?: string; name?: string })[];
    navigation?: any[];
    footerNavigation?: any[];
    branding?: any;
}

// Helper to safely extract string label from either a string or an object { title, category, name }
function extractCategoryName(cat: any): string {
    if (!cat) return 'General';
    if (typeof cat === 'string') return cat;
    if (typeof cat === 'object') {
        return cat.category || cat.title || cat.name || 'General';
    }
    return String(cat);
}

export default function FaqPage({ faqs = [], categories = [], navigation, footerNavigation, branding }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [openId, setOpenId] = useState<number | null>(faqs[0]?.id || null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Normalize all categories into unique, clean string labels
    const allCategories = useMemo(() => {
        const extracted = faqs.map((f) => extractCategoryName(f.category)).filter(Boolean);
        const propCategories = (categories || []).map((c) => extractCategoryName(c)).filter(Boolean);
        const unique = Array.from(new Set([...extracted, ...propCategories]));
        return ['All', ...unique];
    }, [faqs, categories]);

    // Filter pipeline: Category + Keyword Search across Question & Answer
    const filteredFaqs = useMemo(() => {
        return faqs.filter((faq) => {
            const faqCatStr = extractCategoryName(faq.category);
            const matchesCat = selectedCategory === 'All' || faqCatStr.toLowerCase() === selectedCategory.toLowerCase();
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch =
                !query ||
                faq.question.toLowerCase().includes(query) ||
                faq.answer.toLowerCase().includes(query) ||
                faqCatStr.toLowerCase().includes(query);

            return matchesCat && matchesSearch;
        });
    }, [faqs, selectedCategory, searchQuery]);

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedCategory('All');
    };

    const scrollCategories = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const scrollAmount = direction === 'left' ? -240 : 240;
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <MarketingLayout title="Frequently Asked Questions" navigation={navigation} footerNavigation={footerNavigation} branding={branding} currentPath="/faq">
            <Head title="Frequently Asked Questions (FAQ) | EduFlow Kenya" />

            {/* HERO SECTION */}
            <section className="pt-16 pb-12 sm:pt-20 sm:pb-16 bg-white border-b border-slate-200/80">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 inline-flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Platform Knowledge Base</span>
                    </span>

                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 leading-tight">
                        Frequently Asked Questions
                    </h1>

                    <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Find verified answers regarding CBC assessment rubrics, Lipa na M-Pesa automated fee ledgers, student admissions, and school management workflows.
                    </p>

                    {/* Search Field */}
                    <div className="max-w-xl mx-auto pt-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                                <Search className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search questions about fees, CBC, attendance, M-Pesa..."
                                className="h-12 w-full pl-11 pr-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all shadow-xs"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* MAIN KNOWLEDGE BASE CONTENT */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 flex-1 w-full">
                {/* SCROLLABLE TOPIC FILTER TRACK CONTAINER */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                        <span className="font-semibold flex items-center gap-1.5">
                            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                            <span>Browse by Topic</span>
                        </span>

                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={() => scrollCategories('left')}
                                className="p-1 rounded-lg hover:bg-slate-200/80 text-slate-600 transition-colors focus:outline-none"
                                aria-label="Scroll topics left"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                type="button"
                                onClick={() => scrollCategories('right')}
                                className="p-1 rounded-lg hover:bg-slate-200/80 text-slate-600 transition-colors focus:outline-none"
                                aria-label="Scroll topics right"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Horizontal Scroll Pill Track */}
                    <div
                        ref={scrollContainerRef}
                        className="flex items-center gap-2 overflow-x-auto pb-3 pt-1 px-1 scroll-smooth select-none focus:outline-none"
                        style={{
                            scrollbarWidth: 'thin',
                            scrollbarColor: '#CBD5E1 #F1F5F9',
                        }}
                    >
                        {allCategories.map((cat) => {
                            const isSelected = selectedCategory === cat;
                            const count = cat === 'All'
                                ? faqs.length
                                : faqs.filter((f) => extractCategoryName(f.category).toLowerCase() === cat.toLowerCase()).length;

                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all border flex items-center gap-2 shadow-2xs ${
                                        isSelected
                                            ? 'bg-slate-950 text-white border-slate-950 shadow-xs'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    <span>{cat}</span>
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Result Counter & Reset Button */}
                <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-200 pb-3">
                    <span className="font-semibold">
                        Showing <strong className="text-slate-900">{filteredFaqs.length}</strong> of {faqs.length} questions
                    </span>
                    {(searchQuery || selectedCategory !== 'All') && (
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 focus:outline-none"
                        >
                            <RotateCcw className="w-3 h-3" />
                            <span>Reset filters</span>
                        </button>
                    )}
                </div>

                {/* FAQ Accordion List */}
                {filteredFaqs.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
                        <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
                        <h3 className="text-base font-bold text-slate-900">No matching questions found</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            We couldn't find any questions matching your filter or keyword. Try searching for other terms or reset the filters.
                        </p>
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredFaqs.map((faq) => {
                            const isOpen = openId === faq.id;
                            const catName = extractCategoryName(faq.category);

                            return (
                                <div
                                    key={faq.id}
                                    className={`rounded-2xl border transition-all overflow-hidden ${
                                        isOpen
                                            ? 'bg-white border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                                            : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setOpenId(isOpen ? null : faq.id)}
                                        className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 focus:outline-none"
                                    >
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                                {catName}
                                            </span>
                                            <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                                                {faq.question}
                                            </h3>
                                        </div>
                                        <div className={`p-1.5 rounded-full shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 bg-emerald-50 text-emerald-600' : 'text-slate-400 bg-slate-50'}`}>
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </button>

                                    {isOpen && (
                                        <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/40">
                                            <div className="pt-2 whitespace-pre-line">
                                                {faq.answer}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </MarketingLayout>
    );
}