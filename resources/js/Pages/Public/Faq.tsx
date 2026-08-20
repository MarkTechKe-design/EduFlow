import React, { useState, useMemo, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { Search, ChevronDown, HelpCircle, ArrowRight, RotateCcw, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

export interface FaqItem {
    id: number;
    question: string;
    answer: string;
    category: string;
    slug?: string;
    is_featured_on_homepage?: boolean;
}

interface Props {
    faqs: FaqItem[];
    categories: string[];
    navigation?: any[];
    footerNavigation?: any[];
    branding?: any;
}

export default function FaqPage({ faqs = [], categories = [], navigation, footerNavigation, branding }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [openId, setOpenId] = useState<number | null>(faqs[0]?.id || null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Filter pipeline: Category + Keyword Search across Question & Answer
    const filteredFaqs = useMemo(() => {
        return faqs.filter((faq) => {
            const matchesCat = selectedCategory === 'All' || faq.category === selectedCategory;
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch = 
                !query ||
                faq.question.toLowerCase().includes(query) ||
                faq.answer.toLowerCase().includes(query) ||
                (faq.category && faq.category.toLowerCase().includes(query));

            return matchesCat && matchesSearch;
        });
    }, [faqs, selectedCategory, searchQuery]);

    const allCategories = useMemo(() => {
        const unique = Array.from(new Set(faqs.map((f) => f.category).filter(Boolean)));
        return ['All', ...unique];
    }, [faqs]);

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

            {/* UNIFIED PUBLIC NAVBAR */}

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

                    {/* Horizontal Scroll Pill Track with Styled Scrollbar Fill */}
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
                                : faqs.filter((f) => f.category === cat).length;

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
                        <div className="space-y-1">
                            <h3 className="text-base font-bold text-slate-900">No questions matched your search</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                We couldn't find any questions matching "{searchQuery}". Try another keyword or browse all topics.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={resetFilters}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                        >
                            View All Questions
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredFaqs.map((faq) => {
                            const isOpen = openId === faq.id;
                            return (
                                <div
                                    key={faq.id}
                                    className={`rounded-2xl border transition-all bg-white overflow-hidden ${
                                        isOpen
                                            ? 'border-slate-300 shadow-sm ring-1 ring-slate-200'
                                            : 'border-slate-200/90 shadow-xs hover:border-slate-300'
                                    }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => setOpenId(isOpen ? null : faq.id)}
                                        className="w-full py-4.5 px-6 text-left flex items-center justify-between gap-4 focus:outline-none focus:bg-slate-50/50"
                                        aria-expanded={isOpen}
                                    >
                                        <div className="space-y-1">
                                            {faq.category && (
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                    {faq.category}
                                                </span>
                                            )}
                                            <div className="text-sm sm:text-base font-bold text-slate-950 leading-snug">
                                                {faq.question}
                                            </div>
                                        </div>

                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 ${
                                            isOpen ? 'bg-slate-100 text-slate-900 rotate-180' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            <ChevronDown className="w-4 h-4" />
                                        </div>
                                    </button>

                                    {isOpen && (
                                        <div className="px-6 pb-5 pt-2 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in duration-200">
                                            <p className="whitespace-pre-line leading-relaxed">{faq.answer}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Onboarding Banner */}
                <div className="mt-12 rounded-3xl bg-slate-950 text-white p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl border border-slate-800">
                    <div className="space-y-2 text-center sm:text-left">
                        <h3 className="text-lg sm:text-xl font-extrabold text-white">Have a specific question for your school?</h3>
                        <p className="text-xs sm:text-sm text-slate-300">
                            Our deployment engineers are ready to assist with CBC rubrics, Daraja M-Pesa setup, and data migration.
                        </p>
                    </div>
                    <Link
                        href="/register"
                        className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-bold text-xs sm:text-sm text-white shrink-0 shadow-md transition-all flex items-center gap-2"
                    >
                        <span>Setup My School</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>

            </main></MarketingLayout>
    );
}