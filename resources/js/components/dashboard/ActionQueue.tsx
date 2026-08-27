import { Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
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
        high:
            'bg-rose-500/10 border-rose-200/90 text-rose-950 dark:bg-rose-950/25 dark:border-rose-900/50 dark:text-rose-100 hover:border-rose-300 dark:hover:border-rose-800',
        medium:
            'bg-amber-500/10 border-amber-200/90 text-amber-950 dark:bg-amber-950/25 dark:border-amber-900/50 dark:text-amber-100 hover:border-amber-300 dark:hover:border-amber-800',
        low:
            'bg-muted/40 border-border/80 text-foreground hover:border-border dark:bg-muted/20',
    };

    const priorityIndicator = {
        high: 'bg-rose-500',
        medium: 'bg-amber-500',
        low: 'bg-muted-foreground/60',
    };

    return (
        <div className="bg-card text-card-foreground rounded-2xl border border-border/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div
                        className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0"
                        aria-hidden="true"
                    />
                    <h3 className="text-base font-bold text-foreground tracking-tight">
                        {title}
                    </h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {items.length} Pending
                </span>
            </div>

            {items.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-border rounded-xl space-y-2 bg-muted/20">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500 dark:text-emerald-400 mx-auto" aria-hidden="true" />
                    <p className="text-xs text-muted-foreground">{emptyText}</p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {items.map((item) => {
                        const contentNode = (
                            <div
                                className={`group p-3.5 sm:p-4 rounded-xl border flex items-start justify-between gap-3 transition-all duration-150 min-h-[44px] ${
                                    priorityStyles[item.priority]
                                }`}
                            >
                                <div className="space-y-1 min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`w-2 h-2 rounded-full shrink-0 ${
                                                priorityIndicator[item.priority]
                                            }`}
                                            aria-hidden="true"
                                        />
                                        <h4 className="text-xs font-bold leading-snug truncate">
                                            {item.title}
                                        </h4>
                                    </div>
                                    <p className="text-xs text-muted-foreground pl-4 leading-relaxed line-clamp-2">
                                        {item.description}
                                    </p>
                                </div>

                                {item.href && (
                                    <ArrowRight
                                        className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 transition-transform duration-150 group-hover:translate-x-0.5"
                                        aria-hidden="true"
                                    />
                                )}
                            </div>
                        );

                        return item.href ? (
                            <Link
                                key={item.id}
                                href={item.href}
                                className="block rounded-xl focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                {contentNode}
                            </Link>
                        ) : (
                            <div key={item.id}>{contentNode}</div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}