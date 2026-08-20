import AppLayout from '@/Layouts/AppLayout';
import MetricCard from '@/components/dashboard/MetricCard';
import LearnerTodayHero, { LessonPeriod } from '@/components/dashboard/LearnerTodayHero';
import { Head, Link, usePage } from '@inertiajs/react';
import { BookOpen, Calendar, Clock, Award, FileText, CheckCircle2 } from 'lucide-react';
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
}

export default function StudentDashboard({
    studentProfile,
    todayTimetable = [],
    pendingAssignments = [],
    publishedMarksCount = 0,
}: Props) {
    const { auth } = usePage().props as any;

    // Truthful identity: Derive name from authenticated user session
    const learnerName = studentProfile?.name || auth?.user?.name || 'Learner';
    const admissionNo = studentProfile?.admission_number || 'Admission Pending';
    const gradeStream = studentProfile?.grade ? `${studentProfile.grade} · Stream ${studentProfile.stream || 'A'}` : 'Enrolled';

    const currentLesson = todayTimetable.find((t) => t.status === 'current') || todayTimetable[0] || null;
    const nextLesson = todayTimetable.find((t) => t.status === 'upcoming') || (todayTimetable.length > 1 ? todayTimetable[1] : null);

    return (
        <AppLayout title="Student Learning Cockpit">
            
            {/* Header & Identity */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                        Welcome back, {learnerName.split(' ')[0]}
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500">
                        {gradeStream} · Adm: {admissionNo}
                    </p>
                </div>
            </div>

            {/* Live Today Hero Timetable Banner */}
            <LearnerTodayHero
                title="Classroom Timetable"
                subtitle="Live Schedule"
                currentLesson={currentLesson}
                nextLesson={nextLesson}
                emptyMessage="No lesson timetable published for today."
            />

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard
                    title="Active Homework Tasks"
                    value={pendingAssignments.length}
                    icon={BookOpen}
                    variant={pendingAssignments.length > 0 ? 'primary' : 'default'}
                    badge={pendingAssignments.length > 0 ? 'Due Soon' : 'All Clear'}
                />
                <MetricCard
                    title="Lessons Scheduled Today"
                    value={todayTimetable.length}
                    icon={Calendar}
                    variant="default"
                    description="Daily Period Timetable"
                />
                <MetricCard
                    title="Published Continuous Marks"
                    value="Academic Standing"
                    icon={Award}
                    variant="success"
                    badge="Active Learner"
                />
            </div>

            {/* Homework Deadlines & Daily Timetable Schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Timetable Periods */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-600" />
                            <h3 className="text-base font-bold text-slate-950">Today's Class Schedule</h3>
                        </div>
                        <Link href="/school/student/timetable" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                            Full Week
                        </Link>
                    </div>

                    {todayTimetable.length === 0 ? (
                        <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl space-y-1">
                            <Calendar className="w-6 h-6 text-slate-400 mx-auto" />
                            <p className="text-xs text-slate-500">No periods scheduled for today.</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {todayTimetable.map((t, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                                        t.status === 'current'
                                            ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-500/20'
                                            : 'bg-slate-50 border-slate-200'
                                    }`}
                                >
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <span className="font-extrabold text-xs text-indigo-600">Period {t.period || idx + 1}</span>
                                            <span className="text-xs font-bold text-slate-900">{t.subject}</span>
                                        </div>
                                        <p className="text-[11px] text-slate-500">{t.teacher} · {t.room}</p>
                                    </div>
                                    <span className="text-xs font-mono font-semibold text-slate-600">{t.time}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Homework Deadlines */}
                <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-950">Homework Due</h3>
                        <Link href="/school/student/homework" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                            View All
                        </Link>
                    </div>

                    {pendingAssignments.length === 0 ? (
                        <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl space-y-1">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                            <p className="text-xs text-slate-500">No pending assignments due.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingAssignments.map((hw) => (
                                <div key={hw.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="space-y-0.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">{hw.subject}</span>
                                            <h4 className="text-xs font-bold text-slate-900">{hw.title}</h4>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                                            {hw.status}
                                        </span>
                                    </div>
                                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        <span>Due: {hw.due_date}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>

        </AppLayout>
    );
}
