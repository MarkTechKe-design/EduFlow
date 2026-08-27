import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import type { PageProps } from '@/types';

export default function ArtsRubrics({ rubrics, activities }: PageProps<{ rubrics: any[]; activities: any[] }>) {
    const [open, setOpen] = useState(false);
    const form = useForm({
        name: '',
        activity_id: '',
        description: '',
        items: [
            { criterion_name: 'Acting & Stage Presence', max_score: 25 },
            { criterion_name: 'Diction & Voice Projection', max_score: 25 },
            { criterion_name: 'Creativity & Interpretation', max_score: 25 },
            { criterion_name: 'Costume & Decor Alignment', max_score: 25 },
        ],
    });

    function addItem() {
        form.setData('items', [...form.data.items, { criterion_name: '', max_score: 20 }]);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        form.post('/school/cocurricular/arts/rubrics', { onSuccess: () => setOpen(false) });
    }

    return (
        <AppLayout header="Adjudication Rubrics Engine">
            <Head title="Scoring Rubrics - EduFlow" />
            <div className="max-w-5xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <Link href="/school/cocurricular/arts" className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Performing Arts
                    </Link>
                    <button onClick={() => setOpen(true)} className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> New Scoring Rubric
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rubrics.map(r => (
                        <div key={r.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
                            <div className="flex justify-between items-start">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white">{r.name}</h3>
                                <span className="text-xs font-bold text-purple-600">{r.total_max_score} Total Pts</span>
                            </div>
                            <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800 pt-2 text-xs">
                                {r.items?.map((item: any) => (
                                    <div key={item.id} className="flex justify-between text-slate-600 dark:text-slate-300">
                                        <span>{item.criterion_name}</span>
                                        <span className="font-bold">{item.max_score} pts</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl text-xs">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Create Adjudication Rubric</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block font-medium mb-1">Rubric Title</label>
                                <input type="text" value={form.data.name} onChange={e => form.setData('name', e.target.value)} placeholder="e.g. Kenya National Drama Festival - Play Rubric" required className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
                            </div>
                            <div className="space-y-2">
                                <label className="block font-medium">Evaluation Criteria</label>
                                {form.data.items.map((it, idx) => (
                                    <div key={idx} className="flex gap-2">
                                        <input
                                            type="text"
                                            value={it.criterion_name}
                                            onChange={e => {
                                                const updated = [...form.data.items];
                                                updated[idx].criterion_name = e.target.value;
                                                form.setData('items', updated);
                                            }}
                                            placeholder="Criterion name"
                                            required
                                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800"
                                        />
                                        <input
                                            type="number"
                                            value={it.max_score}
                                            onChange={e => {
                                                const updated = [...form.data.items];
                                                updated[idx].max_score = parseFloat(e.target.value) || 0;
                                                form.setData('items', updated);
                                            }}
                                            placeholder="Max"
                                            required
                                            className="w-20 px-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800 text-right"
                                        />
                                    </div>
                                ))}
                                <button type="button" onClick={addItem} className="text-purple-600 font-bold text-[11px]">+ Add Criterion Row</button>
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 text-slate-600">Cancel</button>
                                <button type="submit" disabled={form.processing} className="px-4 py-2 bg-purple-600 text-white rounded-lg font-bold">Save Rubric</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}