import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface MetricSkeletonProps {
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

export default function MetricSkeleton({ variant = 'default' }: MetricSkeletonProps) {
    const borderStyles = {
        default: 'border-border/80',
        primary: 'border-teal-500/20',
        success: 'border-emerald-500/20',
        warning: 'border-amber-500/20',
        danger: 'border-rose-500/20',
    };

    return (
        <div className={`rounded-2xl border p-5 sm:p-6 bg-card flex flex-col justify-between ${borderStyles[variant]}`}>
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-3 w-24 rounded-md" />
                    <Skeleton className="h-8 w-32 rounded-lg" />
                </div>
                <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
            </div>
            <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                <Skeleton className="h-4 w-16 rounded-full" />
                <Skeleton className="h-3 w-20 rounded-md" />
            </div>
        </div>
    );
}