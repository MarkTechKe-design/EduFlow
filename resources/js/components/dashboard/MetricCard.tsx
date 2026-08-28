import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
    badge?: string;
    description?: string;
    onClick?: () => void;
}

export default function MetricCard({
    title,
    value,
    icon: Icon,
    variant = 'default',
    badge,
    description,
    onClick,
}: MetricCardProps) {
    const variants = {
        default: 'bg-card text-card-foreground border-border/80 hover:border-border',
        primary: 'bg-card text-card-foreground border-teal-500/30 hover:border-teal-500/50 shadow-xs shadow-teal-500/5',
        success: 'bg-card text-card-foreground border-emerald-500/30 hover:border-emerald-500/50 shadow-xs shadow-emerald-500/5',
        warning: 'bg-card text-card-foreground border-amber-500/30 hover:border-amber-500/50 shadow-xs shadow-amber-500/5',
        danger: 'bg-card text-card-foreground border-rose-500/30 hover:border-rose-500/50 shadow-xs shadow-rose-500/5',
    };

    const iconStyles = {
        default: 'bg-muted text-muted-foreground',
        primary: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
        success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
    };

    return (
        <div
            onClick={onClick}
            className={`rounded-2xl border p-5 sm:p-6 transition-all duration-200 flex flex-col justify-between ${
                variants[variant]
            } ${onClick ? 'cursor-pointer tactile-press hover:shadow-md' : ''}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0 flex-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate block">
                        {title}
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground break-words font-mono">
                        {value}
                    </div>
                </div>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconStyles[variant]}`}>
                    <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
            </div>

            {(badge || description) && (
                <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                    {badge && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider bg-muted text-muted-foreground">
                            {badge}
                        </span>
                    )}
                    {description && (
                        <span className="text-muted-foreground text-[11px] truncate ml-auto">
                            {description}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}