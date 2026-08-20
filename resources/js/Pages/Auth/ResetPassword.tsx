import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';
import { GraduationCap, Lock, Eye, EyeOff, Check, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

interface Props {
    token: string;
    email: string;
}

export default function ResetPassword({ token, email }: Props) {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/reset-password', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const hasMinLength = data.password.length >= 8;
    const hasLetters = /[a-zA-Z]/.test(data.password);
    const hasNumbers = /[0-9]/.test(data.password);
    const passwordsMatch = data.password.length > 0 && data.password === data.password_confirmation;

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-between font-sans text-slate-100 antialiased selection:bg-indigo-500 selection:text-white">
            <Head title="Reset Password | EduFlow" />

            <header className="py-5 px-4 sm:px-8 max-w-7xl mx-auto w-full flex items-center justify-between z-10">
                <Link href="/" className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-xl p-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform duration-200">
                        <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xl font-bold tracking-tight text-white leading-none">
                            Edu<span className="text-indigo-400">Flow</span>
                        </span>
                        <span className="text-[10px] font-medium tracking-wider text-slate-400 mt-1">
                            School operations, in sync.
                        </span>
                    </div>
                </Link>
            </header>

            <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
                <div className="max-w-md w-full">
                    
                    <div className="bg-white text-slate-900 rounded-3xl border border-slate-200/90 shadow-2xl shadow-indigo-950/20 p-7 sm:p-10 space-y-6">
                        
                        <div className="space-y-1.5 text-center">
                            <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
                                Set New Password
                            </h1>
                            <p className="text-xs sm:text-sm text-slate-500">
                                Enter your email and choose a strong replacement password.
                            </p>
                        </div>

                        {errors.email && (
                            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5" role="alert">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                <span>{errors.email}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                            
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="reset-email">
                                    Account Email
                                </label>
                                <input
                                    id="reset-email"
                                    type="email"
                                    name="email"
                                    required
                                    autoComplete="username"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="h-12 w-full px-4 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none transition-all"
                                />
                            </div>

                            {/* New Password */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="reset-password">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="reset-password"
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        required
                                        autoComplete="new-password"
                                        placeholder="••••••••••••"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="h-12 w-full pl-4 pr-11 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        aria-pressed={showPassword}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg m-1"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="text-xs text-rose-600 mt-1" role="alert">{errors.password}</p>
                                )}
                            </div>

                            {/* Confirm New Password */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700" htmlFor="reset-password-confirm">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="reset-password-confirm"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        name="password_confirmation"
                                        required
                                        autoComplete="new-password"
                                        placeholder="••••••••••••"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        className="h-12 w-full pl-4 pr-11 rounded-xl border border-slate-200 text-xs sm:text-sm text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 focus:outline-none transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                        aria-pressed={showConfirmPassword}
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg m-1"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password_confirmation && (
                                    <p className="text-xs text-rose-600 mt-1" role="alert">{errors.password_confirmation}</p>
                                )}
                            </div>

                            {/* Informational Guidance Checklist */}
                            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    Password Guidelines:
                                </div>
                                <div className="space-y-1.5">
                                    <div className={`flex items-center gap-2 ${hasMinLength ? 'text-indigo-900 font-semibold' : 'text-slate-500'}`}>
                                        <Check className={`w-3.5 h-3.5 ${hasMinLength ? 'text-indigo-600' : 'text-slate-300'}`} />
                                        <span>Minimum 8 characters</span>
                                    </div>
                                    <div className={`flex items-center gap-2 ${hasLetters && hasNumbers ? 'text-indigo-900 font-semibold' : 'text-slate-500'}`}>
                                        <Check className={`w-3.5 h-3.5 ${hasLetters && hasNumbers ? 'text-indigo-600' : 'text-slate-300'}`} />
                                        <span>Contains letters and numbers</span>
                                    </div>
                                    <div className={`flex items-center gap-2 ${passwordsMatch ? 'text-indigo-900 font-semibold' : 'text-slate-500'}`}>
                                        <Check className={`w-3.5 h-3.5 ${passwordsMatch ? 'text-indigo-600' : 'text-slate-300'}`} />
                                        <span>Passwords match</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/25 transition-all disabled:opacity-60 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                {processing ? (
                                    <span>Updating password...</span>
                                ) : (
                                    <>
                                        <span>Reset Password</span>
                                        <CheckCircle2 className="w-4 h-4" />
                                    </>
                                )}
                            </button>

                        </form>

                    </div>

                    <div className="mt-5 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
                        <span>All passwords salted with bcrypt before storage.</span>
                    </div>

                </div>
            </main>

            <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-900">
                © {new Date().getFullYear()} EduFlow. All rights reserved.
            </footer>
        </div>
    );
}