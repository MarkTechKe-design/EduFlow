import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ArrowLeft, Plus, Trash2, Users } from 'lucide-react';
import type { PageProps } from '@/types';

export default function ClubShow({ club, availableStudents }: PageProps<{ club: any; availableStudents: any[] }>) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        student_id: availableStudents[0]?.id ? String(availableStudents[0].id) : '',
        role: 'member',
    });

    function handleEnroll(e: React.FormEvent) {
        e.preventDefault();
        form.post(`/school/cocurricular/clubs/${club.id}/members`, { onSuccess: () => setOpen(false) });
    }

    function handleRemove(membershipId: number) {
        if (!confirm('Remove member from club?')) return;
        router.delete(`/school/cocurricular/clubs/members/${membershipId}`);
    }

    return (
        <AppLayout header={`Club Charter: ${club.name}`}>
            <Head title={`${club.name} - EduFlow`} />
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <Link href="/school/cocurricular/clubs" className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Clubs
                    </Link>
                    <button onClick={() => setOpen(true)} className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> Enroll Member
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">Active Members ({club.memberships.length})</span>
                        <span className="text-slate-500">Patron: {club.patron ? `${club.patron.first_name} ${club.patron.last_name}` : 'Unassigned'}</span>
                    </div>
                    <table className="w-full text-left text-xs">
                        <thead className="text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="p-4">Student Name</th>
                                <th className="p-4">Admission No</th>
                                <th className="p-4">Class</th>
                                <th className="p-4">Leadership Role</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {club.memberships.map((m: any) => (
                                <tr key={m.id}>
                                    <td className="p-4 font-bold text-slate-900 dark:text-white">{m.student?.first_name} {m.student?.last_name}</td>
                                    <td className="p-4 text-slate-500">{m.student?.admission_no}</td>
                                    <td className="p-4 text-slate-600">{m.student?.school_class?.name || '—'}</td>
                                    <td className="p-4 capitalize font-semibold text-indigo-600">{m.role}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleRemove(m.id)} className="text-rose-500 hover:text-rose-700 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl text-xs">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Enroll Learner in Club</h2>
                        <form onSubmit={handleEnroll} className="space-y-4">
                            <div>
                                <label className="block font-medium mb-1">Select Student</label>
                                <select value={form.data.student_id} onChange={e => form.setData('student_id', e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                                    {availableStudents.map(s => (
                                        <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.admission_no})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Leadership Position</label>
                                <select value={form.data.role} onChange={e => form.setData('role', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                                    <option value="member">General Member</option>
                                    <option value="president">President / Chairperson</option>
                                    <option value="secretary">Secretary</option>
                                    <option value="treasurer">Treasurer</option>
                                    <option value="organizing_secretary">Organizing Secretary</option>
                                    <option value="committee_member">Committee Member</option>
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 text-slate-600">Cancel</button>
                                <button type="submit" disabled={form.processing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold">Enroll</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}