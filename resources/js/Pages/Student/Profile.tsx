import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { User, Mail, Shield, School, BookOpen } from 'lucide-react';
import type { PageProps } from '@/types';

export default function StudentProfile({ auth, student }: PageProps<{ student: any }>) {
    const user = student || auth?.user;

    return (
        <AppLayout header="My Academic Profile">
            <Head title="My Profile - EduFlow Cockpit" />

            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
                    <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                        <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 font-bold text-xl">
                            {user?.name?.[0]?.toUpperCase() || 'S'}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{user?.name}</h2>
                            <p className="text-xs text-slate-500">{user?.email}</p>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                                <Shield className="w-3 h-3" /> Student Account
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <School className="w-3.5 h-3.5" /> Institution
                            </span>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-1">
                                {auth?.school?.name || 'EduFlow School'}
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5" /> Status
                            </span>
                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                Active &bull; Enrolled
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}