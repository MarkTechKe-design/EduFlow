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
    CalendarDays,
    Plus,
    Pencil,
    Trash2,
    CalendarCheck,
    Building2,
    Clock,
    Tag
} from 'lucide-react';

interface HolidayItem {
    id: number;
    name: string;
    date: string;
    end_date?: string | null;
    type: 'public_holiday' | 'mid_term_break' | 'term_break' | 'school_event';
    term: string;
    description?: string | null;
}

interface Props extends PageProps {
    holidays: HolidayItem[];
    stats: {
        total: number;
        public_holiday: number;
        mid_term: number;
        term_break: number;
    };
    filters: {
        type: string;
        term: string;
        search: string;
    };
}

const emptyForm = {
    name: '',
    date: '',
    end_date: '',
    type: 'public_holiday' as 'public_holiday' | 'mid_term_break' | 'term_break' | 'school_event',
    term: 'Term 2',
    description: '',
};

export default function HolidaysIndex({ holidays, stats, filters }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<HolidayItem | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        ...emptyForm,
    });

    function openCreate() {
        reset();
        setEditing(null);
        setOpen(true);
    }

    function openEdit(h: HolidayItem) {
        setEditing(h);
        setData({
            name: h.name,
            date: h.date,
            end_date: h.end_date || h.date,
            type: h.type || 'public_holiday',
            term: h.term || 'Term 2',
            description: h.description || '',
        });
        setOpen(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            put(`/school/holidays/${editing.id}`, {
                onSuccess: () => {
                    reset();
                    setOpen(false);
                },
            });
        } else {
            post('/school/holidays', {
                onSuccess: () => {
                    reset();
                    setOpen(false);
                },
            });
        }
    }

    function handleDelete(id: number) {
        if (confirm('Are you sure you want to remove this holiday entry?')) {
            destroy(`/school/holidays/${id}`);
        }
    }

    const typeBadge = (type: string) => {
        switch (type) {
            case 'public_holiday':
                return 'bg-emerald-50 text-emerald-800 border-emerald-200';
            case 'mid_term_break':
                return 'bg-amber-50 text-amber-800 border-amber-200';
            case 'term_break':
                return 'bg-purple-50 text-purple-800 border-purple-200';
            default:
                return 'bg-blue-50 text-blue-800 border-blue-200';
        }
    };

    return (
        <AppLayout title="Academic Holidays & Term Dates">
            <div className="max-w-7xl space-y-6 pb-16">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-emerald-600" />
                            <span>Academic Calendar Holidays & Term Recesses</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Official Kenyan Ministry of Education school term dates, gazetted public holidays, and mid-term breaks.
                        </p>
                    </div>

                    <Button
                        type="button"
                        onClick={openCreate}
                        className="h-10 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-2 shadow-2xs"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Add Holiday / Recess</span>
                    </Button>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Calendar Dates</span>
                        <p className="text-2xl font-black text-slate-900 mt-1">{stats?.total ?? 0}</p>
                        <span className="text-[10px] text-slate-500">Scheduled non-school days</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">National Holidays</span>
                        <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.public_holiday ?? 0}</p>
                        <span className="text-[10px] text-slate-500">Gazetted public days</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Mid-Term Breaks</span>
                        <p className="text-2xl font-black text-amber-600 mt-1">{stats?.mid_term ?? 0}</p>
                        <span className="text-[10px] text-slate-500">Termly half-term pauses</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Term Vacations</span>
                        <p className="text-2xl font-black text-purple-700 mt-1">{stats?.term_break ?? 0}</p>
                        <span className="text-[10px] text-slate-500">April, August & Dec holidays</span>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input
                            placeholder="Search holiday name..."
                            value={filters?.search || ''}
                            onChange={(e) => router.get('/school/holidays', { ...filters, search: e.target.value }, { preserveState: true })}
                            className="h-9 text-xs"
                        />

                        <Select
                            value={filters?.type ?? 'all'}
                            onValueChange={(v) => router.get('/school/holidays', { ...filters, type: v }, { preserveState: true })}
                        >
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Holiday Types" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Holiday Types</SelectItem>
                                <SelectItem value="public_holiday">Gazetted Public Holiday</SelectItem>
                                <SelectItem value="mid_term_break">MoE Mid-Term Break</SelectItem>
                                <SelectItem value="term_break">Term Vacation / Recess</SelectItem>
                                <SelectItem value="school_event">School Event / Exam Recess</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters?.term ?? 'all'}
                            onValueChange={(v) => router.get('/school/holidays', { ...filters, term: v }, { preserveState: true })}
                        >
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Academic Terms" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Academic Terms</SelectItem>
                                <SelectItem value="Term 1">Term 1</SelectItem>
                                <SelectItem value="Term 2">Term 2</SelectItem>
                                <SelectItem value="Term 3">Term 3</SelectItem>
                                <SelectItem value="Annual">Annual / General</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Holidays Roster Table */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="py-3.5 px-4">Calendar Date / Duration</th>
                                    <th className="py-3.5 px-4">Holiday / Event Title</th>
                                    <th className="py-3.5 px-4">Category</th>
                                    <th className="py-3.5 px-4">Academic Term</th>
                                    <th className="py-3.5 px-4">Description & Regulatory Scope</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {holidays.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-slate-400">
                                            No holiday dates found.
                                        </td>
                                    </tr>
                                ) : (
                                    holidays.map((h) => (
                                        <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold text-slate-800">
                                                {h.date} {h.end_date && h.end_date !== h.date ? `to ${h.end_date}` : ''}
                                            </td>
                                            <td className="py-3.5 px-4 font-bold text-slate-900">
                                                {h.name}
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase ${typeBadge(h.type)}`}>
                                                    {h.type.replace(/_/g, ' ')}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span className="inline-flex items-center text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                                    {h.term}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">
                                                {h.description || '—'}
                                            </td>
                                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openEdit(h)}
                                                        className="h-7 text-xs font-bold rounded-lg border-slate-200"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(h.id)}
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
                                {editing ? 'Edit Academic Holiday Entry' : 'Add Holiday / Term Recess'}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                            <div>
                                <Label className="text-xs font-bold">Holiday / Event Title *</Label>
                                <Input
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="e.g. Mashujaa Day or Term 2 Mid-Term Break"
                                    className="h-9 text-xs mt-1"
                                />
                                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Start Date *</Label>
                                    <Input
                                        type="date"
                                        value={data.date}
                                        onChange={(e) => setData('date', e.target.value)}
                                        className="h-9 text-xs mt-1"
                                    />
                                    {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">End Date (Optional for ranges)</Label>
                                    <Input
                                        type="date"
                                        value={data.end_date}
                                        onChange={(e) => setData('end_date', e.target.value)}
                                        className="h-9 text-xs mt-1"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Category Classification *</Label>
                                    <Select value={data.type} onValueChange={(v: any) => setData('type', v)}>
                                        <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="public_holiday">Gazetted Public Holiday</SelectItem>
                                            <SelectItem value="mid_term_break">MoE Mid-Term Break</SelectItem>
                                            <SelectItem value="term_break">Term Vacation / Recess</SelectItem>
                                            <SelectItem value="school_event">School Event / Exam Window</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Academic Term *</Label>
                                    <Select value={data.term} onValueChange={(v: any) => setData('term', v)}>
                                        <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Term 1">Term 1</SelectItem>
                                            <SelectItem value="Term 2">Term 2</SelectItem>
                                            <SelectItem value="Term 3">Term 3</SelectItem>
                                            <SelectItem value="Annual">Annual / General</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Description & Gazette Notes</Label>
                                <Textarea
                                    rows={3}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Add MoE circular reference or holiday context..."
                                    className="text-xs resize-none mt-1"
                                />
                            </div>

                            <DialogFooter className="gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-9 text-xs rounded-xl">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                                    {editing ? 'Update Holiday' : 'Save Holiday'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}