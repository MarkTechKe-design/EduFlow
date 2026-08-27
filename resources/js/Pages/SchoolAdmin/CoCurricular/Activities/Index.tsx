import React, { useState } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Activity, Plus, Search, Filter, Trash2, Edit2, Shield } from 'lucide-react';
import type { PageProps, PaginatedData } from '@/types';

interface ActivityItem {
    id: number;
    name: string;
    code: string | null;
    type: string;
    gender_scope: string;
    age_group: string;
    category?: { id: number; name: string };
    head_coach?: { id: number; first_name: string; last_name: string };
    patron?: { id: number; first_name: string; last_name: string };
    teams_count: number;
    events_count: number;
}

interface Props extends PageProps {
    activities: PaginatedData<ActivityItem>;
    categories: Array<{ id: number; name: string }>;
    staff: Array<{ id: number; first_name: string; last_name: string; emp_id: string }>;
    filters: { category_id: string; type: string; search: string };
}

export default function ActivitiesIndex({ activities, categories, staff, filters }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<ActivityItem | null>(null);

    const form = useForm({
        category_id: categories[0]?.id ? String(categories[0].id) : '',
        name: '',
        code: '',
        type: 'team_fixture',
        gender_scope: 'open',
        age_group: 'under_19',
        head_coach_id: '',
        patron_id: '',
        rules: '',
    });

    function openCreate() {
        form.reset();
        setEditingActivity(null);
        setModalOpen(true);
    }

    function openEdit(act: ActivityItem) {
        setEditingActivity(act);
        form.setData({
            category_id: act.category?.id ? String(act.category.id) : '',
            name: act.name,
            code: act.code || '',
            type: act.type,
            gender_scope: act.gender_scope,
            age_group: act.age_group,
            head_coach_id: act.head_coach?.id ? String(act.head_coach.id) : '',
            patron_id: act.patron?.id ? String(act.patron.id) : '',
            rules: '',
        });
        setModalOpen(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingActivity) {
            form.put(`/school/cocurricular/activities/${editingActivity.id}`, {
                onSuccess: () => setModalOpen(false),
            });
        } else {
            form.post('/school/cocurricular/activities', {
                onSuccess: () => setModalOpen(false),
            });
        }
    }

    function handleDelete(act: ActivityItem) {
        if (!confirm(`Are you sure you want to delete "${act.name}"?`)) return;
        router.delete(`/school/cocurricular/activities/${act.id}`);
    }

    return (
        <AppLayout header="Co-Curricular Disciplines & Activities">
            <Head title="Activities Directory - EduFlow" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-emerald-600" />
                            Activity Directory & Discipline Matrix
                        </h1>
                        <p className="text-xs text-slate-500">Configure sports, track events, debate, music, and academic competitions.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/school/cocurricular/categories" className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold">
                            Manage Categories
                        </Link>
                        <button onClick={openCreate} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition">
                            <Plus className="w-3.5 h-3.5" /> Add Activity
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="p-4">Discipline Name</th>
                                <th className="p-4">Category</th>
                                <th className="p-4">Execution Model</th>
                                <th className="p-4">Gender & Age Bracket</th>
                                <th className="p-4">Coach / Patron</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {activities.data.map((act) => (
                                <tr key={act.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                    <td className="p-4 font-bold text-slate-900 dark:text-white">{act.name}</td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300">{act.category?.name || 'General'}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                            {act.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600 dark:text-slate-400 capitalize">{act.gender_scope} &bull; {act.age_group.replace('_', ' ')}</td>
                                    <td className="p-4 text-slate-600 dark:text-slate-300">
                                        {act.head_coach ? `${act.head_coach.first_name} ${act.head_coach.last_name}` : (act.patron ? `${act.patron.first_name} ${act.patron.last_name}` : 'Unassigned')}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => openEdit(act)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button onClick={() => handleDelete(act)} className="p-1.5 hover:bg-rose-50 text-rose-600 rounded">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {activities.data.length === 0 && (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-400">No activities registered yet.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                            {editingActivity ? 'Update Activity' : 'Register Co-Curricular Discipline'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Activity Name</label>
                                <input type="text" value={form.data.name} onChange={e => form.setData('name', e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Category</label>
                                    <select value={form.data.category_id} onChange={e => form.setData('category_id', e.target.value)} required className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Model Type</label>
                                    <select value={form.data.type} onChange={e => form.setData('type', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                                        <option value="team_fixture">Team Fixture (Match)</option>
                                        <option value="individual_measurable">Individual Measurable (Athletics)</option>
                                        <option value="performance_adjudicated">Performance Adjudicated (Arts/Drama)</option>
                                        <option value="club_society">Club / Society</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Gender Scope</label>
                                    <select value={form.data.gender_scope} onChange={e => form.setData('gender_scope', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                                        <option value="open">Open</option>
                                        <option value="boys">Boys</option>
                                        <option value="girls">Girls</option>
                                        <option value="mixed">Mixed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Age Bracket</label>
                                    <select value={form.data.age_group} onChange={e => form.setData('age_group', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                                        <option value="under_12">Under 12</option>
                                        <option value="under_14">Under 14</option>
                                        <option value="under_16">Under 16</option>
                                        <option value="under_19">Under 19</option>
                                        <option value="open">Open</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button type="button" onClick={() => setModalOpen(false)} className="px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-100">Cancel</button>
                                <button type="submit" disabled={form.processing} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold">Save Discipline</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}