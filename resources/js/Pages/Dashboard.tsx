import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import MetricCard from '@/components/dashboard/MetricCard';
import ChartCard from '@/components/dashboard/ChartCard';
import ActionQueue, { ActionItem } from '@/components/dashboard/ActionQueue';
import { Link } from '@inertiajs/react';
import {
    Users,
    Calendar,
    CreditCard,
    Trophy,
    ArrowRight,
    UserPlus,
    Receipt,
    CheckCircle2,
    Clock,
    AlertTriangle,
    Activity,
} from 'lucide-react';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from 'recharts';
import React from 'react';

interface Props {
    studentCount?: number;
    staffCount?: number;
    attendanceTodayPercentage?: number;
    termFeeCollection?: {
        total_billed: number;
        total_collected: number;
        balance: number;
        rate: number;
    };
    cocurricularSummary?: {
        active_teams_count: number;
        active_clubs_count: number;
        upcoming_events_count: number;
        leading_house?: {
            name: string;
            total_points: number;
            color_hex: string;
        } | null;
        recent_achievements_count: number;
    } | null;
    dailyAttendanceChart?: Array<{
        day: string;
        present: number;
        absent: number;
    }>;
    recentPayments?: Array<{
        id: number;
        receipt_number: string;
        student_name: string;
        amount: number;
        method: string;
        created_at: string;
    }>;
    pendingApprovals?: ActionItem[];
    schoolAnnouncements?: Array<{
        id: number;
        title: string;
        content: string;
        date: string;
    }>;
}

export default function SchoolAdminDashboard({
    studentCount = 0,
    staffCount = 0,
    attendanceTodayPercentage = 0,
    termFeeCollection = {
        total_billed: 0,
        total_collected: 0,
        balance: 0,
        rate: 0,
    },
    cocurricularSummary = {
        active_teams_count: 0,
        active_clubs_count: 0,
        upcoming_events_count: 0,
        leading_house: null,
        recent_achievements_count: 0,
    },
    dailyAttendanceChart = [],
    recentPayments = [],
    pendingApprovals = [],
    schoolAnnouncements = [],
}: Props) {
    const hasAttendanceData = dailyAttendanceChart.length > 0;
    const hasPayments = recentPayments.length > 0;
    const pendingCount = pendingApprovals.length;

    return (
        <AppLayout title="Executive Operations Cockpit">
            <div className="space-y-6 max-w-7xl mx-auto pb-10">
                
                {/* 1. Executive Cockpit Header & Situational Awareness Strip */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border/60">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 ring-4 ring-teal-500/20" />
                            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                                Institutional Operations Cockpit
                            </h1>
                        </div>
                        
                        {/* Live Situational Status Pills */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-medium">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted/60 border border-border/50">
                                <Activity className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                Roll-Call: <strong className="text-foreground">{attendanceTodayPercentage}%</strong>
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted/60 border border-border/50">
                                <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                Fee Target: <strong className="text-foreground">{termFeeCollection.rate}%</strong>
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${
                                pendingCount > 0 
                                    ? 'bg-rose-500/10 border-rose-200/80 text-rose-700 dark:text-rose-300' 
                                    : 'bg-emerald-500/10 border-emerald-200/80 text-emerald-700 dark:text-emerald-300'
                            }`}>
                                <Clock className="w-3.5 h-3.5" />
                                Queue: <strong className="text-foreground">{pendingCount > 0 ? `${pendingCount} Pending` : 'All Clear'}</strong>
                            </span>
                        </div>
                    </div>

                    {/* Primary Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <Link
                            href={route('school.students.create')}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all shadow-xs hover:shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[44px]"
                        >
                            <UserPlus className="w-4 h-4 shrink-0" />
                            <span>Admit New Student</span>
                        </Link>
                        <Link
                            href={route('school.fees.payments.create')}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border/80 bg-card hover:bg-muted/80 text-foreground font-bold text-xs transition-all shadow-xs hover:shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[44px]"
                        >
                            <Receipt className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Record Payment</span>
                        </Link>
                    </div>
                </div>

                {/* 2. Differentiated KPI Architecture */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Enrollment: Institutional Baseline */}
                    <MetricCard
                        title="Active Enrollment"
                        value={studentCount.toLocaleString()}
                        icon={Users}
                        variant="default"
                        badge="Learners"
                        description={staffCount > 0 ? `${staffCount} active educators` : undefined}
                    />

                    {/* Attendance: Operational Pulse */}
                    <MetricCard
                        title="Morning Roll-Call Rate"
                        value={`${attendanceTodayPercentage}%`}
                        icon={Calendar}
                        variant="primary"
                        trend={{ value: 'Today', direction: attendanceTodayPercentage >= 90 ? 'up' : 'neutral' }}
                        description={attendanceTodayPercentage === 0 ? 'Register submission underway' : undefined}
                    />

                    {/* Fee Collection: Financial Flow */}
                    <div className="relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs transition-all hover:shadow-md">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1.5 min-w-0 flex-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate block">
                                    Term Collections
                                </span>
                                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground break-words font-mono">
                                    KES {termFeeCollection.total_collected.toLocaleString()}
                                </div>
                            </div>
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                <CreditCard className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-border/60 space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Target Recovery</span>
                                <span className="font-bold text-foreground">{termFeeCollection.rate}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(termFeeCollection.rate, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Outstanding Balance: Risk / Exception Metric */}
                    <MetricCard
                        title="Uncollected Revenue"
                        value={`KES ${termFeeCollection.balance.toLocaleString()}`}
                        icon={AlertTriangle}
                        variant="danger"
                        badge="Outstanding"
                        description="Pending invoice recovery"
                    />
                </div>

                {/* 3. Compact Co-Curricular & Talent Bento Strip */}
                {cocurricularSummary && (
                    <div className="rounded-2xl border border-border/80 bg-card text-card-foreground p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 shrink-0">
                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center shrink-0">
                                <Trophy className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-foreground leading-tight">Co-Curricular & Talent Hub</h3>
                                <p className="text-xs text-muted-foreground">Leagues, societies, and student passports</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 max-w-2xl text-xs">
                            <div className="px-3 py-2 rounded-xl bg-muted/40 border border-border/50 text-center sm:text-left">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Teams</span>
                                <strong className="text-sm font-black text-foreground">{cocurricularSummary.active_teams_count} Active</strong>
                            </div>
                            <div className="px-3 py-2 rounded-xl bg-muted/40 border border-border/50 text-center sm:text-left">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Clubs</span>
                                <strong className="text-sm font-black text-foreground">{cocurricularSummary.active_clubs_count} Active</strong>
                            </div>
                            <div className="px-3 py-2 rounded-xl bg-muted/40 border border-border/50 text-center sm:text-left">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Fixtures</span>
                                <strong className="text-sm font-black text-amber-600 dark:text-amber-400">{cocurricularSummary.upcoming_events_count} Upcoming</strong>
                            </div>
                            <div className="px-3 py-2 rounded-xl bg-muted/40 border border-border/50 text-center sm:text-left">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Leading House</span>
                                <strong className="text-xs font-black text-emerald-600 dark:text-emerald-400 truncate block">
                                    {cocurricularSummary.leading_house?.name || 'Active Term'}
                                </strong>
                            </div>
                        </div>

                        <Link
                            href={route('school.cocurricular.index')}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-border/80 hover:bg-muted/80 text-foreground font-semibold text-xs transition-colors shrink-0 min-h-[44px] sm:min-h-0"
                        >
                            <span>Open Hub</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                )}

                {/* 4. Operational Telemetry & Action Queue Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Attendance Telemetry Chart with Adaptive Sizing */}
                    <div className="lg:col-span-8">
                        <ChartCard
                            title="Weekly Roll-Call & Presence Analytics"
                            subtitle="Daily morning register completion across all classrooms"
                            minHeight={hasAttendanceData ? 280 : 170}
                            isEmpty={!hasAttendanceData}
                            emptyMessage="Morning roll-call in progress. Daily presence trends will render here once homeroom registers are submitted."
                        >
                            {hasAttendanceData && (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart
                                        data={dailyAttendanceChart}
                                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="currentColor"
                                            className="text-border/40"
                                            vertical={false}
                                        />
                                        <XAxis
                                            dataKey="day"
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
                                        <Bar
                                            dataKey="present"
                                            fill="#0D9488"
                                            radius={[6, 6, 0, 0]}
                                            name="Present Students"
                                        />
                                        <Bar
                                            dataKey="absent"
                                            fill="#E11D48"
                                            radius={[6, 6, 0, 0]}
                                            name="Absent Students"
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </ChartCard>
                    </div>

                    {/* Operational Action Queue with Confident All-Clear */}
                    <div className="lg:col-span-4">
                        <ActionQueue
                            title="Operational Action Queue"
                            items={pendingApprovals}
                            emptyText="Operational queues are clear. All leaves, requisitions, and admissions have been processed."
                        />
                    </div>
                </div>

                {/* 5. Streamlined Financial Transactions Ledger */}
                <div className="bg-card text-card-foreground rounded-2xl border border-border/80 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                            <h3 className="text-base font-bold text-foreground tracking-tight">
                                Real-Time Fee Receipts & Settlements
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Automated M-Pesa STK, direct bank clearances, and counter receipts.
                            </p>
                        </div>
                        <Link
                            href={route('school.fees.payments.index')}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline min-h-[44px] sm:min-h-0 self-start sm:self-auto"
                        >
                            <span>Open Financial Ledger</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border/60">
                                <tr>
                                    <th className="py-3 px-5">Receipt Ref</th>
                                    <th className="py-3 px-5">Learner Account</th>
                                    <th className="py-3 px-5">Settlement Amount</th>
                                    <th className="py-3 px-5">Gateway / Method</th>
                                    <th className="py-3 px-5 text-right">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60 text-card-foreground">
                                {!hasPayments ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                                            <div className="space-y-1">
                                                <p className="font-semibold text-foreground">No transactions posted yet today.</p>
                                                <p className="text-[11px] text-muted-foreground">Real-time collections will appear as soon as payment receipts are generated.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    recentPayments.map((p) => {
                                        const initials = p.student_name
                                            .split(' ')
                                            .map((n) => n[0])
                                            .join('')
                                            .slice(0, 2)
                                            .toUpperCase();

                                        return (
                                            <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="py-3.5 px-5 font-mono font-bold text-teal-600 dark:text-teal-400">
                                                    {p.receipt_number}
                                                </td>
                                                <td className="py-3.5 px-5">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className="w-7 h-7 rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                                                            {initials || 'ST'}
                                                        </span>
                                                        <span className="font-semibold text-foreground truncate max-w-[200px]">
                                                            {p.student_name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-5 font-extrabold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                                                    KES {p.amount.toLocaleString()}
                                                </td>
                                                <td className="py-3.5 px-5">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-muted border border-border/50 text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                                                        {p.method}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-5 text-right text-muted-foreground font-mono text-[11px]">
                                                    {p.created_at}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}