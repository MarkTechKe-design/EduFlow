import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Award, ArrowRight, Download } from 'lucide-react';
import type { PageProps, PaginatedData } from '@/types';

export default function TalentPassportsIndex({ students }: PageProps<{ students: PaginatedData<any> }>) {
    return (
        <AppLayout header="Student Talent Passports & Extracurricular CV">
            <Head title="Talent Passports - EduFlow" />
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Award className="w-5 h-5 text-emerald-600" /> Longitudinal Learner Talent Passports
                        </h1>
                        <p className="text-xs text-slate-500">Track student co-curricular portfolios, personal bests, leadership roles, and honors.</p>
                    </div>
                    <a href="/school/cocurricular/export/achievements/csv" className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5" /> Export All Laurels (CSV)
                    </a>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="p-4">Adm No</th>
                                <th className="p-4">Student Name</th>
                                <th className="p-4">Class</th>
                                <th className="p-4">Gender</th>
                                <th className="p-4 text-right">Portfolio Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {students.data.map(s => (
                                <tr key={s.id}>
                                    <td className="p-4 font-bold text-emerald-600">{s.admission_no}</td>
                                    <td className="p-4 font-bold text-slate-900 dark:text-white">{s.first_name} {s.last_name}</td>
                                    <td className="p-4 text-slate-600">{s.school_class?.name || '—'}</td>
                                    <td className="p-4 capitalize text-slate-500">{s.gender || '—'}</td>
                                    <td className="p-4 text-right">
                                        <Link href={`/school/cocurricular/talent/${s.id}`} className="inline-flex items-center gap-1 font-bold text-emerald-600 hover:underline">
                                            Talent Passport <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}