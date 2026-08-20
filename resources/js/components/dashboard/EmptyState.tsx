import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
}

export function EmptyState({ title, description, icon: Icon = Inbox }: EmptyStateProps) {
    return (
        <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-8 text-center">
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            {description && <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">{description}</p>}
        </div>
    );
}
