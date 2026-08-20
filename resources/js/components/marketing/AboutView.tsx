import { useState, FormEventHandler, useEffect, useMemo } from 'react';
import { Link, useForm } from '@inertiajs/react';
import {
    Target, ShieldCheck, Award, CreditCard, Users, BookOpen,
    CheckCircle2, ArrowRight, Compass, Building2, Layers, HeartHandshake,
    Send, AlertCircle, Database, Check, X, Maximize2, Mail, GraduationCap,
    ChevronRight, PlayCircle, Image as ImageIcon, Video as VideoIcon
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
    Award, CreditCard, Database, Layers, Users, Compass,
    Building2, BookOpen, HeartHandshake, Target, ShieldCheck
};

function LinkedinIcon({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
        </svg>
    );
}

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
        </svg>
    );
}

function TeamAvatarFallback({ initials }: { initials: string }) {
    return (
        <div className="w-full h-full bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 flex flex-col items-center justify-center text-white select-none">
            <span className="text-lg font-black tracking-wider text-emerald-400">{initials}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">EduFlow</span>
        </div>
    );
}

// Convert standard YouTube watch links (e.g. youtube.com/watch?v=XYZ) to embed links
function formatEmbedUrl(url: string): string {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
        const id = url.split('v=')[1]?.split('&')[0];
        return `https://www.youtube-nocookie.com/embed/${id}`;
    }
    if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube-nocookie.com/embed/${id}`;
    }
    return url;
}

interface SectionRecord {
    id?: number;
    identifier: string;
    block_type: string;
    content: Record<string, any> | null;
    is_enabled?: boolean;
}

interface Props {
    branding?: { name?: string; support_email?: string; support_phone?: string; };
    page?: any;
    sections?: SectionRecord[];
}

export default function AboutView({ branding, sections = [] }: Props) {
    const [selectedRoadmapItem, setSelectedRoadmapItem] = useState<any | null>(null);
    const [selectedMember, setSelectedMember] = useState<any | null>(null);
    const [lightboxImage, setLightboxImage] = useState<{ url: string; caption: string } | null>(null);

    const sectionMap = useMemo(() => {
        const map: Record<string, any> = {};
        sections.forEach((s) => {
            if (s.content) {
                map[s.identifier] = s.content;
            }
        });
        return map;
    }, [sections]);

    const hero = sectionMap.hero || {
        badge: 'About EduFlow',
        title: 'Built for the Operational Realities of Kenyan Education.',
        subtitle: 'EduFlow is an integrated school management architecture designed to eliminate administrative paperwork, automate fee accounting, streamline continuous CBC assessment, and establish transparent communication between educators and families.',
    };

    const challenge = sectionMap.challenge || {
        badge: 'The Underlying Challenge',
        title: 'Why EduFlow Was Engineered',
        subtitle: 'Across primary, junior secondary, and senior secondary institutions, school leadership spends an excessive amount of time managing disconnected processes rather than advancing academic outcomes.',
        left_title: 'The Fragmented Status Quo',
        left_desc: 'Most schools rely on separate spreadsheets for student marks, manual paper receipt books for fees, physical gate registers for attendance, and unofficial messaging groups for announcements. This results in:',
        left_bullets: [
            'Exhausting end-of-term report card compilation taking weeks of manual math.',
            'Unmatched M-Pesa payments and disputed fee balances during bank reconciliation.',
            'NEMIS UPI formatting errors causing delays during KNEC candidate registrations.',
        ],
        right_title: 'The Unified Institutional Engine',
        right_desc: 'EduFlow solves this by treating the school as a synchronized system where a single student record connects all institutional operations:',
        right_bullets: [
            'Assessment rubrics automatically compute termly grade averages and generate printable reports.',
            'Paybill receipts instantly update individual fee balances and vote-head accounts.',
            'Daily attendance triggers automated parent SMS alerts when absences occur.',
        ]
    };

    const visionMission = sectionMap.vision_mission || {
        vision_badge: 'Our Long-Term Vision',
        vision_title: 'To make school operations calm, verifiable, and transparent for every Kenyan institution.',
        vision_desc: 'We envision an educational landscape where technology eliminates clerical drag, allowing teachers to focus entirely on learner development, bursars to maintain immaculate fiscal governance, and school directors to lead with real-time operational clarity.',
        mission_badge: 'Our Daily Mission',
        mission_title: 'To engineer dependable, accessible, and secure school software tailored to local curriculum workflows.',
        mission_desc: 'Every day, we build and refine software that mirrors how Kenyan institutions actually function—from CBC rubric grading scales and M-Pesa payment gateways to national compliance exports and guardian SMS networks.',
    };

    const principlesData = sectionMap.principles || {
        badge: 'What Guides Us',
        title: 'The Core Principles of EduFlow',
        subtitle: 'The foundational commitments that govern every architectural decision and feature we build.',
        items: []
    };

    const stakeholdersData = sectionMap.stakeholders || {
        badge: 'Stakeholder Ecosystem',
        title: 'One Unified Platform for the Entire School',
        subtitle: 'Designed with dedicated, role-scoped interfaces for every participant in the educational journey.',
        items: []
    };

    const teamData = sectionMap.team || {
        badge: 'Leadership & Engineering',
        title: 'The Team Behind EduFlow',
        subtitle: 'Software architects, educational specialists, and deployment engineers dedicated to transforming Kenyan school administration.',
        members: []
    };

    const roadmapData = sectionMap.roadmap || {
        badge: 'Continuous Improvement',
        title: 'How EduFlow Evolves with School Needs',
        subtitle: 'EduFlow is not a static boxed program. We actively refine the platform based on feedback from teachers, bursars, and school principals across Kenya.',
        items: []
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setSelectedRoadmapItem(null);
                setSelectedMember(null);
                setLightboxImage(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (selectedRoadmapItem || selectedMember || lightboxImage) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [selectedRoadmapItem, selectedMember, lightboxImage]);

    const [activeFeedbackCategory, setActiveFeedbackCategory] = useState<'suggestion' | 'compliment' | 'concern' | 'feature'>('suggestion');
    const { data, setData, post, processing, recentlySuccessful, reset, errors } = useForm({
        form_type: 'support',
        name: '',
        email: '',
        phone: '',
        organization: '',
        message: '',
    });

    const handleFeedbackSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/contact', {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <div className="py-12 sm:py-20 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 sm:space-y-28">

                {/* 1. Hero Section */}
                <section className="text-center max-w-4xl mx-auto space-y-6">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider shadow-xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{hero.badge}</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.12]">
                        {hero.title}
                    </h1>

                    <p className="text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        {hero.subtitle}
                    </p>
                </section>

                {/* 2. Why EduFlow Exists */}
                <section className="bg-white rounded-3xl p-8 sm:p-14 border border-slate-200/80 shadow-xs space-y-10">
                    <div className="max-w-3xl space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                            {challenge.badge}
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                            {challenge.title}
                        </h2>
                        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                            {challenge.subtitle}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                        <div className="rounded-2xl p-7 bg-rose-50/50 border border-rose-200/80 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900">{challenge.left_title}</h3>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{challenge.left_desc}</p>
                            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                                {challenge.left_bullets?.map((b: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2.5">
                                        <span className="text-rose-500 font-bold">•</span>
                                        <span>{b}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="rounded-2xl p-7 bg-emerald-50/50 border border-emerald-200/80 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-bold text-slate-900">{challenge.right_title}</h3>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{challenge.right_desc}</p>
                            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                                {challenge.right_bullets?.map((b: string, idx: number) => (
                                    <li key={idx} className="flex items-start gap-2.5">
                                        <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>{b}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* 3. Vision & Mission */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs space-y-4 relative overflow-hidden">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                            <Compass className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 block">{visionMission.vision_badge}</span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">{visionMission.vision_title}</h2>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{visionMission.vision_desc}</p>
                    </div>

                    <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200/80 shadow-xs space-y-4 relative overflow-hidden">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                            <Target className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">{visionMission.mission_badge}</span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">{visionMission.mission_title}</h2>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{visionMission.mission_desc}</p>
                    </div>
                </section>

                {/* 4. Guiding Principles */}
                {principlesData.items && principlesData.items.length > 0 && (
                    <section className="space-y-10">
                        <div className="text-center max-w-3xl mx-auto space-y-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                {principlesData.badge}
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{principlesData.title}</h2>
                            <p className="text-sm sm:text-base text-slate-600">{principlesData.subtitle}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {principlesData.items.map((pr: any, idx: number) => {
                                const IconComponent = ICON_MAP[pr.icon] || Award;
                                return (
                                    <div
                                        key={idx}
                                        className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs hover:border-emerald-500/50 hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                                    >
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                                                    <IconComponent className="w-5 h-5" />
                                                </div>
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                                                    {pr.tag}
                                                </span>
                                            </div>
                                            <h3 className="text-base font-bold text-slate-900 leading-snug">{pr.title}</h3>
                                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{pr.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* 5. Stakeholder Ecosystem */}
                {stakeholdersData.items && stakeholdersData.items.length > 0 && (
                    <section className="bg-white rounded-3xl p-8 sm:p-14 border border-slate-200/80 shadow-xs space-y-12">
                        <div className="text-center max-w-3xl mx-auto space-y-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                {stakeholdersData.badge}
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{stakeholdersData.title}</h2>
                            <p className="text-sm sm:text-base text-slate-600">{stakeholdersData.subtitle}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {stakeholdersData.items.map((stk: any, idx: number) => {
                                const IconComponent = ICON_MAP[stk.icon] || Building2;
                                return (
                                    <div key={idx} className="bg-slate-50/80 rounded-2xl p-7 border border-slate-200 space-y-4 hover:border-slate-300 transition-all">
                                        <div className="flex items-center gap-3.5">
                                            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-xs">
                                                <IconComponent className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-slate-950">{stk.role}</h3>
                                                <p className="text-xs text-slate-500 font-medium">{stk.summary}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2 pt-2 border-t border-slate-200/60">
                                            {stk.impacts?.map((imp: string, iIdx: number) => (
                                                <div key={iIdx} className="flex items-start gap-2.5 text-xs text-slate-700">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                                    <span>{imp}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* 6. Leadership & Engineering Team */}
                {teamData.members && teamData.members.length > 0 && (
                    <section className="space-y-10">
                        <div className="text-center max-w-3xl mx-auto space-y-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                {teamData.badge}
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">{teamData.title}</h2>
                            <p className="text-sm sm:text-base text-slate-600">{teamData.subtitle}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                            {teamData.members.map((member: any) => (
                                <div
                                    key={member.id}
                                    className="bg-white rounded-3xl p-7 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-6"
                                >
                                    <div className="space-y-5">
                                        <div className="flex items-start gap-4">
                                            <div
                                                className="relative group/img cursor-pointer shrink-0"
                                                onClick={() => setLightboxImage({ url: member.avatarUrl, caption: `${member.name} — ${member.role}` })}
                                            >
                                                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden border-2 border-emerald-500/40 shadow-md flex items-center justify-center text-white shrink-0 relative">
                                                    {member.avatarUrl ? (
                                                        <img
                                                            src={member.avatarUrl}
                                                            alt={member.name}
                                                            onError={(e) => {
                                                                (e.target as HTMLElement).style.display = 'none';
                                                            }}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : null}
                                                    <div className="absolute inset-0 -z-10">
                                                        <TeamAvatarFallback initials={member.id === 'mark-ochieng' ? 'MO' : 'EF'} />
                                                    </div>
                                                </div>
                                                <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                                                    <Maximize2 className="w-4 h-4 text-white" />
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                                    {member.department}
                                                </span>
                                                <h3 className="text-lg font-bold text-slate-950 leading-snug">{member.name}</h3>
                                                <p className="text-xs font-semibold text-slate-500">{member.role}</p>
                                            </div>
                                        </div>

                                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{member.shortBio}</p>

                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                            {member.specialties?.map((spec: string, sIdx: number) => (
                                                <span key={sIdx} className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                                    {spec}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedMember(member)}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                                        >
                                            <span>Read Full Bio</span>
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </button>

                                        <div className="flex items-center gap-2">
                                            {member.socials?.linkedin && (
                                                <a
                                                    href={member.socials.linkedin}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    aria-label="LinkedIn Profile"
                                                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 flex items-center justify-center transition-colors border border-slate-200/80"
                                                >
                                                    <LinkedinIcon className="w-4 h-4" />
                                                </a>
                                            )}
                                            {member.socials?.facebook && (
                                                <a
                                                    href={member.socials.facebook}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    aria-label="Facebook Profile"
                                                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 flex items-center justify-center transition-colors border border-slate-200/80"
                                                >
                                                    <FacebookIcon className="w-4 h-4" />
                                                </a>
                                            )}
                                            <a
                                                href={`mailto:${member.email}`}
                                                aria-label={`Email ${member.name}`}
                                                className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 flex items-center justify-center transition-colors border border-slate-200/80"
                                            >
                                                <Mail className="w-4 h-4" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 7. Continuous Improvement Roadmap */}
                {roadmapData.items && roadmapData.items.length > 0 && (
                    <section className="bg-white rounded-3xl p-8 sm:p-14 border border-slate-200/80 shadow-xs space-y-8">
                        <div className="space-y-3">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                {roadmapData.badge}
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{roadmapData.title}</h2>
                            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">{roadmapData.subtitle}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {roadmapData.items.map((item: any) => (
                                <div
                                    key={item.id}
                                    className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all group"
                                >
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${item.badgeClass}`}>
                                                {item.status}
                                            </span>
                                            {item.mediaType === 'video' ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                                    <VideoIcon className="w-3 h-3" /> Video
                                                </span>
                                            ) : item.mediaUrl ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                    <ImageIcon className="w-3 h-3" /> Media
                                                </span>
                                            ) : null}
                                        </div>
                                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                                            {item.desc}
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedRoadmapItem(item)}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                                        >
                                            <span>Read More & View Media</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 8. Feedback Form */}
                <section className="bg-white rounded-3xl p-8 sm:p-14 border border-slate-200/80 shadow-xs space-y-8">
                    <div className="max-w-2xl space-y-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                            Your Voice Matters
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                            Share Feedback, Feature Ideas, or Inquiries
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                            Whether you are evaluating EduFlow for your school, have a suggestion for CBC assessment workflows, or need to flag an operational challenge, our engineering desk reviews every submission.
                        </p>
                    </div>

                    {recentlySuccessful && (
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>Thank you. Your feedback has been received and logged directly into our product review queue.</span>
                        </div>
                    )}

                    <form onSubmit={handleFeedbackSubmit} className="space-y-6 max-w-3xl">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                                Feedback Classification *
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {[
                                    { id: 'suggestion', label: 'Suggestion' },
                                    { id: 'feature', label: 'Feature Request' },
                                    { id: 'compliment', label: 'Compliment' },
                                    { id: 'concern', label: 'Concern / Report' },
                                ].map((cat) => (
                                    <button
                                        type="button"
                                        key={cat.id}
                                        onClick={() => setActiveFeedbackCategory(cat.id as any)}
                                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                                            activeFeedbackCategory === cat.id
                                                ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                        }`}
                                    >
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Your Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Dr. John Kimani"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-xs sm:text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                                />
                                {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Email Address *</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="principal@school.ac.ke"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-xs sm:text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                                />
                                {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">Message / Details *</label>
                            <textarea
                                rows={4}
                                required
                                placeholder="Please share your observation, suggested workflow enhancement, or inquiry in detail..."
                                value={data.message}
                                onChange={(e) => setData('message', e.target.value)}
                                className="w-full rounded-xl border border-slate-200 p-4 text-xs sm:text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                            />
                            {errors.message && <p className="text-xs text-rose-600 mt-1">{errors.message}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                        >
                            {processing ? <span>Submitting...</span> : (
                                <>
                                    <span>Transmit Feedback to Product Desk</span>
                                    <Send className="w-3.5 h-3.5" />
                                </>
                            )}
                        </button>
                    </form>
                </section>

                {/* 9. Closing CTA */}
                <section className="bg-slate-900 rounded-3xl p-8 sm:p-14 text-white text-center border border-slate-800 relative overflow-hidden">
                    <div className="max-w-2xl mx-auto space-y-6 relative z-10">
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-white">Experience EduFlow in Your School</h2>
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                            Initialize a complimentary 30-day evaluation workspace or schedule a personalized walkthrough with an EduFlow deployment engineer.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                            <Link
                                href="/register"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md"
                            >
                                <span>Setup My School</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/contact"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-semibold text-xs sm:text-sm hover:bg-slate-700"
                            >
                                <span>Request Guided Demo</span>
                            </Link>
                        </div>
                    </div>
                </section>

            </div>

            {/* MODAL 1: ROADMAP "READ MORE & VIEW MEDIA" (IMAGE & VIDEO PLAYER) */}
            {selectedRoadmapItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setSelectedRoadmapItem(null)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setSelectedRoadmapItem(null)}
                            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="space-y-3">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${selectedRoadmapItem.badgeClass}`}>
                                Status: {selectedRoadmapItem.status}
                            </span>
                            <h3 className="text-xl sm:text-2xl font-bold text-slate-950 leading-snug pr-8">
                                {selectedRoadmapItem.title}
                            </h3>
                        </div>

                        {/* Video / Image Showcase Box */}
                        {selectedRoadmapItem.mediaType === 'video' && selectedRoadmapItem.mediaUrl ? (
                            <div className="space-y-2">
                                <div className="rounded-2xl overflow-hidden bg-slate-950 aspect-video relative shadow-lg border border-slate-800">
                                    <iframe
                                        src={formatEmbedUrl(selectedRoadmapItem.mediaUrl)}
                                        title={selectedRoadmapItem.title}
                                        className="w-full h-full border-0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                                {selectedRoadmapItem.mediaCaption && (
                                    <p className="text-[11px] text-slate-500 italic px-1 flex items-center gap-1.5">
                                        <PlayCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                        <span>{selectedRoadmapItem.mediaCaption}</span>
                                    </p>
                                )}
                            </div>
                        ) : selectedRoadmapItem.mediaUrl ? (
                            <div className="space-y-2">
                                <div
                                    className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 cursor-pointer group/modal relative"
                                    onClick={() => setLightboxImage({ url: selectedRoadmapItem.mediaUrl, caption: selectedRoadmapItem.title })}
                                >
                                    <img
                                        src={selectedRoadmapItem.mediaUrl}
                                        alt={selectedRoadmapItem.title}
                                        onError={(e) => {
                                            (e.target as HTMLElement).style.display = 'none';
                                        }}
                                        className="w-full h-56 sm:h-72 object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/modal:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                                        <Maximize2 className="w-4 h-4" />
                                        <span>Click to expand view</span>
                                    </div>
                                </div>
                                {selectedRoadmapItem.mediaCaption && (
                                    <p className="text-[11px] text-slate-500 italic px-1">
                                        {selectedRoadmapItem.mediaCaption}
                                    </p>
                                )}
                            </div>
                        ) : null}

                        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Architectural Overview</h4>
                            <p>{selectedRoadmapItem.fullSummary || selectedRoadmapItem.desc}</p>
                        </div>

                        {selectedRoadmapItem.highlights && (
                            <div className="space-y-2.5 bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">Key Institutional Deliverables</h4>
                                {selectedRoadmapItem.highlights.map((high: string, hIdx: number) => (
                                    <div key={hIdx} className="flex items-start gap-2.5 text-xs text-slate-700">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                        <span>{high}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="pt-2 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setSelectedRoadmapItem(null)}
                                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                            >
                                Close Brief
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 2: FULL TEAM BIO */}
            {selectedMember && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setSelectedMember(null)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setSelectedMember(null)}
                            className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-start gap-4 pr-6">
                            <div className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-emerald-500/40 overflow-hidden shrink-0 relative flex items-center justify-center text-white">
                                {selectedMember.avatarUrl ? (
                                    <img
                                        src={selectedMember.avatarUrl}
                                        alt={selectedMember.name}
                                        onError={(e) => {
                                            (e.target as HTMLElement).style.display = 'none';
                                        }}
                                        className="w-full h-full object-cover"
                                    />
                                ) : null}
                                <div className="absolute inset-0 -z-10">
                                    <TeamAvatarFallback initials={selectedMember.id === 'mark-ochieng' ? 'MO' : 'EF'} />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                    {selectedMember.department}
                                </span>
                                <h3 className="text-xl font-bold text-slate-950">{selectedMember.name}</h3>
                                <p className="text-xs font-semibold text-slate-500">{selectedMember.role}</p>
                            </div>
                        </div>

                        <div className="space-y-3 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Biography & Experience</h4>
                            {Array.isArray(selectedMember.fullBio) ? selectedMember.fullBio.map((paragraph: string, pIdx: number) => (
                                <p key={pIdx}>{paragraph}</p>
                            )) : <p>{selectedMember.shortBio}</p>}
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Technical & Educational Focus</h4>
                            <div className="flex flex-wrap gap-1.5">
                                {selectedMember.specialties?.map((spec: string, sIdx: number) => (
                                    <span key={sIdx} className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg">
                                        {spec}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                            <a
                                href={`mailto:${selectedMember.email}`}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                            >
                                <Mail className="w-3.5 h-3.5" />
                                <span>Email {selectedMember.name.split(' ')[0]}</span>
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL 3: LIGHTBOX FOR FULL MEDIA */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={() => setLightboxImage(null)}
                >
                    <div
                        className="max-w-3xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 p-4 space-y-3 relative shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setLightboxImage(null)}
                            className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-white hover:bg-slate-700 transition-colors z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center min-h-[300px]">
                            <img
                                src={lightboxImage.url}
                                alt={lightboxImage.caption}
                                onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                }}
                                className="w-full h-auto max-h-[75vh] object-contain"
                            />
                        </div>

                        <p className="text-xs text-slate-300 text-center font-medium">
                            {lightboxImage.caption}
                        </p>
                    </div>
                </div>
            )}

        </div>
    );
}