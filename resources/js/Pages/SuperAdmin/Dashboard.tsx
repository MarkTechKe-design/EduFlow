import AppLayout from '@/Layouts/AppLayout';
import MetricCard from '@/components/dashboard/MetricCard';
import ChartCard from '@/components/dashboard/ChartCard';
import { Head, Link } from '@inertiajs/react';
import { School, Users, CreditCard, ShieldCheck, TrendingUp, Plus, Activity, CheckCircle2, Clock, Ban } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
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
    return (
        <AppLayout title="Super Admin Command Center">
            
            {/* Header / Primary Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                        Platform Command Center
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500">
                        Multi-tenant health, cross-institutional activity, and SaaS growth telemetry.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/super-admin/schools/create"
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Provision New School</span>
                    </Link>
                </div>
            </div>

            {/* Primary Platform Metric Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Total Schools Provisioned"
                    value={totalSchools}
                    icon={School}
                    variant="primary"

                />
                <MetricCard
                    title="Active Subscriptions"
                    value={activeSchools}
                    icon={CheckCircle2}
                    variant="success"
                    badge="Active Tenants"
                />
                <MetricCard
                    title="Evaluation / Trial Schools"
                    value={trialSchools}
                    icon={Clock}
                    variant="warning"
                    description="30-Day trial evaluations"
                />
                <MetricCard
                    title="Suspended Tenants"
                    value={suspendedSchools}
                    icon={Ban}
                    variant="danger"
                    description="Deactivated or overdue"
                />
            </div>

            {/* Analytics & Growth Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                <div className="lg:col-span-8">
                    <ChartCard
                        title="Institutional Growth & User Trajectory"
                        subtitle="Monthly tenant onboarding vs. active users across Kenya"
                        minHeight={300}
                    >
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={growthChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                                />
                                <Area type="monotone" dataKey="schools" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#growthGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>

                {/* Audit Telemetry Stream */}
                <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-indigo-600" />
                            <h3 className="text-base font-bold text-slate-950">Security Audit Stream</h3>
                        </div>
                        <p className="text-xs text-slate-500">Live operational events and authorization logs.</p>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[260px]">
                        {recentAuditLogs.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-8">No recent security events recorded.</p>
                        ) : (
                            recentAuditLogs.map((log) => (
                                <div key={log.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                                    <div className="font-bold text-slate-900 truncate">{log.action}</div>
                                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                                        <span>{log.school_name || 'Global'}</span>
                                        <span>{log.created_at}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <Link
                        href="/super-admin/users"
                        className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs text-center transition-all"
                    >
                        View Comprehensive Audit Ledger
                    </Link>
                </div>

            </div>

            {/* Recent Schools Onboarded Table */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-950">Recently Onboarded Institutions</h3>
                        <p className="text-xs text-slate-500">New primary, JSS, and secondary schools registered on EduFlow.</p>
                    </div>
                    <Link href="/super-admin/schools" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                        View All Schools
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                            <tr>
                                <th className="py-3.5 px-5">School Name</th>
                                <th className="py-3.5 px-5">School Code</th>
                                <th className="py-3.5 px-5">SaaS Plan</th>
                                <th className="py-3.5 px-5">Status</th>
                                <th className="py-3.5 px-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {recentSchools.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-slate-400">No schools currently provisioned.</td>
                                </tr>
                            ) : (
                                recentSchools.map((s) => (
                                    <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-3.5 px-5 font-bold text-slate-900">{s.name}</td>
                                        <td className="py-3.5 px-5 font-mono text-slate-500">{s.code}</td>
                                        <td className="py-3.5 px-5 font-semibold text-indigo-600">{s.plan || 'Standard Campus'}</td>
                                        <td className="py-3.5 px-5">
                                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                                                s.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-5 text-right">
                                            <Link href={`/super-admin/schools/${s.id}`} className="font-bold text-indigo-600 hover:underline">
                                                Manage
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </AppLayout>
    );
}
