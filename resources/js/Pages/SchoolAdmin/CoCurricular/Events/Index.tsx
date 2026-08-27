import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Calendar, Plus, MapPin } from 'lucide-react';
import type { PageProps, PaginatedData } from '@/types';

export default function CocurricularEventsIndex({ events, activities, categories, academicYears }: PageProps<{ events: PaginatedData<any>; activities: any[]; categories: any[]; academicYears: any[] }>) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        title: '',
        activity_id: '',
        category_id: categories[0]?.id ? String(categories[0].id) : '',
        academic_year_id: academicYears[0]?.id ? String(academicYears[0].id) : '',
        term: 'Term 1',
        event_type: 'internal',
        competition_level: 'school',
        start_date: new Date().toISOString().split('T')[0],
        venue: 'School Grounds',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/school/cocurricular/events', { onSuccess: () => setOpen(false) });
    }

    return (
        <AppLayout header="Co-Curricular Events & Competitions">
            <Head title="Events - EduFlow" />
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-indigo-600" /> Events & Competitions Calendar
                        </h1>
                        <p className="text-xs text-slate-500">Schedule inter-house championships, sub-county tournaments, and national galas.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/school/cocurricular/national-calendar" className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold">
                            National MoE Calendar
                        </Link>
                        <button onClick={() => setOpen(true)} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5" /> Schedule Event
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="p-4">Competition Event</th>
                                <th className="p-4">Category / Activity</th>
                                <th className="p-4">Level</th>
                                <th className="p-4">Venue</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {events.data.map(e => (
                                <tr key={e.id}>
                                    <td className="p-4 font-bold text-slate-900 dark:text-white">{e.title}</td>
                                    <td className="p-4 text-slate-600">{e.activity?.name || e.category?.name}</td>
                                    <td className="p-4 capitalize font-semibold text-indigo-600">{e.competition_level}</td>
                                    <td className="p-4 text-slate-500"><MapPin className="w-3 h-3 inline mr-1 text-slate-400" />{e.venue || '—'}</td>
                                    <td className="p-4 font-medium">{e.start_date}</td>
                                    <td className="p-4"><span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 capitalize">{e.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl text-xs">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Schedule Competition Event</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block font-medium mb-1">Event Title</label>
                                <input type="text" value={form.data.title} onChange={e => form.setData('title', e.target.value)} placeholder="e.g. Sub-County Secondary School Athletics" required className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium mb-1">Competition Level</label>
                                    <select value={form.data.competition_level} onChange={e => form.setData('competition_level', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                                        <option value="school">School Level</option>
                                        <option value="inter_house">Inter-House</option>
                                        <option value="zonal">Zonal Level</option>
                                        <option value="sub_county">Sub-County</option>
                                        <option value="county">County Level</option>
                                        <option value="regional">Regional Level</option>
                                        <option value="national">National Level</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">Event Date</label>
                                    <input type="date" value={form.data.start_date} onChange={e => form.setData('start_date', e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
                                </div>
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Venue</label>
                                <input type="text" value={form.data.venue} onChange={e => form.setData('venue', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 text-slate-600">Cancel</button>
                                <button type="submit" disabled={form.processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold">Schedule</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}