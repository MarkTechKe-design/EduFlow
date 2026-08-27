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
    Building2,
    Plus,
    Pencil,
    Trash2,
    Users,
    Briefcase,
    BookOpen,
    ShieldCheck
} from 'lucide-react';

interface StaffItem {
    id: number;
    first_name: string;
    last_name: string;
    emp_id: string;
}

interface DepartmentItem {
    id: number;
    name: string;
    code?: string | null;
    type: 'academic' | 'administration' | 'support' | 'finance';
    hod_id?: number | null;
    description?: string | null;
    staff_count?: number;
    designations_count?: number;
    hod?: StaffItem | null;
}

interface Props extends PageProps {
    departments: DepartmentItem[];
    staff: StaffItem[];
    stats: {
        total: number;
        academic: number;
        administration: number;
        support: number;
    };
    filters: {
        type: string;
        search: string;
    };
}

const emptyForm = {
    name: '',
    code: '',
    type: 'academic' as 'academic' | 'administration' | 'support' | 'finance',
    hod_id: '' as string,
    description: '',
};

export default function DepartmentsIndex({ departments, staff, stats, filters }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<DepartmentItem | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        ...emptyForm,
    });

    function openCreate() {
        reset();
        setEditing(null);
        setOpen(true);
    }

    function openEdit(d: DepartmentItem) {
        setEditing(d);
        setData({
            name: d.name,
            code: d.code || '',
            type: d.type || 'academic',
            hod_id: d.hod_id ? String(d.hod_id) : '',
            description: d.description || '',
        });
        setOpen(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            put(`/school/departments/${editing.id}`, {
                onSuccess: () => {
                    reset();
                    setOpen(false);
                },
            });
        } else {
            post('/school/departments', {
                onSuccess: () => {
                    reset();
                    setOpen(false);
                },
            });
        }
    }

    function handleDelete(id: number) {
        if (confirm('Are you sure you want to delete this department?')) {
            destroy(`/school/departments/${id}`);
        }
    }

    const typeBadge = (type: string) => {
        switch (type) {
            case 'academic':
                return 'bg-emerald-50 text-emerald-800 border-emerald-200';
            case 'administration':
                return 'bg-purple-50 text-purple-800 border-purple-200';
            case 'finance':
                return 'bg-blue-50 text-blue-800 border-blue-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <AppLayout title="Departments & Academic Subject Clusters">
            <div className="max-w-7xl space-y-6 pb-16">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-emerald-600" />
                            <span>Departments & Curriculum Subject Clusters</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Organize KICD learning area faculties, departmental leadership (HODs), and operational wings.
                        </p>
                    </div>

                    <Button
                        type="button"
                        onClick={openCreate}
                        className="h-10 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-2 shadow-2xs"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Establish Department</span>
                    </Button>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Departments</span>
                        <p className="text-2xl font-black text-slate-900 mt-1">{stats?.total ?? 0}</p>
                        <span className="text-[10px] text-slate-500">Active institutional units</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">KICD Academic Clusters</span>
                        <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.academic ?? 0}</p>
                        <span className="text-[10px] text-slate-500">Learning Area subject wings</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Administration Wings</span>
                        <p className="text-2xl font-black text-purple-700 mt-1">{stats?.administration ?? 0}</p>
                        <span className="text-[10px] text-slate-500">Executive & Front Office</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Support & Logistics</span>
                        <p className="text-2xl font-black text-blue-600 mt-1">{stats?.support ?? 0}</p>
                        <span className="text-[10px] text-slate-500">Finance, Boarding & Transport</span>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                            placeholder="Search by department name or code..."
                            value={filters?.search || ''}
                            onChange={(e) => router.get('/school/departments', { ...filters, search: e.target.value }, { preserveState: true })}
                            className="h-9 text-xs"
                        />

                        <Select
                            value={filters?.type ?? 'all'}
                            onValueChange={(v) => router.get('/school/departments', { ...filters, type: v }, { preserveState: true })}
                        >
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Department Types" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Department Types</SelectItem>
                                <SelectItem value="academic">Academic Subject Cluster</SelectItem>
                                <SelectItem value="administration">Executive Administration</SelectItem>
                                <SelectItem value="finance">Finance & Accounts</SelectItem>
                                <SelectItem value="support">Support & Boarding Services</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Departments Roster Table */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="py-3.5 px-4">Department / Cluster Name</th>
                                    <th className="py-3.5 px-4">Code</th>
                                    <th className="py-3.5 px-4">Category</th>
                                    <th className="py-3.5 px-4">Head of Department (HOD)</th>
                                    <th className="py-3.5 px-4">Active Staff</th>
                                    <th className="py-3.5 px-4">Curriculum Scope / Mandate</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {departments.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-slate-400">
                                            No departments found.
                                        </td>
                                    </tr>
                                ) : (
                                    departments.map((d) => (
                                        <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3.5 px-4 font-bold text-slate-900">
                                                {d.name}
                                            </td>
                                            <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                                                {d.code || '—'}
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase ${typeBadge(d.type)}`}>
                                                    {d.type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                {d.hod ? (
                                                    <div>
                                                        <span className="font-bold text-slate-900">{d.hod.first_name} {d.hod.last_name}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono block">EMP: {d.hod.emp_id}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">No HOD assigned</span>
                                                )}
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
                                {editing ? 'Edit Department / Subject Cluster' : 'Establish New Department'}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                            <div>
                                <Label className="text-xs font-bold">Department / Cluster Title *</Label>
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. Pure Sciences & STEM"
                                    className="h-9 text-xs mt-1"
                                />
                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Code Identifier</Label>
                                    <Input
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                        placeholder="e.g. SCI-STEM"
                                        className="h-9 text-xs mt-1 font-mono uppercase"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Category Wing *</Label>
                                    <Select value={data.type} onValueChange={(v: any) => setData('type', v)}>
                                        <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="academic">Academic Subject Cluster</SelectItem>
                                            <SelectItem value="administration">Executive Administration</SelectItem>
                                            <SelectItem value="finance">Finance & Accounts</SelectItem>
                                            <SelectItem value="support">Support & Boarding</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Appoint Head of Department (HOD)</Label>
                                <Select value={data.hod_id} onValueChange={(v) => setData('hod_id', v)}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select faculty member..." /></SelectTrigger>
                                    <SelectContent>
                                        {staff.map((st) => (
                                            <SelectItem key={st.id} value={String(st.id)}>
                                                {st.first_name} {st.last_name} ({st.emp_id})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Curriculum Scope & Subject Description</Label>
                                <Textarea
                                    rows={3}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="List subjects, practical labs, and faculty responsibilities..."
                                    className="text-xs resize-none mt-1"
                                />
                            </div>

                            <DialogFooter className="gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-9 text-xs rounded-xl">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                                    {editing ? 'Update Department' : 'Establish Department'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}