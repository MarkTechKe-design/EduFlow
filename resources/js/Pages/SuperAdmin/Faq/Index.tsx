import React, { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Head, router } from '@inertiajs/react';
import { HelpCircle, Plus, Search, Edit, Trash2, Eye, EyeOff, Home, Check, X, ArrowUpDown, Filter } from 'lucide-react';

interface FaqItem {
    id: number;
    question: string;
    answer: string;
    category: string;
    status: 'draft' | 'published' | 'archived';
    is_featured_on_homepage: boolean;
    sort_order: number;
    updated_at: string;
}

interface Props {
    faqs: {
        data: FaqItem[];
        links: any[];
        total: number;
    };
    categories: string[];
    filters: {
        search?: string;
        category?: string;
        status?: string;
    };
}

export default function FaqIndex({ faqs, categories = [], filters }: Props) {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
    
    // Form state
    const [form, setForm] = useState({
        question: '',
        answer: '',
        category: 'General',
        status: 'published',
        is_featured_on_homepage: false,
        sort_order: 0,
    });

    const openCreateModal = () => {
        setEditingFaq(null);
        setForm({
            question: '',
            answer: '',
            category: categories[0] || 'General',
            status: 'published',
            is_featured_on_homepage: false,
            sort_order: (faqs.total || 0) + 1,
        });
        setModalOpen(true);
    };

    const openEditModal = (faq: FaqItem) => {
        setEditingFaq(faq);
        setForm({
            question: faq.question,
            answer: faq.answer,
            category: faq.category,
            status: faq.status,
            is_featured_on_homepage: faq.is_featured_on_homepage,
            sort_order: faq.sort_order,
        });
        setModalOpen(true);
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingFaq) {
            router.put(`/super-admin/faqs/${editingFaq.id}`, form, {
                onSuccess: () => setModalOpen(false),
            });
        } else {
            router.post('/super-admin/faqs', form, {
                onSuccess: () => setModalOpen(false),
            });
        }
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this FAQ question?')) {
            router.delete(`/super-admin/faqs/${id}`);
        }
    };

    const togglePublish = (id: number) => {
        router.patch(`/super-admin/faqs/${id}/toggle-publish`);
    };

    const toggleHomepage = (id: number) => {
        router.patch(`/super-admin/faqs/${id}/toggle-homepage`);
    };

    return (
        <AppLayout title="Platform FAQ Management">
            <div className="space-y-6">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <HelpCircle className="w-5 h-5 text-indigo-600" />
                            <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">
                                Platform FAQ Management
                            </h1>
                        </div>
                        <p className="text-xs text-slate-500">
                            CMS repository for questions rendered on the public website and standalone /faq portal.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add New FAQ</span>
                    </button>
                </div>

                {/* Data Table Container */}
                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                                <tr>
                                    <th className="py-3.5 px-5">Order</th>
                                    <th className="py-3.5 px-5">Question & Answer</th>
                                    <th className="py-3.5 px-5">Category</th>
                                    <th className="py-3.5 px-5">Homepage</th>
                                    <th className="py-3.5 px-5">Status</th>
                                    <th className="py-3.5 px-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {faqs.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400">
                                            No FAQs created yet. Click "Add New FAQ" to create one.
                                        </td>
                                    </tr>
                                ) : (
                                    faqs.data.map((faq) => (
                                        <tr key={faq.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-3.5 px-5 font-mono font-bold text-slate-500">
                                                #{faq.sort_order}
                                            </td>
                                            <td className="py-3.5 px-5 max-w-md">
                                                <div className="font-bold text-slate-900 line-clamp-1">{faq.question}</div>
                                                <div className="text-slate-500 line-clamp-2 text-[11px] mt-0.5">{faq.answer}</div>
                                            </td>
                                            <td className="py-3.5 px-5">
                                                <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px]">
                                                    {faq.category}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-5">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleHomepage(faq.id)}
                                                    className={`px-2.5 py-1 rounded-md font-bold text-[10px] uppercase flex items-center gap-1 border transition-all ${
                                                        faq.is_featured_on_homepage
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : 'bg-slate-50 text-slate-400 border-slate-200'
                                                    }`}
                                                >
                                                    <Home className="w-3 h-3" />
                                                    <span>{faq.is_featured_on_homepage ? 'Featured' : 'Off'}</span>
                                                </button>
                                            </td>
                                            <td className="py-3.5 px-5">
                                                <button
                                                    type="button"
                                                    onClick={() => togglePublish(faq.id)}
                                                    className={`px-2.5 py-1 rounded-md font-bold text-[10px] uppercase border transition-all ${
                                                        faq.status === 'published'
                                                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                                            : 'bg-amber-100 text-amber-800 border-amber-200'
                                                    }`}
                                                >
                                                    {faq.status}
                                                </button>
                                            </td>
                                            <td className="py-3.5 px-5 text-right space-x-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(faq)}
                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                                                    title="Edit FAQ"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(faq.id)}
                                                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                    title="Delete FAQ"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal Form */}
                {modalOpen && (
                    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
                        <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <h3 className="text-base font-bold text-slate-950">
                                    {editingFaq ? 'Edit FAQ Question' : 'Create New FAQ Question'}
                                </h3>
                                <button type="button" onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSave} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-700">Question</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.question}
                                        onChange={(e) => setForm({ ...form, question: e.target.value })}
                                        placeholder="e.g. How does EduFlow handle CBC rubric scores?"
                                        className="h-10 w-full px-3.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-slate-700">Category</label>
                                        <input
                                            type="text"
                                            required
                                            value={form.category}
                                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                                            placeholder="e.g. CBC & Academics"
                                            className="h-10 w-full px-3.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-slate-700">Display Order</label>
                                        <input
                                            type="number"
                                            value={form.sort_order}
                                            onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
                                            className="h-10 w-full px-3.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="block text-xs font-bold text-slate-700">Answer</label>
                                    <textarea
                                        rows={4}
                                        required
                                        value={form.answer}
                                        onChange={(e) => setForm({ ...form, answer: e.target.value })}
                                        placeholder="Detailed explanation..."
                                        className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div className="space-y-1">
                                        <label className="block text-xs font-bold text-slate-700">Status</label>
                                        <select
                                            value={form.status}
                                            onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                                            className="h-10 w-full px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                        >
                                            <option value="published">Published</option>
                                            <option value="draft">Draft</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>

                                    <div className="flex items-center gap-2 pt-6">
                                        <input
                                            type="checkbox"
                                            id="featured_on_home"
                                            checked={form.is_featured_on_homepage}
                                            onChange={(e) => setForm({ ...form, is_featured_on_homepage: e.target.checked })}
                                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="featured_on_home" className="text-xs font-bold text-slate-700 cursor-pointer">
                                            Feature on Homepage
                                        </label>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={() => setModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs"
                                    >
                                        {editingFaq ? 'Save Changes' : 'Create Question'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </AppLayout>
    );
}