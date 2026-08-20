import { Link } from '@inertiajs/react';
import { LucideIcon, ArrowRight, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import React from 'react';

export interface ActionItem {
    id: string | number;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    href?: string;
    badge?: string;
    timestamp?: string;
}

interface Props {
    title?: string;
    items: ActionItem[];
    emptyText?: string;
}

export default function ActionQueue({
    title = 'Action Required',
    items = [],
    emptyText = 'All operational queues are clear.',
}: Props) {
    const priorityStyles = {
        high: 'bg-rose-50 border-rose-200 text-rose-800',
        medium: 'bg-amber-50 border-amber-200 text-amber-800',
        low: 'bg-slate-50 border-slate-200 text-slate-800',
    };

    const priorityIndicator = {
        high: 'bg-rose-500',
        medium: 'bg-amber-500',
        low: 'bg-slate-400',
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <h3 className="text-base font-bold text-slate-950 tracking-tight">{title}</h3>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {items.length} Pending
                </span>
            </div>

            {items.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl space-y-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto" />
                    <p className="text-xs text-slate-500">{emptyText}</p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {items.map((item) => {
                        const Content = (
                            <div
                                key={item.id}
                                className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 transition-all hover:border-slate-300 ${priorityStyles[item.priority]}`}
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${priorityIndicator[item.priority]}`} />
                                        <h4 className="text-xs font-bold text-slate-900 leading-snug">{item.title}</h4>
                                    </div>
                                    <p className="text-xs text-slate-600 pl-4">{item.description}</p>
                                </div>

                                {item.href && (
                                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                                )}
                            </div>
                        );

                        return item.href ? (
                            <Link key={item.id} href={item.href} className="block focus:outline-none">
                                {Content}
                            </Link>
                        ) : (
                            Content
                        );
                    })}
                </div>
            )}
        </div>
    );
}