import AppLayout from '@/Layouts/AppLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    CreditCard,
    Receipt,
    ShieldCheck,
    RefreshCw,
    Check,
    AlertCircle,
    Sparkles,
    Building2,
    Download,
    Mail,
    Zap,
    AlertTriangle,
    FileText,
} from 'lucide-react';
import { useState } from 'react';
import type { PageProps } from '@/Types';

declare global {
    interface Window {
        PaystackPop?: {
            setup: (options: Record<string, any>) => { openIframe: () => void };
        };
    }
}

interface PackageItem {
    id: number;
    name: string;
    price_monthly?: number;
    price_annual?: number;
    price?: number;
    student_limit?: number | null;
    features?: string[] | string;
    description?: string;
}

interface PaymentRecord {
    id: number;
    reference: string;
    amount: number;
    currency: string;
    status: string;
    paid_at?: string;
    created_at: string;
}

interface SubscriptionData {
    id: number;
    package_id: number;
    package?: PackageItem;
    status?: string;
    lifecycle_status?: string;
    billing_cycle?: string;
    start_date?: string;
    end_date?: string;
    trial_ends_at?: string;
    paystack_authorization_code?: string;
    card_brand?: string;
    card_last4?: string;
    card_exp_month?: string;
    card_exp_year?: string;
    payments?: PaymentRecord[];
}

interface SchoolData {
    id: number;
    name: string;
    email?: string;
    billing_email?: string;
    kra_pin?: string;
    billing_address?: string;
    currency?: string;
}

interface BillingProps {
    school: SchoolData;
    subscription: SubscriptionData | null;
    packages: PackageItem[];
    paystackPublicKey: string;
}

export default function Billing({ school, subscription, packages = [], paystackPublicKey }: BillingProps) {
    const { flash, auth } = usePage<PageProps & { auth: any }>().props;
    const [updatingCard, setUpdatingCard] = useState(false);
    const [changingPackageId, setChangingPackageId] = useState<number | null>(null);
    const [isAnnual, setIsAnnual] = useState(subscription?.billing_cycle === 'annual');
    const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'tax-details'>('overview');

    const status = subscription?.lifecycle_status || subscription?.status || 'trial';

    // Form for Organization Billing Details
    const { data, setData, put, processing, errors } = useForm({
        name: school?.name || '',
        billing_email: school?.billing_email || school?.email || '',
        kra_pin: school?.kra_pin || '',
        billing_address: school?.billing_address || '',
    });

    function handleSaveDetails(e: React.FormEvent) {
        e.preventDefault();
        put('/billing/details');
    }

    function handleUpdateCard() {
        if (!paystackPublicKey) {
            alert('Paystack public key is not configured.');
            return;
        }

        if (typeof window.PaystackPop === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://js.paystack.co/v1/inline.js';
            script.onload = () => openPaystackModal();
            document.body.appendChild(script);
        } else {
            openPaystackModal();
        }
    }

    function openPaystackModal() {
        setUpdatingCard(true);
        const handler = window.PaystackPop!.setup({
            key: paystackPublicKey,
            email: auth?.user?.email || '',
            amount: 5000,
            currency: 'KES',
            metadata: {
                custom_fields: [
                    { display_name: 'School Name', variable_name: 'school_name', value: school?.name || '' },
                    { display_name: 'Action', variable_name: 'action', value: 'update_payment_method' },
                ],
            },
            callback: (response: { reference: string }) => {
                router.post('/billing/card', { reference: response.reference }, {
                    onFinish: () => setUpdatingCard(false),
                });
            },
            onClose: () => {
                setUpdatingCard(false);
            },
        });
        handler.openIframe();
    }

    function handleSelectPackage(packageId: number) {
        setChangingPackageId(packageId);
        router.post('/billing/package', { package_id: packageId }, {
            onFinish: () => setChangingPackageId(null),
        });
    }

    return (
        <AppLayout title="Subscription & Billing">
            <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
                {/* PAGE HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                                <ShieldCheck className="h-6 w-6" />
                            </span>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    Subscription & SaaS Billing
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Canva-style billing manager for <strong className="text-slate-800 dark:text-slate-200">{school?.name}</strong>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* NAVIGATION TABS (CANVA STYLE) */}
                    <div className="flex items-center gap-2 bg-slate-200/70 dark:bg-slate-800/80 p-1.5 rounded-2xl">
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                activeTab === 'overview'
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Plans & Payment
                        </button>
                        <button
                            onClick={() => setActiveTab('invoices')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                activeTab === 'invoices'
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Monthly Invoices ({subscription?.payments?.length || 0})
                        </button>
                        <button
                            onClick={() => setActiveTab('tax-details')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                activeTab === 'tax-details'
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            Tax & Billing Info
                        </button>
                    </div>
                </div>

                {/* FLASH NOTIFICATIONS */}
                {flash?.success && (
                    <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-4 text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
                        <Zap className="h-5 w-5 text-emerald-600 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {flash?.error && (
                    <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-4 text-sm text-rose-800 dark:text-rose-300 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* TAB 1: OVERVIEW / PLANS & PAYMENT METHOD */}
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* ACTIVE PLAN & PAYMENT METHOD ROW */}
                        <div className="grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
                            {/* Active Subscription Overview */}
                            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 md:p-8 text-white shadow-xl border border-slate-800">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-400 border border-teal-500/20">
                                            <Sparkles className="h-3 w-3" /> Active Plan
                                        </span>
                                        <h2 className="mt-3 text-3xl font-extrabold text-white">
                                            {subscription?.package?.name || 'Standard Academy'} Tier
                                        </h2>
                                    </div>
                                    <span className={`rounded-full px-3.5 py-1 text-xs font-bold uppercase tracking-wider ${
                                        status === 'active'
                                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                            : status === 'trial'
                                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                    }`}>
                                        {status.replace('_', ' ')}
                                    </span>
                                </div>

                                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                                    <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 font-medium">Rate</p>
                                        <p className="mt-1.5 text-base font-bold text-white">
                                            KES {Number(subscription?.package?.price_monthly || subscription?.package?.price || 0).toLocaleString()}
                                            <span className="text-xs font-normal text-slate-400"> /mo</span>
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 font-medium">Next Renewal</p>
                                        <p className="mt-1.5 text-base font-bold text-white">
                                            {subscription?.end_date
                                                ? new Date(subscription.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                                : (subscription?.trial_ends_at
                                                    ? new Date(subscription.trial_ends_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                                    : 'Active')}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
                                        <p className="text-xs text-slate-400 font-medium">Auto-Billing</p>
                                        <p className="mt-1.5 text-base font-bold text-teal-300">
                                            {subscription?.paystack_authorization_code ? 'Active Card' : 'Manual / Pending'}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-8 flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
                                    {status === 'cancelled' ? (
                                        <button
                                            type="button"
                                            onClick={() => router.post('/billing/reactivate')}
                                            className="rounded-xl bg-teal-400 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-teal-300 transition-colors"
                                        >
                                            Reactivate Subscription
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to cancel automatic subscription renewals?')) {
                                                    router.post('/billing/cancel');
                                                }
                                            }}
                                            className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                                        >
                                            Cancel Auto-Renew
                                        </button>
                                    )}
                                </div>
                            </section>

                            {/* Payment Method Card */}
                            <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-sm flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                            <CreditCard className="h-4 w-4" />
                                        </span>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                            Payment Method
                                        </h3>
                                    </div>

                                    {subscription?.card_last4 ? (
                                        <div className="mt-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-5">
                                            <div className="flex items-center justify-between">
                                                <span className="font-mono text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                                                    {subscription.card_brand || 'Card'} ???? {subscription.card_last4}
                                                </span>
                                                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                                                    Authorized
                                                </span>
                                            </div>
                                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                                Expires: {subscription.card_exp_month ? `${subscription.card_exp_month}/${subscription.card_exp_year}` : 'N/A'}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="mt-5 rounded-2xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 p-4 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                                            <span>No payment card currently authorized for seamless automated renewals.</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={handleUpdateCard}
                                    disabled={updatingCard}
                                    className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-teal-500 text-white dark:text-slate-950 px-4 py-3 text-sm font-bold hover:bg-slate-800 dark:hover:bg-teal-400 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    {updatingCard ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                                    {subscription?.card_last4 ? 'Change Payment Card' : 'Authorize Renewal Card'}
                                </button>
                            </section>
                        </div>

                        {/* PLAN TIERS & MONTHLY/ANNUAL TOGGLE (CANVA STYLE) */}
                        <section className="space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[.18em] text-teal-600 dark:text-teal-400">Available Tiers</p>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                                        Subscription Packages
                                    </h2>
                                </div>

                                {/* Billing Cycle Toggle */}
                                <div className="inline-flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    <button
                                        onClick={() => setIsAnnual(false)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                                            !isAnnual ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                                        }`}
                                    >
                                        Monthly Billing
                                    </button>
                                    <button
                                        onClick={() => setIsAnnual(true)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                                            isAnnual ? 'bg-teal-500 text-slate-950 font-extrabold shadow-sm' : 'text-slate-500'
                                        }`}
                                    >
                                        <span>Annual Plan</span>
                                        <span className="rounded-full bg-slate-950 text-teal-300 text-[10px] px-1.5 py-0.2">Save 20%</span>
                                    </button>
                                </div>
                            </div>

                            <div className="grid gap-5 md:grid-cols-3">
                                {packages.map((plan) => {
                                    const isCurrent = plan.id === subscription?.package_id;
                                    const monthlyPrice = Number(plan.price_monthly || plan.price || 0);
                                    const displayPrice = isAnnual ? monthlyPrice * 10 : monthlyPrice; // 2 months free calculation

                                    const featuresList: string[] = Array.isArray(plan.features)
                                        ? plan.features
                                        : typeof plan.features === 'string'
                                        ? JSON.parse(plan.features || '[]')
                                        : ['Full platform access', 'CBC Assessment tools', 'Fee Ledger & Receipts', 'Student Attendance'];

                                    return (
                                        <div
                                            key={plan.id}
                                            className={`relative rounded-3xl border bg-white dark:bg-slate-900 p-6 flex flex-col justify-between transition-all ${
                                                isCurrent
                                                    ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-md'
                                                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">{plan.name}</h3>
                                                    {isCurrent && (
                                                        <span className="rounded-full bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/60 px-2.5 py-0.5 text-xs font-bold text-teal-700 dark:text-teal-300">
                                                            Current Plan
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
                                                    KES {displayPrice.toLocaleString()}
                                                    <span className="text-xs font-normal text-slate-400">
                                                        {isAnnual ? ' / year (10 mo price)' : ' / month'}
                                                    </span>
                                                </p>

                                                <ul className="mt-5 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                                                    {featuresList.slice(0, 5).map((feature, idx) => (
                                                        <li key={idx} className="flex items-start">
                                                            <Check className="mr-2 h-3.5 w-3.5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                                                            <span>{feature}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {!isCurrent && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelectPackage(plan.id)}
                                                    disabled={changingPackageId === plan.id}
                                                    className="mt-6 w-full rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-teal-500 hover:text-teal-600 dark:hover:text-teal-400 transition-colors disabled:opacity-50"
                                                >
                                                    {changingPackageId === plan.id ? 'Switching...' : `Switch to ${plan.name}`}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </div>
                )}

                {/* TAB 2: INVOICES & MONTHLY DOWNLOADS (CANVA STYLE) */}
                {activeTab === 'invoices' && (
                    <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <span className="grid h-9 w-9 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                    <Receipt className="h-5 w-5" />
                                </span>
                                <div>
                                    <h2 className="font-bold text-slate-900 dark:text-white text-lg">
                                        Official Invoices & Receipts
                                    </h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Download printable VAT receipts and billing invoices per billing period.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {subscription?.payments && subscription.payments.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold uppercase text-slate-400">
                                            <th className="pb-3">Invoice / Ref</th>
                                            <th className="pb-3">Billing Date</th>
                                            <th className="pb-3">Amount</th>
                                            <th className="pb-3">Status</th>
                                            <th className="pb-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {subscription.payments.map((payment) => (
                                            <tr key={payment.id} className="text-slate-700 dark:text-slate-300">
                                                <td className="py-4 font-mono text-xs font-semibold text-slate-900 dark:text-white">
                                                    {payment.reference}
                                                </td>
                                                <td className="py-4 text-slate-500 dark:text-slate-400 text-xs">
                                                    {payment.paid_at
                                                        ? new Date(payment.paid_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                                                        : new Date(payment.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </td>
                                                <td className="py-4 font-bold text-slate-900 dark:text-white">
                                                    {payment.currency || 'KES'} {Number(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-4">
                                                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                                                        payment.status === 'completed'
                                                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                                            : payment.status === 'pending'
                                                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                                                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'
                                                    }`}>
                                                        {payment.status}
                                                    </span>
                                                </td>
                                                <td className="py-4 text-right space-x-2">
                                                    {/* Canva-Style PDF Download */}
                                                    <a
                                                        href={`/billing/invoices/${payment.id}/download`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                                    >
                                                        <Download className="h-3.5 w-3.5" /> Download PDF
                                                    </a>
                                                    {/* Resend to Email */}
                                                    <button
                                                        type="button"
                                                        onClick={() => router.post(`/billing/invoices/${payment.id}/resend`)}
                                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                                                    >
                                                        <Mail className="h-3.5 w-3.5" /> Email
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-slate-400 text-xs">
                                <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                No billing invoices generated yet.
                            </div>
                        )}
                    </section>
                )}

                {/* TAB 3: TAX & ORGANIZATION BILLING INFO (CANVA STYLE) */}
                {activeTab === 'tax-details' && (
                    <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 shadow-sm max-w-3xl">
                        <div className="flex items-center gap-3 mb-6">
                            <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                                <Building2 className="h-5 w-5" />
                            </span>
                            <div>
                                <h2 className="font-bold text-slate-900 dark:text-white text-lg">
                                    Organization & Tax Settings
                                </h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    These details will appear on all official monthly tax invoices and downloaded receipts.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSaveDetails} className="space-y-5">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                                    Legal School Name
                                </label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                                />
                                {errors.name && <p className="text-xs text-rose-600 mt-1">{errors.name}</p>}
                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                                        Billing / Accounts Email
                                    </label>
                                    <input
                                        type="email"
                                        value={data.billing_email}
                                        onChange={(e) => setData('billing_email', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">Invoices will be sent to this email address automatically.</p>
                                    {errors.billing_email && <p className="text-xs text-rose-600 mt-1">{errors.billing_email}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                                        KRA Tax PIN / VAT Number
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. P051239847Z"
                                        value={data.kra_pin}
                                        onChange={(e) => setData('kra_pin', e.target.value)}
                                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                                    />
                                    {errors.kra_pin && <p className="text-xs text-rose-600 mt-1">{errors.kra_pin}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                                    Physical Billing Address
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="e.g. P.O. Box 40200, Kisumu, Kenya"
                                    value={data.billing_address}
                                    onChange={(e) => setData('billing_address', e.target.value)}
                                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white focus:border-teal-500 focus:outline-none"
                                />
                                {errors.billing_address && <p className="text-xs text-rose-600 mt-1">{errors.billing_address}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="rounded-xl bg-slate-900 dark:bg-teal-500 text-white dark:text-slate-950 px-6 py-2.5 text-sm font-bold hover:bg-slate-800 dark:hover:bg-teal-400 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {processing ? 'Saving...' : 'Save Organization Details'}
                            </button>
                        </form>
                    </section>
                )}
            </div>
        </AppLayout>
    );
}