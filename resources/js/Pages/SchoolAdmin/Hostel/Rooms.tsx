import { useState } from 'react';
import { usePage, useForm, Link } from '@inertiajs/react';
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
import { ArrowLeft, Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import type { PageProps } from '@/types';

interface RoomItem {
    id: number;
    room_no: string;
    floor: string | null;
    type: 'single' | 'double' | 'dormitory';
    capacity: number;
    occupied: number;
    monthly_fee: number;
    status: 'available' | 'full' | 'maintenance';
}

interface HostelModel {
    id: number;
    name: string;
    type: string;
    total_rooms: number;
    total_capacity: number;
}

interface Props extends PageProps {
    hostel: HostelModel;
    rooms: RoomItem[];
}

const emptyForm = {
    room_no: '',
    floor: 'Ground Wing',
    type: 'dormitory' as 'single' | 'double' | 'dormitory',
    capacity: 4,
    monthly_fee: '0',
    status: 'available' as 'available' | 'full' | 'maintenance',
};

export default function HostelRooms({ hostel, rooms = [] }: Props) {
    const { flash } = usePage<PageProps>().props;
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<RoomItem | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        ...emptyForm,
    });

    function openCreate() {
        reset();
        setEditing(null);
        setOpen(true);
    }

    function openEdit(r: RoomItem) {
        setEditing(r);
        setData({
            room_no: r.room_no,
            floor: r.floor || 'Ground Wing',
            type: r.type,
            capacity: r.capacity,
            monthly_fee: String(r.monthly_fee ?? 0),
            status: r.status,
        });
        setOpen(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            put(`/school/hostel/${hostel.id}/rooms/${editing.id}`, {
                onSuccess: () => { setOpen(false); reset(); },
            });
        } else {
            post(`/school/hostel/${hostel.id}/rooms`, {
                onSuccess: () => { setOpen(false); reset(); },
            });
        }
    }

    function handleDelete(id: number) {
        if (confirm('Are you sure you want to remove this cubicle / room?')) {
            destroy(`/school/hostel/${hostel.id}/rooms/${id}`);
        }
    }

    return (
        <AppLayout title={`${hostel.name} - Cubicles & Rooms`}>
            <div className="space-y-6 max-w-7xl mx-auto pb-16">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/school/hostel" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900">
                            <ArrowLeft className="w-4 h-4" /> Hostels
                        </Link>
                        <span className="text-slate-300">|</span>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">{hostel.name}</h1>
                            <p className="text-xs text-slate-500">{rooms.length} cubicles/rooms • {hostel.total_capacity} total beds</p>
                        </div>
                    </div>

                    <Button
                        type="button"
                        onClick={openCreate}
                        className="bg-slate-900 hover:bg-slate-800 text-white inline-flex items-center gap-2 h-9 px-4 text-xs font-bold rounded-xl shadow-2xs"
                    >
                        <Plus className="w-4 h-4" /> Add Room / Cubicle
                    </Button>
                </div>

                {flash?.success && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-800 font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 border-b border-slate-200">
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Room / Cubicle No.</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Wing / Location</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Structure</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Bed Capacity</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Occupied Beds</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Fee / Term (KES)</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Status</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="font-medium text-xs divide-y divide-slate-100">
                            {rooms.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-16 text-slate-400">
                                        No cubicles or rooms registered. Click &quot;Add Room / Cubicle&quot; to configure beds.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rooms.map(r => (
                                    <TableRow key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="py-3.5 px-4 font-bold text-slate-900">{r.room_no}</TableCell>
                                        <TableCell className="py-3.5 px-4 text-slate-600">{r.floor || '—'}</TableCell>
                                        <TableCell className="py-3.5 px-4 capitalize text-slate-700">
                                            {r.type === 'dormitory' ? 'Open Dormitory' : r.type === 'single' ? 'Prefect Cubicle' : 'Standard Cubicle'}
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 font-mono font-bold text-slate-800">{r.capacity} Beds</TableCell>
                                        <TableCell className="py-3.5 px-4 font-mono font-bold text-indigo-600">{r.occupied} Occupied</TableCell>
                                        <TableCell className="py-3.5 px-4 font-mono">
                                            {Number(r.monthly_fee) > 0 ? `KES ${Number(r.monthly_fee).toLocaleString()}` : 'Included in Fees'}
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4">
                                            <Badge variant="outline" className={`capitalize text-[10px] font-bold ${r.status === 'available' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : r.status === 'full' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-600'}`}>
                                                {r.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button type="button" size="sm" variant="outline" onClick={() => openEdit(r)} className="h-7 px-2 text-xs font-bold rounded-lg border-slate-200">
                                                    <Pencil className="w-3 h-3 mr-1" /> Edit
                                                </Button>
                                                <Button type="button" size="sm" variant="ghost" onClick={() => handleDelete(r.id)} className="h-7 w-7 p-0 text-red-500 hover:text-red-700 rounded-lg">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Modal Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900">
                            {editing ? 'Edit Room / Cubicle' : 'Add Room / Cubicle'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Room / Cubicle No. *</Label>
                                <Input
                                    value={data.room_no}
                                    onChange={e => setData('room_no', e.target.value)}
                                    placeholder="e.g. Cubicle 1 or Room 201"
                                    className="h-9 text-xs mt-1"
                                />
                                {errors.room_no && <p className="text-xs text-red-500 mt-1">{errors.room_no}</p>}
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Wing / Location</Label>
                                <Input
                                    value={data.floor}
                                    onChange={e => setData('floor', e.target.value)}
                                    placeholder="e.g. Ground Wing, 1st Floor"
                                    className="h-9 text-xs mt-1"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Structure Type *</Label>
                                <Select value={data.type} onValueChange={(v: any) => setData('type', v)}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dormitory">Open Dormitory</SelectItem>
                                        <SelectItem value="double">Standard Cubicle (Double Decker)</SelectItem>
                                        <SelectItem value="single">Prefect Cubicle (Single Bed)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Bed Capacity *</Label>
                                <Input
                                    type="number"
                                    value={data.capacity}
                                    onChange={e => setData('capacity', Number(e.target.value))}
                                    className="h-9 text-xs mt-1 font-mono"
                                />
                                {errors.capacity && <p className="text-xs text-red-500 mt-1">{errors.capacity}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Boarding Fee / Term (KES)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={data.monthly_fee}
                                    onChange={e => setData('monthly_fee', e.target.value)}
                                    placeholder="0 if standard"
                                    className="h-9 text-xs mt-1 font-mono"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Room Status *</Label>
                                <Select value={data.status} onValueChange={(v: any) => setData('status', v)}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="available">Available</SelectItem>
                                        <SelectItem value="full">Full</SelectItem>
                                        <SelectItem value="maintenance">Maintenance / Repair</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-9 text-xs rounded-xl">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                                {editing ? 'Update Room' : 'Save Room'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}