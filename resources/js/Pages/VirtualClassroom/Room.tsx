import React, { useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import {
    Video, ArrowLeft, ExternalLink, ShieldCheck,
    Clock, LogOut
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
    const [isSessionActive, setIsSessionActive] = useState(false);
    const windowRef = useRef<Window | null>(null);

    const handleLaunch = () => {
        const win = window.open(
            client.meetingUrl,
            `EduFlow_Meeting_${session.id}`,
            'width=1280,height=800,menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes'
        );

        windowRef.current = win;
        setIsSessionActive(true);

        const pollTimer = setInterval(() => {
            if (win && win.closed) {
                clearInterval(pollTimer);
                setIsSessionActive(false);
                windowRef.current = null;
            }
        }, 1000);
    };

    const handleReturn = () => {
        if (windowRef.current && !windowRef.current.closed) {
            windowRef.current.close();
        }
        router.visit(client.returnUrl);
    };

    const handleEndSession = () => {
        if (window.confirm('Terminate this virtual session for all active participants?')) {
            if (windowRef.current && !windowRef.current.closed) {
                windowRef.current.close();
            }
            router.post(`/school/online-classes/${session.id}/end`, {}, {
                onSuccess: () => router.visit(client.returnUrl),
            });
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col antialiased">
            <Head title={`Session: ${session.title}`} />

            {/* Top Navigation */}
            <header className="h-14 shrink-0 border-b border-slate-800 bg-slate-950 px-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={handleReturn}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>Return to Dashboard</span>
                    </button>

                    <div className="h-4 w-px bg-slate-800" />
                    <span className="text-xs font-semibold text-slate-300">{session.audience_label}</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-800">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>Verified Tenant Channel</span>
                    </div>

                    {client.isHost && (
                        <button
                            type="button"
                            onClick={handleEndSession}
                            className="inline-flex items-center gap-1.5 rounded bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-800 transition"
                        >
                            <LogOut className="h-3.5 w-3.5" />
                            <span>End Session</span>
                        </button>
                    )}
                </div>
            </header>

            {/* Main Launch Card */}
            <main className="flex-1 flex items-center justify-center p-6">
                <div className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-xl p-8 space-y-6">
                    
                    <div className="space-y-2 border-b border-slate-800/80 pb-5">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            {session.school_name}
                        </div>
                        <h1 className="text-xl font-bold text-white tracking-tight">
                            {session.title}
                        </h1>
                        <p className="text-xs text-slate-400">
                            {session.description || `Organized by ${session.host_name}. Session is protected under tenant encryption.`}
                        </p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                            <span className="text-[10px] font-medium text-slate-400 uppercase">Category</span>
                            <p className="text-xs font-semibold text-white truncate mt-0.5">{session.audience_label}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                            <span className="text-[10px] font-medium text-slate-400 uppercase">Organizer</span>
                            <p className="text-xs font-semibold text-white truncate mt-0.5">{session.host_name}</p>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                            <span className="text-[10px] font-medium text-slate-400 uppercase">Duration</span>
                            <p className="text-xs font-semibold text-slate-200 truncate mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{session.duration_minutes} Mins</span>
                            </p>
                        </div>
                    </div>

                    {/* Active State vs Launch Button */}
                    {isSessionActive ? (
                        <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs font-semibold text-white">Meeting window is currently running</span>
                            </div>
                            <p className="text-xs text-slate-400">
                                Audio, video, and screen-sharing are active in the detached window.
                            </p>
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={handleLaunch}
                                    className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
                                >
                                    Focus Meeting Window
                                </button>
                                <button
                                    type="button"
                                    onClick={handleReturn}
                                    className="px-3.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-800 text-xs font-semibold text-white transition"
                                >
                                    Conclude & Exit
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3 pt-2">
                            <button
                                type="button"
                                onClick={handleLaunch}
                                className="w-full py-3 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow transition"
                            >
                                <Video className="w-4 h-4" />
                                <span>Launch Meeting Session</span>
                                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                            </button>

                            <p className="text-[11px] text-center text-slate-500">
                                Authenticated as <span className="text-slate-300 font-medium">{client.displayName}</span>
                            </p>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}