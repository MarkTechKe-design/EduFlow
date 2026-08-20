import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { GraduationCap, Mail, Send, LogOut, CheckCircle2, ShieldCheck, Layers, Check } from 'lucide-react';

interface Props {
    status?: string;
}

function EduFlowBrandLogo({ light = false }: { light?: boolean }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 shrink-0">
                <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
                <span className={`text-2xl font-black tracking-tight leading-none ${light ? 'text-white' : 'text-slate-950'}`}>
                    Edu<span className="text-emerald-400">Flow</span>
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${light ? 'text-indigo-200' : 'text-slate-400'}`}>
                    Educate · Empower · Excel
                </span>
            </div>
        </div>
    );
}

export default function VerifyEmail({ status }: Props) {
    const { post, processing } = useForm({});

    const handleResend: FormEventHandler = (e) => {
        e.preventDefault();
        post('/email/verification-notification');
    };

    return (
        <div className="min-h-screen bg-slate-100/70 flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans antialiased selection:bg-indigo-600 selection:text-white">
            <Head title="Verify Email | EduFlow" />

            {/* Master Two-Column Container */}
            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[620px]">
                
                {/* LEFT PANEL: KENYAN VISUAL IDENTITY & SECURITY TRUST */}
                <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-b from-[#1E1B4B] via-[#2E1065] to-[#0F172A] text-white p-8 lg:p-10 flex-col justify-between relative overflow-hidden">
                    
                    {/* Gradient Glow */}
                    <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-24 -left-10 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 space-y-7">
                        <EduFlowBrandLogo light />

                        <div className="space-y-2.5 pt-2">
                            <h1 className="text-2xl lg:text-3xl font-extrabold text-white leading-snug tracking-tight">
                                Account Verification & Security
                            </h1>
                            <p className="text-xs lg:text-sm text-indigo-200/90 leading-relaxed">
                                Confirming your email ensures administrative notifications, audit reports, and billing receipts reach your official school channels.
                            </p>
                        </div>

                        {/* Three Security Highlights */}
                        <div className="space-y-3.5 pt-1">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5 shadow-xs">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <div className="space-y-0.5">
                                    <h2 className="text-xs font-bold text-white">Cryptographically Signed</h2>
                                    <p className="text-[11px] text-indigo-200/80 leading-relaxed">
                                        Verification tokens are time-bound and encrypted with your application key.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5 shadow-xs">
                                    <Layers className="w-4 h-4" />
                                </div>
                                <div className="space-y-0.5">
                                    <h2 className="text-xs font-bold text-white">Prevent Unauthorized Takeover</h2>
                                    <p className="text-[11px] text-indigo-200/80 leading-relaxed">
                                        Guarantees institutional ownership over student records and financial ledgers.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KICC Silhouette Vector Graphic */}
                    <div className="relative z-10 pt-4 pb-2">
                        <div className="w-full relative opacity-40 hover:opacity-55 transition-opacity">
                            <svg className="w-full h-16 text-indigo-300" viewBox="0 0 400 80" fill="currentColor">
                                <path d="M175 75 L160 55 L220 55 L205 75 Z" opacity="0.9" />
                                <ellipse cx="190" cy="55" rx="30" ry="7" opacity="0.9" />
                                <rect x="181" y="16" width="18" height="40" rx="1" />
                                <rect x="183" y="14" width="14" height="2" />
                                <ellipse cx="190" cy="14" rx="12" ry="3" />
                                <rect x="188" y="2" width="4" height="12" rx="0.5" />
                                <line x1="190" y1="0" x2="190" y2="4" stroke="currentColor" strokeWidth="1.5" />

                                <rect x="10" y="38" width="22" height="42" rx="1" opacity="0.6" />
                                <rect x="38" y="24" width="26" height="56" rx="1" opacity="0.7" />
                                <rect x="70" y="44" width="20" height="36" rx="1" opacity="0.5" />
                                <rect x="96" y="18" width="30" height="62" rx="1" opacity="0.8" />
                                <rect x="132" y="32" width="24" height="48" rx="1" opacity="0.6" />
                                <rect x="224" y="22" width="28" height="58" rx="1" opacity="0.75" />
                                <rect x="258" y="36" width="22" height="44" rx="1" opacity="0.55" />
                                <rect x="286" y="12" width="32" height="68" rx="1" opacity="0.8" />
                                <rect x="324" y="28" width="24" height="52" rx="1" opacity="0.65" />
                                <rect x="354" y="42" width="36" height="38" rx="1" opacity="0.5" />
                            </svg>
                        </div>
                        <p className="text-[11px] text-indigo-300/60 pt-2">
                            © {new Date().getFullYear()} EduFlow. All rights reserved.
                        </p>
                    </div>
                </div>

                {/* RIGHT PANEL: INTERACTIVE VERIFICATION CARD */}
                <div className="lg:col-span-7 bg-white p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
                    
                    {/* Mobile Header Branding */}
                    <div className="lg:hidden mb-6 flex justify-center">
                        <EduFlowBrandLogo />
                    </div>

                    <div className="max-w-md w-full mx-auto space-y-6 my-auto">
                        
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mx-auto shadow-xs">
                            <Mail className="w-7 h-7" />
                        </div>

                        <div className="space-y-1.5 text-center">
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                                Verify Your Email
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                                We dispatched a verification link to your registered email address. Click the link inside to activate full access to your workspace.
                            </p>
                        </div>

                        {/* Status Message */}
                        {status === 'verification-link-sent' && (
                            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-3 animate-in fade-in" role="status">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                <span>A fresh verification link has been dispatched to your email address.</span>
                            </div>
                        )}

                        <form onSubmit={handleResend} className="space-y-4">
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                {processing ? (
                                    <span>Dispatching link...</span>
                                ) : (
                                    <>
                                        <span>Resend Verification Email</span>
                                        <Send className="w-3.5 h-3.5" />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Sign Out Option */}
                        <div className="pt-2 text-center border-t border-slate-100">
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 rounded-md p-1"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Sign out of session</span>
                            </Link>
                        </div>

                        {/* Security Notice */}
                        <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>Verification links expire automatically and require signed verification.</span>
                        </div>

                    </div>

                    <div className="lg:hidden text-center text-[11px] text-slate-400 pt-4 border-t border-slate-100">
                        © {new Date().getFullYear()} EduFlow. All rights reserved.
                    </div>

                </div>

            </div>
        </div>
    );
}