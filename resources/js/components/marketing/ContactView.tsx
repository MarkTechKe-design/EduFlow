import { useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { Mail, Phone, MessageSquare, Clock, Send, CheckCircle2, ShieldCheck } from 'lucide-react';

interface Props {
    branding?: {
        name?: string;
        support_phone?: string | null;
        support_email?: string | null;
    };
}

export default function ContactView({ branding }: Props) {
    const [activeType, setActiveType] = useState<'demo' | 'quote' | 'contact'>('demo');

    const { data, setData, post, processing, recentlySuccessful, reset, errors } = useForm({
        form_type: 'demo',
        name: '',
        email: '',
        phone: '',
        organization: '',
        message: '',
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/contact', {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <div className="py-12 sm:py-20 bg-slate-50 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider shadow-xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Admissions & Technical Support</span>
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
                        Schedule a Guided Demo or Inquiry
                    </h1>
                    <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                        Speak directly with an EduFlow deployment specialist to evaluate our school operations platform.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left: Contact Channels & Desk Card */}
                    <div className="lg:col-span-5 space-y-6">
                        <div className="bg-[#0B132B] rounded-3xl p-8 text-white border border-slate-800 shadow-xl space-y-6">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                                    Direct Institutional Channels
                                </span>
                                <h2 className="text-2xl font-bold text-white mt-1">
                                    How Can We Assist?
                                </h2>
                            </div>

                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                Our deployment desk coordinates live demonstrations, data migration assessments, and CBC grading consultations for primary, JSS, and secondary schools.
                            </p>

                            <div className="space-y-4 pt-2 text-xs sm:text-sm">
                                <a
                                    href="https://wa.me/254723172481"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 hover:bg-emerald-900/60 transition-colors"
                                >
                                    <MessageSquare className="w-5 h-5 shrink-0" />
                                    <div>
                                        <span className="font-bold block">Admissions WhatsApp</span>
                                        <span className="text-[11px] text-slate-400">+254 723 172 481 (Quick Inquiries)</span>
                                    </div>
                                </a>

                                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                                    <Phone className="w-5 h-5 text-emerald-400 shrink-0" />
                                    <div>
                                        <span className="font-bold block text-white">Telephone Support</span>
                                        <span className="text-[11px] text-slate-400">{branding?.support_phone || '+254 700 000 000'}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                                    <Mail className="w-5 h-5 text-emerald-400 shrink-0" />
                                    <div>
                                        <span className="font-bold block text-white">Official Work Email</span>
                                        <span className="text-[11px] text-slate-400">{branding?.support_email || 'support@eduflow.co.ke'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>Support Desk: Mon – Fri, 8:00 AM – 5:00 PM EAT</span>
                            </div>
                        </div>
                    </div>

                    {/* Right: Lead Capture Form */}
                    <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-xs">
                        {recentlySuccessful && (
                            <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in duration-200">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                <span>Thank you. Your request has been logged. A deployment engineer will reach out shortly.</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                                    Inquiry Objective *
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { type: 'demo', label: 'Book Live Demo' },
                                        { type: 'quote', label: 'Custom Quote' },
                                        { type: 'contact', label: 'General Inquiry' },
                                    ].map((opt) => (
                                        <button
                                            type="button"
                                            key={opt.type}
                                            onClick={() => {
                                                setActiveType(opt.type as any);
                                                setData('form_type', opt.type as any);
                                            }}
                                            className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                                                activeType === opt.type
                                                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Your Full Name *
                                    </label>
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
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Official Email *
                                    </label>
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Phone Number (Optional)
                                    </label>
                                    <input
                                        type="tel"
                                        placeholder="+254 700 000 000"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        className="h-11 w-full rounded-xl border border-slate-200 px-4 text-xs sm:text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        School / Organization Name
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. St. Augustine Academy"
                                        value={data.organization}
                                        onChange={(e) => setData('organization', e.target.value)}
                                        className="h-11 w-full rounded-xl border border-slate-200 px-4 text-xs sm:text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                    Notes or Specific Requirements *
                                </label>
                                <textarea
                                    rows={4}
                                    required
                                    placeholder="Describe your student enrollment size, curriculum focus (CBC/8-4-4/IGCSE), or specific modules you wish to evaluate..."
                                    value={data.message}
                                    onChange={(e) => setData('message', e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 p-4 text-xs sm:text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                                />
                                {errors.message && <p className="text-xs text-rose-600 mt-1">{errors.message}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {processing ? (
                                    <span>Transmitting Request...</span>
                                ) : (
                                    <>
                                        <span>Submit Request to EduFlow Desk</span>
                                        <Send className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                </div>

            </div>
        </div>
    );
}