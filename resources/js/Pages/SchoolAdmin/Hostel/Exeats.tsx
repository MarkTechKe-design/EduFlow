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
import { ArrowLeft, Plus, CheckCircle2, Calendar, User, Building } from 'lucide-react';
import type { PageProps, Student } from '@/types';

interface HostelItem {
    id: number;
    name: string;
}

interface ExeatItem {
    id: number;
    exeat_type: string;
    departure_date: string;
    expected_return_date: string;
    reason: string;
    guardian_approval_contact: string;
    status: string;
    student?: { id: number; first_name: string; last_name: string; admission_no: string };
    hostel?: { id: number; name: string };
}

interface Props extends PageProps {
    exeats: { data: ExeatItem[]; current_page: number; last_page: number; links: any[] };
    hostels: HostelItem[];
    students: Student[];
}

export default function HostelExeats({ exeats, hostels = [], students = [] }: Props) {
    const { flash } = usePage<PageProps>().props;
    const [open, setOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        student_id: '',
        hostel_id: '',
        exeat_type: 'weekend_out',
        departure_date: '',
        expected_return_date: '',
        reason: '',
        guardian_approval_contact: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/school/hostel/exeats', {
            onSuccess: () => { setOpen(false); reset(); },
        });
    }

    return (
        <AppLayout title="Hostel Exeats & Movement Register">
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
                                <Calendar className="w-5 h-5 text-indigo-600" />
                                <span>Boarding Exeats & Movement Register</span>
                            </h1>
                            <p className="text-xs text-slate-500 mt-1">
                                Track weekend passes, half-term departures, and medical leave clearances.
                            </p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        onClick={() => { reset(); setOpen(true); }}
                        className="h-9 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-2xs flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Issue Exeat Pass
                    </Button>
                </div>

                {flash?.success && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-800 font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* Exeats Table */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="py-3 px-4">Student</th>
                                <th className="py-3 px-4">Hostel</th>
                                <th className="py-3 px-4">Exeat Type</th>
                                <th className="py-3 px-4">Departure & Return</th>
                                <th className="py-3 px-4">Reason & Contact</th>
                                <th className="py-3 px-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {exeats.data.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-12 text-center text-slate-400">
                                        No active exeat passes recorded.
                                    </td>
                                </tr>
                            ) : (
                                exeats.data.map((e) => (
                                    <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-slate-900">
                                                {e.student?.first_name} {e.student?.last_name}
                                            </div>
                                            <div className="text-[10px] font-mono text-slate-400">Adm: {e.student?.admission_no}</div>
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-700">
                                            {e.hostel?.name ?? '—'}
                                        </td>
                                        <td className="py-3.5 px-4 capitalize font-semibold text-indigo-900">
                                            {e.exeat_type.replace('_', ' ')}
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-slate-600">
                                            <div>Dep: {e.departure_date}</div>
                                            <div>Ret: {e.expected_return_date}</div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="text-slate-800">{e.reason}</div>
                                            <div className="text-[10px] text-slate-400">Contact: {e.guardian_approval_contact}</div>
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <Badge variant="outline" className="capitalize bg-emerald-50 text-emerald-800 border-emerald-200 font-bold">
                                                {e.status}
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
                <DialogContent className="sm:max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900">Issue Student Exeat Pass</DialogTitle>
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

                        <div className="grid grid-cols-2 gap-3">
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

                            <div>
                                <Label className="text-xs font-bold">Exeat Type *</Label>
                                <Select value={data.exeat_type} onValueChange={(v: any) => setData('exeat_type', v)}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="weekend_out">Weekend Out</SelectItem>
                                        <SelectItem value="half_term">Half Term</SelectItem>
                                        <SelectItem value="medical_leave">Medical Leave</SelectItem>
                                        <SelectItem value="disciplinary_suspension">Disciplinary Suspension</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Departure Date *</Label>
                                <Input
                                    type="date"
                                    value={data.departure_date}
                                    onChange={e => setData('departure_date', e.target.value)}
                                    className="h-9 text-xs mt-1"
                                />
                                {errors.departure_date && <p className="text-xs text-red-500 mt-1">{errors.departure_date}</p>}
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Expected Return Date *</Label>
                                <Input
                                    type="date"
                                    value={data.expected_return_date}
                                    onChange={e => setData('expected_return_date', e.target.value)}
                                    className="h-9 text-xs mt-1"
                                />
                                {errors.expected_return_date && <p className="text-xs text-red-500 mt-1">{errors.expected_return_date}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Guardian Approval Contact *</Label>
                                <Input
                                    value={data.guardian_approval_contact}
                                    onChange={e => setData('guardian_approval_contact', e.target.value)}
                                    placeholder="07XXXXXXXX"
                                    className="h-9 text-xs mt-1"
                                />
                                {errors.guardian_approval_contact && <p className="text-xs text-red-500 mt-1">{errors.guardian_approval_contact}</p>}
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Reason *</Label>
                                <Input
                                    value={data.reason}
                                    onChange={e => setData('reason', e.target.value)}
                                    placeholder="Family function / Medical checkup"
                                    className="h-9 text-xs mt-1"
                                />
                                {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason}</p>}
                            </div>
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-9 text-xs rounded-xl">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                                Issue Pass
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}