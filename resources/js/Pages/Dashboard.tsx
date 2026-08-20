import AppLayout from '@/Layouts/AppLayout';
import MetricCard from '@/components/dashboard/MetricCard';
import ChartCard from '@/components/dashboard/ChartCard';
import ActionQueue, { ActionItem } from '@/components/dashboard/ActionQueue';
import { Head, Link } from '@inertiajs/react';
import { Users, Calendar, CreditCard, BookOpen, TrendingUp, Plus, AlertCircle, CheckCircle2, FileText } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
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
    dailyAttendanceChart = [],
    recentPayments = [],
    pendingApprovals = [],
    schoolAnnouncements = [],
}: Props) {
    return (
        <AppLayout title="Institutional Executive Cockpit">
            
            {/* Header & Quick Action Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                        Executive Operations Cockpit
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500">
                        Daily student attendance, term fee reconciliation, and CBC grading progress.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                        href="/school/students/create"
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Admit New Student</span>
                    </Link>
                    <Link
                        href="/school/fees"
                        className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-2 shadow-xs transition-all"
                    >
                        <CreditCard className="w-4 h-4 text-emerald-600" />
                        <span>Record Payment</span>
                    </Link>
                </div>
            </div>

            {/* Morning Operational Pulse Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    title="Active Enrollment"
                    value={studentCount}
                    icon={Users}
                    variant="primary"
                    badge="Enrolled Learners"
                />
                <MetricCard
                    title="Morning Roll-Call Rate"
                    value={`${attendanceTodayPercentage}%`}
                    icon={Calendar}
                    variant="success"
                    trend={{ value: '2.4%', label: 'vs last week', direction: 'up' }}
                />
                <MetricCard
                    title="Term Fee Collections"
                    value={`KES ${termFeeCollection.total_collected.toLocaleString()}`}
                    icon={CreditCard}
                    variant="default"
                    badge={`${termFeeCollection.rate}% Collected`}
                />
                <MetricCard
                    title="Outstanding Fee Balance"
                    value={`KES ${termFeeCollection.balance.toLocaleString()}`}
                    icon={AlertCircle}
                    variant="warning"
                    description="Uncollected term invoices"
                />
            </div>

            {/* Operational Visualizations & Pending Queues */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                <div className="lg:col-span-8">
                    <ChartCard
                        title="Weekly Attendance & Presence Roll-Call"
                        subtitle="Daily morning register completion across all classrooms"
                        minHeight={290}
                    >
                        <ResponsiveContainer width="100%" height={290}>
                            <BarChart data={dailyAttendanceChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                                />
                                <Bar dataKey="present" fill="#4F46E5" radius={[6, 6, 0, 0]} name="Present Students" />
                                <Bar dataKey="absent" fill="#F43F5E" radius={[6, 6, 0, 0]} name="Absent Students" />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>

                <div className="lg:col-span-4">
                    <ActionQueue
                        title="Needs Your Attention"
                        items={pendingApprovals}
                        emptyText="No pending approvals or alerts."
                    />
                </div>

            </div>

            {/* Recent Payments Ledger Stream */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-slate-950">Recent Fee Receipts & Transactions</h3>
                        <p className="text-xs text-slate-500">M-Pesa STK, bank deposits, and cash receipts recorded today.</p>
                    </div>
                    <Link href="/school/fees" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                        Full Fee Ledger
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                            <tr>
                                <th className="py-3.5 px-5">Receipt Ref</th>
                                <th className="py-3.5 px-5">Student / Learner</th>
                                <th className="py-3.5 px-5">Amount Paid</th>
                                <th className="py-3.5 px-5">Method</th>
                                <th className="py-3.5 px-5 text-right">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                            {recentPayments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-slate-400">No transactions recorded yet today.</td>
                                </tr>
                            ) : (
                                recentPayments.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-3.5 px-5 font-mono font-bold text-indigo-600">{p.receipt_number}</td>
                                        <td className="py-3.5 px-5 font-bold text-slate-900">{p.student_name}</td>
                                        <td className="py-3.5 px-5 font-extrabold text-emerald-600">KES {p.amount.toLocaleString()}</td>
                                        <td className="py-3.5 px-5 font-semibold text-slate-600">{p.method}</td>
                                        <td className="py-3.5 px-5 text-right text-slate-400">{p.created_at}</td>
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
