import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle, ShieldCheck, Check, GraduationCap } from 'lucide-react';

interface Props {
    status?: string;
}

function EduFlowBrandLogo() {
    return (
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 shrink-0">
                <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight leading-none text-slate-950">
                    Edu<span className="text-emerald-500">Flow</span>
                </span>
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">
                    Educate · Empower · Excel
                </span>
            </div>
        </div>
    );
}

export default function ForgotPassword({ status }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
        <div className="min-h-screen bg-slate-100/70 flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans antialiased selection:bg-indigo-600 selection:text-white">
            <Head title="Forgot Password | EduFlow" />

            {/* Master Two-Column Container Card */}
            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
                
                {/* =========================================================================
                    LEFT PANEL: SECURE RECOVERY TRUST ILLUSTATION
                ========================================================================= */}
                <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-b from-slate-50 via-indigo-50/30 to-purple-50/20 p-8 lg:p-10 flex-col justify-between border-r border-slate-200/80">
                    
                    <div>
                        <EduFlowBrandLogo />
                    </div>

                    {/* Central 3D Vector Shield & Paper Airplane Illustration */}
                    <div className="py-6 flex flex-col items-center text-center space-y-6">
                        <div className="relative">
                            {/* Shield Graphic with Envelope */}
                            <div className="w-28 h-32 rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 shadow-xl shadow-indigo-500/25 flex items-center justify-center text-white relative transform -rotate-1">
                                <div className="w-14 h-11 bg-white/20 rounded-xl backdrop-blur-xs border border-white/40 flex items-center justify-center">
                                    <Mail className="w-7 h-7 text-white" />
                                </div>
                            </div>
                            {/* Floating Paper Airplane Accent */}
                            <div className="absolute -bottom-2 -right-6 w-12 h-12 bg-white rounded-2xl shadow-lg border border-slate-100 flex items-center justify-center text-indigo-600 transform rotate-12">
                                <Send className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="space-y-2 max-w-xs">
                            <h2 className="text-base font-extrabold text-emerald-600">
                                Secure Password Recovery
                            </h2>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                We protect your privacy. For your security, we never disclose whether an account exists for an email address.
                            </p>
                        </div>

                        {/* Three Trust Checklist Items */}
                        <div className="space-y-2 text-left w-full max-w-xs pt-2">
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                                <span>Secure token-based reset links</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                                <span>Time-limited and one-time use</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                                <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                    <Check className="w-3 h-3 stroke-[3]" />
                                </div>
                                <span>Your data stays private and safe</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-[11px] text-slate-400">
                        © {new Date().getFullYear()} EduFlow. All rights reserved.
                    </div>
                </div>

                {/* =========================================================================
                    RIGHT PANEL: PASSWORD RECOVERY REQUEST FORM
                ========================================================================= */}
                <div className="lg:col-span-7 bg-white p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
                    
                    {/* Back to Login Link */}
                    <div className="flex items-center justify-between">
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Back to login</span>
                        </Link>
                        
                        {/* Mobile Brand Logo */}
                        <div className="lg:hidden">
                            <span className="text-lg font-extrabold text-slate-900">
                                Edu<span className="text-emerald-500">Flow</span>
                            </span>
                        </div>
                    </div>

                    <div className="max-w-md w-full mx-auto space-y-6 my-auto py-6">
                        
                        <div className="space-y-1.5">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                                Forgot your password?
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                                No worries! Enter your email and we'll send you a secure link to reset it.
                            </p>
                        </div>

                        {/* Status Message */}
                        {status && (
                            <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in" role="status">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span>{status}</span>
                            </div>
                        )}

                        {/* Validation Error Banner */}
                        {errors.email && (
                            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in" role="alert">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>{errors.email}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            
                            {/* Email Field */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700" htmlFor="forgot-email">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <input
                                        id="forgot-email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        autoComplete="email"
                                        placeholder="Enter your email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="h-11 w-full pl-10 pr-4 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none transition-all"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                {processing ? (
                                    <span>Sending reset link...</span>
                                ) : (
                                    <>
                                        <span>Send Reset Link</span>
                                        <Send className="w-3.5 h-3.5" />
                                    </>
                                )}
                            </button>

                        </form>

                        {/* Reassuring Privacy Box */}
                        <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-950">
                            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                            <span className="leading-relaxed text-[11px] text-slate-600">
                                If an account exists for that email address, password reset instructions have been dispatched.
                            </span>
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