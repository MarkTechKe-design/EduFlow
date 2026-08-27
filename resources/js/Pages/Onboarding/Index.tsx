import { Head, useForm } from '@inertiajs/react';
import { Check, ImagePlus, MapPin, Palette, School, ShieldCheck, Loader2 } from 'lucide-react';
import { useState, FormEventHandler } from 'react';

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
        country: school.country || 'KE',
        timezone: school.timezone || 'Africa/Nairobi',
        currency: school.currency || 'KES',
        language: school.language || 'en',
        curriculum: school.curriculum || 'cbc',
        academic_year: settings.academic_year || `${new Date().getFullYear()}`,
        logo: null as File | null,
    });

    const set = (key: any, value: any) => form.setData(key, value);

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        form.post('/onboarding', { forceFormData: true });
    };

    return (
        <div className="min-h-screen bg-[var(--brand-background,#f8fafc)] px-5 py-8 text-slate-900">
            <Head title={`Set up your school - ${brandName}`} />

            <div className="mx-auto max-w-5xl">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--brand-primary,#0d9488)] text-white shadow-sm">
                        <ShieldCheck className="h-5 w-5" />
                    </span>
                    <div>
                        <p className="text-lg font-bold">
                            {brandName}
                            <span className="text-[var(--brand-accent,#14b8a6)]">.</span>
                        </p>
                        <p className="text-xs text-slate-500">Workspace setup</p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="mt-10 grid gap-8 lg:grid-cols-[.75fr_1.25fr]">
                    {/* Left Sidebar Steps */}
                    <aside>
                        <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--brand-primary,#0d9488)]">
                            Welcome aboard
                        </p>
                        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                            Let’s make {brandName} yours.
                        </h1>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            A few details now help your administrative team start with the right institution context from day one.
                        </p>

                        <div className="mt-8 space-y-3">
                            {[
                                ['school', 'School details', School],
                                ['academic', 'Academic setup', MapPin],
                                ['brand', 'Brand your workspace', Palette],
                                ['launch', 'Ready to launch', Check],
                            ].map(([key, label, Icon], i) => (
                                <div
                                    key={key as string}
                                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm"
                                >
                                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-50 text-[var(--brand-primary,#0d9488)]">
                                        <Icon className="h-4 w-4" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{label as string}</p>
                                        <p className="text-xs text-slate-400">Step {i + 1} of 4</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>

                    {/* Right Form Card */}
                    <form
                        onSubmit={handleSubmit}
                        className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/40 sm:p-8"
                    >
                        <h2 className="text-xl font-bold text-slate-900">Institution Profile</h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Configure your basic institution setup. You can update these details any time in Settings.
                        </p>

                        <section className="mt-7 grid gap-4 sm:grid-cols-2">
                            <Field
                                label="School name"
                                value={form.data.name}
                                onChange={(v) => set('name', v)}
                                error={form.errors.name}
                            />
                            <Field
                                label="Phone"
                                value={form.data.phone}
                                onChange={(v) => set('phone', v)}
                                error={form.errors.phone}
                            />
                            <Field
                                label="City / Town"
                                value={form.data.city}
                                onChange={(v) => set('city', v)}
                                error={form.errors.city}
                            />
                            <Field
                                label="Physical address"
                                value={form.data.address}
                                onChange={(v) => set('address', v)}
                                error={form.errors.address}
                            />
                            <Select
                                label="Curriculum"
                                value={form.data.curriculum}
                                onChange={(v) => set('curriculum', v)}
                                options={[
                                    ['cbc', 'CBC (Competency Based Curriculum)'],
                                    ['844', '8-4-4 System'],
                                    ['dual', 'Dual Curriculum (CBC & 8-4-4)'],
                                    ['international', 'International / IGCSE'],
                                ]}
                                error={form.errors.curriculum}
                            />
                            <Field
                                label="Academic year"
                                value={form.data.academic_year}
                                onChange={(v) => set('academic_year', v)}
                                error={form.errors.academic_year}
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
                                    ['UTC', 'UTC'],
                                ]}
                                error={form.errors.timezone}
                            />
                        </section>

                        {/* School Logo */}
                        <div className="mt-7 border-t border-slate-100 pt-6">
                            <p className="text-sm font-semibold text-slate-900">
                                School logo <span className="font-normal text-slate-400">(optional)</span>
                            </p>
                            <div className="mt-3 flex items-center gap-4">
                                <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="School Logo Preview" className="h-full w-full object-contain" />
                                    ) : (
                                        <ImagePlus className="h-6 w-6 text-slate-300" />
                                    )}
                                </div>
                                <label className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                                    Upload logo
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
                            </div>
                            {form.errors.logo && (
                                <p className="mt-1.5 text-xs text-rose-600">{form.errors.logo}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary,#0d9488)] px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-900/15 hover:opacity-95 transition-opacity disabled:opacity-60"
                        >
                            {form.processing ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span>Saving setup…</span>
                                </>
                            ) : (
                                <span>Complete setup and enter {brandName}</span>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function Field({
    label,
    value,
    onChange,
    error,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    error?: string;
}) {
    return (
        <label className="block text-sm font-semibold text-slate-700">
            {label}
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm font-normal text-slate-900 outline-none transition-colors focus:border-[var(--brand-primary,#0d9488)] focus:ring-1 focus:ring-[var(--brand-primary,#0d9488)]"
            />
            {error && <p className="mt-1 text-xs text-rose-600 font-normal">{error}</p>}
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
        <label className="block text-sm font-semibold text-slate-700">
            {label}
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-normal text-slate-900 outline-none transition-colors focus:border-[var(--brand-primary,#0d9488)] focus:ring-1 focus:ring-[var(--brand-primary,#0d9488)]"
            >
                {options.map(([val, lbl]) => (
                    <option key={val} value={val}>
                        {lbl}
                    </option>
                ))}
            </select>
            {error && <p className="mt-1 text-xs text-rose-600 font-normal">{error}</p>}
        </label>
    );
}