import { useState } from 'react';
import { usePage, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Award, CheckCircle2 } from 'lucide-react';
import type { PageProps } from '@/types';

interface GradeItem {
    id: number;
    grade: string;
    gpa: number;
    min_marks: number;
    max_marks: number;
    remarks?: string | null;
    sort_order: number;
}

interface Props extends PageProps {
    grades?: GradeItem[];
}

const emptyForm = {
    grade: '',
    gpa: '',
    min_marks: '',
    max_marks: '',
    remarks: '',
    sort_order: 1,
};

export default function GradeScalesIndex({ grades = [] }: Props) {
    const { flash } = usePage<PageProps>().props;
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<GradeItem | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        ...emptyForm,
    });

    function openCreate() {
        reset();
        setEditing(null);
        setOpen(true);
    }

    function openEdit(g: GradeItem) {
        setEditing(g);
        setData({
            grade: g.grade,
            gpa: String(g.gpa),
            min_marks: String(g.min_marks),
            max_marks: String(g.max_marks),
            remarks: g.remarks || '',
            sort_order: g.sort_order,
        });
        setOpen(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            put(`/school/grade-scales/${editing.id}`, {
                onSuccess: () => { setOpen(false); reset(); },
            });
        } else {
            post('/school/grade-scales', {
                onSuccess: () => { setOpen(false); reset(); },
            });
        }
    }

    function handleDelete(id: number) {
        if (confirm('Are you sure you want to remove this grade tier?')) {
            destroy(`/school/grade-scales/${id}`);
        }
    }

    const gradeList = grades || [];

    return (
        <AppLayout title="Grading Scales">
            <div className="space-y-6 max-w-7xl mx-auto pb-16">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Award className="w-5 h-5 text-indigo-600" />
                            <span>Institutional Grading Scale</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Configure marks distribution, GPA points, and qualitative remarks for student report cards.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            onClick={openCreate}
                            className="h-9 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-2 shadow-2xs"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Grade</span>
                        </Button>
                    </div>
                </div>

                {flash?.success && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-800 font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* Grades Table */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="py-3 px-4">Grade</th>
                                <th className="py-3 px-4">GPA</th>
                                <th className="py-3 px-4">Marks Range (%)</th>
                                <th className="py-3 px-4">Remarks</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {gradeList.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-slate-400">
                                        No grade tiers configured.
                                    </td>
                                </tr>
                            ) : (
                                gradeList.map((g) => (
                                    <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <span className="font-black text-slate-900 text-sm">{g.grade}</span>
                                        </td>
                                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                                            {Number(g.gpa).toFixed(2)}
                                        </td>
                                        <td className="py-3.5 px-4 font-mono text-slate-700">
                                            {g.min_marks} – {g.max_marks}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-600 font-semibold">
                                            {g.remarks || '—'}
                                        </td>
                                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openEdit(g)}
                                                    className="h-7 text-xs font-bold rounded-lg border-slate-200"
                                                >
                                                    <Pencil className="w-3 h-3 mr-1" /> Edit
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(g.id)}
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

            {/* Modal Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900">
                            {editing ? 'Edit Grade Tier' : 'Add Grade Tier'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Grade *</Label>
                                <Input
                                    value={data.grade}
                                    onChange={e => setData('grade', e.target.value)}
                                    placeholder="e.g. A+"
                                    className="h-9 text-xs mt-1"
                                />
                                {errors.grade && <p className="text-xs text-red-500 mt-1">{errors.grade}</p>}
                            </div>

                            <div>
                                <Label className="text-xs font-bold">GPA Points *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={data.gpa}
                                    onChange={e => setData('gpa', e.target.value)}
                                    placeholder="e.g. 5.00"
                                    className="h-9 text-xs mt-1 font-mono"
                                />
                                {errors.gpa && <p className="text-xs text-red-500 mt-1">{errors.gpa}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Min Marks (%) *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={data.min_marks}
                                    onChange={e => setData('min_marks', e.target.value)}
                                    placeholder="80.00"
                                    className="h-9 text-xs mt-1 font-mono"
                                />
                                {errors.min_marks && <p className="text-xs text-red-500 mt-1">{errors.min_marks}</p>}
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Max Marks (%) *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={data.max_marks}
                                    onChange={e => setData('max_marks', e.target.value)}
                                    placeholder="100.00"
                                    className="h-9 text-xs mt-1 font-mono"
                                />
                                {errors.max_marks && <p className="text-xs text-red-500 mt-1">{errors.max_marks}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Remarks</Label>
                                <Input
                                    value={data.remarks}
                                    onChange={e => setData('remarks', e.target.value)}
                                    placeholder="e.g. Outstanding"
                                    className="h-9 text-xs mt-1"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Sort Order *</Label>
                                <Input
                                    type="number"
                                    value={data.sort_order}
                                    onChange={e => setData('sort_order', Number(e.target.value))}
                                    className="h-9 text-xs mt-1 font-mono"
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-9 text-xs rounded-xl">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                                {editing ? 'Update Grade' : 'Save Grade'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}