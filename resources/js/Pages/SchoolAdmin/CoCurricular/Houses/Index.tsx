import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Shield, Plus, Award } from 'lucide-react';
import type { PageProps, PaginatedData } from '@/types';

export default function HouseSystemIndex({ houses, pointLogs, rules, staff, students }: PageProps<{ houses: any[]; pointLogs: PaginatedData<any>; rules: any[]; staff: any[]; students: any[] }>) {
    const [open, setOpen] = useState(false);
    const [awardOpen, setAwardOpen] = useState(false);

    const houseForm = useForm({
        name: '',
        color_code: '#10b981',
        motto: '',
        patron_id: '',
        captain_student_id: '',
    });

    const awardForm = useForm({
        house_id: houses[0]?.id ? String(houses[0].id) : '',
        position_rank: '1st',
        reason: 'Inter-House Athletics Championship',
        student_id: '',
    });

    function handleHouseSubmit(e: React.FormEvent) {
        e.preventDefault();
        houseForm.post('/school/cocurricular/houses', { onSuccess: () => setOpen(false) });
    }

    function handleAwardSubmit(e: React.FormEvent) {
        e.preventDefault();
        awardForm.post('/school/cocurricular/houses/award-points', { onSuccess: () => setAwardOpen(false) });
    }

    return (
        <AppLayout header="House System & Points Engine">
            <Head title="House Standings - EduFlow" />
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-emerald-600" /> House Championship Standings
                        </h1>
                        <p className="text-xs text-slate-500">Automated points computation across athletics, sports, drama, and academic quizzes.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setAwardOpen(true)} className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5" /> Award House Points
                        </button>
                        <button onClick={() => setOpen(true)} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5" /> Create House
                        </button>
                    </div>
                </div>

                {/* Standings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {houses.map((h, idx) => (
                        <div key={h.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1.5" style={{ backgroundColor: h.color_code || '#10b981' }}></div>
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-extrabold text-slate-400">RANK #{idx + 1}</span>
                                <span className="text-xl font-extrabold text-slate-900 dark:text-white">{h.total_points} pts</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-2">{h.name}</h3>
                            <p className="text-xs text-slate-500 italic">"{h.motto || 'In Unity We Win'}"</p>
                        </div>
                    ))}
                </div>

                {/* Audit Logs */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-900 dark:text-white">
                        Recent House Points Audit Log
                    </div>
                    <table className="w-full text-left text-xs">
                        <thead className="text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="p-4">House</th>
                                <th className="p-4">Points</th>
                                <th className="p-4">Reason / Event</th>
                                <th className="p-4">Learner Contributor</th>
                                <th className="p-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {pointLogs.data.map(p => (
                                <tr key={p.id}>
                                    <td className="p-4 font-bold text-slate-900 dark:text-white">{p.house?.name}</td>
                                    <td className="p-4 font-bold text-emerald-600">+{p.points}</td>
                                    <td className="p-4 text-slate-600">{p.reason}</td>
                                    <td className="p-4 text-slate-500">{p.student ? `${p.student.first_name} ${p.student.last_name}` : 'Team Event'}</td>
                                    <td className="p-4 text-slate-400">{new Date(p.created_at).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {awardOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl text-xs">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Award Championship Points</h2>
                        <form onSubmit={handleAwardSubmit} className="space-y-4">
                            <div>
                                <label className="block font-medium mb-1">House</label>
                                <select value={awardForm.data.house_id} onChange={e => awardForm.setData('house_id', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                                    {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium mb-1">Position / Rank</label>
                                    <select value={awardForm.data.position_rank} onChange={e => awardForm.setData('position_rank', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                                        <option value="1st">1st Place (Gold)</option>
                                        <option value="2nd">2nd Place (Silver)</option>
                                        <option value="3rd">3rd Place (Bronze)</option>
                                        <option value="participant">Participation</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">Student Contributor</label>
                                    <select value={awardForm.data.student_id} onChange={e => awardForm.setData('student_id', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                                        <option value="">None / Team</option>
                                        {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Reason</label>
                                <input type="text" value={awardForm.data.reason} onChange={e => awardForm.setData('reason', e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setAwardOpen(false)} className="px-3 py-2 text-slate-600">Cancel</button>
                                <button type="submit" disabled={awardForm.processing} className="px-4 py-2 bg-amber-500 text-white rounded-lg font-bold">Award & Sync</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}