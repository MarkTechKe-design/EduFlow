import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Plus, Edit2, Trash2, X, Layers, Users, BookOpen, GitBranch } from 'lucide-react';

interface Section {
    id: number;
    name: string;
    capacity: number;
}

interface SchoolClass {
    id: number;
    name: string;
    numeric_name: number;
    capacity: number;
    sections_count?: number;
    subjects_count?: number;
    students_count?: number;
    sections?: Section[];
}

interface Props {
    classes: SchoolClass[];
}

export default function ClassesIndex({ classes = [] }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);

    const [formName, setFormName] = useState('');
    const [formNumeric, setFormNumeric] = useState('');
    const [formCapacity, setFormCapacity] = useState('45');
    const [formSections, setFormSections] = useState<string[]>([]);
    const [newSectionInput, setNewSectionInput] = useState('');
    const [processing, setProcessing] = useState(false);

    const openCreateModal = () => {
        setEditingClass(null);
        setFormName('');
        setFormNumeric('');
        setFormCapacity('45');
        setFormSections(['East', 'West']);
        setNewSectionInput('');
        setIsModalOpen(true);
    };

    const openEditModal = (cls: SchoolClass) => {
        setEditingClass(cls);
        setFormName(cls.name);
        setFormNumeric(cls.numeric_name !== null && cls.numeric_name !== undefined ? String(cls.numeric_name) : '');
        setFormCapacity(cls.capacity ? String(cls.capacity) : '45');
        setFormSections(cls.sections ? cls.sections.map((s) => s.name) : []);
        setNewSectionInput('');
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingClass(null);
    };

    const handleAddSection = () => {
        const trimmed = newSectionInput.trim();
        if (trimmed && !formSections.includes(trimmed)) {
            setFormSections([...formSections, trimmed]);
            setNewSectionInput('');
        }
    };

    const handleRemoveSection = (secToRemove: string) => {
        setFormSections(formSections.filter((s) => s !== secToRemove));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);

        const payload = {
            name: formName,
            numeric_name: formNumeric ? parseInt(formNumeric, 10) : 0,
            capacity: formCapacity ? parseInt(formCapacity, 10) : 45,
            sections: formSections,
        };

        if (editingClass) {
            router.put(`/school/classes/${editingClass.id}`, payload, {
                onSuccess: () => {
                    setProcessing(false);
                    closeModal();
                },
                onError: () => setProcessing(false),
            });
        } else {
            router.post('/school/classes', payload, {
                onSuccess: () => {
                    setProcessing(false);
                    closeModal();
                },
                onError: () => setProcessing(false),
            });
        }
    };

    const handleDelete = (cls: SchoolClass) => {
        if (confirm(`Are you sure you want to delete '${cls.name}'?`)) {
            router.delete(`/school/classes/${cls.id}`);
        }
    };

    return (
        <AppLayout>
            <Head title="Class & Grade Management" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Academic Classes & Levels</h1>
                        <p className="text-sm text-slate-500">Manage school classes, associated streams/sections, and student capacities.</p>
                    </div>

                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                    >
                        <Plus className="h-4 w-4" />
                        Add Class
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-3.5">#</th>
                                    <th className="px-6 py-3.5">Class Name</th>
                                    <th className="px-6 py-3.5">Sections / Streams</th>
                                    <th className="px-6 py-3.5">Subjects</th>
                                    <th className="px-6 py-3.5">Capacity</th>
                                    <th className="px-6 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {classes.length > 0 ? (
                                    classes.map((cls, idx) => (
                                        <tr key={cls.id} className="transition hover:bg-slate-50/70">
                                            <td className="px-6 py-4 font-mono text-xs text-slate-400">{cls.numeric_name || idx + 1}</td>
                                            <td className="px-6 py-4 font-bold text-slate-900">{cls.name}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    {cls.sections && cls.sections.length > 0 ? (
                                                        cls.sections.map((s) => (
                                                            <span
                                                                key={s.id}
                                                                className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                                                            >
                                                                {s.name}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-slate-400">0 streams</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">
                                                {cls.subjects_count !== undefined ? cls.subjects_count : 0}
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-slate-600">{cls.capacity}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(cls)}
                                                        className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                                        title="Edit Class"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(cls)}
                                                        className="rounded p-1.5 text-rose-400 transition hover:bg-rose-50 hover:text-rose-600"
                                                        title="Delete Class"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400">
                                            No academic classes found. Click "Add Class" to get started.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal: Create / Edit Class with Dynamic Streams */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl transition-all">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h2 className="text-lg font-bold text-slate-900">
                                {editingClass ? 'Edit Class' : 'Add New Class'}
                            </h2>
                            <button onClick={closeModal} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                            {/* Class Name */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700">
                                    Class Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    placeholder="e.g. Grade 4 or Form 2"
                                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Order & Capacity */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700">Order (numeric)</label>
                                    <input
                                        type="number"
                                        value={formNumeric}
                                        onChange={(e) => setFormNumeric(e.target.value)}
                                        placeholder="e.g. 4"
                                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700">Capacity</label>
                                    <input
                                        type="number"
                                        value={formCapacity}
                                        onChange={(e) => setFormCapacity(e.target.value)}
                                        placeholder="e.g. 45"
                                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Sections / Streams Manager Inside Modal */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-700">Sections / Streams</label>
                                <p className="text-[11px] text-slate-400">Define streams for this class (e.g. East, West, Elephant, Simba, A, B)</p>

                                {/* Tags List */}
                                <div className="mt-2 flex flex-wrap gap-1.5 min-h-[32px] p-2 rounded-lg bg-slate-50 border border-slate-200">
                                    {formSections.length > 0 ? (
                                        formSections.map((sec) => (
                                            <span
                                                key={sec}
                                                className="inline-flex items-center gap-1 rounded-md bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-800"
                                            >
                                                {sec}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveSection(sec)}
                                                    className="rounded-full text-indigo-500 hover:bg-indigo-200 hover:text-indigo-900"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-slate-400 py-0.5">No streams added yet.</span>
                                    )}
                                </div>

                                {/* Add Stream Input */}
                                <div className="mt-2 flex gap-2">
                                    <input
                                        type="text"
                                        value={newSectionInput}
                                        onChange={(e) => setNewSectionInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleAddSection();
                                            }
                                        }}
                                        placeholder="Add stream name (e.g. Elephant)"
                                        className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddSection}
                                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                                    >
                                        + Add
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}