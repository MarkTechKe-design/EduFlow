import AppLayout from '@/Layouts/AppLayout';
import MetricCard from '@/components/dashboard/MetricCard';
import ChartCard from '@/components/dashboard/ChartCard';
import { Link } from '@inertiajs/react';
import {
    School,
    Users,
    ShieldCheck,
    Plus,
    Activity,
    CheckCircle2,
    Clock,
    Ban,
    ArrowRight,
    Server,
    Building2,
    Lock,
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
    recentSchools = [],
    recentAuditLogs = [],
    growthChart = [],
}: Props) {
    const hasGrowthData = growthChart.length > 0;
    const hasSchools = recentSchools.length > 0;
    const hasAuditLogs = recentAuditLogs.length > 0;

    return (
        <AppLayout title="Super Admin Command Center">
            <div className="space-y-6 max-w-7xl mx-auto pb-10">
                {/* 1. Platform Command Header & Multi-Tenant Telemetry Strip */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border/60">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                            <span
                                className="w-2.5 h-2.5 rounded-full bg-teal-500 ring-4 ring-teal-500/20 animate-pulse"
                                aria-hidden="true"
                            />
                            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                                Platform Command Center
                            </h1>
                        </div>

                        {/* Multi-Tenant Global Telemetry */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-medium">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted/60 border border-border/50">
                                <Server className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                                Multi-Tenant: <strong className="text-foreground">{totalSchools} Institutions</strong>
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted/60 border border-border/50">
                                <Users className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                                Platform Users: <strong className="text-foreground">{totalUsers.toLocaleString()}</strong>
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-200/80 text-emerald-700 dark:text-emerald-300">
                                <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Platform Operational</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <Link
                            href="/super-admin/schools/create"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all shadow-xs hover:shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[44px]"
                        >
                            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Provision New School</span>
                        </Link>
                    </div>
                </div>

                {/* 2. Platform Scale & Health Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard
                        title="Total Institutions"
                        value={totalSchools}
                        icon={Building2}
                        variant="primary"
                        badge="Tenants"
                        description={totalUsers > 0 ? `${totalUsers.toLocaleString()} total active users` : undefined}
                    />
                    <MetricCard
                        title="Active Subscriptions"
                        value={activeSchools}
                        icon={CheckCircle2}
                        variant="success"
                        badge="Subscribed"
                        description="Active institutional contracts"
                    />
                    <MetricCard
                        title="Evaluation & Trials"
                        value={trialSchools}
                        icon={Clock}
                        variant="warning"
                        badge="In Trial"
                        description="30-day evaluation campuses"
                    />
                    <MetricCard
                        title="Suspended Tenants"
                        value={suspendedSchools}
                        icon={Ban}
                        variant={suspendedSchools > 0 ? 'danger' : 'default'}
                        badge={suspendedSchools > 0 ? 'Attention' : 'Zero'}
                        description={
                            suspendedSchools > 0
                                ? 'Deactivated or overdue accounts'
                                : 'All tenant accounts in good standing'
                        }
                    />
                </div>

                {/* 3. Analytics & Security Telemetry Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* SaaS Growth & Onboarding Trajectory */}
                    <div className="lg:col-span-8">
                        <ChartCard
                            title="Institutional Growth & User Trajectory"
                            subtitle="Monthly tenant onboarding vs. active users across Kenya"
                            minHeight={hasGrowthData ? 300 : 180}
                            isEmpty={!hasGrowthData}
                            emptyMessage="No platform telemetry recorded for the selected growth period."
                        >
                            {hasGrowthData && (
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart
                                        data={growthChart}
                                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="superAdminGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0D9488" stopOpacity={0.35} />
                                                <stop offset="95%" stopColor="#0D9488" stopOpacity={0.0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="currentColor"
                                            className="text-border/40"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="month"
                                            stroke="currentColor"
                                            className="text-muted-foreground"
                                            fontSize={11}
                                            tickLine={false}
                                        />
                                        <YAxis
                                            stroke="currentColor"
                                            className="text-muted-foreground"
                                            fontSize={11}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'var(--card, #0F172A)',
                                                borderColor: 'var(--border, rgba(255,255,255,0.1))',
                                                borderRadius: '12px',
                                                color: 'var(--foreground, #FFFFFF)',
                                                fontSize: '12px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                            }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="schools"
                                            stroke="#0D9488"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#superAdminGrowthGrad)"
                                            name="Schools Onboarded"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>
                    </div>

                    {/* Real-Time Security Audit Stream */}
                    <div className="lg:col-span-4 bg-card text-card-foreground rounded-2xl border border-border/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                                <h3 className="text-base font-bold text-foreground tracking-tight">
                                    Security Audit Stream
                                </h3>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Live operational events and authorization logs.
                            </p>
                        </div>

                        <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[260px] pr-1">
                            {!hasAuditLogs ? (
                                <div className="py-8 text-center border border-dashed border-border rounded-xl space-y-2 bg-muted/20">
                                    <Lock className="w-5 h-5 text-muted-foreground mx-auto" aria-hidden="true" />
                                    <p className="text-xs text-muted-foreground">
                                        No recent security events recorded.
                                    </p>
                                </div>
                            ) : (
                                recentAuditLogs.map((log) => (
                                    <div
                                        key={log.id}
                                        className="p-3 rounded-xl bg-muted/30 border border-border/60 text-xs space-y-1 hover:bg-muted/60 transition-colors"
                                    >
                                        <div className="font-bold text-foreground truncate">
                                            {log.action}
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                                            <span className="font-semibold text-teal-700 dark:text-teal-300 truncate max-w-[140px]">
                                                {log.school_name || 'Global Core'}
                                            </span>
                                            <span className="font-mono">{log.created_at}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <Link
                            href="/super-admin/users"
                            className="inline-flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs text-center transition-colors min-h-[44px]"
                        >
                            <span>View Comprehensive Audit Ledger</span>
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                    </div>
                </div>

                {/* 4. Multi-Tenant Institutional Roster */}
                <div className="bg-card text-card-foreground rounded-2xl border border-border/80 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                            <h3 className="text-base font-bold text-foreground tracking-tight">
                                Recently Onboarded Institutions
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Provisioned primary, JSS, and secondary schools registered on EduFlow.
                            </p>
                        </div>
                        <Link
                            href="/super-admin/schools"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline min-h-[44px] sm:min-h-0 self-start sm:self-auto"
                        >
                            <span>View All Institutions</span>
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border/60">
                                <tr>
                                    <th className="py-3.5 px-5">Institution Name</th>
                                    <th className="py-3.5 px-5">Tenant Code</th>
                                    <th className="py-3.5 px-5">SaaS Tier Plan</th>
                                    <th className="py-3.5 px-5">Status</th>
                                    <th className="py-3.5 px-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60 text-card-foreground">
                                {!hasSchools ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                                            No schools currently provisioned on the platform.
                                        </td>
                                    </tr>
                                ) : (
                                    recentSchools.map((s) => (
                                        <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-3.5 px-5">
                                                <div className="flex items-center gap-2.5">
                                                    <span className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                                                        <School className="w-3.5 h-3.5" aria-hidden="true" />
                                                    </span>
                                                    <span className="font-bold text-foreground">
                                                        {s.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-5 font-mono text-muted-foreground">
                                                {s.code}
                                            </td>
                                            <td className="py-3.5 px-5 font-semibold text-teal-700 dark:text-teal-300">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-[11px] font-semibold">
                                                    {s.plan || 'Standard Campus'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-5">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider border ${
                                                        s.status === 'active'
                                                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/80'
                                                            : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200/80'
                                                    }`}
                                                >
                                                    {s.status}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-5 text-right">
                                                <Link
                                                    href={`/super-admin/schools/${s.id}`}
                                                    className="inline-flex items-center gap-1 font-bold text-teal-600 dark:text-teal-400 hover:underline min-h-[44px] sm:min-h-0"
                                                >
                                                    <span>Manage</span>
                                                    <ArrowRight className="w-3 h-3" aria-hidden="true" />
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}