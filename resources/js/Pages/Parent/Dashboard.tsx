import AppLayout from '@/Layouts/AppLayout';
import MetricCard from '@/components/dashboard/MetricCard';
import MultiChildSelector, { ChildProfile } from '@/components/dashboard/MultiChildSelector';
import CbcRubricMeter, { CbcAssessment } from '@/components/dashboard/CbcRubricMeter';
import { Head, Link } from '@inertiajs/react';
import { Calendar, CreditCard, CheckCircle2, ArrowRight, BookOpen } from 'lucide-react';
import React, { useState } from 'react';

interface Props {
    children?: Array<ChildProfile & {
        attendance?: {
            total: number;
            present: number;
            absent: number;
            percentage: number;
        };
        fees?: {
            total_due: number;
            total_paid: number;
            balance: number;
        };
    }>;
    feeSummary?: {
        total_billed: number;
        total_paid: number;
        balance: number;
    };
    recentAttendance?: Array<{
        date: string;
        status: 'present' | 'absent' | 'late';
        remarks?: string;
    }>;
    cbcAssessments?: CbcAssessment[];
}

export default function ParentDashboard({
    children = [],
    cbcAssessments = [],
}: Props) {
    const [selectedChildId, setSelectedChildId] = useState<number | string>(children[0]?.id || '');
    const activeChild = children.find((c) => String(c.id) === String(selectedChildId)) || children[0];
    const feeSummary = {
        total_billed: activeChild?.fees?.total_due ?? 0,
        total_paid: activeChild?.fees?.total_paid ?? 0,
        balance: activeChild?.fees?.balance ?? 0,
    };
    const attendanceStanding = activeChild?.attendance
        ? `${activeChild.attendance.percentage}%`
        : 'No data';

    return (
        <AppLayout title="Parent & Guardian Portal">
            
            {/* Header */}
            <div className="space-y-0.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                    Family Academic Portal
                </h1>
                <p className="text-xs sm:text-sm text-slate-500">
                    Roll-call attendance, fee balances, and CBC term evaluations for your children.
                </p>
            </div>

            {/* Multi-Child Selector */}
            {children.length > 0 && (
                <MultiChildSelector
                    childrenList={children}
                    selectedId={selectedChildId}
                    onSelect={(id) => setSelectedChildId(id)}
                />
            )}

            {/* Active Learner KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard
                    title="Current Fee Balance"
                    value={`KES ${feeSummary.balance.toLocaleString()}`}
                    icon={CreditCard}
                    variant={feeSummary.balance > 0 ? 'warning' : 'success'}
                    badge={feeSummary.balance > 0 ? 'Payment Due' : 'Cleared'}
                />
                <MetricCard
                    title="Total Fees Paid"
                    value={`KES ${feeSummary.total_paid.toLocaleString()}`}
                    icon={CheckCircle2}
                    variant="primary"
                    description={`Invoiced: KES ${feeSummary.total_billed.toLocaleString()}`}
                />
                <MetricCard
                    title="Attendance Standing"
                    value={attendanceStanding}
                    icon={Calendar}
                    variant="success"
                    description="Daily Roll-Call Register"
                />
            </div>

            {/* CBC Continuous Assessment & Lipa na M-Pesa Settlement */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* CBC Assessment Rubric Component */}
                <div className="lg:col-span-8">
                    <CbcRubricMeter
                        assessments={cbcAssessments}
                        title="Continuous Assessment Rubrics"
                    />
                </div>

                {/* Instant M-Pesa Fee Settlement Action Card */}
                <div className="lg:col-span-4 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between space-y-6">
                    <div className="space-y-2">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-white">Lipa na M-Pesa Settlement</h3>
                        <p className="text-xs text-indigo-200 leading-relaxed">
                            Pay school fees securely via M-Pesa. Automated ledger balance update and receipt issued instantly.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 flex justify-between items-center text-xs">
                            <span className="text-indigo-200">Balance Due:</span>
                            <span className="font-extrabold text-emerald-400 text-sm">KES {feeSummary.balance.toLocaleString()}</span>
                        </div>

                        <Link
                            href="/school/parent/fees"
                            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                        >
                            <span>Open Fee Statement & Pay</span>
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

            </div>

        </AppLayout>
    );
}
