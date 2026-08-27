import AppLayout from '@/Layouts/AppLayout';
import { useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import type { PageProps } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
    BadgeCheck,
    Plus,
    Pencil,
    Trash2,
    Users,
    Shield,
    Briefcase,
    Building2
} from 'lucide-react';

interface DesignationItem {
    id: number;
    name: string;
    cadre: 'leadership' | 'teaching' | 'finance_admin' | 'operations_support';
    is_leadership: boolean;
    department_id?: number | null;
    description?: string | null;
    staff_count?: number;
    department?: { id: number; name: string } | null;
}

interface Props extends PageProps {
    designations: DesignationItem[];
    departments: { id: number; name: string }[];
    stats: {
        total: number;
        leadership: number;
        teaching: number;
        operations_support: number;
    };
    filters: {
        cadre: string;
        department_id: string;
        search: string;
    };
}

const emptyForm = {
    name: '',
    cadre: 'teaching' as 'leadership' | 'teaching' | 'finance_admin' | 'operations_support',
    is_leadership: false,
    department_id: '' as string,
    description: '',
};

export default function DesignationsIndex({ designations, departments, stats, filters }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<DesignationItem | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        ...emptyForm,
    });

    function openCreate() {
        reset();
        setEditing(null);
        setOpen(true);
    }

    function openEdit(d: DesignationItem) {
        setEditing(d);
        setData({
            name: d.name,
            cadre: d.cadre || 'teaching',
            is_leadership: d.is_leadership || false,
            department_id: d.department_id ? String(d.department_id) : '',
            description: d.description || '',
        });
        setOpen(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            put(`/school/designations/${editing.id}`, {
                onSuccess: () => {
                    reset();
                    setOpen(false);
                },
            });
        } else {
            post('/school/designations', {
                onSuccess: () => {
                    reset();
                    setOpen(false);
                },
            });
        }
    }

    function handleDelete(id: number) {
        if (confirm('Are you sure you want to delete this designation?')) {
            destroy(`/school/designations/${id}`);
        }
    }

    const cadreBadge = (cadre: string) => {
        switch (cadre) {
            case 'leadership':
                return 'bg-purple-50 text-purple-800 border-purple-200';
            case 'teaching':
                return 'bg-emerald-50 text-emerald-800 border-emerald-200';
            case 'finance_admin':
                return 'bg-blue-50 text-blue-800 border-blue-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <AppLayout title="Staff Designations & Roles">
            <div className="max-w-7xl space-y-6 pb-16">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <BadgeCheck className="w-5 h-5 text-emerald-600" />
                            <span>Staff Job Designations & Roles</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Establish institutional staff hierarchy, teaching cadres, executive positions, and department mappings.
                        </p>
                    </div>

                    <Button
                        type="button"
                        onClick={openCreate}
                        className="h-10 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-2 shadow-2xs"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add New Designation</span>
                    </Button>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Defined</span>
                        <p className="text-2xl font-black text-slate-900 mt-1">{stats?.total ?? 0}</p>
                        <span className="text-[10px] text-slate-500">Official job roles</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Executive & HODs</span>
                        <p className="text-2xl font-black text-purple-700 mt-1">{stats?.leadership ?? 0}</p>
                        <span className="text-[10px] text-slate-500">School administration</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Teaching Cadres</span>
                        <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.teaching ?? 0}</p>
                        <span className="text-[10px] text-slate-500">Instructional facilitators</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Operations & Support</span>
                        <p className="text-2xl font-black text-blue-600 mt-1">{stats?.operations_support ?? 0}</p>
                        <span className="text-[10px] text-slate-500">Finance, health & logistics</span>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input
                            placeholder="Search designation title..."
                            value={filters?.search || ''}
                            onChange={(e) => router.get('/school/designations', { ...filters, search: e.target.value }, { preserveState: true })}
                            className="h-9 text-xs"
                        />

                        <Select
                            value={filters?.cadre ?? 'all'}
                            onValueChange={(v) => router.get('/school/designations', { ...filters, cadre: v }, { preserveState: true })}
                        >
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Cadres" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Cadres</SelectItem>
                                <SelectItem value="leadership">Executive & Leadership</SelectItem>
                                <SelectItem value="teaching">Teaching Faculty</SelectItem>
                                <SelectItem value="finance_admin">Finance & Administration</SelectItem>
                                <SelectItem value="operations_support">Operations & Support</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters?.department_id ?? 'all'}
                            onValueChange={(v) => router.get('/school/designations', { ...filters, department_id: v }, { preserveState: true })}
                        >
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Departments" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map((d) => (
                                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Designations Table */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="py-3.5 px-4">Designation Title</th>
                                    <th className="py-3.5 px-4">Cadre Classification</th>
                                    <th className="py-3.5 px-4">Assigned Department</th>
                                    <th className="py-3.5 px-4">Active Staff</th>
                                    <th className="py-3.5 px-4">Role Description</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {designations.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-slate-400">
                                            No designations found.
                                        </td>
                                    </tr>
                                ) : (
                                    designations.map((d) => (
                                        <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-slate-900 flex items-center gap-2">
                                                    <span>{d.name}</span>
                                                    {d.is_leadership && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                                                            Lead
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase ${cadreBadge(d.cadre)}`}>
                                                    {d.cadre.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-medium">
                                                {d.department?.name || 'General / Unassigned'}
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span className="inline-flex items-center text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                                    {d.staff_count ?? 0} staff
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                                                {d.description || '—'}
                                            </td>
                                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openEdit(d)}
                                                        className="h-7 text-xs font-bold rounded-lg border-slate-200"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(d.id)}
                                                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 rounded-lg"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Create/Edit Modal Dialog */}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="sm:max-w-md rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900">
                                {editing ? 'Edit Job Designation' : 'Add New Staff Designation'}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                            <div>
                                <Label className="text-xs font-bold">Designation Title *</Label>
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. Senior Teacher / HOD"
                                    className="h-9 text-xs mt-1"
                                />
                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Cadre Category *</Label>
                                    <Select value={data.cadre} onValueChange={(v: any) => setData('cadre', v)}>
                                        <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="leadership">Leadership</SelectItem>
                                            <SelectItem value="teaching">Teaching Faculty</SelectItem>
                                            <SelectItem value="finance_admin">Finance & Accounts</SelectItem>
                                            <SelectItem value="operations_support">Operations / Support</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Department</Label>
                                    <Select value={data.department_id} onValueChange={(v) => setData('department_id', v)}>
                                        <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Assign Department" /></SelectTrigger>
                                        <SelectContent>
                                            {departments.map((d) => (
                                                <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                                    <input
                                        type="checkbox"
                                        checked={data.is_leadership}
                                        onChange={(e) => setData('is_leadership', e.target.checked)}
                                        className="rounded border-slate-300 text-purple-600"
                                    />
                                    <span>Executive / Academic Leadership Position</span>
                                </label>
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Job Role Summary & Responsibilities</Label>
                                <Textarea
                                    rows={3}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Brief scope of responsibilities..."
                                    className="text-xs resize-none mt-1"
                                />
                            </div>

                            <DialogFooter className="gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-9 text-xs rounded-xl">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                                    {editing ? 'Update Designation' : 'Save Designation'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}