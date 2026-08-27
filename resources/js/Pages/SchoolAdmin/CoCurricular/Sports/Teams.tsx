import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Shield, Plus, Users, ArrowRight } from 'lucide-react';
import type { PageProps, PaginatedData } from '@/types';

export default function SportsTeamsIndex({ teams, activities, houses, staff, students }: PageProps<{ teams: PaginatedData<any>; activities: any[]; houses: any[]; staff: any[]; students: any[] }>) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        name: '',
        activity_id: activities[0]?.id ? String(activities[0].id) : '',
        house_id: '',
        age_group: 'under_19',
        gender: 'boys',
        coach_id: '',
        captain_student_id: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/school/cocurricular/sports/teams', { onSuccess: () => setOpen(false) });
    }

    return (
        <AppLayout header="Sports Squads & Teams Master">
            <Head title="Teams - EduFlow Sports" />
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-emerald-600" /> Sports Squads & Teams
                        </h1>
                        <p className="text-xs text-slate-500">Manage varsity rosters, houses, trial selections, and coaching staff.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/school/cocurricular/sports/fixtures" className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold">
                            Fixtures & Matches
                        </Link>
                        <button onClick={() => setOpen(true)} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5" /> Create Squad
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {teams.data.map((team) => (
                        <div key={team.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4">
                            <div>
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                        {team.activity?.name}
                                    </span>
                                    <span className="text-xs font-bold text-emerald-600">{team.members_count} Players</span>
                                </div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">{team.name}</h3>
                                <p className="text-xs text-slate-500 capitalize">{team.gender} &bull; {team.age_group?.replace('_', ' ')}</p>
                            </div>
                            <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between items-center text-xs">
                                <span className="text-slate-500">Coach: {team.coach ? `${team.coach.first_name} ${team.coach.last_name}` : 'Unassigned'}</span>
                                <Link href={`/school/cocurricular/sports/teams/${team.id}`} className="font-bold text-emerald-600 flex items-center gap-1 hover:underline">
                                    Roster <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl text-xs">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Establish Sports Squad</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block font-medium mb-1">Squad / Team Name</label>
                                <input type="text" value={form.data.name} onChange={e => form.setData('name', e.target.value)} placeholder="e.g. Varsity Boys Football U19" required className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium mb-1">Activity</label>
                                    <select value={form.data.activity_id} onChange={e => form.setData('activity_id', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                                        {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">House (Optional)</label>
                                    <select value={form.data.house_id} onChange={e => form.setData('house_id', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                                        <option value="">School-wide</option>
                                        {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 text-slate-600">Cancel</button>
                                <button type="submit" disabled={form.processing} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold">Create Team</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}