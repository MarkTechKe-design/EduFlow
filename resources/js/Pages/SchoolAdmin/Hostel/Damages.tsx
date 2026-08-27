import { useState } from 'react';
import { usePage, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, CheckCircle2, ShieldAlert, User, Building } from 'lucide-react';
import type { PageProps, Student } from '@/types';

interface HostelItem {
    id: number;
    name: string;
}

interface DamageItem {
    id: number;
    item_damaged: string;
    fine_amount: number;
    incident_date: string;
    status: string;
    description?: string;
    student?: { id: number; first_name: string; last_name: string; admission_no: string };
    hostel?: { id: number; name: string };
}

interface Props extends PageProps {
    damages: { data: DamageItem[]; current_page: number; last_page: number; links: any[] };
    hostels: HostelItem[];
    students: Student[];
}

export default function HostelDamages({ damages, hostels = [], students = [] }: Props) {
    const { flash } = usePage<PageProps>().props;
    const [open, setOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        student_id: '',
        hostel_id: '',
        item_damaged: '',
        fine_amount: '',
        incident_date: '',
        description: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/school/hostel/damages', {
            onSuccess: () => { setOpen(false); reset(); },
        });
    }

    return (
        <AppLayout title="Hostel Breakages & Fines Ledger">
            <div className="space-y-6 max-w-7xl mx-auto pb-16">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/school/hostel">
                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-red-600" />
                                <span>Dormitory Breakages & Property Fines Ledger</span>
                            </h1>
                            <p className="text-xs text-slate-500 mt-1">
                                Record property damage liabilities (window panes, double-decker beds, locker keys) and fee attachments.
                            </p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        onClick={() => { reset(); setOpen(true); }}
                        className="h-9 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-2xs flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Record Breakage Fine
                    </Button>
                </div>

                {flash?.success && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-800 font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* Damages Table */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="py-3 px-4">Student</th>
                                <th className="py-3 px-4">Hostel Block</th>
                                <th className="py-3 px-4">Item Damaged</th>
                                <th className="py-3 px-4">Fine Amount (KES)</th>
                                <th className="py-3 px-4">Incident Date</th>
                                <th className="py-3 px-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {damages.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        No dormitory breakages or fines recorded.
                                    </td>
                                </tr>
                            ) : (
                                damages.data.map((d) => (
                                    <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-slate-900">
                                                {d.student?.first_name} {d.student?.last_name}
                                            </div>
                                            <div className="text-[10px] font-mono text-slate-400">Adm: {d.student?.admission_no}</div>
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-700">
                                            {d.hostel?.name ?? '—'}
                                        </td>
                                        <td className="py-3.5 px-4 font-bold text-slate-900">
                                            {d.item_damaged}
                                        </td>
                                        <td className="py-3.5 px-4 font-mono font-black text-red-600">
                                            KES {Number(d.fine_amount).toLocaleString()}
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-slate-600">
                                            {d.incident_date}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <Badge variant="outline" className="capitalize bg-amber-50 text-amber-800 border-amber-200 font-bold">
                                                {d.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900">Record Dormitory Breakage Fine</DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div>
                            <Label className="text-xs font-bold">Student *</Label>
                            <Select value={data.student_id} onValueChange={v => setData('student_id', v)}>
                                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select student..." /></SelectTrigger>
                                <SelectContent>
                                    {students.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {s.first_name} {s.last_name} ({s.admission_no})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.student_id && <p className="text-xs text-red-500 mt-1">{errors.student_id}</p>}
                        </div>

                        <div>
                            <Label className="text-xs font-bold">Hostel Block *</Label>
                            <Select value={data.hostel_id} onValueChange={v => setData('hostel_id', v)}>
                                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select hostel..." /></SelectTrigger>
                                <SelectContent>
                                    {hostels.map(h => (
                                        <SelectItem key={h.id} value={String(h.id)}>{h.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.hostel_id && <p className="text-xs text-red-500 mt-1">{errors.hostel_id}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Item Damaged *</Label>
                                <Input
                                    value={data.item_damaged}
                                    onChange={e => setData('item_damaged', e.target.value)}
                                    placeholder="e.g. Double Decker Bed"
                                    className="h-9 text-xs mt-1"
                                />
                                {errors.item_damaged && <p className="text-xs text-red-500 mt-1">{errors.item_damaged}</p>}
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Fine Amount (KES) *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={data.fine_amount}
                                    onChange={e => setData('fine_amount', e.target.value)}
                                    placeholder="1500"
                                    className="h-9 text-xs mt-1 font-mono"
                                />
                                {errors.fine_amount && <p className="text-xs text-red-500 mt-1">{errors.fine_amount}</p>}
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-bold">Incident Date *</Label>
                            <Input
                                type="date"
                                value={data.incident_date}
                                onChange={e => setData('incident_date', e.target.value)}
                                className="h-9 text-xs mt-1"
                            />
                            {errors.incident_date && <p className="text-xs text-red-500 mt-1">{errors.incident_date}</p>}
                        </div>

                        <div>
                            <Label className="text-xs font-bold">Incident Description</Label>
                            <Textarea
                                rows={2}
                                value={data.description}
                                onChange={e => setData('description', e.target.value)}
                                placeholder="Details of how the damage occurred..."
                                className="text-xs resize-none mt-1"
                            />
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-9 text-xs rounded-xl">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                                Record Fine
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}