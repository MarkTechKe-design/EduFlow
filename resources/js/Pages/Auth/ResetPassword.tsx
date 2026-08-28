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
        <div className="min-h-screen bg-slate-100/70 flex items-center justify-center p-3 sm:p-6 lg:p-10 font-sans antialiased selection:bg-indigo-600 selection:text-white">
            <Head title="Set New Password | EduFlow" />

            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-900/10 border border-slate-200/80 p-6 sm:p-9 space-y-6">
                
                {/* Brand Header */}
                <div className="flex flex-col items-center text-center space-y-2">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
                            Set New Password
                        </h1>
                        <p className="text-xs text-slate-600 mt-0.5">
                            Create a secure password for <strong className="text-slate-800">{email}</strong>
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                    
                    {/* New Password */}
                    <div className="space-y-1.5">
                        <label htmlFor="password" className="block font-bold text-slate-800">
                            New Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Lock className="h-4 w-4" />
                            </div>
                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 text-xs text-slate-900 bg-slate-50/50 focus:outline-none"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-[11px] text-rose-600 font-semibold">{errors.password}</p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1.5">
                        <label htmlFor="password_confirmation" className="block font-bold text-slate-800">
                            Confirm New Password <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <Lock className="h-4 w-4" />
                            </div>
                            <input
                                id="password_confirmation"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20 text-xs text-slate-900 bg-slate-50/50 focus:outline-none"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-slate-400" />}
                            </button>
                        </div>
                        {errors.password_confirmation && (
                            <p className="text-[11px] text-rose-600 font-semibold">{errors.password_confirmation}</p>
                        )}
                    </div>

                    {/* Requirements Checklist */}
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                        <div className="flex items-center gap-2 text-[11px]">
                            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white ${hasMinLength ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                <Check className="w-2.5 h-2.5" />
                            </div>
                            <span className={hasMinLength ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>At least 8 characters</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white ${hasLetters && hasNumbers ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                <Check className="w-2.5 h-2.5" />
                            </div>
                            <span className={hasLetters && hasNumbers ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>Contains letters & numbers</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-white ${passwordsMatch ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                <Check className="w-2.5 h-2.5" />
                            </div>
                            <span className={passwordsMatch ? 'text-emerald-700 font-semibold' : 'text-slate-500'}>Passwords match</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={processing || !hasMinLength || !passwordsMatch}
                        className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <span>{processing ? 'Updating Password...' : 'Save New Password & Sign In'}</span>
                    </button>
                </form>

                <div className="text-center pt-2">
                    <Link
                        href="/login"
                        className="text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors"
                    >
                        Return to Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}