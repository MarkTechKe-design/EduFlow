import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { ShieldCheck, Layers, BarChart3, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, AlertCircle, GraduationCap, Award } from 'lucide-react';

interface VisualConfig {
    imageUrl?: string | null;
    title: string;
    subtitle: string;
    notificationText: string;
    notificationSubtext: string;
    notificationEnabled: boolean;
}

interface Props {
    status?: string;
    canResetPassword?: boolean;
    visualConfig?: VisualConfig;
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

function GoogleIcon({ className = "w-4 h-4" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
    );
}

export default function Login({ 
    status, 
    canResetPassword = true, 
    visualConfig = {
        title: 'Empowering Kenyan schools to educate, empower, and excel.',
        subtitle: 'All-in-one school operations platform with secure multi-tenant isolation, role-based access, and real-time insights.',
        notificationText: 'Grade 7 CBC Assessment Rubrics Approved',
        notificationSubtext: 'Term 2 continuous evaluation scores validated for 12 learning areas.',
        notificationEnabled: true,
    }
}: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [imageError, setImageError] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
        <div className="min-h-screen bg-slate-100/70 flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans antialiased selection:bg-indigo-600 selection:text-white">
            <Head title="Sign In | EduFlow" />

            <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[660px]">
                
                {/* LEFT PANEL: BRAND STORYTELLING & KICC SILHOUETTE */}
                <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-b from-[#1E1B4B] via-[#2E1065] to-[#0F172A] text-white p-8 lg:p-10 flex-col justify-between relative overflow-hidden">
                    
                    {/* CMS Uploaded Background Image with Fallback Error Handling */}
                    {visualConfig?.imageUrl && !imageError && (
                        <div 
                            className="absolute inset-0 bg-cover bg-center mix-blend-overlay opacity-35"
                            style={{ backgroundImage: `url(${visualConfig.imageUrl})` }}
                        >
                            <img 
                                src={visualConfig.imageUrl} 
                                alt="" 
                                className="hidden" 
                                onError={() => setImageError(true)} 
                            />
                        </div>
                    )}

                    {/* Gradient Atmosphere */}
                    <div className="absolute top-0 right-0 w-60 h-60 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute bottom-24 -left-10 w-60 h-60 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="relative z-10 space-y-7">
                        <EduFlowBrandLogo light />

                        <div className="space-y-2.5 pt-2">
                            <h1 className="text-2xl lg:text-3xl font-extrabold text-white leading-snug tracking-tight">
                                {visualConfig.title}
                            </h1>
                            <p className="text-xs lg:text-sm text-indigo-200/90 leading-relaxed">
                                {visualConfig.subtitle}
                            </p>
                        </div>

                        {/* Value Highlights */}
                        <div className="space-y-3.5 pt-1">
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5 shadow-xs">
                                    <ShieldCheck className="w-4 h-4" />
                                </div>
                                <div className="space-y-0.5">
                                    <h2 className="text-xs font-bold text-white">Secure & Compliant</h2>
                                    <p className="text-[11px] text-indigo-200/80 leading-relaxed">
                                        Built with industry-leading security and Kenya Data Protection Act.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5 shadow-xs">
                                    <Layers className="w-4 h-4" />
                                </div>
                                <div className="space-y-0.5">
                                    <h2 className="text-xs font-bold text-white">Unified Operations</h2>
                                    <p className="text-[11px] text-indigo-200/80 leading-relaxed">
                                        Academics, finance, communication and more in one place.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5 shadow-xs">
                                    <BarChart3 className="w-4 h-4" />
                                </div>
                                <div className="space-y-0.5">
                                    <h2 className="text-xs font-bold text-white">Real-Time Insights</h2>
                                    <p className="text-[11px] text-indigo-200/80 leading-relaxed">
                                        Make data-driven decisions with live dashboards and reports.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Floating Operational Callout + KICC Silhouette */}
                    <div className="relative z-10 pt-4 pb-2">
                        {visualConfig.notificationEnabled && (
                            <div className="relative w-full max-w-sm mb-4 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="bg-slate-900/90 border border-white/20 rounded-2xl p-3 shadow-xl backdrop-blur-md flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
                                        <Award className="w-4 h-4" />
                                    </div>
                                    <div className="space-y-0.5 pr-1">
                                        <p className="text-xs font-bold text-white leading-tight">
                                            {visualConfig.notificationText}
                                        </p>
                                        <p className="text-[10px] text-slate-300 leading-tight">
                                            {visualConfig.notificationSubtext}
                                        </p>
                                    </div>
                                </div>

                                <div className="absolute -bottom-1.5 left-10 w-3 h-3 bg-slate-900 border-b border-r border-white/20 transform rotate-45" />
                            </div>
                        )}

                        {/* KICC & Nairobi Skyline Vector Structure */}
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

                {/* RIGHT PANEL: AUTHENTICATION FORM */}
                <div className="lg:col-span-7 bg-white p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
                    
                    <div className="lg:hidden mb-6 flex justify-center">
                        <EduFlowBrandLogo />
                    </div>

                    <div className="max-w-md w-full mx-auto space-y-6 my-auto">
                        
                        <div className="space-y-1">
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                                Welcome Back
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500">
                                Sign in to your EduFlow account to continue.
                            </p>
                        </div>

                        {status && (
                            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in" role="status">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span>{status}</span>
                            </div>
                        )}

                        {errors.email && (
                            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in" role="alert">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>{errors.email}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-700" htmlFor="login-email">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <Mail className="w-4 h-4" />
                                    </div>
                                    <input
                                        id="login-email"
                                        type="email"
                                        name="email"
                                        required
                                        autoComplete="username"
                                        placeholder="Enter your email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className="h-11 w-full pl-10 pr-4 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="block text-xs font-bold text-slate-700" htmlFor="login-password">
                                        Password
                                    </label>
                                    {canResetPassword && (
                                        <Link
                                            href="/forgot-password"
                                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded"
                                        >
                                            Forgot password?
                                        </Link>
                                    )}
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                        <Lock className="w-4 h-4" />
                                    </div>
                                    <input
                                        id="login-password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        required
                                        autoComplete="current-password"
                                        placeholder="Enter your password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="h-11 w-full pl-10 pr-11 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        aria-pressed={showPassword}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-rose-600 mt-1" role="alert">{errors.password}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-0.5">
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        name="remember"
                                        id="remember-device"
                                        checked={data.remember}
                                        onChange={(e) => setData('remember', e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                    <span className="text-xs text-slate-600">
                                        Remember this device
                                    </span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                {processing ? (
                                    <span>Signing in...</span>
                                ) : (
                                    <>
                                        <span>Sign In</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                            <div className="relative py-2 flex items-center justify-center">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-slate-200" />
                                </div>
                                <span className="relative bg-white px-3 text-xs text-slate-400 font-medium">
                                    or
                                </span>
                            </div>

                            <a
                                href="/auth/google"
                                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-xs sm:text-sm shadow-xs transition-all flex items-center justify-center gap-2.5 focus:outline-none focus:ring-2 focus:ring-slate-300"
                            >
                                <GoogleIcon className="w-4 h-4" />
                                <span>Continue with Google</span>
                            </a>

                        </form>

                        <div className="pt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>Protected by layered authentication and tenant query boundaries.</span>
                        </div>

                    </div>

                    <div className="mt-8 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
                        New institution?{' '}
                        <Link href="/register" className="font-bold text-indigo-600 hover:text-indigo-700 underline focus:outline-none">
                            Setup My School
                        </Link>
                    </div>

                </div>

            </div>
        </div>
    );
}