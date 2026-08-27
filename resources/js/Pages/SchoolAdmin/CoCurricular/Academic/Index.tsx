import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { BookOpen, Calendar, Award } from 'lucide-react';
import type { PageProps, PaginatedData } from '@/types';

export default function AcademicCompetitionsIndex({ events }: PageProps<{ events: PaginatedData<any> }>) {
    return (
        <AppLayout header="Academic & STEM Competitions">
            <Head title="STEM & Debate - EduFlow" />
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-blue-600" /> Academic & STEM Competitions
                        </h1>
                        <p className="text-xs text-slate-500">Science & Engineering Fairs, Mathematical Olympiads, Debate Championships, and Robotics Challenges.</p>
                    </div>
                    <Link href="/school/cocurricular/events" className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold">
                        Schedule Competition
                    </Link>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="p-4">Competition</th>
                                <th className="p-4">Academic Discipline</th>
                                <th className="p-4">Level</th>
                                <th className="p-4">Delegates</th>
                                <th className="p-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {events.data.map(e => (
                                <tr key={e.id}>
                                    <td className="p-4 font-bold text-slate-900 dark:text-white">{e.title}</td>
                                    <td className="p-4 text-blue-600 font-semibold">{e.activity?.name}</td>
                                    <td className="p-4 uppercase text-[11px] font-bold text-slate-400">{e.competition_level}</td>
                                    <td className="p-4 text-slate-600">{e.participants?.length || 0} Registered</td>
                                    <td className="p-4 text-slate-500">{e.start_date}</td>
                                </tr>
                            ))}
                            {events.data.length === 0 && (
                                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No STEM or academic competitions scheduled.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}