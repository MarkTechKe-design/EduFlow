import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ArrowLeft, Award, Flame } from 'lucide-react';
import type { PageProps } from '@/types';

export default function AthleticsRecordsWall({ schoolRecords }: PageProps<{ schoolRecords: any[] }>) {
    return (
        <AppLayout title="Institutional Athletics Records Wall">
            <Head title="School Records - EduFlow" />
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <Link href="/school/cocurricular/athletics" className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Athletics
                    </Link>
                </div>

                <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white p-6 rounded-2xl shadow-sm flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-extrabold flex items-center gap-2"><Award className="w-6 h-6" /> All-Time Institutional School Records</h2>
                        <p className="text-xs opacity-90 mt-1">Verified peak athlete benchmarks across all recorded seasons and championships.</p>
                    </div>
                    <Flame className="w-12 h-12 opacity-80" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {schoolRecords.length === 0 ? (
                        <div className="col-span-2 p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 dark:text-slate-500 text-xs">
                            No institutional school records established yet.
                        </div>
                    ) : (
                        schoolRecords.map(r => (
                            <div key={r.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">{r.activity?.name}</span>
                                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">{r.student?.first_name} {r.student?.last_name}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Adm No: {r.student?.admission_no} &bull; Set: {r.recorded_date}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                                        {r.metric_type === 'time' ? `${r.time_recorded_seconds}s` : (r.metric_type === 'distance' ? `${r.distance_recorded_meters}m` : `${r.height_recorded_meters}m`)}
                                    </div>
                                    <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                                        School Benchmark
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}