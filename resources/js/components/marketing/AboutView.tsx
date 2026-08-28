import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import {
    Sparkles,
    ArrowRight,
    Check,
    ShieldCheck,
    Clock,
    Smile,
    FolderKanban,
    BookOpen,
    Wallet,
    Users,
    Smartphone,
    CheckCircle2,
    Building2,
    GraduationCap,
    Activity,
    Compass,
    Target,
    HeartHandshake,
    Mail,
    Phone,
    MessageCircle,
    Globe,
    Sliders,
    Lock,
    RefreshCw,
    Layers,
    FileSpreadsheet,
    ArrowUpRight,
    X,
    User
} from 'lucide-react';

export interface TeamMember {
    name: string;
    role: string;
    bio?: string;
    contribution?: string;
    image_url?: string;
    whatsapp?: string;
    email?: string;
    phone?: string;
    linkedin?: string;
}

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
        image_url?: string;
        image_alt?: string;
        facts?: Array<{ label: string; desc: string }>;
        before?: string[];
        after?: string[];
        mission_title?: string;
        mission_body?: string;
        vision_title?: string;
        vision_body?: string;
        values?: Array<{ title: string; desc: string }>;
        points?: Array<{ title?: string; desc?: string } | string>;
        setup_steps?: Array<{ num: string; title: string; desc: string }>;
        daily_steps?: Array<{ num: string; title: string; desc: string }>;
        control_note?: string;
        capabilities?: Array<{ title: string; desc: string }>;
        roles?: Array<{ title: string; desc: string }>;
        groups?: Array<{ role: string; accent: string; desc: string }>;
        team_members?: TeamMember[];
        pillars?: Array<{ title: string; desc: string }>;
        button?: string;
        [key: string]: any;
    } | null;
}

interface Props {
    branding?: any;
    page?: any;
    sections?: SectionItem[];
}

export const formatWhatsAppUrl = (phone?: string): string | null => {
    if (!phone) return null;
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 9 ? `https://wa.me/${digits}` : null;
};

export const formatEmailUrl = (email?: string): string | null => {
    if (!email || !email.includes('@')) return null;
    return `mailto:${encodeURIComponent(email.trim())}`;
};

export const formatPhoneUrl = (phone?: string): string | null => {
    if (!phone) return null;
    const cleaned = phone.replace(/[^0-9+]/g, '');
    return cleaned.length >= 7 ? `tel:${cleaned}` : null;
};

export const formatLinkedInUrl = (url?: string): string | null => {
    if (!url) return null;
    const trimmed = url.trim();
    if (trimmed.startsWith('https://www.linkedin.com/') || trimmed.startsWith('https://linkedin.com/')) {
        return trimmed;
    }
    return trimmed.startsWith('in/') ? `https://linkedin.com/${trimmed}` : null;
};

export default function AboutView({ branding, page, sections = [] }: Props) {
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedMember(null);
            }
        };
        if (selectedMember) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedMember]);

    const getSec = (id: string) => sections.find((s) => s.identifier === id)?.content;

    const hero = getSec('about-hero');
    const atAGlance = getSec('about-at-a-glance');
    const whyWeBuilt = getSec('about-why-we-built-this');
    const theSwitch = getSec('about-the-switch');
    const missionVision = getSec('about-mission-vision');
    const values = getSec('about-values');
    const painPoints = getSec('about-pain-points');
    const lifecycle = getSec('about-lifecycle-steps');
    const platform = getSec('about-platform-showcase');
    const mobile = getSec('about-mobile-experience');
    const whoItIsFor = getSec('about-who-it-is-for');
    const kenyaSpecific = getSec('about-kenyan-specific');
    const team = getSec('about-team');
    const trust = getSec('about-trust');
    const cta = getSec('about-cta');

    return (
        <div className="bg-slate-50 min-h-screen selection:bg-emerald-500 selection:text-white">
            {/* 1. HERO EDITORIAL */}
            <section className="relative pt-24 pb-20 sm:pt-36 sm:pb-28 overflow-hidden bg-gradient-to-b from-emerald-50/40 via-white to-slate-50 border-b border-slate-200/80">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                            <span className="inline-block px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                                {hero?.badge || 'Built for the people behind great schools'}
                            </span>

                            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-950 tracking-tight leading-[1.1]">
                                {hero?.title || 'We watched real schools drown in admin—so we built one calm system.'}
                            </h1>

                            <p className="text-lg sm:text-2xl text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                {hero?.subtitle || 'School administration requires coordinating academic grading, fee collections, attendance, and parent communication in one reliable platform.'}
                            </p>

                            {hero?.body && (
                                <p className="text-sm sm:text-base text-slate-500 max-w-xl mx-auto lg:mx-0 font-normal">
                                    {hero.body}
                                </p>
                            )}
                        </div>

                        <div className="lg:col-span-5">
                            {hero?.image_url && (
                                <div className="rounded-3xl overflow-hidden border border-slate-200/80 shadow-2xl bg-white aspect-[4/3]">
                                    <img
                                        src={hero.image_url}
                                        alt={hero.image_alt || 'EduFlow school campus environment'}
                                        className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700 ease-out"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* 2. AT A GLANCE (Verified Facts Strip) */}
            {atAGlance?.facts && atAGlance.facts.length > 0 && (
                <section className="py-12 bg-white border-b border-slate-200/80">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                            {atAGlance.facts.map((fact, idx) => (
                                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1.5">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">{fact.label}</h4>
                                    </div>
                                    <p className="text-xs text-slate-600 leading-relaxed">{fact.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 3. WHY WE BUILT THIS */}
            {whyWeBuilt && (
                <section className="py-20 sm:py-28 bg-slate-50 border-b border-slate-200/80">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
                            {whyWeBuilt.badge || 'Why We Built This'}
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                            {whyWeBuilt.title}
                        </h2>
                        {whyWeBuilt.subtitle && (
                            <p className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed">
                                {whyWeBuilt.subtitle}
                            </p>
                        )}
                        {whyWeBuilt.body && (
                            <p className="text-sm sm:text-base text-slate-600 leading-relaxed text-left bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs">
                                {whyWeBuilt.body}
                            </p>
                        )}
                    </div>
                </section>
            )}

            {/* 4. THE SWITCH (Before vs After) */}
            {theSwitch && (theSwitch.before || theSwitch.after) && (
                <section className="py-24 sm:py-32 bg-white border-b border-slate-200/80">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                        <div className="text-center space-y-3 max-w-2xl mx-auto">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">{theSwitch.badge || 'The Switch'}</span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">{theSwitch.title}</h2>
                            <p className="text-slate-600 font-medium">{theSwitch.subtitle}</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-slate-50 rounded-3xl p-8 sm:p-10 border border-slate-200/80 space-y-6">
                                <span className="inline-block px-3 py-1 rounded-full bg-slate-200/70 text-slate-700 text-xs font-bold uppercase tracking-wider">
                                    Before EduFlow
                                </span>
                                <ul className="space-y-4">
                                    {theSwitch.before?.map((item: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-3.5 text-sm sm:text-base text-slate-600 leading-relaxed">
                                            <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✕</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="bg-emerald-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl space-y-6">
                                <span className="inline-block px-3 py-1 rounded-full bg-emerald-800 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-700">
                                    With EduFlow
                                </span>
                                <ul className="space-y-4">
                                    {theSwitch.after?.map((item: string, idx: number) => (
                                        <li key={idx} className="flex items-start gap-3.5 text-sm sm:text-base text-emerald-100 leading-relaxed">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* 5. MISSION & VISION */}
            {missionVision && (
                <section className="py-20 sm:py-28 bg-slate-50 border-b border-slate-200/80">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                        <div className="text-center space-y-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">{missionVision.badge || 'Direction & Purpose'}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xs space-y-4">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                                    <Target className="w-5 h-5" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-950">{missionVision.mission_title || 'Our Mission'}</h3>
                                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{missionVision.mission_body}</p>
                            </div>

                            <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xs space-y-4">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                                    <Compass className="w-5 h-5" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-950">{missionVision.vision_title || 'Our Vision'}</h3>
                                <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{missionVision.vision_body}</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* 6. OUR VALUES (All 5 Principles) */}
            {values?.values && values.values.length > 0 && (
                <section className="py-24 sm:py-32 bg-white border-b border-slate-200/80">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                        <div className="text-center space-y-3 max-w-2xl mx-auto">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">{values.badge || 'Our Values'}</span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">{values.title}</h2>
                            <p className="text-slate-600 font-medium">{values.subtitle}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {values.values.map((v, idx) => (
                                <div key={idx} className="bg-slate-50 rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-3">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                                        <HeartHandshake className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-950">{v.title}</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">{v.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 7. SOUND FAMILIAR? (Pain Points Grid) */}
            {painPoints?.points && painPoints.points.length > 0 && (
                <section className="py-24 sm:py-32 bg-slate-50 border-b border-slate-200/80">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                        <div className="text-center space-y-3">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">{painPoints.badge || 'Sound Familiar?'}</span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">{painPoints.title}</h2>
                            <p className="text-slate-600 font-medium max-w-xl mx-auto">{painPoints.subtitle}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                            {painPoints.points.map((pt: any, idx: number) => (
                                <div key={idx} className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xs space-y-3">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                                        {idx === 0 ? <Wallet className="w-5 h-5" /> : idx === 1 ? <BookOpen className="w-5 h-5" /> : idx === 2 ? <FolderKanban className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-950">{typeof pt === 'string' ? pt : pt.title}</h3>
                                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{typeof pt === 'string' ? '' : pt.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 8. LIFECYCLE STEPS & CONTINUOUS OPERATIONS */}
            {lifecycle && (
                <section className="py-24 sm:py-32 bg-white border-b border-slate-200/80">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                        <div className="text-center space-y-3 max-w-2xl mx-auto">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">{lifecycle.badge || 'Operational Lifecycle'}</span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">{lifecycle.title}</h2>
                            <p className="text-slate-600 font-medium">{lifecycle.subtitle}</p>
                        </div>

                        <div className="space-y-8">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Phase 1: Term Setup & Configuration</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {lifecycle.setup_steps?.map((st: any, idx: number) => (
                                    <div key={idx} className="bg-slate-50 rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">{st.num}</div>
                                        <h3 className="text-lg font-bold text-slate-950">{st.title}</h3>
                                        <p className="text-slate-600 text-sm leading-relaxed">{st.desc}</p>
                                    </div>
                                ))}
                            </div>

                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 pt-4">Phase 2: Continuous Daily Operations & Review</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {lifecycle.daily_steps?.map((st: any, idx: number) => (
                                    <div key={idx} className="bg-slate-50 rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-3">
                                        <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">{st.num}</div>
                                        <h3 className="text-lg font-bold text-slate-950">{st.title}</h3>
                                        <p className="text-slate-600 text-sm leading-relaxed">{st.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {lifecycle.control_note && (
                            <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm leading-relaxed flex items-center gap-3">
                                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                                <span>{lifecycle.control_note}</span>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* 9. PLATFORM SHOWCASE (Capabilities + Real Media) */}
            {platform && (
                <section className="py-24 sm:py-32 bg-slate-50 border-b border-slate-200/80">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                        <div className="text-center space-y-3 max-w-2xl mx-auto">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">{platform.badge || 'Platform Capabilities'}</span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">{platform.title}</h2>
                            <p className="text-slate-600 font-medium">{platform.subtitle}</p>
                        </div>

                        {platform.capabilities && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {platform.capabilities.map((cap: any, idx: number) => (
                                    <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                            {idx === 0 ? <Wallet className="w-4 h-4" /> : idx === 1 ? <Users className="w-4 h-4" /> : idx === 2 ? <GraduationCap className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-950">{cap.title}</h3>
                                        <p className="text-slate-600 text-sm leading-relaxed">{cap.desc}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {platform.image_url && (
                            <div className="rounded-3xl overflow-hidden border border-slate-200/80 shadow-xl bg-white p-4 sm:p-6">
                                <img src={platform.image_url} alt={platform.image_alt || 'EduFlow modules'} className="w-full h-auto rounded-2xl object-cover" />
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* 10. MOBILE EXPERIENCE */}
            {mobile?.roles && (
                <section className="py-24 sm:py-32 bg-white border-b border-slate-200/80">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                        <div className="text-center space-y-3 max-w-2xl mx-auto">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">{mobile.badge || 'Mobile Workflows'}</span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">{mobile.title}</h2>
                            <p className="text-slate-600 font-medium">{mobile.subtitle}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {mobile.roles.map((r: any, idx: number) => (
                                <div key={idx} className="bg-slate-50 rounded-3xl p-8 border border-slate-200/80 shadow-xs space-y-4">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                                        <Smartphone className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-950">{r.title}</h3>
                                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed">{r.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 11. WHO IT IS FOR */}
            {whoItIsFor?.groups && (
                <section className="py-24 sm:py-32 bg-slate-50 border-b border-slate-200/80">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                        <div className="text-center space-y-3">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">{whoItIsFor.badge || 'User Roles'}</span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">{whoItIsFor.title}</h2>
                            <p className="text-slate-600 font-medium">{whoItIsFor.subtitle}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {whoItIsFor.groups.map((g: any, idx: number) => (
                                <div key={idx} className={`bg-white rounded-3xl p-8 border-t-4 border-${g.accent || 'emerald'}-600 shadow-xs space-y-4`}>
                                    <div className={`w-10 h-10 rounded-xl bg-${g.accent || 'emerald'}-100 text-${g.accent || 'emerald'}-800 flex items-center justify-center font-bold`}>
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-950">{g.role}</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed">{g.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 12. KENYAN EDUCATIONAL CONTEXT */}
            {kenyaSpecific && (
                <section className="py-24 sm:py-32 bg-emerald-700 text-white relative overflow-hidden">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
                        <div className="text-center space-y-4 max-w-3xl mx-auto">
                            <span className="inline-block px-3.5 py-1.5 rounded-full bg-emerald-800 text-emerald-200 text-xs font-bold uppercase tracking-widest border border-emerald-600">
                                {kenyaSpecific.badge || 'Kenyan Educational Context'}
                            </span>
                            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">{kenyaSpecific.title}</h2>
                            <p className="text-lg sm:text-xl text-emerald-100 font-medium">{kenyaSpecific.subtitle}</p>
                        </div>

                        {kenyaSpecific.points && (
                            <div className="bg-emerald-800/80 rounded-3xl p-8 border border-emerald-600 max-w-3xl mx-auto space-y-4">
                                {kenyaSpecific.points.map((pt: any, idx: number) => (
                                    <div key={idx} className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                                        <p className="text-sm sm:text-base text-emerald-50">{typeof pt === 'string' ? pt : pt.desc || pt.title}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {kenyaSpecific.image_url && (
                            <div className="rounded-3xl overflow-hidden border border-emerald-600 shadow-2xl bg-emerald-800 p-4 sm:p-6 max-w-4xl mx-auto">
                                <img src={kenyaSpecific.image_url} alt={kenyaSpecific.image_alt || 'Kenyan school operations'} className="w-full h-auto rounded-2xl object-cover" />
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* 13. MEET THE TEAM — STRICTLY MODERNIZED EDITORIAL PROFILES */}
            {team?.team_members && team.team_members.length > 0 && (
                <section className="py-24 sm:py-32 bg-slate-50 border-b border-slate-200/80">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                        <div className="text-center space-y-4 max-w-3xl mx-auto">
                            <span className="inline-block px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-widest">
                                {team.badge || 'The People Behind EduFlow'}
                            </span>
                            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
                                {team.title || 'Built by people who understand the work behind the system.'}
                            </h2>
                            <p className="text-slate-600 text-base sm:text-lg font-medium leading-relaxed">
                                {team.subtitle || team.body || 'EduFlow brings together product design, school administration, and dependable infrastructure to support institutions across Kenya.'}
                            </p>
                        </div>

                        {/* Responsive Team Grid matching member count */}
                        <div className={`grid gap-8 max-w-5xl mx-auto ${team.team_members.length === 1 ? 'grid-cols-1 max-w-xl' : team.team_members.length === 2 ? 'grid-cols-1 md:grid-cols-2' : team.team_members.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
                            {team.team_members.map((member: TeamMember, idx: number) => {
                                const waUrl = formatWhatsAppUrl(member.whatsapp);
                                const mailUrl = formatEmailUrl(member.email);
                                const telUrl = formatPhoneUrl(member.phone);
                                const inUrl = formatLinkedInUrl(member.linkedin);
                                const hasContact = waUrl || mailUrl || telUrl || inUrl;

                                return (
                                    <div
                                        key={idx}
                                        className="group bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-xl hover:border-emerald-300 transition-all duration-300 flex flex-col justify-between overflow-hidden"
                                    >
                                        {/* Clickable Profile Card Area */}
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            aria-label={`Open profile for ${member.name}`}
                                            onClick={() => setSelectedMember(member)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    setSelectedMember(member);
                                                }
                                            }}
                                            className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 rounded-t-3xl"
                                        >
                                            {/* Large Editorial Profile Image */}
                                            <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 border-b border-slate-100">
                                                {member.image_url ? (
                                                    <img
                                                        src={member.image_url}
                                                        alt={`Portrait of ${member.name}`}
                                                        className="w-full h-full object-cover object-top transform group-hover:scale-105 transition-transform duration-500 ease-out"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100 text-emerald-800">
                                                        <User className="w-16 h-16 opacity-40" />
                                                    </div>
                                                )}
                                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-950/80 text-white text-xs font-medium backdrop-blur-xs shadow-md">
                                                        <span>View Profile</span>
                                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Summary Context */}
                                            <div className="p-6 sm:p-7 space-y-3">
                                                <div className="space-y-1">
                                                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 font-mono">
                                                        {member.role}
                                                    </span>
                                                    <h3 className="text-xl font-bold text-slate-950 group-hover:text-emerald-700 transition-colors">
                                                        {member.name}
                                                    </h3>
                                                </div>

                                                {member.bio && (
                                                    <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                                                        {member.bio}
                                                    </p>
                                                )}

                                                {member.contribution && (
                                                    <p className="text-xs text-slate-500 italic pt-1 border-t border-slate-100 line-clamp-2">
                                                        {member.contribution}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Contact Actions Row */}
                                        {hasContact && (
                                            <div className="px-6 pb-6 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                                                {/* Primary action if available */}
                                                {waUrl ? (
                                                    <a
                                                        href={waUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        aria-label={`Chat on WhatsApp with ${member.name}`}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors border border-emerald-200/60 shadow-xs"
                                                    >
                                                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                                                        <span>WhatsApp</span>
                                                    </a>
                                                ) : mailUrl ? (
                                                    <a
                                                        href={mailUrl}
                                                        aria-label={`Send email to ${member.name}`}
                                                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-colors border border-emerald-200/60 shadow-xs"
                                                    >
                                                        <Mail className="w-4 h-4 text-emerald-600" />
                                                        <span>Email</span>
                                                    </a>
                                                ) : null}

                                                {/* Secondary compact icon actions */}
                                                <div className="flex items-center gap-1.5">
                                                    {mailUrl && waUrl && (
                                                        <a
                                                            href={mailUrl}
                                                            aria-label={`Send email to ${member.name}`}
                                                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-950 flex items-center justify-center border border-slate-200 transition-colors"
                                                        >
                                                            <Mail className="w-3.5 h-3.5" />
                                                        </a>
                                                    )}
                                                    {telUrl && (
                                                        <a
                                                            href={telUrl}
                                                            aria-label={`Call ${member.name}`}
                                                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-950 flex items-center justify-center border border-slate-200 transition-colors"
                                                        >
                                                            <Phone className="w-3.5 h-3.5" />
                                                        </a>
                                                    )}
                                                    {inUrl && (
                                                        <a
                                                            href={inUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            aria-label={`View LinkedIn profile for ${member.name}`}
                                                            className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-950 flex items-center justify-center border border-slate-200 transition-colors"
                                                        >
                                                            <Globe className="w-3.5 h-3.5" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Accessible Interactive Profile Modal Dialog */}
                    {selectedMember && (
                        <div
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="modal-member-name"
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
                            onClick={(e) => {
                                if (e.target === e.currentTarget) setSelectedMember(null);
                            }}
                        >
                            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
                                {/* Header / Close Button */}
                                <div className="absolute top-4 right-4 z-10">
                                    <button
                                        type="button"
                                        aria-label="Close profile modal"
                                        onClick={() => setSelectedMember(null)}
                                        className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Modal Body with Smooth Internal Scroll */}
                                <div className="overflow-y-auto p-6 sm:p-10 space-y-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 sm:gap-8 items-start">
                                        {/* Large Profile Image in Modal */}
                                        <div className="sm:col-span-5 rounded-2xl overflow-hidden aspect-[4/5] bg-slate-100 border border-slate-200 shadow-sm shrink-0">
                                            {selectedMember.image_url ? (
                                                <img
                                                    src={selectedMember.image_url}
                                                    alt={`Portrait of ${selectedMember.name}`}
                                                    className="w-full h-full object-cover object-top"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-slate-100 text-emerald-800">
                                                    <User className="w-20 h-20 opacity-40" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Metadata & Roles */}
                                        <div className="sm:col-span-7 space-y-3">
                                            <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                                                {selectedMember.role}
                                            </span>
                                            <h3 id="modal-member-name" className="text-2xl sm:text-3xl font-extrabold text-slate-950">
                                                {selectedMember.name}
                                            </h3>

                                            {selectedMember.contribution && (
                                                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                                                    <strong className="block font-bold text-slate-900 mb-0.5">Focus & Responsibility:</strong>
                                                    {selectedMember.contribution}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Full Biography */}
                                    {selectedMember.bio && (
                                        <div className="space-y-2 border-t border-slate-100 pt-6">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Biography & Background</h4>
                                            <p className="text-slate-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                                                {selectedMember.bio}
                                            </p>
                                        </div>
                                    )}

                                    {/* Modal Contact Action Links */}
                                    {(selectedMember.whatsapp || selectedMember.email || selectedMember.phone || selectedMember.linkedin) && (
                                        <div className="border-t border-slate-100 pt-6 space-y-3">
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Direct Contact Options</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {formatWhatsAppUrl(selectedMember.whatsapp) && (
                                                    <a
                                                        href={formatWhatsAppUrl(selectedMember.whatsapp)!}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold transition-colors"
                                                    >
                                                        <MessageCircle className="w-4 h-4 text-emerald-700" />
                                                        <span>Chat on WhatsApp</span>
                                                    </a>
                                                )}
                                                {formatEmailUrl(selectedMember.email) && (
                                                    <a
                                                        href={formatEmailUrl(selectedMember.email)!}
                                                        className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 text-xs font-bold transition-colors"
                                                    >
                                                        <Mail className="w-4 h-4 text-slate-700" />
                                                        <span>Send Email ({selectedMember.email})</span>
                                                    </a>
                                                )}
                                                {formatPhoneUrl(selectedMember.phone) && (
                                                    <a
                                                        href={formatPhoneUrl(selectedMember.phone)!}
                                                        className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 text-xs font-bold transition-colors"
                                                    >
                                                        <Phone className="w-4 h-4 text-slate-700" />
                                                        <span>Call ({selectedMember.phone})</span>
                                                    </a>
                                                )}
                                                {formatLinkedInUrl(selectedMember.linkedin) && (
                                                    <a
                                                        href={formatLinkedInUrl(selectedMember.linkedin)!}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 text-xs font-bold transition-colors"
                                                    >
                                                        <Globe className="w-4 h-4 text-slate-700" />
                                                        <span>View Professional Profile</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* 14. DATA TRUST & STEWARDSHIP */}
            {trust && (
                <section className="py-24 sm:py-32 bg-slate-950 text-white border-b border-slate-900">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                        <div className="text-center space-y-4 max-w-2xl mx-auto">
                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">{trust.badge || 'Data Trust & Stewardship'}</span>
                            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">{trust.title}</h2>
                            <p className="text-slate-400 font-medium">{trust.subtitle}</p>
                        </div>

                        {trust.pillars && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {trust.pillars.map((pil: any, idx: number) => (
                                    <div key={idx} className="bg-slate-900/80 rounded-3xl p-8 border border-slate-800 space-y-3">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white">{pil.title}</h3>
                                        <p className="text-slate-300 text-sm leading-relaxed">{pil.desc}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* 15. CLOSING INVITATION (CTA) */}
            {cta && (
                <section className="py-24 sm:py-32 bg-emerald-700 text-white text-center">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                        <span className="inline-block px-3.5 py-1.5 rounded-full bg-emerald-800 text-emerald-200 text-xs font-bold uppercase tracking-widest border border-emerald-600">
                            {cta.badge || 'Get Started'}
                        </span>

                        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">{cta.title}</h2>

                        {cta.subtitle && (
                            <p className="text-lg sm:text-xl text-emerald-100 max-w-2xl mx-auto font-medium">{cta.subtitle}</p>
                        )}

                        {cta.body && (
                            <p className="text-xs font-bold uppercase tracking-widest text-emerald-200">{cta.body}</p>
                        )}

                        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/contact"
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white hover:bg-slate-100 text-emerald-800 font-bold text-base transition-all shadow-lg"
                            >
                                <span>{cta.button || 'Get in Touch'}</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}