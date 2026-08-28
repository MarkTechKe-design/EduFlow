import React from 'react';
import { Link } from '@inertiajs/react';
import { 
    CheckCircle2, 
    ArrowRight, 
    MessageCircle, 
    ShieldCheck,
    Clock,
    Wallet,
    Users,
    Smartphone,
    Building2,
    GraduationCap,
    Activity,
    Compass,
    Target,
    FileSpreadsheet,
    Layers,
    Lock,
    RefreshCw,
    Zap,
    Check
} from 'lucide-react';

interface SectionProps {
    content?: Record<string, any> | null;
}

// 1. Quick Highlights Cards Strip
export function HomeQuickHighlights({ content }: SectionProps) {
    if (!content) return null;
    const highlights = content.highlights || [
        { title: 'Modular Core', desc: 'Full workspace access' },
        { title: 'Excel Import', desc: 'Smooth data migration' },
        { title: 'CBC Ready', desc: '4-band assessment rubrics' },
        { title: 'M-Pesa', desc: 'Daraja fee workflows' },
        { title: 'Role-Based', desc: 'Granular access control' },
    ];

    return (
        <section className="py-20 sm:py-28 bg-slate-50 border-b border-slate-200/80">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                <div className="text-center space-y-3 max-w-3xl mx-auto">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 font-mono">
                        {content.badge || 'Built for Kenyan Schools'}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                        {content.title || 'One dashboard for the work schools do every day'}
                    </h2>
                    <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                        {content.subtitle || 'EduFlow supports real school operations across student records, fees and billing, attendance, CBC exams, and parent communication.'}
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
                    {highlights.map((item: any, idx: number) => (
                        <div
                            key={idx}
                            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center justify-center space-y-1.5"
                        >
                            <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-800 tracking-tight">
                                {item.title}
                            </h3>
                            <p className="text-xs font-medium text-slate-500 leading-snug">
                                {item.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// 2. Efficiency Comparison Matrix Table
export function HomeEfficiencyMatrix({ content }: SectionProps) {
    if (!content) return null;
    const rows = content.rows || [
        {
            feature: 'Fee Tracking & Ledger',
            digital: 'Automated Daraja matching & instant SMS receipts',
            manual: 'Paper ledger books & manual bank statement checks',
        },
        {
            feature: 'CBC Report Cards',
            digital: 'Automated broadsheets with 4-band formative tabulation',
            manual: 'Days of manual score entry across multiple loose sheets',
        },
        {
            feature: 'Attendance & Roll Call',
            digital: 'Fast digital roll call with instant guardian absence alerts',
            manual: 'Physical registers with delayed communication',
        },
        {
            feature: 'Student Bio-Data Search',
            digital: 'Search any learner, stream, or guardian file in seconds',
            manual: 'Digging through filing cabinets and archive folders',
        },
        {
            feature: 'Parent & Guardian Access',
            digital: 'Direct SMS alerts and transparent term progress visibility',
            manual: 'Limited to physical office visits and phone inquiries',
        },
    ];

    return (
        <section className="py-24 sm:py-32 bg-white border-b border-slate-200/80">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                <div className="text-center space-y-3 max-w-3xl mx-auto">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 font-mono">
                        {content.badge || 'Efficiency Matters'}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                        {content.title || 'Why Schools Are Moving to EduFlow'}
                    </h2>
                    <p className="text-slate-600 font-medium text-sm sm:text-base">
                        {content.subtitle || 'Compare the speed, precision, and security of a connected school platform against traditional manual methods.'}
                    </p>
                </div>

                <div className="overflow-hidden rounded-3xl border border-slate-200/80 shadow-sm bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200/80 bg-slate-50/70 text-slate-900 text-xs font-bold uppercase tracking-wider">
                                    <th className="py-5 px-6 sm:px-8 w-1/4">Feature</th>
                                    <th className="py-5 px-6 sm:px-8 w-1/2 text-emerald-800 font-extrabold">EduFlow (Digital)</th>
                                    <th className="py-5 px-6 sm:px-8 w-1/4 text-slate-500">Manual Systems</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {rows.map((row: any, idx: number) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-5 px-6 sm:px-8 font-bold text-slate-950">
                                            {row.feature}
                                        </td>
                                        <td className="py-5 px-6 sm:px-8 text-emerald-900 font-medium">
                                            <div className="flex items-center gap-2.5">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                <span>{row.digital}</span>
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 sm:px-8 text-slate-500">
                                            {row.manual}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </section>
    );
}

// 3. Continuous Term Operations: 8-Step Lifecycle
export function HomeTermLifecycle({ content }: SectionProps) {
    if (!content) return null;
    const steps = content.steps || [
        { num: '1', title: 'Bio-Data Enrollment', desc: 'Import learners, stream allocations, and student bio-data files.' },
        { num: '2', title: 'Fee Structure Setup', desc: 'Configure termly tuition, boarding, transport, and extra charges.' },
        { num: '3', title: 'Daraja M-Pesa Matching', desc: 'Automated reconciliation connects mobile receipts directly to student ledgers.' },
        { num: '4', title: 'Formative CBC Grading', desc: 'Teachers record classroom assessments across standard 4-band rubrics.' },
        { num: '5', title: 'Attendance & Alerts', desc: 'Daily morning roll call logs with automated SMS notifications for absences.' },
        { num: '6', title: 'Campus & Hostel Logistics', desc: 'Coordinate dormitory bed capacity, meal tracking, and transport routes.' },
        { num: '7', title: 'Broadsheet Verification', desc: 'Admin review and official sign-off on termly broadsheet scorecards.' },
        { num: '8', title: 'Term Rollover & Reports', desc: 'Publish final report cards and roll student balances forward seamlessly.' },
    ];

    return (
        <section className="py-24 sm:py-32 bg-slate-50 border-b border-slate-200/80">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                <div className="text-center space-y-3 max-w-3xl mx-auto">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 font-mono">
                        {content.badge || 'Continuous Operations'}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                        {content.title || 'Setup is just the beginning'}
                    </h2>
                    <p className="text-slate-600 font-medium text-sm sm:text-base leading-relaxed">
                        {content.subtitle || 'EduFlow powers your institution across the full academic cycle—from term opening to fee closing, grading, and rollover.'}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {steps.map((st: any, idx: number) => (
                        <div
                            key={idx}
                            className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-4"
                        >
                            <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                                {st.num}
                            </div>
                            <div className="space-y-1.5">
                                <h3 className="text-base font-bold text-slate-950">
                                    {st.title}
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    {st.desc}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// 4. Multi-Curriculum & Campus Presets (Deep Emerald Banner)
export function HomeCurriculumTypes({ content }: SectionProps) {
    if (!content) return null;
    const presets = content.presets || [
        {
            title: 'CBC Primary & Junior',
            bullets: ['Junior School (Grade 7–9)', 'Formative learning area templates', 'Strand-level rubric assessment'],
        },
        {
            title: 'Secondary Schools',
            bullets: ['Form 1–4 stream scheduling', '8-4-4 and CBC transition support', 'Mock exam broadsheet tabulation'],
        },
        {
            title: 'Day & Boarding Schools',
            bullets: ['Dormitory bed allocation', 'Evening prep attendance logs', 'Bus route & transport manifests'],
        },
        {
            title: 'Multi-Campus Groups',
            bullets: ['Central institutional oversight', 'Independent campus database scoping', 'Consolidated financial reports'],
        },
    ];

    return (
        <section className="py-24 sm:py-32 bg-emerald-800 text-white relative overflow-hidden">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 relative z-10">
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                    <span className="inline-block px-3.5 py-1.5 rounded-full bg-emerald-900 text-emerald-200 text-xs font-bold uppercase tracking-widest border border-emerald-700">
                        {content.badge || 'Built for Kenyan Schools'}
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                        {content.title || 'Every school type. Every curriculum. Every campus.'}
                    </h2>
                    <p className="text-emerald-100 text-base sm:text-lg font-medium">
                        {content.subtitle || 'From small CBC primaries to multi-campus secondary institutions, EduFlow configures around how your school actually runs.'}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {presets.map((p: any, idx: number) => (
                        <div
                            key={idx}
                            className="bg-emerald-900/80 rounded-3xl p-7 border border-emerald-700/80 shadow-md hover:border-emerald-500 transition-all duration-300 space-y-4 flex flex-col justify-between"
                        >
                            <div className="space-y-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-800 text-emerald-300 flex items-center justify-center font-bold">
                                    <GraduationCap className="w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-bold text-white">
                                    {p.title}
                                </h3>
                            </div>

                            <ul className="space-y-2.5 pt-2 border-t border-emerald-800/80">
                                {p.bullets?.map((b: string, bIdx: number) => (
                                    <li key={bIdx} className="flex items-start gap-2 text-xs text-emerald-100 leading-relaxed">
                                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                        <span>{b}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// 5. Real School Operations Grid
export function HomeOperationalControl({ content }: SectionProps) {
    if (!content) return null;
    const tools = content.tools || [
        { icon: RefreshCw, title: 'Complete Audit Trail', desc: 'Immutable activity records of fee adjustments, mark alterations, and system logins.' },
        { icon: Users, title: 'Teacher Absence Tracking', desc: 'Mark teacher attendance in seconds and manage classroom coverage seamlessly.' },
        { icon: FileSpreadsheet, title: 'Bulk Excel Import', desc: 'Bring in student registers, fee structures, and past records without manual retyping.' },
        { icon: Lock, title: 'Multi-Tenant Isolation', desc: 'Strict database-level workspace boundaries ensuring complete institutional privacy.' },
        { icon: ShieldCheck, title: 'Draft Broadsheet Safety', desc: 'Calculated broadsheets remain drafts until reviewed and approved by administrators.' },
        { icon: Zap, title: 'Real-Time M-Pesa Callbacks', desc: 'Instant ledger reconciliation and immediate SMS receipts upon verified settlement.' },
        { icon: Smartphone, title: 'Mobile-Optimized Portal', desc: 'Classroom roll call and formative rubric grading directly on teachers’ phones.' },
        { icon: Layers, title: 'Term Rollover Continuity', desc: 'Seamlessly advance student streams and carry forward fee balances into the new term.' },
    ];

    return (
        <section className="py-24 sm:py-32 bg-white border-b border-slate-200/80">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                <div className="text-center space-y-3 max-w-3xl mx-auto">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 font-mono">
                        {content.badge || 'Operations'}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                        {content.title || 'Built for real school operations'}
                    </h2>
                    <p className="text-slate-600 font-medium text-sm sm:text-base leading-relaxed">
                        {content.subtitle || 'Managing a school requires dependable day-to-day administrative tools—engineered around the staff who run the institution.'}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {tools.map((t: any, idx: number) => {
                        const IconComponent = t.icon || ShieldCheck;
                        return (
                            <div
                                key={idx}
                                className="bg-slate-50 rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300 space-y-3"
                            >
                                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                                    <IconComponent className="w-5 h-5" />
                                </div>
                                <h3 className="text-base font-bold text-slate-950">
                                    {t.title}
                                </h3>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    {t.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

// 6. Operational Outcomes Metrics Banner
export function HomeOutcomesMetrics({ content }: SectionProps) {
    if (!content) return null;
    const metrics = content.metrics || [
        { value: '4 Bands', label: 'CBC Assessment Rubrics', desc: 'Native support for standard EE, ME, AE, and BE performance levels.' },
        { value: '0 Bleed', label: 'Multi-Tenant Isolation', desc: 'Strict database scoping guarantees 100% data separation between schools.' },
        { value: 'Real-Time', label: 'M-Pesa Reconciliation', desc: 'Direct Safaricom Daraja callback matching to student fee ledgers.' },
        { value: '100%', label: 'Institutional Ownership', desc: 'Your school retains exclusive administrative control over all records.' },
        { value: '3 Terms', label: 'Kenyan Calendar Alignment', desc: 'Built for standard Term 1, 2, and 3 academic and fee collection cycles.' },
    ];

    return (
        <section className="py-24 sm:py-32 bg-emerald-900 text-white border-b border-emerald-950">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                <div className="text-center space-y-3 max-w-2xl mx-auto">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-300 font-mono">
                        {content.badge || 'Outcomes'}
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
                        {content.title || 'The numbers schools actually feel'}
                    </h2>
                    <p className="text-emerald-200 text-sm sm:text-base font-medium">
                        {content.subtitle || 'Built on verified technical foundations to ensure speed, compliance, and peace of mind.'}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {metrics.map((m: any, idx: number) => (
                        <div
                            key={idx}
                            className="bg-emerald-800/80 rounded-3xl p-6 border border-emerald-700 shadow-sm space-y-2 flex flex-col justify-between"
                        >
                            <div>
                                <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                                    {m.value}
                                </div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300 pt-1">
                                    {m.label}
                                </h3>
                            </div>
                            <p className="text-xs text-emerald-100/80 leading-relaxed pt-2 border-t border-emerald-700/60">
                                {m.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// 7. Guided 5-Step Onboarding Stepper
export function HomeGuidedOnboarding({ content }: SectionProps) {
    if (!content) return null;
    const steps = content.steps || [
        { num: '1', title: 'School Details', desc: 'Enter school name, level, and registration type.' },
        { num: '2', title: 'Academic Structure', desc: 'Define student grade streams and CBC / 8-4-4 frameworks.' },
        { num: '3', title: 'Campus & Location', desc: 'Configure county location, day/boarding, and campus settings.' },
        { num: '4', title: 'Branding & Roles', desc: 'Upload school crest and configure administrator and staff access.' },
        { num: '5', title: 'Review & Launch', desc: 'Confirm parameters and instantly access your operational dashboard.' },
    ];

    return (
        <section className="py-24 sm:py-32 bg-slate-50 border-b border-slate-200/80">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
                <div className="text-center space-y-3 max-w-3xl mx-auto">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 font-mono">
                        {content.badge || 'Guided Onboarding'}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
                        {content.title || 'Digitize Your School in 5 Simple Steps'}
                    </h2>
                    <p className="text-slate-600 font-medium text-sm sm:text-base">
                        {content.subtitle || 'No complex IT infrastructure required. Our guided setup flow gets your school workspace online and ready to operate in minutes.'}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 relative">
                    {steps.map((st: any, idx: number) => (
                        <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col items-center text-center space-y-3 group hover:border-emerald-300 hover:-translate-y-1 transition-all duration-300">
                            <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-110 transition-transform">
                                {st.num}
                            </div>
                            <h3 className="text-base font-bold text-slate-950">
                                {st.title}
                            </h3>
                            <p className="text-xs text-slate-600 leading-relaxed">
                                {st.desc}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="text-center pt-4">
                    <Link
                        href={content.button_url || '/contact'}
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg"
                    >
                        <span>{content.button_text || 'Start Your 5-Minute Setup'}</span>
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </section>
    );
}

// 8. Knowledge Base & Resource Guides
export function HomeResourcesGuides({ content }: SectionProps) {
    if (!content) return null;
    const guides = content.guides || [
        {
            title: 'Best School Management System in Kenya (2026 Guide)',
            desc: 'How to evaluate school management software in Kenya for records, fees, exams, SMS, and parent access.',
        },
        {
            title: 'How to Manage School Fees, Billing, and Receipts Digitally',
            desc: 'Practical steps to move from fee spreadsheets to structured billing, payments, receipts, and statements.',
        },
        {
            title: 'How to Replace Spreadsheets with Student Information Software',
            desc: 'A rollout path for digital student records, attendance, exams, and report cards.',
        },
    ];

    return (
        <section className="py-24 sm:py-32 bg-white border-b border-slate-200/80">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                    <div className="lg:col-span-5 space-y-6">
                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 font-mono">
                            {content.badge || 'Resources'}
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
                            {content.title || 'Expert Guides to Help You Scale'}
                        </h2>
                        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
                            {content.subtitle || 'Practical guides on student records, school fees management, report cards, parent communication, and digital school operations.'}
                        </p>
                        <div className="pt-2">
                            <Link
                                href={content.button_url || '/contact'}
                                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-sm"
                            >
                                <span>{content.button_text || 'Visit Knowledge Base'}</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    <div className="lg:col-span-7 divide-y divide-slate-100">
                        {guides.map((g: any, idx: number) => (
                            <div key={idx} className="py-6 first:pt-0 last:pb-0 space-y-2 group cursor-pointer">
                                <h3 className="text-lg font-bold text-slate-950 group-hover:text-emerald-700 transition-colors">
                                    {g.title}
                                </h3>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    {g.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

// 9. Emerald Action Banner CTA (Rendered After FAQs)
export function HomeActionBanner({ content }: SectionProps) {
    if (!content) return null;
    const rawWa = content.whatsapp ? String(content.whatsapp).replace(/\D/g, '') : null;
    const waUrl = rawWa && rawWa.length >= 9 ? `https://wa.me/${rawWa}` : null;

    return (
        <section className="py-20 sm:py-28 bg-slate-50 border-t border-slate-200/80">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-emerald-700 text-white rounded-3xl p-8 sm:p-14 text-center shadow-xl space-y-8">
                    <div className="space-y-4 max-w-3xl mx-auto">
                        <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                            {content.title || 'Ready to take control of your school?'}
                        </h2>
                        <p className="text-emerald-100 text-base sm:text-lg font-medium leading-relaxed">
                            {content.subtitle || 'Join schools across Kenya using EduFlow to eliminate paperwork, speed up reporting, and collect fees without the stress. No setup fees. Works immediately.'}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                        <Link
                            href={content.primary_url || '/contact'}
                            className="px-7 py-4 rounded-full bg-white hover:bg-slate-100 text-emerald-900 font-extrabold text-sm transition-all shadow-sm hover:shadow-md"
                        >
                            {content.primary_btn || 'Start Free Now'}
                        </Link>

                        <Link
                            href={content.demo_url || '/contact'}
                            className="px-7 py-4 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white border border-emerald-600 font-bold text-sm transition-all"
                        >
                            {content.demo_btn || 'Book a Demo'}
                        </Link>

                        {waUrl && (
                            <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm transition-all shadow-sm"
                            >
                                <MessageCircle className="w-4 h-4" />
                                <span>Chat on WhatsApp</span>
                            </a>
                        )}
                    </div>

                    <p className="text-xs font-semibold text-emerald-200 tracking-wide pt-2">
                        {content.footer_note || 'Used by schools across Nairobi, Kiambu, and beyond. Set up in 10 minutes.'}
                    </p>
                </div>
            </div>
        </section>
    );
}