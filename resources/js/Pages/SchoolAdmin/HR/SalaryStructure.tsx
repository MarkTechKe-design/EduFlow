import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps, PaginatedData } from '@/Types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import {
    ArrowLeft,
    Calculator,
    CheckCircle2,
    DollarSign,
    Edit2,
    Filter,
    Layers,
    Plus,
    Receipt,
    Save,
    ShieldCheck,
    Trash2,
    Users
} from 'lucide-react';

interface StaffItem {
    id: number;
    first_name: string;
    last_name: string;
    emp_id?: string | null;
    department?: { id: number; name: string } | null;
    designation?: { id: number; name: string } | null;
    salary_structure?: {
        id: number;
        basic_salary: number;
        allowances?: Array<{ label: string; amount: number }> | null;
        deductions?: Array<{ label: string; amount: number }> | null;
    } | null;
}

interface Props extends PageProps {
    staffList: PaginatedData<StaffItem>;
    departments: Array<{ id: number; name: string }>;
    statutoryConfig?: any;
    filters: { department_id?: string };
}

export default function SalaryStructureIndex({ auth, staffList, departments, statutoryConfig, filters }: Props) {
    const [departmentId, setDepartmentId] = useState(filters.department_id || 'all');
    const [editingStaff, setEditingStaff] = useState<StaffItem | null>(null);

    const form = useForm({
        basic_salary: 0,
        allowances: [] as Array<{ label: string; amount: number }>,
        deductions: [] as Array<{ label: string; amount: number }>,
    });

    const openEditModal = (staff: StaffItem) => {
        setEditingStaff(staff);
        form.setData({
            basic_salary: Number(staff.salary_structure?.basic_salary || 0),
            allowances: staff.salary_structure?.allowances || [],
            deductions: staff.salary_structure?.deductions || [],
        });
    };

    const addAllowance = () => {
        form.setData('allowances', [...form.data.allowances, { label: 'House Allowance', amount: 0 }]);
    };

    const removeAllowance = (idx: number) => {
        form.setData('allowances', form.data.allowances.filter((_, i) => i !== idx));
    };

    const addDeduction = () => {
        form.setData('deductions', [...form.data.deductions, { label: 'Sacco / Welfare', amount: 0 }]);
    };

    const removeDeduction = (idx: number) => {
        form.setData('deductions', form.data.deductions.filter((_, i) => i !== idx));
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingStaff) return;

        form.put(`/school/hr/salary-structure/${editingStaff.id}`, {
            onSuccess: () => setEditingStaff(null),
        });
    };

    // Live Calculation Simulation
    const totalAllowances = form.data.allowances.reduce((acc, a) => acc + Number(a.amount || 0), 0);
    const gross = Number(form.data.basic_salary || 0) + totalAllowances;
    
    // NSSF preview (6% capped at KSh 4,320)
    const nssfPreview = gross > 0 ? Math.min(gross * 0.06, 4320) : 0;
    const shifPreview = gross > 0 ? Math.max(300, gross * 0.0275) : 0;
    const ahlPreview = gross > 0 ? gross * 0.015 : 0;
    const customDedTotal = form.data.deductions.reduce((acc, d) => acc + Number(d.amount || 0), 0);
    const estimatedNet = Math.max(0, gross - (nssfPreview + shifPreview + ahlPreview + customDedTotal));

    return (
        <AppLayout header="Staff Salary Structures & Compensation">
            <Head title="Salary Structures - EduFlow" />

            <div className="max-w-7xl mx-auto space-y-6 pb-16">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                    <div>
                        <Link
                            href="/school/hr/payroll"
                            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 mb-1"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                            Back to Payroll Records
                        </Link>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-indigo-600" />
                            Staff Base Salary & Compensation Master
                        </h1>
                        <p className="text-xs text-slate-500">
                            Configure base wages, customized allowances, and voluntary deductions per employee.
                        </p>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                                    <th className="py-3 px-4">Staff Member</th>
                                    <th className="py-3 px-4">Department & Designation</th>
                                    <th className="py-3 px-4 text-right">Basic Salary</th>
                                    <th className="py-3 px-4 text-right">Allowances</th>
                                    <th className="py-3 px-4 text-right">Voluntary Deductions</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {staffList.data && staffList.data.length > 0 ? (
                                    staffList.data.map((st) => {
                                        const struct = st.salary_structure;
                                        const basic = Number(struct?.basic_salary || 0);
                                        const allowTotal = struct?.allowances?.reduce((a, b) => a + Number(b.amount || 0), 0) || 0;
                                        const dedTotal = struct?.deductions?.reduce((a, b) => a + Number(b.amount || 0), 0) || 0;

                                        return (
                                            <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                <td className="py-3 px-4">
                                                    <div className="font-bold text-slate-900 dark:text-white">
                                                        {st.first_name} {st.last_name}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-mono">
                                                        {st.emp_id || 'STAFF'}
                                                    </div>
                                                </td>

                                                <td className="py-3 px-4">
                                                    <div className="font-semibold">{st.department?.name || 'General'}</div>
                                                    <div className="text-[11px] text-slate-500">{st.designation?.name || 'Staff'}</div>
                                                </td>

                                                <td className="py-3 px-4 text-right font-mono font-bold">
                                                    KSh {basic.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>

                                                <td className="py-3 px-4 text-right font-mono">
                                                    {allowTotal > 0 ? `+KSh ${allowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                                                </td>

                                                <td className="py-3 px-4 text-right font-mono text-rose-600">
                                                    {dedTotal > 0 ? `-KSh ${dedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '-'}
                                                </td>

                                                <td className="py-3 px-4 text-center">
                                                    {basic > 0 ? (
                                                        <span className="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                                            Not Set
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="py-3 px-4 text-right">
                                                    <button
                                                        onClick={() => openEditModal(st)}
                                                        className="inline-flex items-center h-7 px-2.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold"
                                                    >
                                                        <Edit2 className="w-3 h-3 mr-1" />
                                                        Edit Structure
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-xs text-slate-500">
                                            No active staff records found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* EDIT SALARY STRUCTURE MODAL */}
            {editingStaff && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div>
                                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                                    Configure Salary: {editingStaff.first_name} {editingStaff.last_name}
                                </h3>
                                <p className="text-[11px] text-slate-500">{editingStaff.designation?.name} • {editingStaff.department?.name}</p>
                            </div>
                            <button onClick={() => setEditingStaff(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4 text-xs">
                            <div>
                                <label className="font-bold block mb-1">Basic Monthly Salary (KSh):</label>
                                <Input
                                    type="number"
                                    required
                                    min={0}
                                    value={form.data.basic_salary}
                                    onChange={(e) => form.setData('basic_salary', Number(e.target.value))}
                                    className="h-9 text-xs font-mono font-bold text-slate-900 dark:text-white"
                                />
                            </div>

                            {/* Allowances */}
                            <div className="space-y-2 border-t pt-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Allowances</span>
                                    <button type="button" onClick={addAllowance} className="text-indigo-600 font-bold flex items-center gap-1">
                                        <Plus className="w-3 h-3" /> Add Allowance
                                    </button>
                                </div>
                                {form.data.allowances.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <Input
                                            placeholder="e.g. House Allowance"
                                            value={item.label}
                                            onChange={(e) => {
                                                const updated = [...form.data.allowances];
                                                updated[idx].label = e.target.value;
                                                form.setData('allowances', updated);
                                            }}
                                            className="h-8 text-xs flex-1"
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Amount (KSh)"
                                            value={item.amount}
                                            onChange={(e) => {
                                                const updated = [...form.data.allowances];
                                                updated[idx].amount = Number(e.target.value);
                                                form.setData('allowances', updated);
                                            }}
                                            className="h-8 text-xs font-mono w-32"
                                        />
                                        <button type="button" onClick={() => removeAllowance(idx)} className="text-slate-400 hover:text-rose-600">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Voluntary Deductions */}
                            <div className="space-y-2 border-t pt-3">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Custom / Voluntary Deductions</span>
                                    <button type="button" onClick={addDeduction} className="text-rose-600 font-bold flex items-center gap-1">
                                        <Plus className="w-3 h-3" /> Add Deduction
                                    </button>
                                </div>
                                {form.data.deductions.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <Input
                                            placeholder="e.g. Staff Welfare"
                                            value={item.label}
                                            onChange={(e) => {
                                                const updated = [...form.data.deductions];
                                                updated[idx].label = e.target.value;
                                                form.setData('deductions', updated);
                                            }}
                                            className="h-8 text-xs flex-1"
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Amount (KSh)"
                                            value={item.amount}
                                            onChange={(e) => {
                                                const updated = [...form.data.deductions];
                                                updated[idx].amount = Number(e.target.value);
                                                form.setData('deductions', updated);
                                            }}
                                            className="h-8 text-xs font-mono w-32"
                                        />
                                        <button type="button" onClick={() => removeDeduction(idx)} className="text-slate-400 hover:text-rose-600">
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Live Statutory Preview Card */}
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-1 font-mono text-[11px]">
                                <div className="font-bold text-indigo-700 dark:text-indigo-300 flex justify-between">
                                    <span>Gross Monthly Salary:</span>
                                    <span>KSh {gross.toFixed(2)}</span>
                                </div>
                                <div className="text-slate-600 dark:text-slate-400 flex justify-between">
                                    <span>Est. NSSF Contribution:</span>
                                    <span>-KSh {nssfPreview.toFixed(2)}</span>
                                </div>
                                <div className="text-slate-600 dark:text-slate-400 flex justify-between">
                                    <span>Est. SHIF (2.75%):</span>
                                    <span>-KSh {shifPreview.toFixed(2)}</span>
                                </div>
                                <div className="text-slate-600 dark:text-slate-400 flex justify-between">
                                    <span>Est. Housing Levy (1.5%):</span>
                                    <span>-KSh {ahlPreview.toFixed(2)}</span>
                                </div>
                                <div className="font-bold text-emerald-700 dark:text-emerald-300 flex justify-between pt-1 border-t">
                                    <span>Estimated Net Take-Home:</span>
                                    <span>~KSh {estimatedNet.toFixed(2)}</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <Button type="button" variant="outline" onClick={() => setEditingStaff(null)} size="sm">Cancel</Button>
                                <Button type="submit" disabled={form.processing} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                                    <Save className="w-3.5 h-3.5 mr-1" />
                                    Save Salary Structure
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}