import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react';

export interface PublicFaqItem {
    id: number;
    question: string;
    answer: string;
    category?: string;
    slug?: string;
}

interface Props {
    faqs?: PublicFaqItem[];
    title?: string;
    subtitle?: string;
    showViewAll?: boolean;
}

export default function FaqSection({
    faqs = [],
    title = 'Frequently Asked Questions',
    subtitle = 'Everything you need to know about Kenya\'s modern school management platform.',
    showViewAll = true,
}: Props) {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleAccordion = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    if (!faqs || faqs.length === 0) {
        return null;
    }

    return (
        <section id="faq" className="py-20 bg-slate-50 border-t border-slate-200/80 text-slate-900">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                
                <div className="text-center space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 inline-flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Platform FAQs</span>
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
                        {title}
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
                        {subtitle}
                    </p>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, idx) => {
                        const isOpen = openIndex === idx;
                        return (
                            <div
                                key={faq.id || idx}
                                className={`rounded-2xl border transition-all duration-200 bg-white overflow-hidden ${
                                    isOpen
                                        ? 'border-indigo-500 shadow-md shadow-indigo-600/5 ring-1 ring-indigo-500/20'
                                        : 'border-slate-200/90 shadow-xs hover:border-slate-300'
                                }`}
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleAccordion(idx)}
                                    className="w-full py-4.5 px-6 text-left flex items-center justify-between gap-4 focus:outline-none"
                                    aria-expanded={isOpen}
                                >
                                    <span className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                                        {faq.question}
                                    </span>
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 ${
                                        isOpen ? 'bg-indigo-50 text-indigo-600 rotate-180' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        <ChevronDown className="w-4 h-4" />
                                    </div>
                                </button>

                                {isOpen && (
                                    <div className="px-6 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <p className="whitespace-pre-line">{faq.answer}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {showViewAll && (
                    <div className="text-center pt-4">
                        <Link
                            href="/faq"
                            className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                        >
                            <span>Have more questions? Browse all platform topics</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}

            </div>
        </section>
    );
}