import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    label: string;
    value: string | number;
    hint?: string;
    icon: LucideIcon;
    tone?: 'teal' | 'violet' | 'sky' | 'amber' | 'rose' | 'emerald';
    href?: string;
}

const tones = {
    teal: 'bg-teal-500/10 text-teal-700 ring-teal-500/15 dark:text-teal-300',
    violet: 'bg-violet-500/10 text-violet-700 ring-violet-500/15 dark:text-violet-300',
    sky: 'bg-sky-500/10 text-sky-700 ring-sky-500/15 dark:text-sky-300',
    amber: 'bg-amber-500/10 text-amber-700 ring-amber-500/15 dark:text-amber-300',
    rose: 'bg-rose-500/10 text-rose-700 ring-rose-500/15 dark:text-rose-300',
    emerald: 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/15 dark:text-emerald-300',
};

export function StatCard({ label, value, hint, icon: Icon, tone = 'teal', href }: StatCardProps) {
    const content = (
        <div className="group flex h-full items-start justify-between gap-4 rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_2px_rgb(15_23_42/0.04)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_32px_rgb(15_23_42/0.08)]">
            <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
                <p className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{value}</p>
                {hint && <p className="mt-1 truncate text-xs text-muted-foreground">{hint}</p>}
            </div>
            <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ring-1', tones[tone])}>
                <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            {href && <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />}
        </div>
    );

    return href ? <Link href={href} className="block h-full">{content}</Link> : content;
}
