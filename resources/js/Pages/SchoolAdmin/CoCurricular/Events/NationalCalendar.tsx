import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ArrowLeft, Calendar } from 'lucide-react';
import type { PageProps } from '@/types';

export default function NationalCalendarView({ calendar, academicYear, term }: PageProps<{ calendar: any[]; academicYear: string; term: string }>) {
    return (
        <AppLayout header="National Co-Curricular Calendar (MoE Circular)">
            <Head title="MoE Co-Curricular Calendar - EduFlow" />
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <Link href="/school/cocurricular/events" className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Events
                    </Link>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs font-bold text-slate-900 dark:text-white">
                        <span>Ministry of Education Official Co-Curricular Calendar ({academicYear} - {term})</span>
                    </div>
                    <table className="w-full text-left text-xs">
                        <thead className="text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="p-4">Discipline / Activity</th>
                                <th className="p-4">Education Level</th>
                                <th className="p-4">Competition Level</th>
                                <th className="p-4">Host County / Region</th>
                                <th className="p-4">Action Dates</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {calendar.map(c => (
                                <tr key={c.id}>
                                    <td className="p-4 font-bold text-slate-900 dark:text-white">{c.activity_name}</td>
                                    <td className="p-4 uppercase text-slate-600">{c.education_level} ({c.age_bracket})</td>
                                    <td className="p-4 capitalize font-semibold text-indigo-600">{c.competition_level}</td>
                                    <td className="p-4 text-slate-500">{c.host_county}, {c.host_region}</td>
                                    <td className="p-4 font-medium">{c.start_date} &bull; {c.end_date}</td>
                                </tr>
                            ))}
                            {calendar.length === 0 && (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No official circular records populated for this year.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}