import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ArrowLeft, Plus, Edit2, Trash2 } from 'lucide-react';
import type { PageProps } from '@/types';

interface CategoryItem {
    id: number;
    name: string;
    code: string | null;
    icon: string;
    description: string | null;
    display_order: number;
    activities_count: number;
}

export default function CategoriesIndex({ categories }: PageProps<{ categories: CategoryItem[] }>) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<CategoryItem | null>(null);

    const form = useForm({
        name: '',
        code: '',
        icon: 'Activity',
        description: '',
        display_order: 0,
    });

    function openCreate() {
        form.reset();
        setEditing(null);
        setOpen(true);
    }

    function openEdit(c: CategoryItem) {
        setEditing(c);
        form.setData({
            name: c.name,
            code: c.code || '',
            icon: c.icon || 'Activity',
            description: c.description || '',
            display_order: c.display_order || 0,
        });
        setOpen(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            form.put(`/school/cocurricular/categories/${editing.id}`, { onSuccess: () => setOpen(false) });
        } else {
            form.post('/school/cocurricular/categories', { onSuccess: () => setOpen(false) });
        }
    }

    function handleDelete(c: CategoryItem) {
        if (!confirm(`Delete category "${c.name}"?`)) return;
        router.delete(`/school/cocurricular/categories/${c.id}`);
    }

    return (
        <AppLayout header="Activity Categories">
            <Head title="Categories - Co-Curricular Hub" />
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <Link href="/school/cocurricular/activities" className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Activities
                    </Link>
                    <button onClick={openCreate} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5" /> New Category
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="p-4">Category Name</th>
                                <th className="p-4">Code</th>
                                <th className="p-4">Linked Disciplines</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {categories.map((c) => (
                                <tr key={c.id}>
                                    <td className="p-4 font-bold text-slate-900 dark:text-white">{c.name}</td>
                                    <td className="p-4 text-slate-500">{c.code || '—'}</td>
                                    <td className="p-4 text-slate-600 font-medium">{c.activities_count} activities</td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEdit(c)} className="p-1 text-slate-500 hover:text-slate-800"><Edit2 className="w-3.5 h-3.5" /></button>
                                            <button onClick={() => handleDelete(c)} className="p-1 text-rose-500 hover:text-rose-700"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {open && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl text-xs">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white">{editing ? 'Edit Category' : 'Create Category'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                                <input type="text" value={form.data.name} onChange={e => form.setData('name', e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
                            </div>
                            <div>
                                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                <input type="text" value={form.data.description} onChange={e => form.setData('description', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 text-slate-600">Cancel</button>
                                <button type="submit" disabled={form.processing} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}