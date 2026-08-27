import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Timer, Plus, Award, Trophy, ChevronRight } from 'lucide-react';
import type { PageProps, PaginatedData } from '@/types';

export default function AthleticsIndex({ results, events, activities, students, houses }: PageProps<{ results: PaginatedData<any>; events: any[]; activities: any[]; students: any[]; houses: any[] }>) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        event_id: events[0]?.id ? String(events[0].id) : '',
        activity_id: activities[0]?.id ? String(activities[0].id) : '',
        student_id: students[0]?.id ? String(students[0].id) : '',
        house_id: houses[0]?.id ? String(houses[0].id) : '',
        event_round: 'final',
        metric_type: 'time',
        time_recorded_seconds: '',
        distance_recorded_meters: '',
        height_recorded_meters: '',
        final_position: 1,
        remarks: '',
        award_house_points: true,
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/school/cocurricular/athletics/results', { onSuccess: () => setOpen(false) });
    }

    return (
        <AppLayout title="Athletics & Individual Events Management">
            <Head title="Athletics & Track - EduFlow" />
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
                            <Timer className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Athletics & Track Performance Ledger
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Record heats, race times, jump heights, personal bests, and school records.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/school/cocurricular/athletics/records" className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition">
                            <Award className="w-3.5 h-3.5" /> School Records Wall
                        </Link>
                        <button onClick={() => setOpen(true)} className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition">
                            <Plus className="w-3.5 h-3.5" /> Record Result
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="p-4">Learner Athlete</th>
                                    <th className="p-4">Discipline</th>
                                    <th className="p-4">Round</th>
                                    <th className="p-4">Result Metric</th>
                                    <th className="p-4">Position</th>
                                    <th className="p-4">Status & Laurels</th>
                                    <th className="p-4 text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                                {results.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500">No athletics records registered yet.</td>
                                    </tr>
                                ) : (
                                    results.data.map((r) => (
                                        <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="p-4 font-bold text-slate-900 dark:text-white">
                                                {r.student?.first_name} {r.student?.last_name}
                                                <span className="block text-[11px] font-mono text-slate-400 dark:text-slate-500">{r.student?.admission_no}</span>
                                            </td>
                                            <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">{r.activity?.name}</td>
                                            <td className="p-4 capitalize">
                                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                                                    {r.event_round}
                                                </span>
                                            </td>
                                            <td className="p-4 font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                                                {r.metric_type === 'time' ? `${r.time_recorded_seconds}s` : (r.metric_type === 'distance' ? `${r.distance_recorded_meters}m` : `${r.height_recorded_meters}m`)}
                                            </td>
                                            <td className="p-4 font-extrabold text-slate-900 dark:text-slate-100">{r.final_position ? `#${r.final_position}` : '—'}</td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {r.is_school_record && (
                                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60">
                                                            School Record
                                                        </span>
                                                    )}
                                                    {r.is_personal_best && (
                                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/60">
                                                            PB
                                                        </span>
                                                    )}
                                                    {!r.is_school_record && !r.is_personal_best && (
                                                        <span className="text-[11px] text-slate-400 dark:text-slate-500">Official Entry</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right text-slate-500 dark:text-slate-400 font-mono text-[11px]">{r.recorded_date}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {open && (
                <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl text-xs">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Log Athletics Track / Field Result</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Competition Event</label>
                                    <select value={form.data.event_id} onChange={e => form.setData('event_id', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                                        {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Discipline</label>
                                    <select value={form.data.activity_id} onChange={e => form.setData('activity_id', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                                        {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Student Athlete</label>
                                    <select value={form.data.student_id} onChange={e => form.setData('student_id', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                                        {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.admission_no})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">House (For Standings)</label>
                                    <select value={form.data.house_id} onChange={e => form.setData('house_id', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                                        {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Time (Seconds)</label>
                                    <input type="number" step="0.001" value={form.data.time_recorded_seconds} onChange={e => form.setData('time_recorded_seconds', e.target.value)} placeholder="e.g. 11.82" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
                                </div>
                                <div>
                                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Distance (Meters)</label>
                                    <input type="number" step="0.01" value={form.data.distance_recorded_meters} onChange={e => form.setData('distance_recorded_meters', e.target.value)} placeholder="e.g. 6.45" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
                                </div>
                                <div>
                                    <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Finish Position</label>
                                    <input type="number" min="1" value={form.data.final_position} onChange={e => form.setData('final_position', parseInt(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-slate-900 dark:text-slate-100" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setOpen(false)} className="px-3.5 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-semibold">Cancel</button>
                                <button type="submit" disabled={form.processing} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-xs">Record & Evaluate</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}