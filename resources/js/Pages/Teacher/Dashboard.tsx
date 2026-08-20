import AppLayout from '@/Layouts/AppLayout';
import MetricCard from '@/components/dashboard/MetricCard';
import ActionQueue from '@/components/dashboard/ActionQueue';
import { Head, Link } from '@inertiajs/react';
import { BookOpen, Calendar, CheckCircle2, Clock, FileText, Plus, Users } from 'lucide-react';
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
    return (
        <AppLayout title="Educator Classroom Cockpit">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
                        Teacher Workflow Cockpit
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500">
                        Class attendance roll-call, CBC rubric scoring, and daily lesson plans.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/school/attendance"
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all"
                    >
                        <Calendar className="w-4 h-4" />
                        <span>Take Roll-Call</span>
                    </Link>
                </div>
            </div>

            {/* Quick KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricCard
                    title="Today's Lessons"
                    value={todayLessonsCount}
                    icon={Clock}
                    variant="primary"
                    badge="Scheduled"
                />
                <MetricCard
                    title="Assignments to Grade"
                    value={pendingMarkingCount}
                    icon={BookOpen}
                    variant="warning"
                    badge="Awaiting Marking"
                />
                <MetricCard
                    title="Assigned Class Streams"
                    value={assignedClassesCount}
                    icon={Users}
                    variant="default"
                    description="Primary & JSS Streams"
                />
            </div>

            {/* Today's Schedule List */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-950">Today's Class Timetable</h3>
                    <span className="text-xs font-semibold text-slate-400">Term 2 Schedule</span>
                </div>

                <div className="space-y-2.5">
                    {todaySchedule.map((item) => (
                        <div key={item.period} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-xs text-indigo-600">Period {item.period}</span>
                                    <span className="text-xs font-bold text-slate-900">{item.class} · {item.subject}</span>
                                </div>
                                <p className="text-[11px] text-slate-500">{item.room}</p>
                            </div>
                            <span className="text-xs font-mono font-semibold text-slate-600">{item.time}</span>
                        </div>
                    ))}
                </div>
            </div>

        </AppLayout>
    );
}
