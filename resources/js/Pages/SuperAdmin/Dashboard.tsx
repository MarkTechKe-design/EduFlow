import AppLayout from '@/Layouts/AppLayout';
import MetricCard from '@/components/dashboard/MetricCard';
import ChartCard from '@/components/dashboard/ChartCard';
import { Link } from '@inertiajs/react';
import {
    School,
    Users,
    ShieldCheck,
    CreditCard,
    TrendingUp,
    Clock,
    AlertTriangle,
    ArrowRight,
    Building2,
    DollarSign,
    Sparkles,
    Calendar,
    Activity,
} from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';
import React from 'react';

interface Props {
    totalSchools?: number;
    activeSchools?: number;
    trialSchools?: number;
    suspendedSchools?: number;
    totalUsers?: number;
    totalRevenue?: number;
    revenueThisMonth?: number;
    revenueTrend?: Array<{
        month: string;
        revenue: number;
    }>;
    expiringSubscriptions?: Array<{
        id: number;
        school: string;
        package: string;
        end_date: string;
        days_left: number;
    }>;
    recentSchools?: Array<{
        id: number;
        name: string;
        code: string;
        plan?: string;
        status: string;
        created_at: string;
    }>;
    recentAuditLogs?: Array<{
        id: number;
        action: string;
        user_name?: string;
        school_name?: string;
        created_at: string;
    }>;
    growthChart?: Array<{
        month: string;
        schools: number;
        users: number;
    }>;
}

export default function SuperAdminDashboard({
    totalSchools = 0,
    activeSchools = 0,
    trialSchools = 0,
    suspendedSchools = 0,
    totalUsers = 0,
    totalRevenue = 0,
    revenueThisMonth = 0,
    revenueTrend = [],
    expiringSubscriptions = [],
    recentSchools = [],
    recentAuditLogs = [],
    growthChart = [],
}: Props) {
    return (
        <AppLayout title="Platform Command Center">
            <div className="h-full overflow-y-auto p-4 md:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
                {/* PAGE HEADER */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                <ShieldCheck className="h-6 w-6" />
                            </span>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    Platform Command Center
                                </h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Global multi-tenant analytics, SaaS recurring billing, and institutional status.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <Link
                            href="/super-admin/subscriptions"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 text-slate-950 px-4 py-2.5 text-xs font-bold hover:bg-teal-400 transition-colors shadow-sm"
                        >
                            <CreditCard className="h-4 w-4" /> Manage Subscriptions
                        </Link>
                        <Link
                            href="/super-admin/packages"
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:border-slate-400 transition-colors"
                        >
                            <Sparkles className="h-4 w-4" /> Package Tiers
                        </Link>
                    </div>
                </div>

                {/* SAAS REVENUE & CORE PLATFORM METRICS */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* MRR */}
                    <div className="rounded-3xl border border-teal-500/20 bg-gradient-to-br from-teal-500/5 via-teal-500/10 to-transparent p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-300">
                                Monthly Recurring (MRR)
                            </span>
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-teal-500 text-slate-950 font-bold">
                                <DollarSign className="h-4 w-4" />
                            </span>
                        </div>
                        <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
                            KES {Number(revenueThisMonth).toLocaleString()}
                        </p>
                        <p className="mt-1 text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                            Current active monthly run-rate
                        </p>
                    </div>

                    {/* Total SaaS Revenue */}
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Cumulative Revenue
                            </span>
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                <CreditCard className="h-4 w-4" />
                            </span>
                        </div>
                        <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
                            KES {Number(totalRevenue).toLocaleString()}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">Total verified billing settlements</p>
                    </div>

                    {/* Active vs Trial Schools */}
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Active Institutions
                            </span>
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                <School className="h-4 w-4" />
                            </span>
                        </div>
                        <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
                            {activeSchools} <span className="text-sm font-normal text-slate-400">/ {totalSchools}</span>
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">
                            {trialSchools} currently in free trial
                        </p>
                    </div>

                    {/* Total User Reach */}
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Platform Users
                            </span>
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                <Users className="h-4 w-4" />
                            </span>
                        </div>
                        <p className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">
                            {Number(totalUsers).toLocaleString()}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-400">Admins, Teachers, Parents, Students</p>
                    </div>
                </div>

                {/* CHARTS ROW: REVENUE TREND & SCHOOL GROWTH */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* SaaS Revenue Trend Chart */}
                    <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                    SaaS Revenue Trend (6 Months)
                                </h3>
                                <p className="text-xs text-slate-400">Paystack settled subscription volume</p>
                            </div>
                            <span className="text-xs font-bold text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800/60">
                                KES Currency
                            </span>
                        </div>

                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `KES ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} />
                                    <Tooltip
                                        formatter={(value: any) => [`KES ${Number(value).toLocaleString()}`, 'Revenue']}
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    {/* School & User Growth Chart */}
                    <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                    Tenant Onboarding Growth (12 Months)
                                </h3>
                                <p className="text-xs text-slate-400">New schools and active accounts</p>
                            </div>
                        </div>

                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={growthChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSchools" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                                    />
                                    <Area type="monotone" dataKey="schools" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSchools)" name="Schools" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </section>
                </div>

                {/* BOTTOM ROW: EXPIRATIONS / AT-RISK QUEUE & RECENT SCHOOLS */}
                <div className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
                    {/* Expiration Watchlist */}
                    <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <Clock className="h-4 w-4" />
                                </span>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                        Upcoming Subscription Expirations (30 Days)
                                    </h3>
                                    <p className="text-xs text-slate-400">Institutions approaching renewal or grace period</p>
                                </div>
                            </div>
                            <Link href="/super-admin/subscriptions" className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline">
                                View All
                            </Link>
                        </div>

                        {expiringSubscriptions.length > 0 ? (
                            <div className="space-y-3">
                                {expiringSubscriptions.map((sub) => (
                                    <div
                                        key={sub.id}
                                        className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60"
                                    >
                                        <div>
                                            <p className="font-bold text-slate-900 dark:text-white text-sm">{sub.school}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {sub.package} &middot; Renews on {sub.end_date}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                                sub.days_left <= 3
                                                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                                                    : sub.days_left <= 7
                                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                                                    : 'bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300'
                                            }`}>
                                                {sub.days_left} {sub.days_left === 1 ? 'day' : 'days'} left
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-400 text-xs">
                                No schools currently expiring in the next 30 days.
                            </div>
                        )}
                    </section>

                    {/* Recently Onboarded Schools */}
                    <section className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2.5">
                                <span className="grid h-8 w-8 place-items-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                                    <Building2 className="h-4 w-4" />
                                </span>
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                        Recently Onboarded Schools
                                    </h3>
                                    <p className="text-xs text-slate-400">Latest registered tenants</p>
                                </div>
                            </div>
                            <Link href="/super-admin/schools" className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline">
                                View All
                            </Link>
                        </div>

                        <div className="space-y-3">
                            {recentSchools.slice(0, 4).map((s) => (
                                <div
                                    key={s.id}
                                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60"
                                >
                                    <div>
                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{s.name}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {s.plan} &middot; {s.created_at}
                                        </p>
                                    </div>
                                    <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                                        {s.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}