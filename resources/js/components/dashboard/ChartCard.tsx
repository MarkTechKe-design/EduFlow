import React, { ReactNode } from 'react';

interface Props {
    title: string;
    subtitle?: string;
    action?: ReactNode;
    children: ReactNode;
    minHeight?: number;
    isEmpty?: boolean;
    emptyMessage?: string;
    isLoading?: boolean;
}

export default function ChartCard({
    title,
    subtitle,
    action,
    children,
    minHeight = 280,
    isEmpty = false,
    emptyMessage = 'No chart telemetry available for the selected period.',
    isLoading = false,
}: Props) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="space-y-0.5">
                    <h3 className="text-base font-bold text-slate-950 tracking-tight">{title}</h3>
                    {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
                </div>
                {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
            </div>

            <div className="w-full relative" style={{ minHeight: `${minHeight}px` }}>
                {isLoading ? (
                    <div className="w-full h-full flex flex-col items-center justify-center space-y-3 py-12">
                        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                        <span className="text-xs font-semibold text-slate-400">Loading dataset...</span>
                    </div>
                ) : isEmpty ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-xl">
                        <p className="text-xs text-slate-500 max-w-xs">{emptyMessage}</p>
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}