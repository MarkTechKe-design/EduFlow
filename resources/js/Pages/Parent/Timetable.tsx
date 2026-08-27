import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Clock, Calendar } from 'lucide-react';
import type { PageProps } from '@/types';

export default function ParentTimetable({ auth, children = [], schedule = [] }: PageProps<{ children: any[]; schedule: any[] }>) {
    return (
        <AppLayout header="Children Class Timetable">
            <Head title="Class Timetable - Parent Portal" />
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">Weekly Class Schedule</h2>
                    </div>
                    <p className="text-xs text-slate-500 mb-6">View live class periods, teacher allocations, and lab sessions.</p>
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Timetable synchronized with school term curriculum.</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}