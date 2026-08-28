import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle, ShieldCheck, GraduationCap } from 'lucide-react';

interface Props {
    status?: string;
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

            {/* Master Responsive Container Card */}
            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">

                {/* Left Panel: Recovery Security & Trust Context (Hidden on small screens) */}
                <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-b from-slate-50 via-indigo-50/30 to-purple-50/20 p-8 lg:p-10 flex-col justify-between border-r border-slate-200/80">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 shrink-0">
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

                    <div className="py-6 flex flex-col items-center text-center space-y-5">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-purple-700 shadow-xl shadow-indigo-500/25 flex items-center justify-center text-white relative transform -rotate-1">
                            <div className="w-12 h-10 bg-white/20 rounded-xl backdrop-blur-xs border border-white/40 flex items-center justify-center">
                                <Mail className="w-6 h-6 text-white" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-lg font-bold text-slate-900">Secure Account Recovery</h2>
                            <p className="text-xs text-slate-600 leading-relaxed max-w-xs">
                                Enter your verified school email address. We will dispatch a cryptographically signed reset token valid for 60 minutes.
                            </p>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200/60 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Protected by multi-tenant authentication boundaries.</span>
                    </div>
                </div>

                {/* Right Panel: Reset Request Form */}
                <div className="col-span-1 lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
                    
                    {/* Mobile Brand Header */}
                    <div className="lg:hidden flex items-center justify-between pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-sm">
                                <GraduationCap className="w-4 h-4" />
                            </div>
                            <span className="text-xl font-extrabold text-slate-950">
                                Edu<span className="text-emerald-500">Flow</span>
                            </span>
                        </div>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Back to Sign In</span>
                        </Link>
                    </div>

                    <div className="space-y-6 max-w-md w-full mx-auto my-auto py-4">
                        <div className="space-y-2">
                            <div className="hidden lg:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Password Assistance</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                                Reset your password
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                Enter the email associated with your staff, administrator, or parent account to receive reset instructions.
                            </p>
                        </div>

                        {/* Status Alert */}
                        {status && (
                            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3 text-emerald-900 animate-in fade-in duration-200">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold">Reset Instructions Dispatched</p>
                                    <p className="text-xs text-emerald-800/90 leading-relaxed">{status}</p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label htmlFor="email" className="block text-xs font-bold text-slate-800">
                                    Account Email Address <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <Mail className="h-4 w-4" />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="admin@eduflow.test or teacher@school.ke"
                                        className={`w-full pl-10 pr-4 py-3 rounded-2xl border text-xs sm:text-sm transition-all focus:outline-none focus:ring-2 bg-slate-50/50 ${
                                            errors.email
                                                ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900 bg-rose-50/30'
                                                : 'border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:ring-indigo-600/20 text-slate-900'
                                        }`}
                                        required
                                        autoFocus
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-xs text-rose-600 font-semibold flex items-center gap-1 mt-1">
                                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                        <span>{errors.email}</span>
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Send className="w-4 h-4" />
                                <span>{processing ? 'Sending Link...' : 'Email Reset Link'}</span>
                            </button>
                        </form>

                        <div className="text-center pt-2">
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Return to Sign In</span>
                            </Link>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 text-center lg:text-left">
                        <p className="text-[11px] text-slate-400">
                            Need institutional access assistance? Contact your school system administrator or EduFlow support.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}