import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, CircleAlert, Database, HardDrive, Layers, Server, Wifi } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';

type Check = { name: string; status: 'ok' | 'warning' | 'error'; message: string; details: Record<string, string | number | boolean | null> };

export default function SystemHealth({ checks, generatedAt }: { checks: Check[]; generatedAt: string }) {
    const icons: Record<string, typeof Server> = { Application: Server, Database, Cache: Wifi, Storage: HardDrive, Queue: Layers };
    const tones: Record<string, string> = { ok: 'bg-emerald-50 text-emerald-600', warning: 'bg-amber-50 text-amber-600', error: 'bg-rose-50 text-rose-600' };

    return <AppLayout title="System Health">
        <Head title="System Health" />
        <div className="space-y-6">
            <div className="flex items-start gap-3">
                <Link href="/super-admin/dashboard" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><ArrowLeft className="h-4 w-4" /></Link>
                <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Health</h1><p className="mt-1 text-sm text-slate-500">Measured platform checks. No synthetic telemetry is shown.</p></div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {checks.map((check) => {
                    const Icon = icons[check.name] ?? Server;
                    return <div key={check.name} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="flex items-center justify-between"><div className={'grid h-10 w-10 place-items-center rounded-xl ' + tones[check.status]}><Icon className="h-5 w-5" /></div>{check.status === 'ok' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <CircleAlert className="h-5 w-5 text-amber-600" />}</div>
                        <h2 className="mt-4 font-semibold text-slate-900 dark:text-white">{check.name}</h2><p className="mt-1 text-sm text-slate-500">{check.message}</p>
                        <dl className="mt-4 space-y-1 text-xs text-slate-500">{Object.entries(check.details).map(([key, value]) => <div key={key} className="flex justify-between gap-3"><dt className="capitalize">{key.replaceAll('_', ' ')}</dt><dd className="font-mono text-right">{String(value ?? 'Unavailable')}</dd></div>)}</dl>
                    </div>;
                })}
            </div>
            <p className="text-xs text-slate-400">Checked {new Date(generatedAt).toLocaleString()} · Scheduler, failed-job and error-rate telemetry remain unavailable unless configured.</p>
        </div>
    </AppLayout>;
}