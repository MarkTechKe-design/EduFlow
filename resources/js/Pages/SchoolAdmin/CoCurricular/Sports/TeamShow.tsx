import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ArrowLeft, Plus, Printer, Trash2, Shield, User } from 'lucide-react';
import type { PageProps } from '@/types';

export default function TeamShow({ team, availableStudents }: PageProps<{ team: any; availableStudents: any[] }>) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        student_id: availableStudents[0]?.id ? String(availableStudents[0].id) : '',
        role: 'starter',
        jersey_number: '',
        position_name: '',
    });

    function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        form.post(`/school/cocurricular/sports/teams/${team.id}/members`, {
            onSuccess: () => setOpen(false),
        });
    }

    function handleRemove(memberId: number) {
        if (!confirm('Remove player from roster?')) return;
        router.delete(`/school/cocurricular/sports/members/${memberId}`);
    }

    return (
        <AppLayout header={`Team Roster: ${team.name}`}>
            <Head title={`${team.name} Roster - EduFlow`} />
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <Link href="/school/cocurricular/sports/teams" className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Teams
                    </Link>
                    <div className="flex items-center gap-2">
                        <a href={`/school/cocurricular/export/team/${team.id}/pdf`} target="_blank" className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
                            <Printer className="w-3.5 h-3.5" /> Official Team Sheet PDF
                        </a>
                        <button onClick={() => setOpen(true)} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5" /> Add Player
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">Active Team Members ({team.members.length})</span>
                        <span className="text-slate-500">{team.activity?.name} &bull; {team.gender} &bull; {team.age_group}</span>
                    </div>
                    <table className="w-full text-left text-xs">
                        <thead className="text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="p-4">Jersey</th>
                                <th className="p-4">Student Name</th>
                                <th className="p-4">Admission No</th>
                                <th className="p-4">Class</th>
                                <th className="p-4">Squad Role</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {team.members.map((m: any) => (
                                <tr key={m.id}>
                                    <td className="p-4 font-bold text-emerald-600">{m.jersey_number || '—'}</td>
                                    <td className="p-4 font-bold text-slate-900 dark:text-white">{m.student?.first_name} {m.student?.last_name}</td>
                                    <td className="p-4 text-slate-500">{m.student?.admission_no}</td>
                                    <td className="p-4 text-slate-600">{m.student?.school_class?.name || '—'}</td>
                                    <td className="p-4 capitalize">{m.role} {m.position_name ? `(${m.position_name})` : ''}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleRemove(m.id)} className="text-rose-500 hover:text-rose-700 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </td>
                                </tr>
                            ))}
                            {team.members.length === 0 && (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-400">No players assigned yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl text-xs">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Draft Player to Squad</h2>
                        <form onSubmit={handleAdd} className="space-y-4">
                            <div>
                                <label className="block font-medium mb-1">Select Student</label>
                                <select value={form.data.student_id} onChange={e => form.setData('student_id', e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                                    {availableStudents.map(s => (
                                        <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.admission_no})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium mb-1">Squad Role</label>
                                    <select value={form.data.role} onChange={e => form.setData('role', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                                        <option value="starter">Starter</option>
                                        <option value="captain">Captain</option>
                                        <option value="vice_captain">Vice Captain</option>
                                        <option value="reserve">Reserve</option>
                                        <option value="member">Squad Member</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">Jersey No.</label>
                                    <input type="text" value={form.data.jersey_number} onChange={e => form.setData('jersey_number', e.target.value)} placeholder="e.g. 10" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 text-slate-600">Cancel</button>
                                <button type="submit" disabled={form.processing} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold">Add to Team</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}