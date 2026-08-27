import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/Components/ui/dialog';
import {
    Mail,
    Plus,
    Pencil,
    FileText,
    CheckCircle2,
    XCircle,
    Copy,
    Tag
} from 'lucide-react';

interface EmailTemplate {
    id: number;
    name: string;
    slug: string;
    subject: string;
    body: string;
    variables?: string[];
    is_active: boolean;
}

interface Props {
    templates: EmailTemplate[];
}

const emptyForm = {
    name: '',
    slug: '',
    subject: '',
    body: '',
    variables_raw: '',
    is_active: true,
};

export default function EmailTemplates({ templates }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<EmailTemplate | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({ ...emptyForm });

    function openCreate() {
        reset();
        setEditing(null);
        setOpen(true);
    }

    function openEdit(t: EmailTemplate) {
        setEditing(t);
        setData({
            name: t.name,
            slug: t.slug,
            subject: t.subject,
            body: t.body,
            variables_raw: (t.variables ?? []).join(', '),
            is_active: t.is_active,
        });
        setOpen(true);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        const payload = {
            name: data.name,
            slug: data.slug,
            subject: data.subject,
            body: data.body,
            variables: data.variables_raw
                ? data.variables_raw.split(',').map((v) => v.trim()).filter(Boolean)
                : [],
            is_active: data.is_active,
        };

        if (editing) {
            put(`/school/communication/email-templates/${editing.id}`, {
                ...payload,
                onSuccess: () => {
                    reset();
                    setOpen(false);
                },
            });
        } else {
            post('/school/communication/email-templates', {
                ...payload,
                onSuccess: () => {
                    reset();
                    setOpen(false);
                },
            });
        }
    }

    function insertVariable(variableKey: string) {
        setData('body', data.body + ` {{${variableKey}}}`);
    }

    return (
        <AppLayout header="Institutional Email Templates">
            <div className="max-w-6xl space-y-6 pb-16">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Mail className="w-5 h-5 text-emerald-600" />
                            <span>Institutional Communication Templates</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Standardized email notifications for CBC performance releases, fee balances, term circulars, and attendance alerts.
                        </p>
                    </div>

                    <Button
                        type="button"
                        onClick={openCreate}
                        className="h-10 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl flex items-center gap-2 shadow-2xs"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add New Template</span>
                    </Button>
                </div>

                {/* Templates Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {templates.map((t) => (
                        <Card
                            key={t.id}
                            className={`rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between transition-all ${
                                !t.is_active ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/50' : 'bg-white dark:bg-slate-900'
                            }`}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <CardTitle className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                                            {t.name}
                                        </CardTitle>
                                        <span className="text-[10px] font-mono text-slate-400 mt-0.5 block">
                                            {t.slug}
                                        </span>
                                    </div>
                                    <span
                                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                            t.is_active
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                        }`}
                                    >
                                        {t.is_active ? 'Active' : 'Disabled'}
                                    </span>
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                                        Subject Header
                                    </span>
                                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                                        {t.subject}
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                        Message Preview
                                    </span>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed whitespace-pre-line font-sans">
                                        {t.body}
                                    </p>
                                </div>

                                {t.variables && t.variables.length > 0 && (
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {t.variables.slice(0, 4).map((v) => (
                                                <span
                                                    key={v}
                                                    className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                                >
                                                    {`{{${v}}}`}
                                                </span>
                                            ))}
                                            {t.variables.length > 4 && (
                                                <span className="text-[10px] text-slate-400 font-bold">
                                                    +{t.variables.length - 4} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => openEdit(t)}
                                        className="w-full text-xs font-bold h-8 rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                        <span>Edit Template</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Edit / Create Modal Dialog */}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="sm:max-w-2xl rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
                                {editing ? 'Edit Communication Template' : 'Create Communication Template'}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={submit} className="space-y-4 pt-2">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs font-bold">Template Title *</Label>
                                    <Input
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g. CBC Term Assessment Report Release"
                                        className="h-9 text-xs mt-1"
                                    />
                                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">System Identifier (Slug) *</Label>
                                    <Input
                                        value={data.slug}
                                        onChange={(e) => setData('slug', e.target.value)}
                                        placeholder="e.g. cbc-assessment-report"
                                        className="h-9 text-xs mt-1 font-mono"
                                    />
                                    {errors.slug && <p className="text-xs text-red-500 mt-1">{errors.slug}</p>}
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Subject Line *</Label>
                                <Input
                                    value={data.subject}
                                    onChange={(e) => setData('subject', e.target.value)}
                                    placeholder="e.g. {{school_name}} — CBC Assessment Report for {{student_name}}"
                                    className="h-9 text-xs mt-1"
                                />
                                {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <Label className="text-xs font-bold">Email Message Body *</Label>
                                    <span className="text-[10px] text-slate-400">Plain text with variable tokens</span>
                                </div>
                                <Textarea
                                    rows={8}
                                    value={data.body}
                                    onChange={(e) => setData('body', e.target.value)}
                                    placeholder="Write formal institutional body text here..."
                                    className="text-xs font-mono resize-none leading-relaxed"
                                />
                                {errors.body && <p className="text-xs text-red-500 mt-1">{errors.body}</p>}
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Variables (Comma-Separated)</Label>
                                <Input
                                    value={data.variables_raw}
                                    onChange={(e) => setData('variables_raw', e.target.value)}
                                    placeholder="student_name, admission_no, term, outstanding_balance, paybill_no"
                                    className="h-9 text-xs mt-1 font-mono"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">
                                    Tokens will be replaced automatically upon dispatch.
                                </p>
                            </div>

                            <DialogFooter className="gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    className="h-9 text-xs rounded-xl"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
                                >
                                    {editing ? 'Save Changes' : 'Create Template'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}