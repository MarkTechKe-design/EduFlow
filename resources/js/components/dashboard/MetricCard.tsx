import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import React from 'react';

interface Props {
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    trend?: {
        value: string | number;
        label?: string;
        direction: 'up' | 'down' | 'neutral';
    };
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
    badge?: string;
    onClick?: () => void;
}

export default function MetricCard({
    title,
    value,
    description,
    icon: Icon,
    trend,
    variant = 'default',
    badge,
    onClick,
}: Props) {
    const variantStyles = {
        default: 'bg-white border-slate-200/90 text-slate-900',
        primary: 'bg-indigo-900/10 border-indigo-200 text-indigo-950',
        success: 'bg-emerald-900/10 border-emerald-200 text-emerald-950',
        warning: 'bg-amber-900/10 border-amber-200 text-amber-950',
        danger: 'bg-rose-900/10 border-rose-200 text-rose-950',
    };

    const iconStyles = {
        default: 'bg-slate-100 text-slate-700',
        primary: 'bg-indigo-600 text-white',
        success: 'bg-emerald-600 text-white',
        warning: 'bg-amber-500 text-white',
        danger: 'bg-rose-600 text-white',
    };

    return (
        <div
            onClick={onClick}
            className={`relative rounded-2xl border p-5 shadow-xs transition-all duration-200 hover:shadow-md ${variantStyles[variant]} ${
                onClick ? 'cursor-pointer hover:border-slate-300' : ''
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {title}
                    </span>
                    <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950">
                        {value}
                    </div>
                </div>

                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${iconStyles[variant]}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>

            {(description || trend || badge) && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                    {trend && (
                        <div className="flex items-center gap-1 font-semibold">
                            {trend.direction === 'up' && (
                                <span className="inline-flex items-center gap-0.5 text-emerald-600">
                                    <TrendingUp className="w-3.5 h-3.5" />
                                    <span>+{trend.value}</span>
                                </span>
                            )}
                            {trend.direction === 'down' && (
                                <span className="inline-flex items-center gap-0.5 text-rose-600">
                                    <TrendingDown className="w-3.5 h-3.5" />
                                    <span>-{trend.value}</span>
                                </span>
                            )}
                            {trend.direction === 'neutral' && (
                                <span className="inline-flex items-center gap-0.5 text-slate-500">
                                    <Minus className="w-3.5 h-3.5" />
                                    <span>{trend.value}</span>
                                </span>
                            )}
                            {trend.label && <span className="text-slate-400 font-normal">{trend.label}</span>}
                        </div>
                    )}

                    {description && !trend && (
                        <span className="text-slate-500 truncate">{description}</span>
                    )}

                    {badge && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                            {badge}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}