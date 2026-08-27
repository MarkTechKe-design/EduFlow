import { route } from 'ziggy-js';
import AppLayout from '@/Layouts/AppLayout';
import MetricCard from '@/components/dashboard/MetricCard';
import { LessonPeriod } from '@/components/dashboard/LearnerTodayHero';
import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Calendar,
    Clock,
    Award,
    CheckCircle2,
    Trophy,
    ArrowRight,
    MapPin,
    User,
    Sparkles,
    GraduationCap,
    AlertCircle,
} from 'lucide-react';
import React from 'react';

interface Props {
    publishedMarksCount?: number;
    studentProfile?: {
        name?: string;
        admission_number?: string;
        grade?: string;
        stream?: string;
    };
    todayTimetable?: LessonPeriod[];
    pendingAssignments?: Array<{
        id: number;
        title: string;
        subject: string;
        due_date: string;
        status: 'pending' | 'submitted' | 'graded';
    }>;
    talentSummary?: {
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
        achievements: Array<{
            title: string;
            activity_name: string;
            award_level: string;
            awarded_date: string;
        }>;
        teams: Array<{
            team_name: string;
            activity_name: string;
            role: string;
        }>;
        clubs: Array<{
            club_name: string;
            role: string;
        }>;
    } | null;
}

export default function StudentDashboard({
    studentProfile,
    todayTimetable = [],
    pendingAssignments = [],
    publishedMarksCount = 0,
    talentSummary,
}: Props) {
    const { auth } = usePage().props as any;

    const learnerName = studentProfile?.name || auth?.user?.name || 'Learner';
    const admissionNo = studentProfile?.admission_number || 'Admission Pending';
    const gradeStream = studentProfile?.grade
        ? `${studentProfile.grade} · Stream ${studentProfile.stream || 'A'}`
        : 'Enrolled Learner';

    const currentLesson =
        todayTimetable.find((t) => t.status === 'current') || todayTimetable[0] || null;
    const nextLesson =
        todayTimetable.find((t) => t.status === 'upcoming') ||
        (todayTimetable.length > 1 ? todayTimetable[1] : null);

    const hasLessons = todayTimetable.length > 0;
    const hasAssignments = pendingAssignments.length > 0;

    return (
        <AppLayout title="Student Learning Cockpit">
            <div className="space-y-6 max-w-7xl mx-auto pb-10">
                {/* 1. Learner Header & Status Strip */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/60">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-2.5">
                            <span
                                className="w-2.5 h-2.5 rounded-full bg-teal-500 ring-4 ring-teal-500/20"
                                aria-hidden="true"
                            />
                            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                                Welcome back, {learnerName.split(' ')[0]}
                            </h1>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground font-medium">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted/60 border border-border/50">
                                <GraduationCap className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                                <strong className="text-foreground">{gradeStream}</strong>
                            </span>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted/60 border border-border/50 font-mono text-[11px]">
                                Adm: <strong className="text-foreground">{admissionNo}</strong>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-semibold">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-300">
                            <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>Active Term</span>
                        </span>
                    </div>
                </div>

                {/* 2. Live Today Hero Schedule Banner */}
                <div className="bg-card text-card-foreground rounded-2xl border border-border/80 p-5 sm:p-6 shadow-xs relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3 mb-4">
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-teal-600 dark:text-teal-400">
                                Live Classroom Telemetry
                            </span>
                            <h3 className="text-base font-bold text-foreground">
                                Today's Learning Schedule
                            </h3>
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground">
                            {todayTimetable.length} {todayTimetable.length === 1 ? 'Period' : 'Periods'} Total
                        </span>
                    </div>

                    {!hasLessons ? (
                        <div className="py-8 text-center border border-dashed border-border rounded-xl space-y-2 bg-muted/20">
                            <Clock className="w-6 h-6 text-muted-foreground mx-auto" aria-hidden="true" />
                            <p className="text-xs text-muted-foreground">
                                No lessons scheduled for today. Enjoy your private study period.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* In Session Period */}
                            {currentLesson ? (
                                <div className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="px-2 py-0.5 rounded-md bg-teal-600 text-white text-[10px] font-extrabold uppercase tracking-wider">
                                            In Session Now
                                        </span>
                                        <span className="text-xs font-mono font-bold text-teal-700 dark:text-teal-300">
                                            {currentLesson.time}
                                        </span>
                                    </div>
                                    <div className="text-lg font-black text-foreground">
                                        {currentLesson.subject}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                        {currentLesson.teacher && (
                                            <span className="flex items-center gap-1">
                                                <User className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                                                {currentLesson.teacher}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                                            {currentLesson.room || 'Classroom'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-center text-xs text-muted-foreground">
                                    No active lesson in session right now.
                                </div>
                            )}

                            {/* Next Period */}
                            {nextLesson ? (
                                <div className="p-4 rounded-xl bg-muted/30 border border-border/60 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="px-2 py-0.5 rounded-md bg-muted border border-border/80 text-muted-foreground text-[10px] font-extrabold uppercase tracking-wider">
                                            Next Period
                                        </span>
                                        <span className="text-xs font-mono font-bold text-foreground">
                                            {nextLesson.time}
                                        </span>
                                    </div>
                                    <div className="text-base font-bold text-foreground">
                                        {nextLesson.subject}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                        {nextLesson.teacher && (
                                            <span className="flex items-center gap-1">
                                                <User className="w-3.5 h-3.5" aria-hidden="true" />
                                                {nextLesson.teacher}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                                            {nextLesson.room || 'Classroom'}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 rounded-xl bg-muted/30 border border-border/60 flex items-center justify-center text-xs text-muted-foreground">
                                    No further lessons scheduled today.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* 3. Key Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <MetricCard
                        title="Active Homework Tasks"
                        value={pendingAssignments.length}
                        icon={BookOpen}
                        variant={pendingAssignments.length > 0 ? 'primary' : 'success'}
                        badge={pendingAssignments.length > 0 ? 'Pending' : 'All Clear'}
                        description={
                            pendingAssignments.length > 0
                                ? 'Continuous assessments to submit'
                                : 'All assignments submitted'
                        }
                    />
                    <MetricCard
                        title="Published Exam Scores"
                        value={publishedMarksCount}
                        icon={Award}
                        variant="success"
                        badge="CBC Term Marks"
                        description="Summative & formative records"
                    />
                    <MetricCard
                        title="Daily Timetable Periods"
                        value={todayTimetable.length}
                        icon={Clock}
                        variant="default"
                        badge="Today"
                        description="Allocated instructional blocks"
                    />
                </div>

                {/* 4. Homework & Assignments Detailed Stream */}
                <div className="bg-card text-card-foreground rounded-2xl border border-border/80 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-border/60 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <h3 className="text-base font-bold text-foreground tracking-tight">
                                Homework & Learning Tasks
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Continuous assessments and prep work due for submission.
                            </p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {pendingAssignments.length} Pending
                        </span>
                    </div>

                    <div className="p-5 sm:p-6">
                        {!hasAssignments ? (
                            <div className="py-8 text-center border border-dashed border-border rounded-xl space-y-2 bg-muted/20">
                                <CheckCircle2 className="w-6 h-6 text-emerald-500 dark:text-emerald-400 mx-auto" aria-hidden="true" />
                                <div className="space-y-0.5">
                                    <p className="text-xs font-bold text-foreground">You are all caught up!</p>
                                    <p className="text-[11px] text-muted-foreground">
                                        No homework tasks or assignments currently awaiting your submission.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2.5">
                                {pendingAssignments.map((task) => {
                                    const statusStyles = {
                                        pending: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200/80',
                                        submitted: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-200/80',
                                        graded: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200/80',
                                    };

                                    return (
                                        <div
                                            key={task.id}
                                            className="p-3.5 sm:p-4 rounded-xl border border-border/80 bg-muted/30 hover:bg-muted/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[44px]"
                                        >
                                            <div className="space-y-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold text-[11px]">
                                                        {task.subject}
                                                    </span>
                                                    <h4 className="text-xs font-bold text-foreground truncate">
                                                        {task.title}
                                                    </h4>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                                    <Calendar className="w-3 h-3 shrink-0" aria-hidden="true" />
                                                    <span>Due: {task.due_date}</span>
                                                </div>
                                            </div>

                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full border font-semibold text-[10px] uppercase tracking-wider shrink-0 self-start sm:self-auto ${
                                                    statusStyles[task.status] || statusStyles.pending
                                                }`}
                                            >
                                                {task.status}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* 5. Co-Curricular & Talent Highlights */}
                {talentSummary && (
                    <div className="rounded-2xl border border-border/80 bg-card text-card-foreground p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 shrink-0">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center shrink-0">
                                <Trophy className="w-5 h-5" aria-hidden="true" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-foreground leading-tight">
                                    Talent & Activities Passport
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    Sports leagues, clubs, house standings, and personal achievements
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 max-w-2xl text-xs">
                            <div className="px-3 py-2 rounded-xl bg-muted/40 border border-border/50 text-center sm:text-left">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase block">My Teams</span>
                                <strong className="text-sm font-black text-foreground">{talentSummary.summary.total_teams}</strong>
                            </div>
                            <div className="px-3 py-2 rounded-xl bg-muted/40 border border-border/50 text-center sm:text-left">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase block">My Clubs</span>
                                <strong className="text-sm font-black text-foreground">{talentSummary.summary.total_clubs}</strong>
                            </div>
                            <div className="px-3 py-2 rounded-xl bg-muted/40 border border-border/50 text-center sm:text-left">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Achievements</span>
                                <strong className="text-sm font-black text-emerald-600 dark:text-emerald-400">{talentSummary.summary.total_achievements}</strong>
                            </div>
                            <div className="px-3 py-2 rounded-xl bg-muted/40 border border-border/50 text-center sm:text-left">
                                <span className="text-[10px] font-semibold text-muted-foreground uppercase block">House</span>
                                <strong className="text-xs font-black text-teal-600 dark:text-teal-400 truncate block">
                                    {talentSummary.house?.name || 'Unassigned'}
                                </strong>
                            </div>
                        </div>

                        <Link
                            href={route('student.cocurricular')}
                            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-border/80 hover:bg-muted/80 text-foreground font-semibold text-xs transition-colors shrink-0 min-h-[44px] sm:min-h-0"
                        >
                            <span>View Passport</span>
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}