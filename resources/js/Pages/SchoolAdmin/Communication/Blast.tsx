import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import {
    MessageSquare,
    Mail,
    Info,
    Send,
    Radio,
    Users,
    Layers,
    Clock,
    CheckCircle
} from 'lucide-react';

interface SchoolClass {
    id: number;
    name: string;
}

interface Props {
    classes: SchoolClass[];
}

export default function Blast({ classes }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        channel: 'sms',
        audience: 'all_parents',
        class_id: '',
        subject: '',
        message: '',
    });

    // Compute GSM SMS units (160 characters for 1 part; 153 characters per part for multipart)
    const smsStats = useMemo(() => {
        const len = data.message.length;
        if (len === 0) return { chars: 0, parts: 0, remaining: 160 };
        if (len <= 160) {
            return { chars: len, parts: 1, remaining: 160 - len };
        }
        const parts = Math.ceil(len / 153);
        const remaining = parts * 153 - len;
        return { chars: len, parts, remaining };
    }, [data.message]);

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/school/communication/blast', {
            onSuccess: () => reset('message', 'subject'),
        });
    }

    return (
        <AppLayout header="Mass Communications & Broadcast Engine">
            <div className="max-w-3xl space-y-6 pb-16">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Radio className="w-5 h-5 text-emerald-600" />
                        <span>SMS & Email Broadcast Dispatch</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Dispatch instant notifications to parents, guardians, students, or staff via local bulk SMS and SMTP relays.
                    </p>
                </div>

                <div className="flex gap-2.5 p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-800 dark:text-blue-300">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                        Bulk dispatches are queued in asynchronous background workers. SMS targeting parents automatically resolves primary guardians and active student emergency phone numbers.
                    </span>
                </div>

                <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xs">
                    <CardHeader>
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                            Compose Broadcast Message
                        </CardTitle>
                        <CardDescription className="text-xs">
                            Select dispatch medium and specify recipient group filters.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-5">
                            {/* Channel Selector */}
                            <div>
                                <Label className="text-xs font-bold">Dispatch Channel *</Label>
                                <div className="grid grid-cols-2 gap-3 mt-1.5">
                                    <button
                                        type="button"
                                        onClick={() => setData('channel', 'sms')}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                                            data.channel === 'sms'
                                                ? 'border-emerald-600 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600'
                                        }`}
                                    >
                                        <MessageSquare className="w-4 h-4 text-emerald-600" />
                                        <span>Kenyan Bulk SMS</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setData('channel', 'email')}
                                        className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                                            data.channel === 'email'
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-300 ring-2 ring-indigo-500/20'
                                                : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600'
                                        }`}
                                    >
                                        <Mail className="w-4 h-4 text-indigo-600" />
                                        <span>Email Blast</span>
                                    </button>
                                </div>
                            </div>

                            {/* Audience Target */}
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs font-bold">Target Audience *</Label>
                                    <Select value={data.audience} onValueChange={(v) => setData('audience', v)}>
                                        <SelectTrigger className="h-10 text-xs mt-1.5">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all_parents">All Parents & Guardians</SelectItem>
                                            <SelectItem value="class">Specific Class / Grade</SelectItem>
                                            <SelectItem value="all_staff">All Teaching & Non-Teaching Staff</SelectItem>
                                            <SelectItem value="all_students">All Students (Where Available)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {data.audience === 'class' && (
                                    <div>
                                        <Label className="text-xs font-bold">Select Class *</Label>
                                        <Select value={data.class_id} onValueChange={(v) => setData('class_id', v)}>
                                            <SelectTrigger className="h-10 text-xs mt-1.5">
                                                <SelectValue placeholder="Choose grade / class..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {classes.map((c) => (
                                                    <SelectItem key={c.id} value={String(c.id)}>
                                                        {c.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.class_id && <p className="text-xs text-red-500 mt-1">{errors.class_id}</p>}
                                    </div>
                                )}
                            </div>

                            {/* Subject (for Email) */}
                            {data.channel === 'email' && (
                                <div>
                                    <Label className="text-xs font-bold">Email Subject *</Label>
                                    <Input
                                        value={data.subject}
                                        onChange={(e) => setData('subject', e.target.value)}
                                        placeholder="e.g. End of Term 2 Closing Circular & Fee Guidelines"
                                        className="h-10 text-xs mt-1.5"
                                    />
                                    {errors.subject && <p className="text-xs text-red-500 mt-1">{errors.subject}</p>}
                                </div>
                            )}

                            {/* Message Area */}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <Label className="text-xs font-bold">Message Content *</Label>
                                    {data.channel === 'sms' && (
                                        <div className="text-[11px] font-mono text-slate-500">
                                            <span>{smsStats.chars} chars</span> |{' '}
                                            <span className="font-bold text-emerald-700 dark:text-emerald-400">
                                                {smsStats.parts} SMS part{smsStats.parts > 1 ? 's' : ''}
                                            </span>{' '}
                                            ({smsStats.remaining} chars left in part)
                                        </div>
                                    )}
                                </div>
                                <Textarea
                                    rows={5}
                                    value={data.message}
                                    onChange={(e) => setData('message', e.target.value)}
                                    placeholder={
                                        data.channel === 'sms'
                                            ? 'Dear Parent, School closes on Friday at 12:30 PM. Please ensure all outstanding fees are settled before reporting date.'
                                            : 'Enter full email announcement body...'
                                    }
                                    className="text-xs resize-none"
                                />
                                {errors.message && <p className="text-xs text-red-500 mt-1">{errors.message}</p>}
                            </div>

                            <Button
                                type="submit"
                                disabled={processing || !data.message}
                                className="h-11 px-6 text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl flex items-center gap-2"
                            >
                                <Send className="w-3.5 h-3.5" />
                                <span>
                                    {data.channel === 'sms' ? 'Dispatch SMS Broadcast' : 'Dispatch Email Broadcast'}
                                </span>
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}