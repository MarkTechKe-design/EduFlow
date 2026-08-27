import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ArrowLeft, Printer, Award, Plus, Shield, Trophy } from 'lucide-react';
import type { PageProps } from '@/types';

export default function LearnerPassportView({ passport, activities, events, staff }: PageProps<{ passport: any; activities: any[]; events: any[]; staff: any[] }>) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        student_id: passport.student.id,
        activity_id: activities[0]?.id ? String(activities[0].id) : '',
        award_title: '1st Place Trophy',
        award_type: 'gold_medal',
        competition_level: 'county',
        position_rank: '1st',
        citation: 'Exemplary performance and leadership',
        awarded_date: new Date().toISOString().split('T')[0],
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/school/cocurricular/talent/achievements', { onSuccess: () => setOpen(false) });
    }

    return (
        <AppLayout header={`Talent Passport: ${passport.student.first_name} ${passport.student.last_name}`}>
            <Head title={`${passport.student.first_name} Passport - EduFlow`} />
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <Link href="/school/cocurricular/talent" className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Passports
                    </Link>
                    <div className="flex items-center gap-2">
                        <a href={`/school/cocurricular/export/talent/${passport.student.id}/pdf`} target="_blank" className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
                            <Printer className="w-3.5 h-3.5" /> Export Official CV (PDF)
                        </a>
                        <button onClick={() => setOpen(true)} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5" /> Concur Award
                        </button>
                    </div>
                </div>

                {/* Profile Header Card */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">{passport.student.first_name} {passport.student.last_name}</h2>
                        <p className="text-xs text-slate-500">Admission No: {passport.student.admission_no} &bull; Class: {passport.student.school_class?.name || '—'}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold">
                        <span className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200">{passport.summary.total_achievements} Laurels</span>
                        <span className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200">{passport.summary.personal_bests} Personal Bests</span>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Squads & Deployments */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Shield className="w-4 h-4 text-emerald-600" /> Sports Squad Deployments</h3>
                        <div className="space-y-2">
                            {passport.teams.map((t: any, idx: number) => (
                                <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-xs">
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white">{t.team_name}</div>
                                        <div className="text-slate-500 text-[11px]">{t.activity_name} &bull; {t.age_group}</div>
                                    </div>
                                    <span className="font-semibold text-emerald-600 capitalize">{t.role}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Verified Awards & Certificates */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-500" /> Official Laurels & Certificates</h3>
                        <div className="space-y-2">
                            {passport.achievements.map((a: any) => (
                                <div key={a.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-xs">
                                    <div>
                                        <div className="font-bold text-slate-900 dark:text-white">{a.award_title}</div>
                                        <div className="text-slate-500 text-[11px]">{a.activity?.name} &bull; {a.competition_level}</div>
                                    </div>
                                    <a href={`/school/cocurricular/export/certificate/${a.id}/pdf`} target="_blank" className="text-emerald-600 font-bold hover:underline">Certificate</a>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl text-xs">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Concur Student Achievement</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block font-medium mb-1">Award / Honor Title</label>
                                <input type="text" value={form.data.award_title} onChange={e => form.setData('award_title', e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium mb-1">Activity</label>
                                    <select value={form.data.activity_id} onChange={e => form.setData('activity_id', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                                        {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">Level</label>
                                    <select value={form.data.competition_level} onChange={e => form.setData('competition_level', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                                        <option value="school">School</option>
                                        <option value="sub_county">Sub-County</option>
                                        <option value="county">County</option>
                                        <option value="regional">Regional</option>
                                        <option value="national">National</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block font-medium mb-1">Official Citation</label>
                                <textarea value={form.data.citation} onChange={e => form.setData('citation', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 text-slate-600">Cancel</button>
                                <button type="submit" disabled={form.processing} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold">Concur Award</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}