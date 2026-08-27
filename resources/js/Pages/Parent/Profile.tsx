import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { User, Mail, Shield, School, Users } from 'lucide-react';
import type { PageProps } from '@/types';

export default function ParentProfile({ auth, user, children = [] }: PageProps<{ user: any; children: any[] }>) {
    const parent = user || auth?.user;

    return (
        <AppLayout header="Parent / Guardian Profile">
            <Head title="My Profile - Parent Portal" />
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                        <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 font-bold text-xl">
                            {parent?.name?.[0]?.toUpperCase() || 'P'}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{parent?.name}</h2>
                            <p className="text-xs text-slate-500">{parent?.email}</p>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                                <Shield className="w-3 h-3" /> Registered Guardian
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
                                <Users className="w-3.5 h-3.5" /> Linked Learners
                            </span>
                            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                                {children.length} Enrolled Ward(s)
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}