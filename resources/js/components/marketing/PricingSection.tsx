import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Check, ArrowRight, ShieldCheck } from 'lucide-react';

export interface PackageItem {
    id: number;
    name: string;
    badge?: string | null;
    slug?: string;
    description: string | null;
    price_monthly: string | number;
    price_yearly: string | number;
    trial_days?: number;
    is_popular?: boolean;
    features: string[] | null;
}

interface Props {
    packages?: PackageItem[];
}

export default function PricingSection({ packages = [] }: Props) {
    const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

    return (
        <section className="py-20 sm:py-28 bg-white relative overflow-hidden" id="pricing">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200 inline-flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Transparent Institutional Pricing</span>
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
                        Predictable Plans Built for Kenyan Schools
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        No hidden server setup costs. Scale seamlessly across student enrollment and termly CBC reporting.
                    </p>

                    {/* Monthly / Annual Toggle */}
                    <div className="pt-4 flex items-center justify-center">
                        <div className="bg-slate-100 p-1 rounded-2xl flex items-center border border-slate-200 text-xs font-bold">
                            <button
                                type="button"
                                onClick={() => setBillingPeriod('monthly')}
                                className={`px-5 py-2 rounded-xl transition-all ${
                                    billingPeriod === 'monthly'
                                        ? 'bg-white text-slate-950 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                Monthly Billing
                            </button>
                            <button
                                type="button"
                                onClick={() => setBillingPeriod('yearly')}
                                className={`px-5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                                    billingPeriod === 'yearly'
                                        ? 'bg-white text-slate-950 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                <span>Annual Billing</span>
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-extrabold">
                                    Save 15%
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Cards Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-4">
                    {packages.map((pkg) => {
                        const isPopular = Boolean(pkg.is_popular || pkg.name.toLowerCase().includes('standard'));
                        const price = billingPeriod === 'yearly' ? Number(pkg.price_yearly) : Number(pkg.price_monthly);
                        const trialDays = pkg.trial_days || 14;
                        const badgeText = pkg.badge || (isPopular ? 'POPULAR CHOICE' : (pkg.name.toLowerCase().includes('enterprise') ? 'INSTITUTIONAL PLAN' : 'AVAILABLE PLAN'));

                        return (
                            <div
                                key={pkg.id}
                                className={`relative rounded-3xl p-8 sm:p-10 flex flex-col justify-between transition-all ${
                                    isPopular
                                        ? 'bg-white border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500'
                                        : 'bg-white border border-slate-200/80 shadow-xs hover:border-slate-300'
                                }`}
                            >
                                {/* Top "Most Popular" Pill */}
                                {isPopular && (
                                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full shadow-xs whitespace-nowrap">
                                        MOST POPULAR CHOICE
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {/* Card Header & Badge */}
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="text-2xl font-extrabold text-slate-950 leading-tight">
                                            {pkg.name}
                                        </h3>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md shrink-0">
                                            {badgeText}
                                        </span>
                                    </div>

                                    {/* Target Scope Box */}
                                    {pkg.description && (
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                                            <span className="text-xs font-bold text-slate-900 block">Target Scope:</span>
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                {pkg.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Price Display */}
                                    <div className="space-y-1">
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
                                                KES {price.toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 font-medium">
                                            {trialDays}-day trial, then per {billingPeriod === 'yearly' ? 'year' : 'month'}
                                        </p>
                                        <p className="text-xs font-bold text-emerald-600 pt-0.5">
                                            Configurable institutional capacity
                                        </p>
                                    </div>

                                    {/* Core Capabilities Checklist */}
                                    <div className="space-y-3 pt-3 border-t border-slate-100">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                                            CORE CAPABILITIES INCLUDED:
                                        </span>

                                        <ul className="space-y-2.5 text-xs text-slate-700">
                                            {Array.isArray(pkg.features) && pkg.features.map((feature, fIdx) => (
                                                <li key={fIdx} className="flex items-start gap-2.5">
                                                    <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                                    <span className="leading-snug">{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* CTA Action Button */}
                                <div className="pt-8 mt-6">
                                    <Link
                                        href="/contact"
                                        className={`w-full py-3 px-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs ${
                                            isPopular
                                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                                        }`}
                                    >
                                        <span>Choose this plan</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
}