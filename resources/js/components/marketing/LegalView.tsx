import { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import {
    ShieldCheck, Lock, FileText, Scale, Database, AlertCircle,
    CheckCircle2, ArrowRight, BookOpen, ExternalLink, Calendar,
    Building2, FileCheck, Landmark, Check
} from 'lucide-react';

interface SectionItem {
    id?: number;
    identifier: string;
    block_type: string;
    sort_order?: number;
    content: {
        badge?: string;
        title?: string;
        subtitle?: string;
        body?: string;
        [key: string]: any;
    } | null;
}

interface Props {
    type: 'privacy' | 'cookies' | 'terms' | 'saas-terms' | 'security' | 'disclaimer' | 'governance';
    branding?: any;
    page?: any;
    sections?: SectionItem[];
}

const LEGAL_DOCS = [
    { type: 'privacy', label: 'Privacy Policy', path: '/privacy', icon: ShieldCheck, tag: 'Data Protection Act 2019' },
    { type: 'cookies', label: 'Cookie Policy', path: '/cookies', icon: Database, tag: 'Zero Ad Tracking' },
    { type: 'terms', label: 'Terms of Service', path: '/terms', icon: Scale, tag: 'Acceptable Use' },
    { type: 'saas-terms', label: 'SaaS Agreement', path: '/saas-terms', icon: Landmark, tag: '99.5% SLA' },
    { type: 'security', label: 'Security Controls', path: '/security', icon: Lock, tag: 'Encryption Matrix' },
    { type: 'disclaimer', label: 'Legal Disclaimer', path: '/disclaimer', icon: AlertCircle, tag: 'Regulatory Notice' },
];

export default function LegalView({ type, branding, page, sections = [] }: Props) {
    const currentDoc = LEGAL_DOCS.find((d) => d.type === type) || LEGAL_DOCS[0];

    function renderInlineText(text: string) {
        if (!text) return null;

        // Clean out stray asterisks or format **bold** into <strong>
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                const cleanWord = part.slice(2, -2).replace(/\*/g, '');
                return <strong key={i} className="font-semibold text-slate-900">{cleanWord}</strong>;
            }
            // Remove any lone unparsed asterisks in plain text
            return part.replace(/\*\*/g, '').replace(/^\s*-\s*/, '');
        });
    }

    function renderFormattedBody(bodyText: string) {
        if (!bodyText) return null;

        // Split text by lines to handle both double-breaks and inline list items
        const rawLines = bodyText.replace(/\r\n/g, '\n').split('\n');
        const elements: React.ReactNode[] = [];

        let currentList: string[] = [];

        function flushList(keyPrefix: number) {
            if (currentList.length > 0) {
                const listItems = [...currentList];
                currentList = [];
                elements.push(
                    <ul key={`list-${keyPrefix}`} className="space-y-2.5 my-3 pl-1">
                        {listItems.map((itemText, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="flex-1">{renderInlineText(itemText)}</span>
                            </li>
                        ))}
                    </ul>
                );
            }
        }

        rawLines.forEach((line, index) => {
            const trimmed = line.trim();
            if (!trimmed) {
                flushList(index);
                return;
            }

            // 1. Heading 3 (### Heading or A. Subheading / B. Subheading)
            if (trimmed.startsWith('### ') || /^[A-Z]\.\s+/.test(trimmed)) {
                flushList(index);
                const headingText = trimmed.replace(/^###\s*/, '');
                elements.push(
                    <h4 key={`h4-${index}`} className="text-sm sm:text-base font-bold text-slate-900 pt-4 pb-1 border-b border-slate-100">
                        {renderInlineText(headingText)}
                    </h4>
                );
                return;
            }

            // 2. Bullet list items starting with '-' or '*'
            if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.includes(' - **')) {
                // If multiple bullet points were condensed into one line with ' - ', split them
                if (trimmed.includes(' - **')) {
                    const subParts = trimmed.split(' - ').filter(Boolean);
                    subParts.forEach((sp) => currentList.push(sp));
                } else {
                    currentList.push(trimmed.replace(/^[-*]\s+/, ''));
                }
                return;
            }

            // 3. Regular Paragraphs
            flushList(index);
            elements.push(
                <p key={`p-${index}`} className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed my-2">
                    {renderInlineText(trimmed)}
                </p>
            );
        });

        flushList(rawLines.length);
        return elements;
    }

    return (
        <div className="pt-8 pb-16 sm:pt-12 sm:pb-24 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

                {/* Hero Header */}
                <div className="text-center max-w-3xl mx-auto space-y-4 pt-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider shadow-xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Kenyan Institutional Governance Suite</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
                        {page?.title || currentDoc.label}
                    </h1>

                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                        Last Updated: 19 August 2026 • Compliant with Kenya Data Protection Act (2019) & Basic Education Act
                    </p>
                </div>

                {/* Document Switcher Tabs */}
                <div className="flex items-center justify-center gap-2 overflow-x-auto pb-2 text-xs">
                    {LEGAL_DOCS.map((doc) => {
                        const Icon = doc.icon;
                        const isActive = doc.type === type;
                        return (
                            <Link
                                key={doc.type}
                                href={doc.path}
                                className={`px-4 py-2.5 rounded-2xl font-bold transition-all flex items-center gap-2 whitespace-nowrap shadow-xs ${
                                    isActive
                                        ? 'bg-slate-900 text-white shadow-md'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                                <span>{doc.label}</span>
                            </Link>
                        );
                    })}
                </div>

                {/* 2-Column Layout: Sidebar Index + Document Body */}
                <div className="grid lg:grid-cols-12 gap-8 items-start max-w-6xl mx-auto">

                    {/* Left Sticky Index */}
                    <div className="hidden lg:block lg:col-span-4 sticky top-28 space-y-4">
                        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-emerald-600" />
                                <span>Sections in this Charter</span>
                            </h3>

                            <nav className="space-y-1.5 text-xs font-medium">
                                {sections.map((sec, idx) => (
                                    <a
                                        key={idx}
                                        href={`#${sec.identifier}`}
                                        className="block p-2.5 rounded-xl text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/50 transition-colors truncate"
                                    >
                                        {sec.content?.title || `Section ${idx + 1}`}
                                    </a>
                                ))}
                            </nav>

                            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-[11px] text-emerald-950 space-y-1.5">
                                <span className="font-bold flex items-center gap-1 text-emerald-800">
                                    <Building2 className="w-3.5 h-3.5" />
                                    Data Controller Independence
                                </span>
                                <p className="text-slate-600 font-normal leading-relaxed">
                                    Schools retain exclusive ownership over student marks, fee registers, and admission files under the Kenya DPA (2019).
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Document Sections */}
                    <div className="lg:col-span-8 space-y-8">
                        {sections && sections.length > 0 ? (
                            sections.map((sec, idx) => {
                                const c = sec.content || {};
                                return (
                                    <section
                                        id={sec.identifier}
                                        key={sec.id || idx}
                                        className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-4 scroll-mt-28 hover:border-slate-300 transition-all"
                                    >
                                        {c.badge && (
                                            <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                                                {c.badge}
                                            </span>
                                        )}

                                        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight leading-snug">
                                            {c.title}
                                        </h2>

                                        {c.subtitle && (
                                            <p className="text-xs sm:text-sm font-medium text-slate-500 pb-2 border-b border-slate-100">
                                                {c.subtitle}
                                            </p>
                                        )}

                                        <div className="space-y-3 pt-1">
                                            {renderFormattedBody(c.body || '')}
                                        </div>
                                    </section>
                                );
                            })
                        ) : (
                            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-3">
                                <FileText className="w-12 h-12 text-slate-300 mx-auto" />
                                <h3 className="text-base font-bold text-slate-800">No content published for this charter yet.</h3>
                                <p className="text-xs text-slate-500 font-normal">Edit sections in the SuperAdmin CMS Studio to configure terms.</p>
                            </div>
                        )}

                        {/* Bottom CTA */}
                        <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-800 shadow-md">
                            <div className="space-y-1 text-center sm:text-left">
                                <h4 className="font-bold text-sm text-white">Have questions about school compliance or data safety?</h4>
                                <p className="text-xs text-slate-400 font-normal">Our legal and technical desk is available to assist school management boards.</p>
                            </div>
                            <Link
                                href="/contact"
                                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 transition-colors shadow-xs"
                            >
                                Contact Governance Desk
                            </Link>
                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
}