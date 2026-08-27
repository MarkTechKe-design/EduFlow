import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Sparkles, Plus, Award } from 'lucide-react';
import type { PageProps, PaginatedData } from '@/types';

export default function PerformingArtsIndex({ adjudications, events, rubrics, students }: PageProps<{ adjudications: PaginatedData<any>; events: any[]; rubrics: any[]; students: any[] }>) {
    const [open, setOpen] = useState(false);
    const selectedRubric = rubrics[0] || null;

    const form = useForm({
        event_id: events[0]?.id ? String(events[0].id) : '',
        student_id: students[0]?.id ? String(students[0].id) : '',
        rubric_id: selectedRubric?.id ? String(selectedRubric.id) : '',
        adjudicator_name: 'Official Judge',
        general_feedback: '',
        scores: selectedRubric?.items?.map((item: any) => ({
            rubric_item_id: item.id,
            awarded_score: 0,
            item_comment: '',
        })) || [],
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/school/cocurricular/arts/adjudicate', { onSuccess: () => setOpen(false) });
    }

    return (
        <AppLayout header="Performing Arts & Adjudication Engine">
            <Head title="Arts & Drama - EduFlow" />
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-purple-600" /> Performing Arts & Adjudications
                        </h1>
                        <p className="text-xs text-slate-500">Adjudicate plays, choral verses, music soloists, and dance performances.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/school/cocurricular/arts/rubrics" className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold">
                            Configure Rubrics
                        </Link>
                        <button onClick={() => setOpen(true)} className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5" /> Adjudicate Performance
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="p-4">Performer</th>
                                <th className="p-4">Competition Festival</th>
                                <th className="p-4">Rubric Applied</th>
                                <th className="p-4">Adjudicator</th>
                                <th className="p-4">Score & Grade</th>
                                <th className="p-4">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {adjudications.data.map((adj) => (
                                <tr key={adj.id}>
                                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                                        {adj.participant?.student?.first_name} {adj.participant?.student?.last_name}
                                    </td>
                                    <td className="p-4 text-slate-600">{adj.participant?.event?.title}</td>
                                    <td className="p-4 text-slate-500">{adj.rubric?.name}</td>
                                    <td className="p-4 font-medium">{adj.adjudicator_name}</td>
                                    <td className="p-4 font-bold text-purple-600">
                                        {adj.total_awarded_score} pts ({adj.grade_attained})
                                    </td>
                                    <td className="p-4 text-slate-500">{adj.general_feedback || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl text-xs">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Score Performance (Rubric Evaluation)</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block font-medium mb-1">Performer Student</label>
                                <select value={form.data.student_id} onChange={e => form.setData('student_id', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                                    {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.admission_no})</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block font-medium mb-1">Event</label>
                                    <select value={form.data.event_id} onChange={e => form.setData('event_id', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                                        {events.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-medium mb-1">Adjudicator Name</label>
                                    <input type="text" value={form.data.adjudicator_name} onChange={e => form.setData('adjudicator_name', e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
                                </div>
                            </div>
                            {selectedRubric && (
                                <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                                    <span className="font-bold text-slate-700 dark:text-slate-300">Criteria Scoring: {selectedRubric.name}</span>
                                    {selectedRubric.items?.map((item: any, idx: number) => (
                                        <div key={item.id} className="flex items-center justify-between gap-3">
                                            <span className="text-slate-600">{item.criterion_name} (Max {item.max_score})</span>
                                            <input
                                                type="number"
                                                min="0"
                                                max={item.max_score}
                                                required
                                                onChange={e => {
                                                    const newScores = [...form.data.scores];
                                                    newScores[idx] = { rubric_item_id: item.id, awarded_score: parseFloat(e.target.value) || 0, item_comment: '' };
                                                    form.setData('scores', newScores);
                                                }}
                                                className="w-20 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-right"
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 text-slate-600">Cancel</button>
                                <button type="submit" disabled={form.processing} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold">Submit Adjudication</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}