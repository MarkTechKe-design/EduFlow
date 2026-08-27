import { useState } from 'react';
import { usePage, useForm, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, CheckCircle2, BedSingle } from 'lucide-react';
import type { PageProps, Student } from '@/types';

interface HostelOption {
    id: number;
    name: string;
    type: string;
}

interface RoomOption {
    id: number;
    hostel_id: number;
    room_no: string;
    floor: string | null;
    type: string;
    capacity: number;
    occupied: number;
    monthly_fee: string;
    status: string;
}

interface Allocation {
    id: number;
    bed_no: string | null;
    joining_date: string;
    leaving_date: string | null;
    status: string;
    student?: { id: number; first_name: string; last_name: string | null; admission_no: string; school_class?: { name: string } };
    hostel?: { id: number; name: string; type: string };
    room?: { id: number; room_no: string; floor: string | null; type: string };
}

interface Props extends PageProps {
    allocations: { data: Allocation[]; meta?: { total: number }; current_page: number; last_page: number; links: any[] };
    hostels: HostelOption[];
    rooms: RoomOption[];
    students: Student[];
    filters: { hostel_id?: string; status?: string };
}

export default function HostelAllocations({ allocations, hostels = [], rooms = [], students = [], filters }: Props) {
    const { flash } = usePage<PageProps>().props;
    const [open, setOpen] = useState(false);
    const [vacateOpen, setVacateOpen] = useState<Allocation | null>(null);
    const [vacateDate, setVacateDate] = useState(new Date().toISOString().split('T')[0]);

    const { data, setData, post, processing, errors, reset } = useForm({
        hostel_id: '',
        room_id: '',
        student_id: '',
        bed_no: '',
        joining_date: new Date().toISOString().split('T')[0],
        fee_linked: true,
        notes: '',
    });

    const availableRooms = data.hostel_id
        ? rooms.filter(r => String(r.hostel_id) === String(data.hostel_id) && r.occupied < r.capacity)
        : [];

    function handleHostelChange(val: string) {
        setData(prev => ({
            ...prev,
            hostel_id: val,
            room_id: '',
        }));
    }

    function applyFilter(key: string, value: string) {
        router.get('/school/hostel/allocations', { ...filters, [key]: value === 'all' || !value ? undefined : value }, { preserveScroll: true });
    }

    function handleAllocate(e: React.FormEvent) {
        e.preventDefault();
        post('/school/hostel/allocations', {
            preserveScroll: true,
            onSuccess: () => { setOpen(false); reset(); },
        });
    }

    function handleVacate() {
        if (!vacateOpen) return;
        router.put(`/school/hostel/allocations/${vacateOpen.id}/vacate`, { leaving_date: vacateDate }, {
            preserveScroll: true,
            onSuccess: () => { setVacateOpen(null); },
        });
    }

    return (
        <AppLayout title="Hostel Bed Allocations">
            <div className="space-y-6 max-w-7xl mx-auto pb-16">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/school/hostel" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
                            <ArrowLeft className="w-4 h-4" /> Hostels
                        </Link>
                        <span className="text-slate-300">|</span>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <BedSingle className="w-5 h-5 text-indigo-600" />
                                <span>Room Allocations & Bed Register</span>
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {allocations.meta?.total ?? allocations.data?.length ?? 0} active & archived resident student allocations
                            </p>
                        </div>
                    </div>

                    <Button
                        onClick={() => { reset(); setOpen(true); }}
                        className="bg-slate-900 hover:bg-slate-800 text-white inline-flex items-center gap-2 h-9 px-4 text-xs font-bold rounded-xl shadow-2xs"
                    >
                        <Plus className="w-4 h-4" /> Allocate Student
                    </Button>
                </div>

                {flash?.success && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-800 font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* Filters */}
                <div className="flex gap-3 items-center">
                    <div className="w-56">
                        <Select value={filters?.hostel_id ?? 'all'} onValueChange={v => applyFilter('hostel_id', v)}>
                            <SelectTrigger className="h-9 text-xs bg-white border-slate-200"><SelectValue placeholder="All Hostels" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Hostels</SelectItem>
                                {hostels.map(h => <SelectItem key={h.id} value={String(h.id)}>{h.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="w-44">
                        <Select value={filters?.status ?? 'all'} onValueChange={v => applyFilter('status', v)}>
                            <SelectTrigger className="h-9 text-xs bg-white border-slate-200"><SelectValue placeholder="All Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="left">Checked Out</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Allocations Table */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 border-b border-slate-200">
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Student</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Hostel</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Room</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Bed No.</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Joining Date</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Leaving Date</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Status</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="font-medium text-xs divide-y divide-slate-100">
                            {(!allocations.data || allocations.data.length === 0) ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-16 text-slate-400">
                                        No room allocations found. Click &quot;Allocate Student&quot; to assign a resident student.
                                    </TableCell>
                                </TableRow>
                            ) : allocations.data.map(a => (
                                <TableRow key={a.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell className="py-3 px-4">
                                        <p className="font-bold text-slate-900">{a.student?.first_name} {a.student?.last_name}</p>
                                        <p className="text-[10px] text-slate-400 font-mono">Adm: {a.student?.admission_no} • {a.student?.school_class?.name ?? '—'}</p>
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-slate-700">{a.hostel?.name ?? '—'}</TableCell>
                                    <TableCell className="py-3 px-4 text-slate-600 font-mono">Room {a.room?.room_no ?? '—'}</TableCell>
                                    <TableCell className="py-3 px-4 font-mono text-indigo-600 font-bold">{a.bed_no ?? 'Bed 1'}</TableCell>
                                    <TableCell className="py-3 px-4 font-mono text-slate-600">{a.joining_date}</TableCell>
                                    <TableCell className="py-3 px-4 font-mono text-slate-600">{a.leaving_date ?? '—'}</TableCell>
                                    <TableCell className="py-3 px-4">
                                        <Badge variant="outline" className={`capitalize text-[10px] font-bold ${a.status === 'active' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                                            {a.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-3 px-4 text-right">
                                        {a.status === 'active' && (
                                            <Button size="sm" variant="outline" onClick={() => setVacateOpen(a)} className="h-7 text-xs font-bold rounded-lg border-red-200 text-red-600 hover:bg-red-50">
                                                Checkout
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Allocate Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader><DialogTitle className="text-base font-bold text-slate-900">Allocate Student to Bed</DialogTitle></DialogHeader>
                    <form onSubmit={handleAllocate} className="space-y-4 pt-2">
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
                            <Select value={data.hostel_id} onValueChange={handleHostelChange}>
                                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select hostel..." /></SelectTrigger>
                                <SelectContent>
                                    {hostels.map(h => <SelectItem key={h.id} value={String(h.id)}>{h.name} ({h.type})</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {errors.hostel_id && <p className="text-xs text-red-500 mt-1">{errors.hostel_id}</p>}
                        </div>

                        <div>
                            <Label className="text-xs font-bold">Room / Cubicle *</Label>
                            <Select
                                value={data.room_id}
                                onValueChange={v => setData('room_id', v)}
                                disabled={!data.hostel_id || availableRooms.length === 0}
                            >
                                <SelectTrigger className="h-9 text-xs mt-1">
                                    <SelectValue
                                        placeholder={
                                            !data.hostel_id
                                                ? "Select hostel block first"
                                                : availableRooms.length === 0
                                                ? "No vacant rooms in this hostel"
                                                : "Select available room..."
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableRooms.map(r => (
                                        <SelectItem key={r.id} value={String(r.id)}>
                                            Room {r.room_no} — Cap: {r.capacity} (Occupied: {r.occupied})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.room_id && <p className="text-xs text-red-500 mt-1">{errors.room_id}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Bed Number</Label>
                                <Input value={data.bed_no} onChange={e => setData('bed_no', e.target.value)} placeholder="e.g. Bed A1" className="h-9 text-xs mt-1 font-mono" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Joining Date *</Label>
                                <Input type="date" value={data.joining_date} onChange={e => setData('joining_date', e.target.value)} className="h-9 text-xs mt-1 font-mono" />
                                {errors.joining_date && <p className="text-xs text-red-500 mt-1">{errors.joining_date}</p>}
                            </div>
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-9 text-xs rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">Allocate</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Vacate Dialog */}
            <Dialog open={!!vacateOpen} onOpenChange={() => setVacateOpen(null)}>
                <DialogContent className="sm:max-w-sm rounded-2xl">
                    <DialogHeader><DialogTitle className="text-base font-bold text-slate-900">Checkout Student</DialogTitle></DialogHeader>
                    <div className="space-y-3 pt-2">
                        <div className="rounded-xl bg-slate-50 p-3 text-xs">
                            <p className="font-bold text-slate-900">{vacateOpen?.student?.first_name} {vacateOpen?.student?.last_name}</p>
                            <p className="text-slate-500 mt-0.5">{vacateOpen?.hostel?.name} • Room {vacateOpen?.room?.room_no}</p>
                        </div>
                        <div>
                            <Label className="text-xs font-bold">Leaving / Checkout Date *</Label>
                            <Input type="date" value={vacateDate} onChange={e => setVacateDate(e.target.value)} className="h-9 text-xs mt-1 font-mono" />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setVacateOpen(null)} className="h-9 text-xs rounded-xl">Cancel</Button>
                        <Button type="button" onClick={handleVacate} className="h-9 text-xs font-bold px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl">Confirm Checkout</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}