import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import {
    Video, Plus, Radio, Calendar, CheckCircle2,
    X, ExternalLink, Play, AlertCircle, Shield, Users, Briefcase, UserCheck
} from 'lucide-react';

interface SessionItem {
    id: number;
    title: string;
    meeting_type?: string;
    description?: string;
    platform: string;
    scheduled_at: string;
    duration_minutes: number;
    status: 'scheduled' | 'live' | 'completed' | 'cancelled';
    class?: { id: number; name: string };
    section?: { id: number; name: string };
    subject?: { id: number; name: string };
    teacher?: { id: number; name: string };
}

interface Props {
    sessions: { data: SessionItem[] };
    classes: Array<{ id: number; name: string }>;
    subjects: Array<{ id: number; name: string }>;
    teachers: Array<{ id: number; name: string }>;
    metrics: { total: number; live: number; scheduled: number; completed: number };
    can_manage: boolean;
    filters: { status: string; meeting_type: string; class_id: string };
}

const AUDIENCE_OPTIONS = [
    { value: 'classroom', label: 'Academic Class Lesson', context: 'Students & Subject Instructor' },
    { value: 'parent_grade', label: 'Grade-Level Parent Meeting', context: 'Parents of Selected Class/Grade' },
    { value: 'parent_general', label: 'General Parent Assembly / AGM', context: 'All School Parents & Guardians' },
    { value: 'staff', label: 'Staff & Faculty Briefing', context: 'Teaching & Administrative Staff' },
    { value: 'board', label: 'Board of Management (BOM)', context: 'Executive & Governance Board' },
];

export default function OnlineClassesIndex({ sessions, classes, subjects, teachers, metrics, can_manage = false }: Props) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const getInitialDateTime = () => {
        const d = new Date();
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };

    const form = useForm({
        title: '',
        meeting_type: 'classroom',
        class_id: classes[0]?.id ? String(classes[0].id) : '',
        subject_id: subjects[0]?.id ? String(subjects[0].id) : '',
        teacher_id: '',
        scheduled_at: getInitialDateTime(),
        duration_minutes: 45,
        platform: 'jitsi',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/school/online-classes', {
            preserveScroll: true,
            onSuccess: () => {
                setIsModalOpen(false);
                form.reset();
            },
        });
    };

    const getAudienceTag = (item: SessionItem) => {
        switch (item.meeting_type) {
            case 'parent_grade':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-900 border border-amber-200">
                        <UserCheck className="w-3 h-3 text-amber-700" />
                        <span>{item.class?.name || 'Class'} Parents</span>
                    </span>
                );
            case 'parent_general':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-900 border border-emerald-200">
                        <Users className="w-3 h-3 text-emerald-700" />
                        <span>General Parents</span>
                    </span>
                );
            case 'staff':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-900 border border-blue-200">
                        <Briefcase className="w-3 h-3 text-blue-700" />
                        <span>Staff Session</span>
                    </span>
                );
            case 'board':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-purple-50 text-purple-900 border border-purple-200">
                        <Shield className="w-3 h-3 text-purple-700" />
                        <span>Executive Board</span>
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                        <span>{item.class?.name || 'Class'} Session</span>
                    </span>
                );
        }
    };

    return (
        <AppLayout>
            <Head title="Virtual Sessions & Classrooms" />

            <div className="space-y-6 max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Virtual Classrooms & Meetings</h1>
                        <p className="text-xs text-slate-500 mt-1">Manage scheduled lessons, faculty briefings, and parent consultations.</p>
                    </div>

                    {can_manage && (
                        <button
                            type="button"
                            onClick={() => {
                                form.setData('scheduled_at', getInitialDateTime());
                                setIsModalOpen(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 transition"
                        >
                            <Plus className="h-4 w-4" />
                            <span>Schedule Session</span>
                        </button>
                    )}
                </div>

                {/* Metrics Summary */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between text-slate-500">
                            <span className="text-xs font-medium uppercase tracking-wider">Total Scheduled</span>
                            <Calendar className="h-4 w-4 text-slate-400" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-slate-900">{metrics.total}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between text-emerald-700">
                            <span className="text-xs font-medium uppercase tracking-wider">Active Now</span>
                            <Radio className="h-4 w-4 text-emerald-600" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-emerald-700">{metrics.live}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between text-slate-500">
                            <span className="text-xs font-medium uppercase tracking-wider">Upcoming</span>
                            <Video className="h-4 w-4 text-slate-400" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-slate-900">{metrics.scheduled}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between text-slate-500">
                            <span className="text-xs font-medium uppercase tracking-wider">Concluded</span>
                            <CheckCircle2 className="h-4 w-4 text-slate-400" />
                        </div>
                        <p className="mt-2 text-2xl font-bold text-slate-900">{metrics.completed}</p>
                    </div>
                </div>

                {/* Sessions Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                                <tr>
                                    <th className="px-5 py-3">Session Title</th>
                                    <th className="px-5 py-3">Audience Group</th>
                                    <th className="px-5 py-3">Subject / Details</th>
                                    <th className="px-5 py-3">Organizer</th>
                                    <th className="px-5 py-3">Scheduled Time</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {sessions.data.length > 0 ? (
                                    sessions.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50">
                                            <td className="px-5 py-3.5 font-medium text-slate-900">
                                                {item.title}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {getAudienceTag(item)}
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-600">
                                                {item.subject?.name || 'General Session'}
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-700">
                                                {item.teacher?.name || 'School Admin'}
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-600">
                                                {new Date(item.scheduled_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                <span className="text-slate-400 ml-1">({item.duration_minutes}m)</span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                                                    item.status === 'live'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : item.status === 'scheduled'
                                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {item.status === 'live' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {item.status === 'scheduled' && can_manage && (
                                                        <Link
                                                            href={`/school/online-classes/${item.id}/start`}
                                                            method="post"
                                                            as="button"
                                                            className="inline-flex items-center gap-1 rounded bg-emerald-700 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-800 transition"
                                                        >
                                                            <Play className="h-3 w-3" />
                                                            <span>Start</span>
                                                        </Link>
                                                    )}

                                                    {item.status === 'live' && (
                                                        <Link
                                                            href={`/school/classroom/${item.id}`}
                                                            className="inline-flex items-center gap-1 rounded bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white hover:bg-slate-800 transition"
                                                        >
                                                            <ExternalLink className="h-3 w-3" />
                                                            <span>Join Session</span>
                                                        </Link>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-slate-400">
                                            No active or scheduled sessions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Scheduling Modal */}
            {isModalOpen && can_manage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl border border-slate-200">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h2 className="text-sm font-bold text-slate-900">Schedule Virtual Session</h2>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-100 text-slate-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {Object.keys(form.errors).length > 0 && (
                            <div className="mt-3 p-3 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                                <span>{Object.values(form.errors)[0]}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700">Target Audience</label>
                                <select
                                    value={form.data.meeting_type}
                                    onChange={(e) => form.setData('meeting_type', e.target.value)}
                                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-slate-800"
                                >
                                    {AUDIENCE_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label} — ({opt.context})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700">Session Title</label>
                                <input
                                    type="text"
                                    required
                                    value={form.data.title}
                                    onChange={(e) => form.setData('title', e.target.value)}
                                    placeholder="e.g. Form 2 Mathematics: Quadratic Equations"
                                    className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:border-slate-800"
                                />
                            </div>

                            {['classroom', 'parent_grade'].includes(form.data.meeting_type) && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className={form.data.meeting_type === 'parent_grade' ? 'col-span-2' : ''}>
                                        <label className="block text-xs font-semibold text-slate-700">Target Grade / Class</label>
                                        <select
                                            value={form.data.class_id}
                                            onChange={(e) => form.setData('class_id', e.target.value)}
                                            className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-xs text-slate-800"
                                        >
                                            <option value="">Select Grade</option>
                                            {classes.map((c) => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {form.data.meeting_type === 'classroom' && (
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700">Subject</label>
                                            <select
                                                value={form.data.subject_id}
                                                onChange={(e) => form.setData('subject_id', e.target.value)}
                                                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-xs text-slate-800"
                                            >
                                                <option value="">Select Subject</option>
                                                {subjects.map((s) => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700">Scheduled Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={form.data.scheduled_at}
                                        onChange={(e) => form.setData('scheduled_at', e.target.value)}
                                        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-xs text-slate-800"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700">Duration (Minutes)</label>
                                    <input
                                        type="number"
                                        value={form.data.duration_minutes}
                                        onChange={(e) => form.setData('duration_minutes', parseInt(e.target.value, 10) || 40)}
                                        className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-xs text-slate-800"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="rounded border border-slate-300 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="rounded bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                                >
                                    {form.processing ? 'Scheduling...' : 'Confirm & Schedule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}