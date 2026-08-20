import { Head, router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Trash2, Upload, Image as ImageIcon } from 'lucide-react';

interface MediaItem {
    id: number;
    file_name: string;
    mime_type: string;
    size: number;
    folder?: string | null;
    title?: string | null;
    alt_text?: string | null;
    url: string;
}

interface Props {
    media: { data: MediaItem[]; links: unknown[] };
    filters?: { folder?: string };
}

export default function MediaIndex({ media }: Props) {
    const [fileName, setFileName] = useState('');
    const form = useForm<{ file: File | null; folder: string; title: string; alt_text: string }>({
        file: null,
        folder: 'general',
        title: '',
        alt_text: '',
    });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post('/super-admin/website/media', { forceFormData: true, preserveScroll: true, onSuccess: () => { form.reset(); setFileName(''); } });
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
            <Head title="Website Media" />
            <div className="mx-auto max-w-7xl space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Website Media</h1>
                    <p className="mt-1 text-sm text-slate-500">Upload safe, reusable public website assets.</p>
                </div>

                <form onSubmit={submit} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[1.2fr_.7fr_1fr_1fr_auto] md:items-end">
                    <label className="text-xs font-semibold text-slate-600">File
                        <input type="file" accept=".jpg,.jpeg,.png,.webp,.svg" className="mt-2 block w-full text-sm" onChange={(event) => { const file = event.target.files?.[0] || null; form.setData('file', file); setFileName(file?.name || ''); }} />
                    </label>
                    <label className="text-xs font-semibold text-slate-600">Folder<input value={form.data.folder} onChange={(event) => form.setData('folder', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label>
                    <label className="text-xs font-semibold text-slate-600">Title<input value={form.data.title} onChange={(event) => form.setData('title', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label>
                    <label className="text-xs font-semibold text-slate-600">Alt text<input value={form.data.alt_text} onChange={(event) => form.setData('alt_text', event.target.value)} className="mt-2 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label>
                    <button disabled={form.processing || !form.data.file} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-50"><Upload className="h-4 w-4" />Upload</button>
                    {fileName && <p className="text-xs text-slate-500 md:col-span-full">Selected: {fileName}{form.progress ? ` — ${form.progress.percentage}%` : ''}</p>}
                </form>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {media.data.map((item) => (
                        <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="flex aspect-video items-center justify-center bg-slate-100">{item.mime_type === 'image/svg+xml' || item.mime_type.startsWith('image/') ? <img src={item.url} alt={item.alt_text || item.title || item.file_name} className="h-full w-full object-contain" /> : <ImageIcon className="h-8 w-8 text-slate-400" />}</div>
                            <div className="space-y-2 p-4"><p className="truncate text-sm font-semibold">{item.title || item.file_name}</p><p className="text-xs text-slate-500">{item.folder || 'general'} · {Math.ceil(item.size / 1024)} KB</p><button type="button" onClick={() => window.confirm('Remove this media asset?') && window.location.assign(`/super-admin/website/media/${item.id}`)} className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600"><Trash2 className="h-3.5 w-3.5" />Remove</button></div>
                        </article>
                    ))}
                </div>
            </div>
        </div>
    );
}
