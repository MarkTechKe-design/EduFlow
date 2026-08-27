import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    ArrowLeft, ShieldCheck, Clock, LogOut,
    Copy, Check, ExternalLink, Maximize2
} from 'lucide-react';

interface SessionData {
    id: number;
    title: string;
    meeting_type: string;
    audience_label: string;
    description?: string;
    status: string;
    scheduled_at: string;
    duration_minutes: number;
    school_name: string;
    class_name?: string;
    section_name?: string;
    subject_name?: string;
    host_name: string;
}

interface ClientData {
    meetingUrl: string;
    roomName: string;
    displayName: string;
    isHost: boolean;
    returnUrl: string;
}

interface Props {
    session: SessionData;
    client: ClientData;
}

export default function VirtualClassroomRoom({ session, client }: Props) {
    const [copied, setCopied] = useState(false);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(client.meetingUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleReturn = () => {
        router.visit(client.returnUrl);
    };

    const handleEndSession = () => {
        if (window.confirm('Terminate this virtual session for all active participants?')) {
            router.post(`/school/online-classes/${session.id}/end`, {}, {
                onSuccess: () => router.visit(client.returnUrl),
            });
        }
    };

    const openInNewTab = () => {
        window.open(client.meetingUrl, '_blank');
    };

    return (
        <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden antialiased">
            <Head title={`Live: ${session.title}`} />

            {/* Top Operational Bar */}
            <header className="h-14 shrink-0 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleReturn}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Dashboard</span>
                    </button>

                    <div className="h-4 w-px bg-slate-800" />

                    <div>
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <h1 className="text-xs font-bold text-white tracking-wide truncate max-w-[200px] md:max-w-md">
                                {session.title}
                            </h1>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">
                            {session.school_name} &bull; {session.audience_label}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Shareable Link Button */}
                    <button
                        type="button"
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-700/60 bg-indigo-950/60 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/80 transition"
                        title="Copy direct meeting link to share with parents/teachers"
                    >
                        {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copied ? 'Link Copied!' : 'Copy Share Link'}</span>
                    </button>

                    {/* Pop-out Fullscreen Tab */}
                    <button
                        type="button"
                        onClick={openInNewTab}
                        className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                        title="Open in detached full tab"
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                    </button>

                    <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 font-medium px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-800">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Encrypted</span>
                    </div>

                    {client.isHost && (
                        <button
                            type="button"
                            onClick={handleEndSession}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 px-3 py-1.5 text-xs font-semibold text-white transition shadow-sm"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            <span>End Session</span>
                        </button>
                    )}
                </div>
            </header>

            {/* In-Page Embedded Jitsi Meeting Frame */}
            <main className="flex-1 w-full h-full bg-black relative">
                <iframe
                    src={client.meetingUrl}
                    className="w-full h-full border-0"
                    allow="camera; microphone; display-capture; autoplay; clipboard-write; fullscreen"
                    title={session.title}
                />
            </main>
        </div>
    );
}