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
        <div className="bg-card text-card-foreground rounded-2xl border border-border/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="space-y-0.5">
                    <h3 className="text-base font-bold text-foreground tracking-tight">
                        {title}
                    </h3>
                    {subtitle && (
                        <p className="text-xs text-muted-foreground">{subtitle}</p>
                    )}
                </div>
                {action && (
                    <div className="flex items-center gap-2 shrink-0">
                        {action}
                    </div>
                )}
            </div>

            <div
                className="w-full relative overflow-hidden"
                style={{ minHeight: `${minHeight}px` }}
            >
                {isLoading ? (
                    <div
                        role="status"
                        aria-label="Loading dataset"
                        className="w-full h-full min-h-[220px] flex flex-col items-center justify-center space-y-3 py-12"
                    >
                        <div className="w-8 h-8 rounded-full border-2 border-teal-600 dark:border-teal-400 border-t-transparent animate-spin" />
                        <span className="text-xs font-semibold text-muted-foreground">
                            Loading dataset...
                        </span>
                    </div>
                ) : isEmpty ? (
                    <div className="w-full h-full min-h-[220px] flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-xl bg-muted/20">
                        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                            {emptyMessage}
                        </p>
                    </div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}