import AppLayout from '@/Layouts/AppLayout';
import MetricCard from '@/components/dashboard/MetricCard';
import { Link } from '@inertiajs/react';
import {
    BookOpen,
    Calendar,
    CheckCircle2,
    Clock,
    GraduationCap,
    MapPin,
    Users,
} from 'lucide-react';
import React from 'react';

interface Props {
    assignedClassesCount?: number;
    pendingMarkingCount?: number;
    todayLessonsCount?: number;
    todaySchedule?: Array<{
        period: number;
        class: string;
        subject: string;
        time: string;
        room: string;
    }>;
}

export default function TeacherDashboard({
    assignedClassesCount = 0,
    pendingMarkingCount = 0,
    todayLessonsCount = 0,
    todaySchedule = [],
}: Props) {
    const hasLessons = todaySchedule.length > 0;

    return (
        <AppLayout title="Educator Classroom Cockpit">
            <div className="space-y-6 max-w-7xl mx-auto pb-10">
                {/* Header & Situational Awareness Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                            <span
                                className="w-2.5 h-2.5 rounded-full bg-teal-500 ring-4 ring-teal-500/20"
                                aria-hidden="true"
                            />
                            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                                Teacher Workflow Cockpit
                            </h1>
                        </div>

                        {/* Live Pedagogical Status Indicators */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-medium">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted/60 border border-border/50">
                                <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                                Today's Lessons: <strong className="text-foreground">{todayLessonsCount}</strong>
                            </span>
                            <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border ${
                                    pendingMarkingCount > 0
                                        ? 'bg-amber-500/10 border-amber-200/80 text-amber-700 dark:text-amber-300'
                                        : 'bg-emerald-500/10 border-emerald-200/80 text-emerald-700 dark:text-emerald-300'
                                }`}
                            >
                                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                                Grading:{' '}
                                <strong className="text-foreground">
                                    {pendingMarkingCount > 0
                                        ? `${pendingMarkingCount} Awaiting Marking`
                                        : 'All Graded'}
                                </strong>
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted/60 border border-border/50">
                                <Users className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" aria-hidden="true" />
                                Allocated Streams: <strong className="text-foreground">{assignedClassesCount}</strong>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                        <Link
                            href="/school/attendance"
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-all shadow-xs hover:shadow-md focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[44px]"
                        >
                            <Calendar className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>Take Roll-Call</span>
                        </Link>
                    </div>
                </div>

                {/* Operational Pulse Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <MetricCard
                        title="Today's Lessons"
                        value={todayLessonsCount}
                        icon={Clock}
                        variant="primary"
                        badge="Scheduled Today"
                        description={
                            todayLessonsCount > 0
                                ? 'Active timetable periods'
                                : 'No teaching blocks scheduled'
                        }
                    />
                    <MetricCard
                        title="Assignments to Grade"
                        value={pendingMarkingCount}
                        icon={BookOpen}
                        variant={pendingMarkingCount > 0 ? 'warning' : 'success'}
                        badge={pendingMarkingCount > 0 ? 'Awaiting Marking' : 'All Caught Up'}
                        description={
                            pendingMarkingCount > 0
                                ? 'CBC rubric evaluation pending'
                                : 'No pending submissions'
                        }
                    />
                    <MetricCard
                        title="Assigned Class Streams"
                        value={assignedClassesCount}
                        icon={GraduationCap}
                        variant="default"
                        badge="Allocated"
                        description="Active learning cohorts"
                    />
                </div>

                {/* Today's Timetable Schedule */}
                <div className="bg-card text-card-foreground rounded-2xl border border-border/80 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                            <h3 className="text-base font-bold text-foreground tracking-tight">
                                Today's Teaching Schedule
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Sequential periods, room allocations, and subject blocks for today.
                            </p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground self-start sm:self-auto">
                            {todaySchedule.length} {todaySchedule.length === 1 ? 'Period' : 'Periods'} Total
                        </span>
                    </div>

                    <div className="p-5 sm:p-6">
                        {!hasLessons ? (
                            <div className="py-10 text-center border border-dashed border-border rounded-xl space-y-2.5 bg-muted/20">
                                <div
                                    className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center mx-auto"
                                    aria-hidden="true"
                                >
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-sm text-foreground">No Classes Scheduled Today</p>
                                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                                        Your daily register has no active periods assigned. Use this time for CBC rubric scoring or curriculum preparation.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {todaySchedule.map((item) => (
                                    <div
                                        key={item.period}
                                        className="group p-4 rounded-xl border border-border/80 bg-muted/30 hover:bg-muted/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[44px]"
                                    >
                                        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                                            <div className="px-2.5 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-300 font-extrabold text-xs shrink-0">
                                                Period {item.period}
                                            </div>
                                            <div className="space-y-0.5 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-sm text-foreground">
                                                        {item.subject}
                                                    </span>
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[11px] font-semibold">
                                                        {item.class}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground/80" aria-hidden="true" />
                                                    <span className="truncate">{item.room || 'Main Classroom'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                            <span className="px-3 py-1 rounded-lg bg-card border border-border/80 text-xs font-mono font-bold tabular-nums text-foreground">
                                                {item.time}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}