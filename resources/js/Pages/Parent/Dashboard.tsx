import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import MetricCard from '@/components/dashboard/MetricCard';
import { ChildProfile } from '@/components/dashboard/MultiChildSelector';
import { CbcAssessment } from '@/components/dashboard/CbcRubricMeter';
import { Link } from '@inertiajs/react';
import {
    Calendar,
    CreditCard,
    CheckCircle2,
    ArrowRight,
    BookOpen,
    Trophy,
    Award,
    Check,
    Activity,
    User,
    Clock,
} from 'lucide-react';
import React, { useState } from 'react';

interface Props {
    children?: Array<
        ChildProfile & {
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
        }
    >;
    childrenTalent?: Record<
        number | string,
        {
            summary: {
                total_teams: number;
                total_clubs: number;
                total_events: number;
                total_achievements: number;
                personal_bests: number;
                school_records: number;
            };
            house?: {
                name: string;
                total_points: number;
                color_hex: string;
            } | null;
            latest_achievement?: {
                title: string;
                activity_name: string;
                award_level: string;
            } | null;
            teams_count: number;
            clubs_count: number;
        }
    > | null;
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
    childrenTalent,
    cbcAssessments = [],
}: Props) {
    const [selectedChildId, setSelectedChildId] = useState<number | string>(
        children[0]?.id || ''
    );

    const activeChild =
        children.find((c) => String(c.id) === String(selectedChildId)) || children[0];

    const feeSummary = {
        total_billed: activeChild?.fees?.total_due ?? 0,
        total_paid: activeChild?.fees?.total_paid ?? 0,
        balance: activeChild?.fees?.balance ?? 0,
    };

    const feeRate =
        feeSummary.total_billed > 0
            ? Math.round((feeSummary.total_paid / feeSummary.total_billed) * 100)
            : 0;

    const attendanceStanding = activeChild?.attendance
        ? `${activeChild.attendance.percentage}%`
        : 'No data';

    const activeChildTalent =
        activeChild && childrenTalent ? childrenTalent[activeChild.id] : null;

    const rubricDetails: Record<string, { label: string; badge: string }> = {
        EE: {
            label: 'Exceeding Expectations',
            badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/80',
        },
        ME: {
            label: 'Meeting Expectations',
            badge: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-200/80',
        },
        AE: {
            label: 'Approaching Expectations',
            badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200/80',
        },
        BE: {
            label: 'Below Expectations',
            badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-200/80',
        },
    };

    return (
        <AppLayout title="Parent & Guardian Portal">
            <div className="space-y-6 max-w-7xl mx-auto pb-10">
                {/* 1. Portal Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                            <span
                                className="w-2.5 h-2.5 rounded-full bg-teal-500 ring-4 ring-teal-500/20"
                                aria-hidden="true"
                            />
                            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                                Family Academic Portal
                            </h1>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Roll-call attendance, fee balances, and CBC term evaluations for your children.
                        </p>
                    </div>

                    {activeChild && (
                        <div className="flex items-center gap-2 text-xs font-semibold">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-300">
                                <Activity className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                                <span>Active Learner: {activeChild.name}</span>
                            </span>
                        </div>
                    )}
                </div>

                {/* 2. Responsive Multi-Child Switcher */}
                {children.length > 1 && (
                    <div className="bg-card text-card-foreground rounded-2xl border border-border/80 p-4 shadow-xs space-y-2.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                            Select Active Learner
                        </span>
                        <div className="flex flex-wrap gap-2.5">
                            {children.map((child) => {
                                const isSelected = String(child.id) === String(selectedChildId);
                                return (
                                    <button
                                        key={child.id}
                                        type="button"
                                        onClick={() => setSelectedChildId(child.id)}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 border transition-all min-h-[44px] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                                            isSelected
                                                ? 'bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-600/20'
                                                : 'bg-muted/40 text-foreground border-border/80 hover:bg-muted'
                                        }`}
                                    >
                                        <div
                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
                                                isSelected
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            {child.name.charAt(0)}
                                        </div>
                                        <div className="text-left">
                                            <div className="truncate max-w-[140px]">{child.name}</div>
                                            <div
                                                className={`text-[10px] font-normal ${
                                                    isSelected ? 'text-teal-100' : 'text-muted-foreground'
                                                }`}
                                            >
                                                Adm: {child.admission_number}
                                                {child.grade ? ` · ${child.grade}` : ''}
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <Check className="w-3.5 h-3.5 ml-1 shrink-0" aria-hidden="true" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* 3. Differentiated Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <MetricCard
                        title="Roll-Call Attendance"
                        value={attendanceStanding}
                        icon={Calendar}
                        variant="success"
                        badge="Current Term"
                        description="Verified morning register attendance"
                    />

                    {/* Financial Clearance Progress Card */}
                    <div className="relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs transition-all hover:shadow-md">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1.5 min-w-0 flex-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate block">
                                    Term Payments
                                </span>
                                <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground break-words font-mono">
                                    KES {feeSummary.total_paid.toLocaleString()}
                                </div>
                            </div>
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                                <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-border/60 space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Settlement Progress</span>
                                <span className="font-bold text-foreground">{feeRate}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-teal-500 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(feeRate, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <MetricCard
                        title="Outstanding Fee Balance"
                        value={`KES ${feeSummary.balance.toLocaleString()}`}
                        icon={CreditCard}
                        variant={feeSummary.balance > 0 ? 'warning' : 'success'}
                        badge={feeSummary.balance > 0 ? 'Pending Invoices' : 'Cleared'}
                        description={
                            feeSummary.balance > 0
                                ? 'Unsettled term invoice balances'
                                : 'All term invoices settled'
                        }
                    />
                </div>

                {/* 4. Co-Curricular & Talent Highlights for Active Child */}
                {activeChildTalent && (
                    <div className="rounded-2xl border border-border/80 bg-card text-card-foreground p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 shrink-0">
                            <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center shrink-0">
                                <Trophy className="w-5 h-5" aria-hidden="true" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-foreground leading-tight">
                                    Co-Curricular Highlights — {activeChild?.name || 'Learner'}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Active sports teams, societies, house points, and awards
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 max-w-2xl text-xs">
                            <div className="px-3 py-2 rounded-xl bg-muted/40 border border-border/50 text-center sm:text-left">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Teams</span>
                                <strong className="text-sm font-black text-foreground">{activeChildTalent.teams_count} Active</strong>
                            </div>
                            <div className="px-3 py-2 rounded-xl bg-muted/40 border border-border/50 text-center sm:text-left">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Clubs</span>
                                <strong className="text-sm font-black text-foreground">{activeChildTalent.clubs_count} Active</strong>
                            </div>
                            <div className="px-3 py-2 rounded-xl bg-muted/40 border border-border/50 text-center sm:text-left">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Achievements</span>
                                <strong className="text-sm font-black text-emerald-600 dark:text-emerald-400">{activeChildTalent.summary.total_achievements}</strong>
                            </div>
                            <div className="px-3 py-2 rounded-xl bg-muted/40 border border-border/50 text-center sm:text-left">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase block">House</span>
                                <strong className="text-xs font-black text-teal-600 dark:text-teal-400 truncate block">
                                    {activeChildTalent.house?.name || 'Unassigned'}
                                </strong>
                            </div>
                        </div>

                        <Link
                            href={route('parent.cocurricular')}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-border/80 hover:bg-muted/80 text-foreground font-semibold text-xs transition-colors shrink-0 min-h-[44px] sm:min-h-0"
                        >
                            <span>View Records</span>
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                    </div>
                )}

                {/* 5. CBC Evaluation Meter */}
                <div className="bg-card text-card-foreground rounded-2xl border border-border/80 p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                                <Award className="w-4 h-4" aria-hidden="true" />
                            </div>
                            <h3 className="text-base font-bold text-foreground tracking-tight">
                                CBC Continuous Assessment Rubrics
                            </h3>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                            Kenyan CBC Standard
                        </span>
                    </div>

                    {cbcAssessments.length === 0 ? (
                        <div className="py-8 text-center border border-dashed border-border rounded-xl space-y-2 bg-muted/20">
                            <BookOpen className="w-6 h-6 text-muted-foreground mx-auto" aria-hidden="true" />
                            <p className="text-xs text-muted-foreground">
                                No CBC rubric assessments recorded for this term yet.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {cbcAssessments.map((a) => {
                                const rubricInfo = rubricDetails[a.rubric] || rubricDetails.ME;
                                return (
                                    <div
                                        key={a.id}
                                        className="p-4 rounded-xl bg-muted/30 border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[44px]"
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="text-xs font-bold text-foreground">
                                                    {a.learning_area}
                                                </h4>
                                                <span className="text-xs text-muted-foreground">
                                                    · {a.strand}
                                                </span>
                                            </div>
                                            {a.teacher_comment && (
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    {a.teacher_comment}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                                            <span
                                                className={`px-2.5 py-1 rounded-lg border font-extrabold text-xs ${rubricInfo.badge}`}
                                            >
                                                {a.rubric}
                                            </span>
                                            <span className="text-[11px] font-semibold text-muted-foreground hidden md:inline">
                                                {rubricInfo.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}