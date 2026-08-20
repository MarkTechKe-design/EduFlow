import React from 'react';
import { Clock, MapPin, User, BookOpen, AlertCircle } from 'lucide-react';

export interface LessonPeriod {
    period: number;
    subject: string;
    teacher?: string;
    time: string;
    room: string;
    status?: 'completed' | 'current' | 'upcoming';
}

interface Props {
    title?: string;
    subtitle?: string;
    currentLesson?: LessonPeriod | null;
    nextLesson?: LessonPeriod | null;
    emptyMessage?: string;
}

export default function LearnerTodayHero({
    title = "Today's Learning Schedule",
    subtitle = 'Academic Term Timetable',
    currentLesson,
    nextLesson,
    emptyMessage = 'No lessons currently in session for today.',
}: Props) {
    if (!currentLesson && !nextLesson) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex items-center gap-3 text-slate-500">
                <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                <span className="text-xs font-semibold">{emptyMessage}</span>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Live Classroom Schedule</span>
                        <h3 className="text-base font-extrabold text-white">{title}</h3>
                    </div>
                    <span className="text-xs text-indigo-200 font-medium">{subtitle}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Active Period */}
                    {currentLesson ? (
                        <div className="p-4 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-white text-[10px] font-extrabold uppercase tracking-wider">
                                    In Session Now
                                </span>
                                <span className="text-xs font-mono font-semibold text-indigo-200">{currentLesson.time}</span>
                            </div>
                            <div className="text-lg font-black text-white">{currentLesson.subject}</div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-indigo-200">
                                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-indigo-300" /> {currentLesson.teacher}</span>
                                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-indigo-300" /> {currentLesson.room}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs text-indigo-300">
                            No lesson in session right now.
                        </div>
                    )}

                    {/* Next Period */}
                    {nextLesson ? (
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-indigo-300 text-[10px] font-extrabold uppercase tracking-wider border border-white/10">
                                    Next Period
                                </span>
                                <span className="text-xs font-mono font-semibold text-indigo-200">{nextLesson.time}</span>
                            </div>
                            <div className="text-base font-bold text-white">{nextLesson.subject}</div>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-indigo-300">
                                <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {nextLesson.teacher}</span>
                                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {nextLesson.room}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xs text-indigo-300">
                            No further lessons scheduled today.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
