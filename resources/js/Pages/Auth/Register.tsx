import { Head, Link, useForm } from '@inertiajs/react';
import { useState, useEffect, FormEventHandler } from 'react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import {
    CheckCircle2,
    ArrowRight,
    ArrowLeft,
    Shield,
    CreditCard,
    Tag,
    Eye,
    EyeOff,
    Loader2,
} from 'lucide-react';

declare global {
    interface Window {
        PaystackPop?: {
            setup: (options: Record<string, any>) => { openIframe: () => void };
        };
    }
}

interface Package {
    id: number;
    name: string;
    badge?: string;
    description: string;
    price_monthly: number | string;
    price_yearly: number | string;
    trial_days: number;
    features?: string[];
    is_popular?: boolean;
}

interface Props {
    backgroundImages?: string[];
    packages?: Package[];
    branding?: {
        name?: string;
        support_phone?: string;
        support_email?: string;
    };
    paystackPublicKey?: string;
    currency?: string;
}

export default function Register({
    backgroundImages = [],
    packages = [],
    branding,
    paystackPublicKey = '',
    currency = 'KES',
}: Props) {
    const [bgIndex, setBgIndex] = useState(0);
    const [currentStep, setCurrentStep] = useState(1);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    // Coupon states
    const [couponInput, setCouponInput] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);
    const [couponError, setCouponError] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState<number | null>(null);

    // Auto-scroll background images
    useEffect(() => {
        if (backgroundImages.length <= 1) return;
        const interval = setInterval(() => {
            setBgIndex((prev) => (prev + 1) % backgroundImages.length);
        }, 7000);
        return () => clearInterval(interval);
    }, [backgroundImages]);

    // Load Paystack Inline SDK
    useEffect(() => {
        if (!document.getElementById('paystack-inline-sdk')) {
            const script = document.createElement('script');
            script.id = 'paystack-inline-sdk';
            script.src = 'https://js.paystack.co/v1/inline.js';
            script.async = true;
            document.body.appendChild(script);
        }
    }, []);

    const form = useForm({
        school_name: '',
        school_type: 'private',
        education_level: 'primary',
        curriculum: 'cbc',
        boarding_type: 'day',
        gender_type: 'mixed',
        school_email: '',
        school_phone: '',
        school_motto: '',
        county: '',
        sub_county: '',
        knec_code: '',
        registration_number: '',
        nemis_code: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        package_id: packages[0]?.id || 1,
        billing_cycle: 'monthly' as 'monthly' | 'yearly',
        coupon_code: '',
        paystack_reference: '',
        terms: false,
    });

    const selectedPkg = packages.find((p) => p.id === form.data.package_id) || packages[0];
    const trialDays = selectedPkg?.trial_days ?? 14;
    const basePrice = Number(billingCycle === 'yearly' ? selectedPkg?.price_yearly : selectedPkg?.price_monthly) || 0;
    const finalPrice = appliedDiscount !== null ? Math.max(0, basePrice - appliedDiscount) : basePrice;

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) return;
        setCouponLoading(true);
        setCouponError('');

        try {
            const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
            const res = await fetch('/register/validate-coupon', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    code: couponInput.trim(),
                    package_id: form.data.package_id,
                    billing_cycle: billingCycle,
                }),
            });

            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                const data = await res.json();
                if (res.ok && data.valid) {
                    setAppliedDiscount(data.discount_amount);
                    form.setData('coupon_code', data.code);
                    setCouponError('');
                } else {
                    setCouponError(data.message || 'Invalid coupon code.');
                    setAppliedDiscount(null);
                    form.setData('coupon_code', '');
                }
            } else {
                setCouponError('Server error. Check session/CSRF status.');
                setAppliedDiscount(null);
            }
        } catch (err: any) {
            setCouponError(err.message || 'Unable to connect to coupon verification service.');
        } finally {
            setCouponLoading(false);
        }
    };

    const validateAndNext = () => {
        if (currentStep === 1 && !form.data.school_name.trim()) {
            form.setError('school_name', 'Official School Name is required');
            return;
        }
        if (currentStep === 2 && (!form.data.school_email.trim() || !form.data.school_phone.trim())) {
            if (!form.data.school_email.trim()) form.setError('school_email', 'School email is required');
            if (!form.data.school_phone.trim()) form.setError('school_phone', 'School phone number is required');
            return;
        }
        if (currentStep === 3 && (!form.data.county.trim() || !form.data.sub_county.trim())) {
            if (!form.data.county.trim()) form.setError('county', 'County is required');
            if (!form.data.sub_county.trim()) form.setError('sub_county', 'Sub-County / Ward is required');
            return;
        }
        if (currentStep === 4) {
            if (!form.data.first_name.trim() || !form.data.last_name.trim() || !form.data.email.trim() || !form.data.password) {
                if (!form.data.first_name.trim()) form.setError('first_name', 'First name is required');
                if (!form.data.last_name.trim()) form.setError('last_name', 'Last name is required');
                if (!form.data.email.trim()) form.setError('email', 'Administrator email is required');
                if (!form.data.password) form.setError('password', 'Password is required');
                return;
            }
            if (form.data.password !== form.data.password_confirmation) {
                form.setError('password_confirmation', 'Passwords do not match');
                return;
            }
        }

        form.clearErrors();
        setCurrentStep((prev) => Math.min(prev + 1, 5));
        window.scrollTo({ top: 120, behavior: 'smooth' });
    };

    const prevStep = () => {
        form.clearErrors();
        setCurrentStep((prev) => Math.max(prev - 1, 1));
        window.scrollTo({ top: 120, behavior: 'smooth' });
    };

    const handleSubmit: FormEventHandler = (e) => {
        e.preventDefault();
        if (!form.data.terms) {
            form.setError('terms', 'Please accept the Terms of Service & Privacy Policy to proceed');
            return;
        }

        if (paystackPublicKey && window.PaystackPop) {
            const handler = window.PaystackPop.setup({
                key: paystackPublicKey,
                email: form.data.email || form.data.school_email,
                amount: 100, // Nominal KES 1 for 3DS tokenization
                currency: 'KES',
                ref: `AUTH_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                callback: (res: { reference: string }) => {
                    form.transform((data) => ({
                        ...data,
                        billing_cycle: billingCycle,
                        paystack_reference: res.reference,
                    }));
                    form.post('/register');
                },
            });
            handler.openIframe();
        } else {
            form.transform((data) => ({
                ...data,
                billing_cycle: billingCycle,
            }));
            form.post('/register');
        }
    };

    const steps = [
        { num: 1, label: 'Academic Structure' },
        { num: 2, label: 'Institution Profile' },
        { num: 3, label: 'Location & Compliance' },
        { num: 4, label: 'Administrator' },
        { num: 5, label: 'Plan & Billing' },
    ];

    const progressPercentage = (currentStep / 5) * 100;

    return (
        <MarketingLayout>
            <Head title="Setup My School ? EduFlow" />

            <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col justify-center">
                {/* Background Image Carousel with Overlay */}
                {backgroundImages.length > 0 && (
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {backgroundImages.map((src, index) => (
                            <div
                                key={src}
                                className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
                                    index === bgIndex ? 'opacity-25 scale-105' : 'opacity-0 scale-100'
                                }`}
                                style={{ backgroundImage: `url(${src})`, transitionProperty: 'opacity, transform', transitionDuration: '1000ms' }}
                            />
                        ))}
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/80 to-slate-950" />
                    </div>
                )}

                <div className="max-w-3xl mx-auto relative z-10 w-full">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
                            {trialDays}-Day Free Trial Included
                        </span>
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                            Register Your School
                        </h1>
                        <p className="mt-2 text-sm text-slate-400">
                            Institutional provisioning, CBC curriculum workflows, and school management portal.
                        </p>
                    </div>

                    {/* Progress Bar & Steps Tabs */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-6 shadow-xl backdrop-blur-md">
                        <div className="flex items-center justify-between text-xs font-semibold tracking-wider text-slate-400 mb-2">
                            <span>Stage {currentStep} of 5</span>
                            <span className="text-emerald-400 font-bold">{progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-3">
                            <div
                                className="bg-emerald-500 h-full transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                            {steps.map((s) => {
                                const isActive = currentStep === s.num;
                                const isDone = currentStep > s.num;
                                return (
                                    <button
                                        key={s.num}
                                        type="button"
                                        onClick={() => isDone && setCurrentStep(s.num)}
                                        disabled={!isDone && !isActive}
                                        className={`py-1.5 px-2 rounded-lg text-center text-xs font-medium transition-all ${
                                            isActive
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                : isDone
                                                ? 'text-slate-300 hover:text-white cursor-pointer'
                                                : 'text-slate-600 cursor-not-allowed'
                                        }`}
                                    >
                                        <div className="flex items-center justify-center gap-1">
                                            {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                                            <span className="truncate">{s.label}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-2xl">
                        <form onSubmit={handleSubmit}>
                            {/* STAGE 1: Academic Structure */}
                            {currentStep === 1 && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Official School Name *
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Nairobi Academy"
                                            value={form.data.school_name}
                                            onChange={(e) => form.setData('school_name', e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                                        />
                                        {form.errors.school_name && (
                                            <p className="text-xs text-red-500 mt-1">{form.errors.school_name}</p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                Education Level
                                            </label>
                                            <select
                                                value={form.data.education_level}
                                                onChange={(e) => form.setData('education_level', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                                            >
                                                <option value="primary">Primary / Junior School (Grade 1 - 9)</option>
                                                <option value="secondary">Senior Secondary School</option>
                                                <option value="all_through">Comprehensive (PP1 - Grade 12)</option>
                                                <option value="tvet">TVET / Tertiary Institution</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                Curriculum Orientation
                                            </label>
                                            <select
                                                value={form.data.curriculum}
                                                onChange={(e) => form.setData('curriculum', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                                            >
                                                <option value="cbc">Kenyan CBC</option>
                                                <option value="844">8-4-4 System</option>
                                                <option value="igcse">British / Cambridge IGCSE</option>
                                                <option value="integrated">Dual Integrated Curriculum</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STAGE 2: Institution Profile */}
                            {currentStep === 2 && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                Official School Email *
                                            </label>
                                            <input
                                                type="email"
                                                placeholder="info@school.ac.ke"
                                                value={form.data.school_email}
                                                onChange={(e) => form.setData('school_email', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                                            />
                                            {form.errors.school_email && (
                                                <p className="text-xs text-red-500 mt-1">{form.errors.school_email}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                Official School Phone *
                                            </label>
                                            <input
                                                type="tel"
                                                placeholder="+254 700 000000"
                                                value={form.data.school_phone}
                                                onChange={(e) => form.setData('school_phone', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                                            />
                                            {form.errors.school_phone && (
                                                <p className="text-xs text-red-500 mt-1">{form.errors.school_phone}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            School Motto / Tagline
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Knowledge, Integrity and Excellence"
                                            value={form.data.school_motto}
                                            onChange={(e) => form.setData('school_motto', e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* STAGE 3: Location & Compliance */}
                            {currentStep === 3 && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                County *
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Nairobi"
                                                value={form.data.county}
                                                onChange={(e) => form.setData('county', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                                            />
                                            {form.errors.county && (
                                                <p className="text-xs text-red-500 mt-1">{form.errors.county}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                Sub-County / Ward *
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Westlands"
                                                value={form.data.sub_county}
                                                onChange={(e) => form.setData('sub_county', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                                            />
                                            {form.errors.sub_county && (
                                                <p className="text-xs text-red-500 mt-1">{form.errors.sub_county}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                KNEC Examination Centre Code
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. 20401001"
                                                value={form.data.knec_code}
                                                onChange={(e) => form.setData('knec_code', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                Ministry Registration Number
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="Optional (e.g. MOE/PRI/2026/001)"
                                                value={form.data.registration_number}
                                                onChange={(e) => form.setData('registration_number', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            NEMIS / UIC Code
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Optional — provide if your institution has been issued one"
                                            value={form.data.nemis_code}
                                            onChange={(e) => form.setData('nemis_code', e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* STAGE 4: Administrator Credentials */}
                            {currentStep === 4 && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                First Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={form.data.first_name}
                                                onChange={(e) => form.setData('first_name', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                                            />
                                            {form.errors.first_name && (
                                                <p className="text-xs text-red-500 mt-1">{form.errors.first_name}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                Last Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={form.data.last_name}
                                                onChange={(e) => form.setData('last_name', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                                            />
                                            {form.errors.last_name && (
                                                <p className="text-xs text-red-500 mt-1">{form.errors.last_name}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                            Admin Work Email *
                                        </label>
                                        <input
                                            type="email"
                                            value={form.data.email}
                                            onChange={(e) => form.setData('email', e.target.value)}
                                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                                        />
                                        {form.errors.email && (
                                            <p className="text-xs text-red-500 mt-1">{form.errors.email}</p>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                Password *
                                            </label>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={form.data.password}
                                                onChange={(e) => form.setData('password', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm pr-9"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            {form.errors.password && (
                                                <p className="text-xs text-red-500 mt-1">{form.errors.password}</p>
                                            )}
                                        </div>
                                        <div className="relative">
                                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                                Confirm Password *
                                            </label>
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={form.data.password_confirmation}
                                                onChange={(e) => form.setData('password_confirmation', e.target.value)}
                                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm pr-9"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                            {form.errors.password_confirmation && (
                                                <p className="text-xs text-red-500 mt-1">{form.errors.password_confirmation}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STAGE 5: Plan, Coupon & Paystack Tokenization */}
                            {currentStep === 5 && (
                                <div className="space-y-4">
                                    {/* Cycle Switch */}
                                    <div className="flex justify-center">
                                        <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200">
                                            <button
                                                type="button"
                                                onClick={() => { setBillingCycle('monthly'); setAppliedDiscount(null); }}
                                                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                                    billingCycle === 'monthly'
                                                        ? 'bg-white text-slate-900 shadow-sm'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                            >
                                                Monthly Billing
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { setBillingCycle('yearly'); setAppliedDiscount(null); }}
                                                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                                                    billingCycle === 'yearly'
                                                        ? 'bg-emerald-600 text-white shadow-sm'
                                                        : 'text-slate-600 hover:text-slate-900'
                                                }`}
                                            >
                                                <span>Annual Billing</span>
                                                <span className="bg-emerald-200 text-emerald-900 text-[10px] px-1.5 py-0.2 rounded font-bold">
                                                    Save 20%
                                                </span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Package Radio Options */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {packages.map((pkg) => {
                                            const isSelected = form.data.package_id === pkg.id;
                                            const price = Number(billingCycle === 'yearly' ? pkg.price_yearly : pkg.price_monthly) || 0;
                                            return (
                                                <div
                                                    key={pkg.id}
                                                    onClick={() => { form.setData('package_id', pkg.id); setAppliedDiscount(null); }}
                                                    className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                                                        isSelected
                                                            ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                                                            : 'border-slate-200 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div className="font-bold text-slate-900 text-xs">{pkg.name}</div>
                                                    <div className="text-base font-bold text-slate-900 mt-1">
                                                        {currency} {price.toLocaleString()}
                                                        <span className="text-[10px] font-normal text-slate-500">
                                                            /{billingCycle === 'yearly' ? 'yr' : 'mo'}
                                                        </span>
                                                    </div>
                                                    <div className="text-[11px] text-emerald-600 font-medium mt-1">
                                                        {pkg.trial_days > 0 ? `${pkg.trial_days}-Day Free Trial` : 'Direct Plan'}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Coupon Input */}
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input
                                                type="text"
                                                placeholder="Coupon or Promo Code"
                                                value={couponInput}
                                                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                                className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-mono uppercase focus:ring-emerald-500"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleApplyCoupon}
                                            disabled={couponLoading || !couponInput.trim()}
                                            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl disabled:opacity-50 flex items-center gap-1"
                                        >
                                            {couponLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                            Apply
                                        </button>
                                    </div>
                                    {couponError && <p className="text-xs text-red-500">{couponError}</p>}

                                    {/* Order Calculation Summary */}
                                    <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2 text-xs">
                                        <div className="flex justify-between text-slate-400">
                                            <span>Subtotal ({billingCycle})</span>
                                            <span>{currency} {basePrice.toLocaleString()}</span>
                                        </div>
                                        {appliedDiscount !== null && (
                                            <div className="flex justify-between text-emerald-400 font-semibold">
                                                <span>Coupon Discount</span>
                                                <span>-{currency} {appliedDiscount.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-sm">
                                            <span>Due Today</span>
                                            <span>{currency} 0.00</span>
                                        </div>
                                        <p className="text-[11px] text-slate-400 flex items-start gap-1.5 pt-1">
                                            <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                            After {trialDays} days, recurring billing begins at {currency} {finalPrice.toLocaleString()}/{billingCycle === 'yearly' ? 'year' : 'month'}. Cancel anytime in settings.
                                        </p>
                                    </div>

                                    {/* Terms and Authorization */}
                                    <div className="flex items-start gap-2 pt-1">
                                        <input
                                            type="checkbox"
                                            id="terms"
                                            checked={form.data.terms}
                                            onChange={(e) => form.setData('terms', e.target.checked)}
                                            className="mt-0.5 w-4 h-4 rounded text-emerald-600 border-slate-300"
                                        />
                                        <label htmlFor="terms" className="text-xs text-slate-600">
                                            I agree to the <Link href="/terms" className="text-emerald-600 font-medium underline">Terms of Service</Link> and authorize post-trial recurring billing.
                                        </label>
                                    </div>
                                    {form.errors.terms && <p className="text-xs text-red-500">{form.errors.terms}</p>}
                                </div>
                            )}

                            {/* Controls */}
                            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                                {currentStep > 1 ? (
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                                    </button>
                                ) : <div />}

                                {currentStep < 5 ? (
                                    <button
                                        type="button"
                                        onClick={validateAndNext}
                                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-sm"
                                    >
                                        Continue <ArrowRight className="w-3.5 h-3.5" />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer"
                                    >
                                        <CreditCard className="w-3.5 h-3.5" />
                                        {trialDays > 0 ? `Authorize Card & Start ${trialDays}-Day Trial` : 'Authorize & Subscribe'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </MarketingLayout>
    );
}