import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Check, CreditCard, Receipt, ShieldCheck, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import type { PageProps } from '@/Types';

declare global {
    interface Window {
        PaystackPop?: {
            setup: (options: Record<string, any>) => { openIframe: () => void };
        };
    }
}

interface BillingProps {
    school: any;
    subscription: any;
    packages: any[];
    paystackPublicKey: string;
}

export default function Billing({ school, subscription, packages = [], paystackPublicKey }: BillingProps) {
    const { flash, auth } = usePage<PageProps & { auth: any }>().props;
    const [updatingCard, setUpdatingCard] = useState(false);

    const status = subscription?.lifecycle_status || subscription?.status || 'trial';

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
            email: auth.user.email,
            amount: 5000, // 50.00 KES authorization/verification amount
            currency: 'KES',
            metadata: {
                custom_fields: [
                    { display_name: 'School Name', variable_name: 'school_name', value: school.name },
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

    return (
        <div className="min-h-screen bg-[var(--brand-background)] px-5 py-8 text-slate-900">
            <Head title="Billing & Subscription" />
            <div className="mx-auto max-w-6xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[var(--brand-primary)] text-white">
                            <ShieldCheck className="h-5 w-5" />
                        </span>
                        <span className="text-xl font-bold">Billing & Subscription</span>
                    </div>
                    <Link href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-slate-700">
                        <ArrowLeft className="mr-1 inline h-4 w-4" /> Back to Dashboard
                    </Link>
                </div>

                {flash?.success && (
                    <div className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 border border-emerald-200">
                        {flash.success}
                    </div>
                )}

                <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
                    {/* Subscription Overview */}
                    <section className="rounded-3xl bg-slate-950 p-7 text-white shadow-lg">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[.18em] text-teal-300">Active Tier</p>
                                <h1 className="mt-3 text-3xl font-bold">{subscription?.package?.name || 'Trial'} Plan</h1>
                            </div>
                            <span className="rounded-full bg-teal-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-300">
                                {status.replace('_', ' ')}
                            </span>
                        </div>

                        <div className="mt-8 grid gap-4 sm:grid-cols-3">
                            <Stat label="Billing Rate" value={`KES ${Number(subscription?.package?.price_monthly || 0).toLocaleString()} / mo`} />
                            <Stat label="Trial / Expiry" value={subscription?.trial_ends_at ? new Date(subscription.trial_ends_at).toLocaleDateString() : (subscription?.end_date ? new Date(subscription.end_date).toLocaleDateString() : 'Active')} />
                            <Stat label="Auto-Renew" value={subscription?.paystack_authorization_code ? 'Enabled' : 'Pending Card'} />
                        </div>

                        <div className="mt-8 flex flex-wrap gap-3">
                            {status === 'cancelled' ? (
                                <button
                                    onClick={() => router.post('/billing/reactivate')}
                                    className="rounded-xl bg-teal-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-teal-300"
                                >
                                    Reactivate Plan
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        if (confirm('Are you sure you want to cancel your recurring subscription?')) {
                                            router.post('/billing/cancel');
                                        }
                                    }}
                                    className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10"
                                >
                                    Cancel Auto-Renew
                                </button>
                            )}
                        </div>
                    </section>

                    {/* Payment Method Card */}
                    <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <CreditCard className="h-5 w-5 text-[var(--brand-primary)]" />
                                <h2 className="font-bold">Payment Method</h2>
                            </div>

                            {subscription?.card_last4 ? (
                                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-800 uppercase tracking-wider text-sm">
                                            {subscription.card_brand || 'Card'} ???? {subscription.card_last4}
                                        </span>
                                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                                            Active
                                        </span>
                                    </div>
                                    <p className="mt-2 text-xs text-slate-500">
                                        Expires: {subscription.card_exp_month ? `${subscription.card_exp_month}/${subscription.card_exp_year}` : 'N/A'}
                                    </p>
                                </div>
                            ) : (
                                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-5 text-sm text-amber-800">
                                    No payment card currently authorized for auto-renewal.
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={handleUpdateCard}
                            disabled={updatingCard}
                            className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                            {updatingCard ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                            {subscription?.card_last4 ? 'Change Payment Card' : 'Authorize Payment Card'}
                        </button>
                    </section>
                </div>

                {/* Plan Selection */}
                <section className="mt-10">
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--brand-primary)]">Available Tiers</p>
                            <h2 className="mt-1 text-2xl font-bold">Change Subscription Tier</h2>
                        </div>
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                        {packages.map((plan) => {
                            const isCurrent = plan.id === subscription?.package_id;
                            return (
                                <div
                                    key={plan.id}
                                    className={`rounded-2xl border bg-white p-5 transition-all ${
                                        isCurrent ? 'border-teal-500 ring-2 ring-teal-100 shadow-sm' : 'border-slate-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-slate-900">{plan.name}</h3>
                                        {isCurrent && (
                                            <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-700">
                                                Current Plan
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-3 text-2xl font-bold text-slate-900">
                                        KES {Number(plan.price_monthly).toLocaleString()}
                                        <span className="text-xs font-normal text-slate-400"> / mo</span>
                                    </p>
                                    <ul className="mt-4 space-y-2 text-xs text-slate-600">
                                        {(Array.isArray(plan.features) ? plan.features : ['Full platform access', 'CBC Assessment tools', 'Automated fee billing']).slice(0, 4).map((feature: string) => (
                                            <li key={feature} className="flex items-center">
                                                <Check className="mr-2 h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    {!isCurrent && (
                                        <button
                                            onClick={() => router.post('/billing/package', { package_id: plan.id })}
                                            className="mt-6 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm font-bold text-slate-700 hover:border-teal-500 hover:text-teal-700 transition-colors"
                                        >
                                            Switch to {plan.name}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* Invoice History */}
                <section className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Receipt className="h-5 w-5 text-[var(--brand-primary)]" />
                        <h2 className="font-bold">Billing & Invoice History</h2>
                    </div>

                    {subscription?.payments?.length ? (
                        <div className="mt-5 overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-400">
                                        <th className="pb-3">Reference</th>
                                        <th className="pb-3">Date</th>
                                        <th className="pb-3">Amount</th>
                                        <th className="pb-3 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {subscription.payments.map((payment: any) => (
                                        <tr key={payment.id} className="text-slate-700">
                                            <td className="py-3.5 font-mono text-xs font-medium">{payment.reference}</td>
                                            <td className="py-3.5 text-slate-500">
                                                {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString() : new Date(payment.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="py-3.5 font-semibold">
                                                {payment.currency || 'KES'} {Number(payment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-3.5 text-right">
                                                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                                                    payment.status === 'completed'
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : payment.status === 'pending'
                                                        ? 'bg-amber-50 text-amber-700'
                                                        : 'bg-rose-50 text-rose-700'
                                                }`}>
                                                    {payment.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="mt-4 text-sm text-slate-500">No payment invoices generated yet.</p>
                    )}
                </section>
            </div>
        </div>
    );
}

function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl bg-white/5 p-4 border border-white/5">
            <p className="text-xs text-slate-400">{label}</p>
            <p className="mt-1.5 text-base font-bold text-white">{value}</p>
        </div>
    );
}