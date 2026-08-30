import { Head, useForm } from '@inertiajs/react';
import { Check, ImagePlus, MapPin, Palette, School, GraduationCap, Loader2, AlertCircle, Phone, Globe, Calendar, Clock } from 'lucide-react';
import React, { useState, FormEventHandler } from 'react';

interface SchoolData {
    id: number;
    name?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
    timezone?: string;
    currency?: string;
    language?: string;
    curriculum?: string;
    logo?: string | null;
}

interface Props {
    school: SchoolData;
    settings: Record<string, string>;
    branding?: {
        name?: string;
        support_phone?: string;
        support_email?: string;
    };
    steps?: Record<string, string>;
}

export default function Onboarding({ school, settings, branding }: Props) {
    const brandName = branding?.name || 'EduFlow';
    const [logoPreview, setLogoPreview] = useState<string | null>(
        school.logo ? `/storage/${school.logo}` : null
    );

    const form = useForm({
        name: school.name || '',
        phone: school.phone || '',
        address: school.address || '',
        city: school.city || '',
        country: (school.country && school.country.length === 2) ? school.country.toUpperCase() : 'KE',
        timezone: school.timezone || 'Africa/Nairobi',
        currency: school.currency || 'KES',
        language: school.language ? school.language.toLowerCase() : 'en',
        curriculum: school.curriculum ? school.curriculum.toLowerCase().replace('-', '') : 'cbc',
        academic_year: settings?.academic_year || `${new Date().getFullYear()}`,
        logo: null as File | null,
    });

    const set = (key: any, value: any) => form.setData(key, value);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post('/onboarding', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    const hasErrors = Object.keys(form.errors).length > 0;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between font-sans selection:bg-indigo-500 selection:text-white">
            <Head title={`Set up your school - ${brandName}`} />

            {/* Topbar Header */}
            <header className="h-16 shrink-0 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-xs">
                        <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-extrabold tracking-tight text-white leading-none">
                            Edu<span className="text-emerald-500">Flow</span>
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            School Operations Platform
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Workspace Initialization</span>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12">
                <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] items-start">
                    {/* Left Sidebar Steps */}
                    <aside className="space-y-6">
                        <div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                Welcome aboard
                            </span>
                            <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                                Let’s make <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">{brandName}</span> yours.
                            </h1>
                            <p className="mt-3 text-sm leading-relaxed text-slate-400">
                                Configure your primary institution details and academic schedule to calibrate your workspace.
                            </p>
                        </div>

                        <div className="space-y-3 pt-2">
                            {[
                                ['school', 'School details', School, 'Step 1 of 4'],
                                ['academic', 'Academic setup', MapPin, 'Step 2 of 4'],
                                ['brand', 'Brand your workspace', Palette, 'Step 3 of 4'],
                                ['launch', 'Ready to launch', Check, 'Step 4 of 4'],
                            ].map(([key, label, Icon, stepText]) => (
                                <div
                                    key={key as string}
                                    className="flex items-center gap-3.5 rounded-2xl border border-slate-800 bg-slate-950/60 p-3.5 shadow-sm transition-all hover:border-slate-700"
                                >
                                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-bold text-white">{label as string}</p>
                                        <p className="text-xs font-medium text-slate-500">{stepText as string}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Support contacts */}
                        <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 text-xs text-slate-400 space-y-1">
                            <p className="font-semibold text-slate-300">Need onboarding assistance?</p>
                            <p>Support: <span className="text-indigo-400 font-mono">{branding?.support_email || 'support@eduflow.co.ke'}</span></p>
                            <p>Helpline: <span className="text-indigo-400 font-mono">{branding?.support_phone || '+254 718 178521'}</span></p>
                        </div>
                    </aside>

                    {/* Right Form Card */}
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl shadow-black/50">
                        <div className="border-b border-slate-800 pb-5">
                            <h2 className="text-xl font-bold text-white">Institution Profile</h2>
                            <p className="mt-1 text-xs text-slate-400">
                                Configure your core institution profile and initial academic year.
                            </p>
                        </div>

                        {/* Error Alert Banner */}
                        {hasErrors && (
                            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 text-xs text-rose-300">
                                <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
                                <div className="space-y-1">
                                    <p className="font-bold text-rose-200">Please review the errors below:</p>
                                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-300/90">
                                        {Object.entries(form.errors).map(([key, err]) => (
                                            <li key={key}>{err}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    label="School name"
                                    value={form.data.name}
                                    onChange={(v) => set('name', v)}
                                    error={form.errors.name}
                                    placeholder="e.g. Greenfield Academy"
                                />

                                <Field
                                    label="Phone"
                                    value={form.data.phone}
                                    onChange={(v) => set('phone', v)}
                                    error={form.errors.phone}
                                    placeholder="+254 700 000000"
                                />

                                <Field
                                    label="City / Town"
                                    value={form.data.city}
                                    onChange={(v) => set('city', v)}
                                    error={form.errors.city}
                                    placeholder="e.g. Nairobi"
                                />

                                <Field
                                    label="Physical address"
                                    value={form.data.address}
                                    onChange={(v) => set('address', v)}
                                    error={form.errors.address}
                                    placeholder="e.g. Kilimani, Argwings Kodhek Rd"
                                />

                                <Select
                                    label="Curriculum"
                                    value={form.data.curriculum}
                                    onChange={(v) => set('curriculum', v)}
                                    options={[
                                        ['cbc', 'CBC (Competency Based Curriculum)'],
                                        ['844', '8-4-4 System'],
                                        ['dual', 'Dual Curriculum (CBC & 8-4-4 / IGCSE)'],
                                        ['international', 'International / IGCSE'],
                                    ]}
                                    error={form.errors.curriculum}
                                />

                                <Field
                                    label="Current academic year"
                                    value={form.data.academic_year}
                                    onChange={(v) => set('academic_year', v)}
                                    error={form.errors.academic_year}
                                    placeholder="2026"
                                />

                                <Select
                                    label="Country"
                                    value={form.data.country}
                                    onChange={(v) => set('country', v)}
                                    options={[
                                        ['KE', 'Kenya (KE)'],
                                        ['UG', 'Uganda (UG)'],
                                        ['TZ', 'Tanzania (TZ)'],
                                        ['RW', 'Rwanda (RW)'],
                                    ]}
                                    error={form.errors.country}
                                />

                                <Select
                                    label="Default currency"
                                    value={form.data.currency}
                                    onChange={(v) => set('currency', v)}
                                    options={[
                                        ['KES', 'KES - Kenyan Shilling'],
                                        ['USD', 'USD - US Dollar'],
                                        ['UGX', 'UGX - Ugandan Shilling'],
                                        ['TZS', 'TZS - Tanzanian Shilling'],
                                    ]}
                                    error={form.errors.currency}
                                />

                                <Select
                                    label="Language"
                                    value={form.data.language}
                                    onChange={(v) => set('language', v)}
                                    options={[
                                        ['en', 'English'],
                                        ['sw', 'Kiswahili'],
                                        ['fr', 'French'],
                                        ['ar', 'Arabic'],
                                    ]}
                                    error={form.errors.language}
                                />

                                <Select
                                    label="Timezone"
                                    value={form.data.timezone}
                                    onChange={(v) => set('timezone', v)}
                                    options={[
                                        ['Africa/Nairobi', 'Africa/Nairobi (EAT, UTC+3)'],
                                        ['Africa/Kampala', 'Africa/Kampala (EAT, UTC+3)'],
                                        ['Africa/Dar_es_Salaam', 'Africa/Dar es Salaam (EAT, UTC+3)'],
                                        ['Africa/Kigali', 'Africa/Kigali (CAT, UTC+2)'],
                                        ['UTC', 'UTC'],
                                    ]}
                                    error={form.errors.timezone}
                                />
                            </div>

                            {/* School Logo */}
                            <div className="border-t border-slate-800/80 pt-5">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                    Institution Logo <span className="font-normal lowercase text-slate-500">(optional)</span>
                                </p>
                                <div className="mt-3 flex items-center gap-4">
                                    <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/90">
                                        {logoPreview ? (
                                            <img src={logoPreview} alt="School Logo Preview" className="h-full w-full object-contain p-1" />
                                        ) : (
                                            <ImagePlus className="h-6 w-6 text-slate-600" />
                                        )}
                                    </div>
                                    <div>
                                        <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 text-xs font-semibold text-white transition-colors">
                                            <span>{logoPreview ? 'Change logo' : 'Upload logo'}</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0] || null;
                                                    if (file) {
                                                        set('logo', file);
                                                        setLogoPreview(URL.createObjectURL(file));
                                                    }
                                                }}
                                            />
                                        </label>
                                        <p className="mt-1 text-[11px] text-slate-500">PNG, JPG or SVG up to 2MB</p>
                                    </div>
                                </div>
                                {form.errors.logo && (
                                    <p className="mt-1.5 text-xs text-rose-400">{form.errors.logo}</p>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4 border-t border-slate-800/80">
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-emerald-600 hover:from-indigo-500 hover:to-emerald-500 px-6 py-4 text-sm font-extrabold text-white shadow-lg shadow-indigo-900/30 transition-all disabled:opacity-50 cursor-pointer"
                                >
                                    {form.processing ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            <span>Completing workspace setup…</span>
                                        </>
                                    ) : (
                                        <span>Complete setup and enter EduFlow</span>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-800/80 bg-slate-950/60 py-4 text-center text-xs text-slate-500">
                &copy; {new Date().getFullYear()} EduFlow. All rights reserved.
            </footer>
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    error,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
    placeholder?: string;
}) {
    return (
        <label className="block text-xs font-semibold text-slate-300">
            {label}
            <input
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 text-sm text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
            {error && <p className="mt-1 text-xs text-rose-400 font-normal">{error}</p>}
        </label>
    );
}

function Select({
    label,
    value,
    onChange,
    options,
    error,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: string[][];
    error?: string;
}) {
    return (
        <label className="block text-xs font-semibold text-slate-300">
            {label}
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 text-sm text-white outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            >
                {options.map(([val, lbl]) => (
                    <option key={val} value={val} className="bg-slate-900 text-white">
                        {lbl}
                    </option>
                ))}
            </select>
            {error && <p className="mt-1 text-xs text-rose-400 font-normal">{error}</p>}
        </label>
    );
}