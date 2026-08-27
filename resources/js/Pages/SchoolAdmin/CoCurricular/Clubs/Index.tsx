import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Users, Plus, ArrowRight } from 'lucide-react';
import type { PageProps, PaginatedData } from '@/types';

export default function ClubsIndex({ clubs, categories, staff }: PageProps<{ clubs: PaginatedData<any>; categories: any[]; staff: any[] }>) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        name: '',
        category_id: categories[0]?.id ? String(categories[0].id) : '',
        motto: '',
        patron_id: '',
        meeting_schedule: 'Every Wednesday 4:00 PM',
        meeting_venue: 'School Hall',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/school/cocurricular/clubs', { onSuccess: () => setOpen(false) });
    }

    return (
        <AppLayout header="Clubs, Societies & Scouts">
            <Head title="Clubs & Societies - EduFlow" />
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" /> Clubs, Societies & Youth Movements
                        </h1>
                        <p className="text-xs text-slate-500">Scouts, St. John Ambulance, Environmental Club, Debate, and Red Cross charters.</p>
                    </div>
                    <button onClick={() => setOpen(true)} className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> Register Club Charter
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {clubs.data.map(club => (
                        <div key={club.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
                            <div>
                                <span className="text-xs font-bold text-indigo-600">{club.memberships_count} Active Members</span>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">{club.name}</h3>
                                <p className="text-xs text-slate-500 italic mt-0.5">"{club.motto || 'Excellence in Service'}"</p>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">Patron: {club.patron ? `${club.patron.first_name} ${club.patron.last_name}` : 'Unassigned'}</p>
                            </div>
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-center text-xs">
                                <span className="text-slate-400">{club.meeting_schedule}</span>
                                <Link href={`/school/cocurricular/clubs/${club.id}`} className="font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                                    Charter & Roster <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl text-xs">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Register Club Charter</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block font-medium mb-1">Club / Movement Name</label>
                                <input type="text" value={form.data.name} onChange={e => form.setData('name', e.target.value)} placeholder="e.g. Kenya Scouts Association - 1st Troop" required className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Patron Teacher</label>
                                <select value={form.data.patron_id} onChange={e => form.setData('patron_id', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                                    <option value="">Select Patron</option>
                                    {staff.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Motto / Slogan</label>
                                <input type="text" value={form.data.motto} onChange={e => form.setData('motto', e.target.value)} placeholder="e.g. Be Prepared" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 text-slate-600">Cancel</button>
                                <button type="submit" disabled={form.processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold">Charter Club</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}