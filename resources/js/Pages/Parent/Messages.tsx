import React from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { MessageSquare, Send } from 'lucide-react';
import type { PageProps } from '@/types';

export default function ParentMessages({ auth, threads = [] }: PageProps<{ threads: any[] }>) {
    return (
        <AppLayout header="Direct School Communications">
            <Head title="Messages - Parent Portal" />
            <div className="max-w-6xl mx-auto space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-4">
                        <MessageSquare className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">Guardian Messaging Center</h2>
                    </div>
                    <p className="text-xs text-slate-500 mb-6">Communicate securely with class teachers, principals, and accounts desk.</p>
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                        <Send className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">No unread inquiries. Direct communication channel is active.</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}