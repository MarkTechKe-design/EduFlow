import { useState } from 'react';
import axios from 'axios';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, Download, FileUp, Upload, XCircle } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ImportRow = { row_index: number; first_name: string; last_name: string; admission_no?: string | null; class_name?: string | null; section_name?: string | null; error?: string | null; };
type Preview = { total_rows: number; valid_count: number; invalid_count: number; valid_rows: ImportRow[]; invalid_rows: ImportRow[]; errors?: string[]; };

export default function ImportStudents() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<Preview | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const previewFile = async () => {
        if (!file) return;
        setLoading(true); setError(null); setPreview(null);
        try {
            const body = new FormData(); body.append('file', file);
            const response = await axios.post<Preview>('/school/students/import/preview', body);
            setPreview(response.data);
            if (response.data.errors?.length) setError(response.data.errors.join(' '));
        } catch (exception: any) { setError(exception.response?.data?.message ?? 'We could not read that CSV file.'); }
        finally { setLoading(false); }
    };
    const commitImport = () => {
        if (!preview?.valid_rows.length) return;
        setSubmitting(true);
        router.post('/school/students/import/process', { records: preview.valid_rows }, { onFinish: () => setSubmitting(false) });
    };
    return <AppLayout breadcrumbs={[{ label: 'Students', href: '/school/students' }, { label: 'Import students' }]}>
        <Head title="Import Students" />
        <div className="mx-auto max-w-4xl space-y-6">
            <div className="flex items-start gap-3"><Button variant="ghost" size="icon" asChild><Link href="/school/students"><ArrowLeft className="h-4 w-4" /></Link></Button><div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Import students</h1><p className="mt-1 text-sm text-slate-500">Preview your CSV before adding or updating learner records.</p></div></div>
            <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileUp className="h-4 w-4 text-indigo-600" /> CSV import</CardTitle><CardDescription>Existing admission numbers are updated within this school; new class and stream labels are added to this school only.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-medium text-slate-800">Student import template</p><p className="mt-1 text-xs text-slate-500">CSV only · maximum 10 MB · required: student name</p></div><a href="/school/students/import/template"><Button variant="outline" size="sm"><Download className="mr-2 h-4 w-4" /> Download template</Button></a></div><input type="file" accept=".csv,text/csv" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="block w-full rounded-lg border border-slate-200 bg-white p-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-indigo-700" />{file && <p className="text-xs text-slate-500">Selected: {file.name}</p>}{error && <p className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}<div className="flex justify-end"><Button onClick={previewFile} disabled={!file || loading}><Upload className="mr-2 h-4 w-4" /> {loading ? 'Reading CSV…' : 'Preview import'}</Button></div></CardContent></Card>
            {preview && <Card><CardHeader><CardTitle className="text-base">Import preview</CardTitle><CardDescription>{preview.total_rows} rows read. Review invalid rows before continuing.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="grid gap-3 sm:grid-cols-3"><Summary label="Rows read" value={preview.total_rows} /><Summary label="Ready to import" value={preview.valid_count} tone="green" /><Summary label="Need attention" value={preview.invalid_count} tone={preview.invalid_count ? 'red' : 'green'} /></div>{preview.invalid_rows.length > 0 && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4"><p className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-800"><XCircle className="h-4 w-4" /> Invalid rows</p><ul className="space-y-1 text-xs text-rose-700">{preview.invalid_rows.slice(0, 10).map((row) => <li key={row.row_index}>Row {row.row_index}: {row.error}</li>)}</ul></div>}{preview.valid_rows.length > 0 && <div className="overflow-hidden rounded-xl border border-slate-200"><div className="max-h-80 overflow-auto"><table className="w-full text-left text-sm"><thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Admission no.</th><th className="px-4 py-3">Class</th><th className="px-4 py-3">Stream</th></tr></thead><tbody className="divide-y divide-slate-100">{preview.valid_rows.map((row) => <tr key={row.row_index}><td className="px-4 py-3 font-medium">{row.first_name} {row.last_name}</td><td className="px-4 py-3 font-mono text-xs">{row.admission_no || 'Auto-generated'}</td><td className="px-4 py-3">{row.class_name || 'Unassigned'}</td><td className="px-4 py-3">{row.section_name || '—'}</td></tr>)}</tbody></table></div></div>}<div className="flex justify-end"><Button onClick={commitImport} disabled={!preview.valid_rows.length || submitting}><CheckCircle2 className="mr-2 h-4 w-4" /> {submitting ? 'Importing…' : 'Import selected learners'}</Button></div></CardContent></Card>}
        </div>
    </AppLayout>;
}
function Summary({ label, value, tone = 'slate' }: { label: string; value: number; tone?: 'slate' | 'green' | 'red' }) {
    const tones = { slate: 'bg-slate-50 text-slate-900', green: 'bg-emerald-50 text-emerald-700', red: 'bg-rose-50 text-rose-700' };
    return <div className={'rounded-xl p-4 ' + tones[tone]}><p className="text-xs font-medium">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div>;
}