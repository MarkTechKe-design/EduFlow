import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps, PaginatedData } from '@/Types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { formatDate } from '@/lib/utils';
import {
    Calendar,
    CheckCircle2,
    Clock,
    ExternalLink,
    Layers,
    Play,
    Plus,
    School,
    Square,
    Trash2,
    Users,
    Video,
    VideoOff
} from 'lucide-react';

interface OnlineClassItem {
    id: number;
    title: string;
    description?: string | null;
    platform: 'jitsi' | 'google_meet' | 'zoom' | 'teams' | 'custom';
    meeting_url?: string | null;
    meeting_id?: string | null;
    passcode?: string | null;
    start_time: string;
    end_time?: string | null;
    status: 'scheduled' | 'live' | 'ended' | 'cancelled';
    school_class?: { id: number; name: string } | null;
    section?: { id: number; name: string } | null;
    subject?: { id: number; name: string } | null;
    teacher?: { id: number; name: string } | null;
}

interface Props extends PageProps {
    classes: PaginatedData<OnlineClassItem>;
    schoolClasses?: Array<{ id: number; name: string }>;
    subjects?: Array<{ id: number; name: string }>;
}

export default function OnlineClassesIndex({ auth, classes, schoolClasses = [], subjects = [] }: Props) {
    const userRoles = auth.user?.roles?.map((r: any) => typeof r === 'string' ? r : r.name) || [];
    
    // Host permissions (Can create, start, end meetings)
    const canHost = userRoles.some((r: string) => ['school-admin', 'principal', 'teacher', 'super-admin'].includes(r));
    
    const [createModalOpen, setCreateModalOpen] = useState(false);

    const form = useForm({
        class_id: '',
        subject_id: '',
        title: '',
        description: '',
        platform: 'google_meet',
        meeting_url: '',
        meeting_id: '',
        passcode: '',
        start_time: '',
        end_time: '',
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/school/online-classes', {
            onSuccess: () => {
                setCreateModalOpen(false);
                form.reset();
            },
        });
    };

    const handleStartMeeting = (id: number) => {
        router.post(`/school/online-classes/${id}/start`);
    };

    const handleEndMeeting = (id: number) => {
        router.post(`/school/online-classes/${id}/end`);
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this scheduled class?')) {
            router.delete(`/school/online-classes/${id}`);
        }
    };

    return (
        <AppLayout header="Virtual Classroom & Live Online Sessions">
            <Head title="Online Classroom - EduFlow" />

            <div className="max-w-7xl mx-auto space-y-6 pb-16">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                            <Video className="w-5 h-5 text-indigo-600" />
                            Live Virtual Classrooms & Distance Learning
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {canHost
                                ? 'Schedule, launch, and manage interactive remote lectures (Google Meet, Zoom, Jitsi).'
                                : 'Join active virtual classes and view your scheduled live sessions.'}
                        </p>
                    </div>

                    {canHost && (
                        <Button
                            onClick={() => setCreateModalOpen(true)}
                            size="sm"
                            className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                        >
                            <Plus className="w-3.5 h-3.5 mr-1.5" />
                            Schedule Online Class
                        </Button>
                    )}
                </div>

                {/* Class Sessions List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {classes.data && classes.data.length > 0 ? (
                        classes.data.map((c) => {
                            const isLive = c.status === 'live';
                            const isEnded = c.status === 'ended';
                            const joinUrl = c.meeting_url || `/school/classroom/${c.id}`;

                            return (
                                <div
                                    key={c.id}
                                    className={`rounded-xl border p-5 shadow-sm space-y-4 transition-all bg-white dark:bg-slate-900 ${
                                        isLive
                                            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                                            : 'border-slate-200 dark:border-slate-800'
                                    }`}
                                >
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                {isLive ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 animate-pulse">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Live Now
                                                    </span>
                                                ) : isEnded ? (
                                                    <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                        Ended
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 border border-blue-200 dark:border-blue-800">
                                                        Scheduled
                                                    </span>
                                                )}
                                                <span className="text-[11px] font-bold text-slate-500 uppercase font-mono">
                                                    {c.platform.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1.5 line-clamp-1">
                                                {c.title}
                                            </h3>
                                        </div>

                                        {canHost && !isEnded && (
                                            <button
                                                onClick={() => handleDelete(c.id)}
                                                className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                                                title="Delete Class"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Meta Details */}
                                    <div className="text-xs space-y-1.5 text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-slate-500">Class & Stream:</span>
                                            <span className="font-bold text-slate-900 dark:text-slate-200">
                                                {c.school_class?.name || 'All'} {c.section ? `(${c.section.name})` : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-slate-500">Subject:</span>
                                            <span className="font-semibold text-slate-900 dark:text-slate-200">
                                                {c.subject?.name || 'General'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium text-slate-500">Instructor:</span>
                                            <span className="text-slate-700 dark:text-slate-300">
                                                {c.teacher?.name || 'Assigned Staff'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                                            <span className="text-slate-500 flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> Time:
                                            </span>
                                            <span>{formatDate(c.start_time)}</span>
                                        </div>
                                    </div>

                                    {/* Join / Start Action Controls */}
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                                        {/* Students & Parents Join Button */}
                                        <a
                                            href={joinUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={`flex-1 inline-flex items-center justify-center h-8 rounded-lg text-xs font-bold transition-colors ${
                                                isLive
                                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                            }`}
                                        >
                                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                                            {isLive ? 'Join Live Class' : 'Enter Meeting Room'}
                                        </a>

                                        {/* Teacher / Host Controls */}
                                        {canHost && !isEnded && (
                                            <>
                                                {!isLive ? (
                                                    <Button
                                                        onClick={() => handleStartMeeting(c.id)}
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-xs font-semibold text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                                    >
                                                        <Play className="w-3 h-3 mr-1" /> Start
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={() => handleEndMeeting(c.id)}
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50"
                                                    >
                                                        <Square className="w-3 h-3 mr-1" /> End
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                            <VideoOff className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Online Classes Scheduled</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                                {canHost
                                    ? 'Click the "Schedule Online Class" button above to set up interactive video sessions.'
                                    : 'There are no active or scheduled live lectures at this time. Check back later.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* CREATE ONLINE CLASS MODAL (HOSTS ONLY) */}
            {createModalOpen && canHost && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                <Video className="w-4 h-4 text-indigo-600" />
                                Schedule New Online Class
                            </h3>
                            <button onClick={() => setCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
                        </div>

                        <form onSubmit={handleCreate} className="space-y-3 text-xs">
                            <div>
                                <label className="font-bold block mb-1">Session Title:</label>
                                <Input
                                    required
                                    placeholder="e.g. Grade 6 CBC Mathematics - Decimals"
                                    value={form.data.title}
                                    onChange={(e) => form.setData('title', e.target.value)}
                                    className="h-8 text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold block mb-1">Target Class:</label>
                                    <Select value={form.data.class_id} onValueChange={(v) => form.setData('class_id', v)}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Class" /></SelectTrigger>
                                        <SelectContent>
                                            {schoolClasses.map((c) => (
                                                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="font-bold block mb-1">Subject:</label>
                                    <Select value={form.data.subject_id} onValueChange={(v) => form.setData('subject_id', v)}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                                        <SelectContent>
                                            {subjects.map((s) => (
                                                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold block mb-1">Meeting Platform:</label>
                                    <Select value={form.data.platform} onValueChange={(v: any) => form.setData('platform', v)}>
                                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="google_meet">Google Meet</SelectItem>
                                            <SelectItem value="zoom">Zoom</SelectItem>
                                            <SelectItem value="jitsi">Jitsi Meet</SelectItem>
                                            <SelectItem value="teams">Microsoft Teams</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="font-bold block mb-1">Start Date & Time:</label>
                                    <Input
                                        type="datetime-local"
                                        required
                                        value={form.data.start_time}
                                        onChange={(e) => form.setData('start_time', e.target.value)}
                                        className="h-8 text-xs font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="font-bold block mb-1">Meeting Link / URL:</label>
                                <Input
                                    required
                                    placeholder="https://meet.google.com/xyz-abcd-efg or Zoom link"
                                    value={form.data.meeting_url}
                                    onChange={(e) => form.setData('meeting_url', e.target.value)}
                                    className="h-8 text-xs font-mono"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)} size="sm">Cancel</Button>
                                <Button type="submit" disabled={form.processing} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                                    {form.processing ? 'Scheduling...' : 'Save & Publish Session'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}