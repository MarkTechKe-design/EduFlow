import { useState } from 'react';
import { usePage, useForm, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building, Plus, Pencil, Trash2, BedSingle, Calendar, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { PageProps, Student, Staff } from '@/types';

interface HostelHouse {
    id: number;
    name: string;
    type: 'boys' | 'girls' | 'mixed';
    warden_id?: number | null;
    housemaster_name?: string | null;
    matron_name?: string | null;
    phone?: string | null;
    address?: string | null;
    status: 'active' | 'inactive';
    rooms_count?: number;
    allocations_count?: number;
    total_capacity: number;
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

interface AllocationItem {
    id: number;
    bed_no?: string;
    joining_date: string;
    leaving_date?: string;
    status: string;
    student?: { id: number; first_name: string; last_name: string; admission_no: string; school_class?: { name: string } };
    hostel?: { id: number; name: string };
    room?: { id: number; room_no: string; type: string };
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

interface DamageItem {
    id: number;
    item_damaged: string;
    fine_amount: number;
    incident_date: string;
    status: string;
    student?: { id: number; first_name: string; last_name: string; admission_no: string };
    hostel?: { id: number; name: string };
}

interface Props extends PageProps {
    hostels: HostelHouse[];
    allocations: { data: AllocationItem[]; current_page: number; last_page: number };
    exeats: { data: ExeatItem[]; current_page: number; last_page: number };
    damages: { data: DamageItem[]; current_page: number; last_page: number };
    rooms: RoomOption[];
    students: Student[];
    staffList: Staff[];
    stats: {
        total_hostels: number;
        total_capacity: number;
        occupied: number;
        active_exeats: number;
        unpaid_damages: number;
    };
    filters: { hostel_id?: string; status?: string };
}

export default function HostelIndex({
    hostels = [],
    allocations,
    exeats,
    damages,
    rooms = [],
    students = [],
    stats,
    filters,
}: Props) {
    const { flash } = usePage<PageProps>().props;
    const [activeTab, setActiveTab] = useState<'houses' | 'allocations' | 'exeats' | 'damages'>('houses');

    // Modals state
    const [houseModalOpen, setHouseModalOpen] = useState(false);
    const [editingHouse, setEditingHouse] = useState<HostelHouse | null>(null);
    const [allocateModalOpen, setAllocateModalOpen] = useState(false);
    const [exeatModalOpen, setExeatModalOpen] = useState(false);
    const [damageModalOpen, setDamageModalOpen] = useState(false);
    const [vacateModalOpen, setVacateModalOpen] = useState<AllocationItem | null>(null);
    const [vacateDate, setVacateDate] = useState(new Date().toISOString().split('T')[0]);

    // House Form
    const houseForm = useForm({
        name: '',
        type: 'boys' as 'boys' | 'girls' | 'mixed',
        housemaster_name: '',
        matron_name: '',
        phone: '',
        address: '',
        status: 'active' as 'active' | 'inactive',
    });

    // Allocation Form
    const allocateForm = useForm({
        hostel_id: '',
        room_id: '',
        student_id: '',
        bed_no: '',
        joining_date: new Date().toISOString().split('T')[0],
    });

    // Exeat Form
    const exeatForm = useForm({
        student_id: '',
        hostel_id: '',
        exeat_type: 'weekend_out',
        departure_date: '',
        expected_return_date: '',
        reason: '',
        guardian_approval_contact: '',
    });

    // Damage Form
    const damageForm = useForm({
        student_id: '',
        hostel_id: '',
        item_damaged: '',
        fine_amount: '',
        incident_date: '',
        description: '',
    });

    const availableRooms = allocateForm.data.hostel_id
        ? rooms.filter(r => String(r.hostel_id) === String(allocateForm.data.hostel_id) && r.occupied < r.capacity)
        : [];

    function openHouseCreate() {
        houseForm.reset();
        setEditingHouse(null);
        setHouseModalOpen(true);
    }

    function openHouseEdit(h: HostelHouse) {
        setEditingHouse(h);
        houseForm.setData({
            name: h.name,
            type: h.type,
            housemaster_name: h.housemaster_name || '',
            matron_name: h.matron_name || '',
            phone: h.phone || '',
            address: h.address || '',
            status: h.status,
        });
        setHouseModalOpen(true);
    }

    function handleHouseSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingHouse) {
            houseForm.put(`/school/hostel/${editingHouse.id}`, {
                onSuccess: () => { setHouseModalOpen(false); houseForm.reset(); },
            });
        } else {
            houseForm.post('/school/hostel', {
                onSuccess: () => { setHouseModalOpen(false); houseForm.reset(); },
            });
        }
    }

    function handleHouseDelete(id: number) {
        if (confirm('Are you sure you want to delete this hostel house?')) {
            router.delete(`/school/hostel/${id}`);
        }
    }

    function handleAllocateSubmit(e: React.FormEvent) {
        e.preventDefault();
        allocateForm.post('/school/hostel/allocations', {
            preserveScroll: true,
            onSuccess: () => { setAllocateModalOpen(false); allocateForm.reset(); },
        });
    }

    function handleExeatSubmit(e: React.FormEvent) {
        e.preventDefault();
        exeatForm.post('/school/hostel/exeats', {
            preserveScroll: true,
            onSuccess: () => { setExeatModalOpen(false); exeatForm.reset(); },
        });
    }

    function handleDamageSubmit(e: React.FormEvent) {
        e.preventDefault();
        damageForm.post('/school/hostel/damages', {
            preserveScroll: true,
            onSuccess: () => { setDamageModalOpen(false); damageForm.reset(); },
        });
    }

    function handleVacateSubmit() {
        if (!vacateModalOpen) return;
        router.put(`/school/hostel/allocations/${vacateModalOpen.id}/vacate`, { leaving_date: vacateDate }, {
            preserveScroll: true,
            onSuccess: () => setVacateModalOpen(null),
        });
    }

    return (
        <AppLayout title="Boarding & Hostel Management">
            <div className="space-y-6 max-w-7xl mx-auto pb-16">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Building className="w-5 h-5 text-indigo-600" />
                            <span>Hostel & Boarding Department</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Residential houses, cubicle allocations, student movement registers, and property liability ledger.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {activeTab === 'houses' && (
                            <Button onClick={openHouseCreate} className="h-9 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-2xs flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Add Hostel House
                            </Button>
                        )}
                        {activeTab === 'allocations' && (
                            <Button onClick={() => { allocateForm.reset(); setAllocateModalOpen(true); }} className="h-9 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-2xs flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Allocate Bed
                            </Button>
                        )}
                        {activeTab === 'exeats' && (
                            <Button onClick={() => { exeatForm.reset(); setExeatModalOpen(true); }} className="h-9 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-2xs flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Issue Exeat Pass
                            </Button>
                        )}
                        {activeTab === 'damages' && (
                            <Button onClick={() => { damageForm.reset(); setDamageModalOpen(true); }} className="h-9 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-2xs flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Record Damage Fine
                            </Button>
                        )}
                    </div>
                </div>

                {flash?.success && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-800 font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Hostel Houses</span>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.total_hostels ?? 0}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Bed Capacity</span>
                        <p className="text-2xl font-bold text-indigo-600 mt-1">{stats?.total_capacity ?? 0}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Occupied Beds</span>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">{stats?.occupied ?? 0}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Exeats</span>
                        <p className="text-2xl font-bold text-amber-600 mt-1">{stats?.active_exeats ?? 0}</p>
                    </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="flex border-b border-slate-200 gap-6">
                    <button
                        onClick={() => setActiveTab('houses')}
                        className={`pb-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'houses' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        Hostel Houses & Dorms
                    </button>
                    <button
                        onClick={() => setActiveTab('allocations')}
                        className={`pb-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'allocations' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        Bed Allocations Register
                    </button>
                    <button
                        onClick={() => setActiveTab('exeats')}
                        className={`pb-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'exeats' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        Exeats & Movement Register
                    </button>
                    <button
                        onClick={() => setActiveTab('damages')}
                        className={`pb-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'damages' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        Property Breakages & Fines
                    </button>
                </div>

                {/* TAB 1: HOUSES */}
                {activeTab === 'houses' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {hostels.map(h => (
                            <div key={h.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-900">{h.name}</h3>
                                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 bg-slate-100 text-slate-700">
                                            {h.type} House
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Button type="button" variant="ghost" size="sm" onClick={() => openHouseEdit(h)} className="h-7 w-7 p-0">
                                            <Pencil className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => handleHouseDelete(h.id)} className="h-7 w-7 p-0 text-red-500">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="text-xs space-y-1 text-slate-600 border-t border-slate-100 pt-3">
                                    {h.housemaster_name && <p><strong>Housemaster:</strong> {h.housemaster_name}</p>}
                                    {h.matron_name && <p><strong>Matron:</strong> {h.matron_name}</p>}
                                    {h.phone && <p><strong>Phone:</strong> {h.phone}</p>}
                                </div>

                                <div className="grid grid-cols-3 gap-2 py-2 bg-slate-50 rounded-xl px-3 text-center text-xs">
                                    <div>
                                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Cubicles</span>
                                        <strong className="text-slate-900">{h.rooms_count ?? 0}</strong>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Capacity</span>
                                        <strong className="text-indigo-600">{h.total_capacity}</strong>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Allocated</span>
                                        <strong className="text-emerald-600">{h.allocations_count ?? 0}</strong>
                                    </div>
                                </div>

                                <Link href={`/school/hostel/${h.id}/rooms`} className="block">
                                    <Button className="w-full h-9 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                                        Manage Cubicles & Beds
                                    </Button>
                                </Link>
                            </div>
                        ))}
                    </div>
                )}

                {/* TAB 2: ALLOCATIONS */}
                {activeTab === 'allocations' && (
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Student</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Hostel House</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Cubicle / Room</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Bed No.</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Joining Date</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Status</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="font-medium text-xs divide-y divide-slate-100">
                                {allocations.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-16 text-slate-400">
                                            No resident students allocated to beds.
                                        </TableCell>
                                    </TableRow>
                                ) : allocations.data.map(a => (
                                    <TableRow key={a.id} className="hover:bg-slate-50/50">
                                        <TableCell className="py-3 px-4">
                                            <p className="font-bold text-slate-900">{a.student?.first_name} {a.student?.last_name}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">Adm: {a.student?.admission_no} • {a.student?.school_class?.name ?? '—'}</p>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-slate-700">{a.hostel?.name}</TableCell>
                                        <TableCell className="py-3 px-4 text-slate-600 font-mono">Room {a.room?.room_no}</TableCell>
                                        <TableCell className="py-3 px-4 font-mono font-bold text-indigo-600">{a.bed_no || 'Bed 1'}</TableCell>
                                        <TableCell className="py-3 px-4 font-mono text-slate-600">{a.joining_date}</TableCell>
                                        <TableCell className="py-3 px-4">
                                            <Badge variant="outline" className={`capitalize text-[10px] font-bold ${a.status === 'active' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600'}`}>
                                                {a.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-right">
                                            {a.status === 'active' && (
                                                <Button size="sm" variant="outline" onClick={() => setVacateModalOpen(a)} className="h-7 text-xs font-bold rounded-lg border-red-200 text-red-600 hover:bg-red-50">
                                                    Checkout
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* TAB 3: EXEATS */}
                {activeTab === 'exeats' && (
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Student</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">House</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Pass Type</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Departure & Return</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Reason & Parent Contact</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="font-medium text-xs divide-y divide-slate-100">
                                {exeats.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                                            No active exeat passes recorded.
                                        </TableCell>
                                    </TableRow>
                                ) : exeats.data.map(e => (
                                    <TableRow key={e.id} className="hover:bg-slate-50/50">
                                        <TableCell className="py-3 px-4 font-bold text-slate-900">
                                            {e.student?.first_name} {e.student?.last_name}
                                            <div className="text-[10px] font-mono text-slate-400">Adm: {e.student?.admission_no}</div>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-slate-700">{e.hostel?.name}</TableCell>
                                        <TableCell className="py-3 px-4 capitalize font-semibold text-indigo-900">{e.exeat_type.replace('_', ' ')}</TableCell>
                                        <TableCell className="py-3 px-4 font-mono text-slate-600">
                                            <div>Dep: {e.departure_date}</div>
                                            <div>Ret: {e.expected_return_date}</div>
                                        </TableCell>
                                        <TableCell className="py-3 px-4">
                                            <div>{e.reason}</div>
                                            <div className="text-[10px] text-slate-400">Contact: {e.guardian_approval_contact}</div>
                                        </TableCell>
                                        <TableCell className="py-3 px-4">
                                            <Badge variant="outline" className="capitalize text-[10px] font-bold bg-emerald-50 text-emerald-800 border-emerald-200">
                                                {e.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* TAB 4: DAMAGES */}
                {activeTab === 'damages' && (
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Student</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">House Block</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Damaged Item</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Fine (KES)</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Date</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="font-medium text-xs divide-y divide-slate-100">
                                {damages.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                                            No breakage fines or property damages recorded.
                                        </TableCell>
                                    </TableRow>
                                ) : damages.data.map(d => (
                                    <TableRow key={d.id} className="hover:bg-slate-50/50">
                                        <TableCell className="py-3 px-4 font-bold text-slate-900">
                                            {d.student?.first_name} {d.student?.last_name}
                                            <div className="text-[10px] font-mono text-slate-400">Adm: {d.student?.admission_no}</div>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-slate-700">{d.hostel?.name}</TableCell>
                                        <TableCell className="py-3 px-4 font-bold text-slate-900">{d.item_damaged}</TableCell>
                                        <TableCell className="py-3 px-4 font-mono font-bold text-red-600">KES {Number(d.fine_amount).toLocaleString()}</TableCell>
                                        <TableCell className="py-3 px-4 font-mono text-slate-600">{d.incident_date}</TableCell>
                                        <TableCell className="py-3 px-4">
                                            <Badge variant="outline" className="capitalize text-[10px] font-bold bg-amber-50 text-amber-800 border-amber-200">
                                                {d.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* MODAL 1: REGISTER/EDIT HOUSE */}
            <Dialog open={houseModalOpen} onOpenChange={setHouseModalOpen}>
                <DialogContent className="sm:max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900">
                            {editingHouse ? 'Edit Hostel House' : 'Register New Hostel House'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleHouseSubmit} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">House Name *</Label>
                                <Input value={houseForm.data.name} onChange={e => houseForm.setData('name', e.target.value)} placeholder="e.g. Mara House" className="h-9 text-xs mt-1" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">House Type *</Label>
                                <Select value={houseForm.data.type} onValueChange={(v: any) => houseForm.setData('type', v)}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="boys">Boys House</SelectItem>
                                        <SelectItem value="girls">Girls House</SelectItem>
                                        <SelectItem value="mixed">Mixed House</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Housemaster Name</Label>
                                <Input value={houseForm.data.housemaster_name} onChange={e => houseForm.setData('housemaster_name', e.target.value)} placeholder="e.g. Mr. Kipchoge" className="h-9 text-xs mt-1" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Matron Name</Label>
                                <Input value={houseForm.data.matron_name} onChange={e => houseForm.setData('matron_name', e.target.value)} placeholder="e.g. Madam Wanjiku" className="h-9 text-xs mt-1" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Contact Phone</Label>
                                <Input value={houseForm.data.phone} onChange={e => houseForm.setData('phone', e.target.value)} placeholder="07XXXXXXXX" className="h-9 text-xs mt-1" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Status *</Label>
                                <Select value={houseForm.data.status} onValueChange={(v: any) => houseForm.setData('status', v)}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setHouseModalOpen(false)} className="h-9 text-xs rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={houseForm.processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">Save House</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 2: ALLOCATE STUDENT */}
            <Dialog open={allocateModalOpen} onOpenChange={setAllocateModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader><DialogTitle className="text-base font-bold text-slate-900">Allocate Resident Student</DialogTitle></DialogHeader>
                    <form onSubmit={handleAllocateSubmit} className="space-y-4 pt-2">
                        <div>
                            <Label className="text-xs font-bold">Student *</Label>
                            <Select value={allocateForm.data.student_id} onValueChange={v => allocateForm.setData('student_id', v)}>
                                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select student..." /></SelectTrigger>
                                <SelectContent>
                                    {students.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.first_name} {s.last_name} ({s.admission_no})</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs font-bold">Hostel House *</Label>
                            <Select value={allocateForm.data.hostel_id} onValueChange={v => allocateForm.setData(p => ({ ...p, hostel_id: v, room_id: '' }))}>
                                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select house..." /></SelectTrigger>
                                <SelectContent>
                                    {hostels.map(h => <SelectItem key={h.id} value={String(h.id)}>{h.name} ({h.type})</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs font-bold">Cubicle / Room *</Label>
                            <Select value={allocateForm.data.room_id} onValueChange={v => allocateForm.setData('room_id', v)} disabled={!allocateForm.data.hostel_id || availableRooms.length === 0}>
                                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder={!allocateForm.data.hostel_id ? "Select house first" : availableRooms.length === 0 ? "No vacant cubicles" : "Select cubicle..."} /></SelectTrigger>
                                <SelectContent>
                                    {availableRooms.map(r => <SelectItem key={r.id} value={String(r.id)}>Room {r.room_no} (Cap: {r.capacity}, Occ: {r.occupied})</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Bed No.</Label>
                                <Input value={allocateForm.data.bed_no} onChange={e => allocateForm.setData('bed_no', e.target.value)} placeholder="Bed 1" className="h-9 text-xs mt-1 font-mono" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Joining Date *</Label>
                                <Input type="date" value={allocateForm.data.joining_date} onChange={e => allocateForm.setData('joining_date', e.target.value)} className="h-9 text-xs mt-1 font-mono" />
                            </div>
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setAllocateModalOpen(false)} className="h-9 text-xs rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={allocateForm.processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">Allocate</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 3: ISSUE EXEAT */}
            <Dialog open={exeatModalOpen} onOpenChange={setExeatModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader><DialogTitle className="text-base font-bold text-slate-900">Issue Student Exeat Pass</DialogTitle></DialogHeader>
                    <form onSubmit={handleExeatSubmit} className="space-y-4 pt-2">
                        <div>
                            <Label className="text-xs font-bold">Student *</Label>
                            <Select value={exeatForm.data.student_id} onValueChange={v => exeatForm.setData('student_id', v)}>
                                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select student..." /></SelectTrigger>
                                <SelectContent>
                                    {students.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.first_name} {s.last_name} ({s.admission_no})</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Hostel House *</Label>
                                <Select value={exeatForm.data.hostel_id} onValueChange={v => exeatForm.setData('hostel_id', v)}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                                    <SelectContent>
                                        {hostels.map(h => <SelectItem key={h.id} value={String(h.id)}>{h.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Pass Type *</Label>
                                <Select value={exeatForm.data.exeat_type} onValueChange={(v: any) => exeatForm.setData('exeat_type', v)}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="weekend_out">Weekend Out</SelectItem>
                                        <SelectItem value="half_term">Half Term</SelectItem>
                                        <SelectItem value="medical_leave">Medical Leave</SelectItem>
                                        <SelectItem value="disciplinary_suspension">Disciplinary</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Departure Date *</Label>
                                <Input type="date" value={exeatForm.data.departure_date} onChange={e => exeatForm.setData('departure_date', e.target.value)} className="h-9 text-xs mt-1 font-mono" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Return Date *</Label>
                                <Input type="date" value={exeatForm.data.expected_return_date} onChange={e => exeatForm.setData('expected_return_date', e.target.value)} className="h-9 text-xs mt-1 font-mono" />
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs font-bold">Parent / Guardian Contact *</Label>
                            <Input value={exeatForm.data.guardian_approval_contact} onChange={e => exeatForm.setData('guardian_approval_contact', e.target.value)} placeholder="07XXXXXXXX" className="h-9 text-xs mt-1 font-mono" />
                        </div>
                        <div>
                            <Label className="text-xs font-bold">Reason *</Label>
                            <Input value={exeatForm.data.reason} onChange={e => exeatForm.setData('reason', e.target.value)} placeholder="Reason for departure..." className="h-9 text-xs mt-1" />
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setExeatModalOpen(false)} className="h-9 text-xs rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={exeatForm.processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">Issue Pass</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 4: RECORD DAMAGE */}
            <Dialog open={damageModalOpen} onOpenChange={setDamageModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader><DialogTitle className="text-base font-bold text-slate-900">Record Property Damage Fine</DialogTitle></DialogHeader>
                    <form onSubmit={handleDamageSubmit} className="space-y-4 pt-2">
                        <div>
                            <Label className="text-xs font-bold">Student *</Label>
                            <Select value={damageForm.data.student_id} onValueChange={v => damageForm.setData('student_id', v)}>
                                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select student..." /></SelectTrigger>
                                <SelectContent>
                                    {students.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.first_name} {s.last_name} ({s.admission_no})</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-xs font-bold">Hostel House *</Label>
                            <Select value={damageForm.data.hostel_id} onValueChange={v => damageForm.setData('hostel_id', v)}>
                                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select house..." /></SelectTrigger>
                                <SelectContent>
                                    {hostels.map(h => <SelectItem key={h.id} value={String(h.id)}>{h.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Item Damaged *</Label>
                                <Input value={damageForm.data.item_damaged} onChange={e => damageForm.setData('item_damaged', e.target.value)} placeholder="e.g. Window Pane" className="h-9 text-xs mt-1" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Fine Amount (KES) *</Label>
                                <Input type="number" step="0.01" value={damageForm.data.fine_amount} onChange={e => damageForm.setData('fine_amount', e.target.value)} placeholder="1500" className="h-9 text-xs mt-1 font-mono" />
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs font-bold">Incident Date *</Label>
                            <Input type="date" value={damageForm.data.incident_date} onChange={e => damageForm.setData('incident_date', e.target.value)} className="h-9 text-xs mt-1 font-mono" />
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setDamageModalOpen(false)} className="h-9 text-xs rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={damageForm.processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">Record Fine</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 5: VACATE */}
            <Dialog open={!!vacateModalOpen} onOpenChange={() => setVacateModalOpen(null)}>
                <DialogContent className="sm:max-w-sm rounded-2xl">
                    <DialogHeader><DialogTitle className="text-base font-bold text-slate-900">Checkout Student</DialogTitle></DialogHeader>
                    <div className="space-y-3 pt-2">
                        <div className="rounded-xl bg-slate-50 p-3 text-xs">
                            <p className="font-bold text-slate-900">{vacateModalOpen?.student?.first_name} {vacateModalOpen?.student?.last_name}</p>
                            <p className="text-slate-500 mt-0.5">{vacateModalOpen?.hostel?.name} • Room {vacateModalOpen?.room?.room_no}</p>
                        </div>
                        <div>
                            <Label className="text-xs font-bold">Checkout Date *</Label>
                            <Input type="date" value={vacateDate} onChange={e => setVacateDate(e.target.value)} className="h-9 text-xs mt-1 font-mono" />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setVacateModalOpen(null)} className="h-9 text-xs rounded-xl">Cancel</Button>
                        <Button type="button" onClick={handleVacateSubmit} className="h-9 text-xs font-bold px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl">Confirm Checkout</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}