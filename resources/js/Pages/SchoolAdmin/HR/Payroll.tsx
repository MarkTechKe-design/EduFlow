import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps, PaginatedData } from '@/Types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { formatDate } from '@/lib/utils';
import {
    AlertCircle,
    Building2,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    Download,
    Eye,
    FileSpreadsheet,
    FileText,
    Filter,
    Play,
    Printer,
    Receipt,
    RefreshCw,
    Save,
    Settings2,
    Shield,
    ShieldCheck,
    Sliders,
    Users
} from 'lucide-react';

interface PayrollRecord {
    id: number;
    month_year: string;
    basic_salary: number;
    total_allowances: number;
    total_deductions: number;
    net_salary: number;
    working_days: number;
    present_days: number;
    leave_days: number;
    status: 'draft' | 'generated' | 'paid';
    paid_on?: string | null;
    deductions_snapshot?: Array<{ label: string; amount: number; code?: string; type?: string }> | null;
    staff?: {
        id: number;
        first_name: string;
        last_name: string;
        emp_id?: string | null;
        department?: { id: number; name: string } | null;
        designation?: { id: number; name: string } | null;
    } | null;
}

interface StatutoryConfig {
    id: number;
    nssf_enabled: boolean;
    nssf_rate: number;
    nssf_tier1_limit: number;
    nssf_tier2_limit: number;
    shif_enabled: boolean;
    shif_rate: number;
    shif_min_amount: number;
    housing_levy_enabled: boolean;
    housing_levy_rate: number;
    paye_enabled: boolean;
    paye_brackets: Array<{ limit: number | null; rate: number }>;
    personal_relief: number;
    shif_relief_rate: number;
    housing_relief_rate: number;
}

interface Props extends PageProps {
    payrolls: PaginatedData<PayrollRecord>;
    departments: Array<{ id: number; name: string }>;
    statutoryConfig: StatutoryConfig;
    filters: {
        month_year?: string;
        department_id?: string;
        status?: string;
    };
    stats: {
        total_net: number;
        paid_count: number;
        draft_count: number;
    };
}

export default function PayrollIndex({ auth, payrolls, departments, statutoryConfig, filters, stats }: Props) {
    const [monthYear, setMonthYear] = useState(filters.month_year || new Date().toISOString().slice(0, 7));
    const [departmentId, setDepartmentId] = useState(filters.department_id || 'all');
    const [status, setStatus] = useState(filters.status || 'all');

    // Modals
    const [generateModalOpen, setGenerateModalOpen] = useState(false);
    const [configModalOpen, setConfigModalOpen] = useState(false);

    // Batch Payroll Generation Form
    const genForm = useForm({
        month_year: monthYear,
        department_id: '',
        working_days: 26,
    });

    // Statutory Settings Form
    const statForm = useForm({
        nssf_enabled: statutoryConfig?.nssf_enabled ?? true,
        nssf_rate: statutoryConfig?.nssf_rate ?? 6.00,
        nssf_tier1_limit: statutoryConfig?.nssf_tier1_limit ?? 8000.00,
        nssf_tier2_limit: statutoryConfig?.nssf_tier2_limit ?? 72000.00,
        shif_enabled: statutoryConfig?.shif_enabled ?? true,
        shif_rate: statutoryConfig?.shif_rate ?? 2.75,
        shif_min_amount: statutoryConfig?.shif_min_amount ?? 300.00,
        housing_levy_enabled: statutoryConfig?.housing_levy_enabled ?? true,
        housing_levy_rate: statutoryConfig?.housing_levy_rate ?? 1.50,
        paye_enabled: statutoryConfig?.paye_enabled ?? true,
        paye_brackets: statutoryConfig?.paye_brackets ?? [
            { limit: 24000.00, rate: 10.00 },
            { limit: 8333.33, rate: 25.00 },
            { limit: 467666.67, rate: 30.00 },
            { limit: 300000.00, rate: 32.50 },
            { limit: null, rate: 35.00 },
        ],
        personal_relief: statutoryConfig?.personal_relief ?? 2400.00,
        shif_relief_rate: statutoryConfig?.shif_relief_rate ?? 15.00,
        housing_relief_rate: statutoryConfig?.housing_relief_rate ?? 15.00,
    });

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/school/hr/payroll',
            {
                month_year: monthYear,
                department_id: departmentId === 'all' ? undefined : departmentId,
                status: status === 'all' ? undefined : status,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        genForm.post('/school/hr/payroll/generate', {
            onSuccess: () => setGenerateModalOpen(false),
        });
    };

    const handleSaveStatutory = (e: React.FormEvent) => {
        e.preventDefault();
        statForm.post('/school/hr/payroll/statutory-settings', {
            onSuccess: () => setConfigModalOpen(false),
        });
    };

    const handleMarkPaid = (id: number) => {
        if (confirm('Mark this payroll record as disbursed/paid?')) {
            router.put(`/school/hr/payroll/${id}/paid`);
        }
    };

    return (
        <AppLayout header="Staff Payroll & Statutory Remittance Engine">
            <Head title="Staff Payroll - EduFlow" />

            <div className="max-w-7xl mx-auto space-y-6 pb-16">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                    <div>
                        <div className="flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-indigo-600" />
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Staff Payroll & Kenya Statutory Engine
                            </h1>
                            <span className="inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold">
                                <ShieldCheck className="w-3 h-3 mr-1" /> KRA / SHIF / NSSF Automated
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Automated monthly salary computation, attendance proration, and statutory deduction schedules.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            onClick={() => setConfigModalOpen(true)}
                            size="sm"
                            variant="outline"
                            className="h-9 text-xs font-semibold"
                        >
                            <Sliders className="w-3.5 h-3.5 mr-1.5" />
                            Statutory & Tax Rules
                        </Button>

                        <Button
                            type="button"
                            onClick={() => setGenerateModalOpen(true)}
                            size="sm"
                            className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                        >
                            <Play className="w-3.5 h-3.5 mr-1.5" />
                            Generate Monthly Payroll
                        </Button>
                    </div>
                </div>

                {/* Summary Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                        <div className="text-xs font-medium text-slate-500">Total Net Remittance</div>
                        <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                            KSh {Number(stats.total_net).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[11px] text-indigo-600 font-semibold mt-1">Period: {monthYear}</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                        <div className="text-xs font-medium text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Disbursed Salaries
                        </div>
                        <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                            {stats.paid_count} Staff
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">Settled to bank accounts</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                        <div className="text-xs font-medium text-amber-600 font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Pending Disbursal
                        </div>
                        <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-1">
                            {stats.draft_count} Staff
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">Calculated & ready</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                        <div className="text-xs font-medium text-slate-500">Salary Structures</div>
                        <Link
                            href="/school/hr/salary-structure"
                            className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-700"
                        >
                            Manage Base Salaries &rarr;
                        </Link>
                        <div className="text-[10px] text-slate-400">163 Active Staff Members</div>
                    </div>
                </div>

                {/* Filter Workspace */}
                <form onSubmit={handleFilter} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                        <label className="text-xs font-bold block mb-1">Payroll Period:</label>
                        <Input
                            type="month"
                            value={monthYear}
                            onChange={(e) => setMonthYear(e.target.value)}
                            className="h-9 text-xs font-mono"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold block mb-1">Department:</label>
                        <Select value={departmentId} onValueChange={setDepartmentId}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Departments" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map((d) => (
                                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-xs font-bold block mb-1">Disbursal Status:</label>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Records</SelectItem>
                                <SelectItem value="generated">Generated / Draft</SelectItem>
                                <SelectItem value="paid">Paid / Disbursed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-end">
                        <Button type="submit" size="sm" className="h-9 text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold w-full">
                            <Filter className="w-3.5 h-3.5 mr-1" />
                            Filter Payroll Ledger
                        </Button>
                    </div>
                </form>

                {/* Payroll Ledger Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                                    <th className="py-3 px-4">Staff Member</th>
                                    <th className="py-3 px-4">Department</th>
                                    <th className="py-3 px-4 text-right">Basic (KSh)</th>
                                    <th className="py-3 px-4 text-right">Gross (KSh)</th>
                                    <th className="py-3 px-4 text-right">Statutory Deductions</th>
                                    <th className="py-3 px-4 text-right">Net Remittance</th>
                                    <th className="py-3 px-4 text-center">Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {payrolls.data && payrolls.data.length > 0 ? (
                                    payrolls.data.map((row) => {
                                        const gross = Number(row.basic_salary) + Number(row.total_allowances);
                                        return (
                                            <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                <td className="py-3 px-4">
                                                    <div className="font-bold text-slate-900 dark:text-white">
                                                        {row.staff?.first_name} {row.staff?.last_name}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-mono">
                                                        {row.staff?.emp_id || 'EMP-STAFF'}
                                                    </div>
                                                </td>

                                                <td className="py-3 px-4">
                                                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                                                        {row.staff?.department?.name || 'General'}
                                                    </span>
                                                </td>

                                                <td className="py-3 px-4 text-right font-mono">
                                                    {Number(row.basic_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>

                                                <td className="py-3 px-4 text-right font-mono font-semibold">
                                                    {gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>

                                                <td className="py-3 px-4 text-right font-mono text-rose-600 font-semibold">
                                                    -KSh {Number(row.total_deductions).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>

                                                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                                                    KSh {Number(row.net_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>

                                                <td className="py-3 px-4 text-center">
                                                    {row.status === 'paid' ? (
                                                        <span className="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Paid
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                                            Generated
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="py-3 px-4 text-right space-x-1">
                                                    <Link
                                                        href={`/school/hr/payroll/${row.id}/slip`}
                                                        className="inline-flex items-center h-7 px-2.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold"
                                                    >
                                                        <FileText className="w-3 h-3 mr-1" />
                                                        Payslip
                                                    </Link>

                                                    {row.status !== 'paid' && (
                                                        <button
                                                            onClick={() => handleMarkPaid(row.id)}
                                                            className="inline-flex items-center h-7 px-2.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold"
                                                        >
                                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                                            Mark Paid
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                                            No payroll records generated for {monthYear}. Click "Generate Monthly Payroll" to run the statutory engine.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* MODAL 1: GENERATE MONTHLY PAYROLL */}
            {generateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                <Play className="w-4 h-4 text-indigo-600" />
                                Process Kenya Statutory Payroll
                            </h3>
                            <button onClick={() => setGenerateModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
                        </div>

                        <form onSubmit={handleGenerate} className="space-y-3 text-xs">
                            <p className="text-slate-600 dark:text-slate-400">
                                The engine will compute Gross Salaries, NSSF Tier I/II, SHIF (2.75%), Affordable Housing Levy (1.5%), and KRA PAYE tax reliefs for all active staff.
                            </p>

                            <div>
                                <label className="font-bold block mb-1">Target Period (YYYY-MM):</label>
                                <Input
                                    type="month"
                                    required
                                    value={genForm.data.month_year}
                                    onChange={(e) => genForm.setData('month_year', e.target.value)}
                                    className="h-8 text-xs font-mono"
                                />
                            </div>

                            <div>
                                <label className="font-bold block mb-1">Target Department:</label>
                                <Select
                                    value={genForm.data.department_id || 'all'}
                                    onValueChange={(v) => genForm.setData('department_id', v === 'all' ? '' : v)}
                                >
                                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="All Departments" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments (Entire Institution)</SelectItem>
                                        {departments.map((d) => (
                                            <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="font-bold block mb-1">Total Standard Working Days:</label>
                                <Input
                                    type="number"
                                    required
                                    min={1}
                                    max={31}
                                    value={genForm.data.working_days}
                                    onChange={(e) => genForm.setData('working_days', Number(e.target.value))}
                                    className="h-8 text-xs font-mono"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <Button type="button" variant="outline" onClick={() => setGenerateModalOpen(false)} size="sm">Cancel</Button>
                                <Button type="submit" disabled={genForm.processing} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                                    {genForm.processing ? 'Calculating...' : 'Run Payroll Engine'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL 2: DYNAMIC STATUTORY & TAX CONFIGURATION */}
            {configModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl max-w-2xl w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                <Sliders className="w-4 h-4 text-indigo-600" />
                                Dynamic Statutory Rates & Tax Reliefs (Kenya)
                            </h3>
                            <button onClick={() => setConfigModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
                        </div>

                        <form onSubmit={handleSaveStatutory} className="space-y-4 text-xs">
                            {/* NSSF Section */}
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-2">
                                <div className="font-bold text-slate-900 dark:text-white flex justify-between items-center">
                                    <span>NSSF Parameters</span>
                                    <label className="flex items-center gap-1 font-normal cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={statForm.data.nssf_enabled}
                                            onChange={(e) => statForm.setData('nssf_enabled', e.target.checked)}
                                        /> Enable NSSF
                                    </label>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="text-[11px] text-slate-500">Rate (%)</label>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            value={statForm.data.nssf_rate}
                                            onChange={(e) => statForm.setData('nssf_rate', Number(e.target.value))}
                                            className="h-8 text-xs font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] text-slate-500">Tier I Limit (KSh)</label>
                                        <Input
                                            type="number"
                                            value={statForm.data.nssf_tier1_limit}
                                            onChange={(e) => statForm.setData('nssf_tier1_limit', Number(e.target.value))}
                                            className="h-8 text-xs font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] text-slate-500">Tier II Limit (KSh)</label>
                                        <Input
                                            type="number"
                                            value={statForm.data.nssf_tier2_limit}
                                            onChange={(e) => statForm.setData('nssf_tier2_limit', Number(e.target.value))}
                                            className="h-8 text-xs font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SHIF & Housing Levy */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-2">
                                    <div className="font-bold text-slate-900 dark:text-white flex justify-between items-center">
                                        <span>SHIF (Health Fund)</span>
                                        <label className="flex items-center gap-1 font-normal cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={statForm.data.shif_enabled}
                                                onChange={(e) => statForm.setData('shif_enabled', e.target.checked)}
                                            /> Enable
                                        </label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[11px] text-slate-500">Rate (%)</label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={statForm.data.shif_rate}
                                                onChange={(e) => statForm.setData('shif_rate', Number(e.target.value))}
                                                className="h-8 text-xs font-mono"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[11px] text-slate-500">Minimum Floor (KSh)</label>
                                            <Input
                                                type="number"
                                                value={statForm.data.shif_min_amount}
                                                onChange={(e) => statForm.setData('shif_min_amount', Number(e.target.value))}
                                                className="h-8 text-xs font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-2">
                                    <div className="font-bold text-slate-900 dark:text-white flex justify-between items-center">
                                        <span>Housing Levy (AHL)</span>
                                        <label className="flex items-center gap-1 font-normal cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={statForm.data.housing_levy_enabled}
                                                onChange={(e) => statForm.setData('housing_levy_enabled', e.target.checked)}
                                            /> Enable
                                        </label>
                                    </div>
                                    <div>
                                        <label className="text-[11px] text-slate-500">Rate (%)</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={statForm.data.housing_levy_rate}
                                            onChange={(e) => statForm.setData('housing_levy_rate', Number(e.target.value))}
                                            className="h-8 text-xs font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Tax Reliefs */}
                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-2">
                                <div className="font-bold text-slate-900 dark:text-white">Tax Reliefs & Exemptions</div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="text-[11px] text-slate-500">Personal Relief (KSh/Mo)</label>
                                        <Input
                                            type="number"
                                            value={statForm.data.personal_relief}
                                            onChange={(e) => statForm.setData('personal_relief', Number(e.target.value))}
                                            className="h-8 text-xs font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] text-slate-500">SHIF Relief (%)</label>
                                        <Input
                                            type="number"
                                            value={statForm.data.shif_relief_rate}
                                            onChange={(e) => statForm.setData('shif_relief_rate', Number(e.target.value))}
                                            className="h-8 text-xs font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] text-slate-500">Housing Relief (%)</label>
                                        <Input
                                            type="number"
                                            value={statForm.data.housing_relief_rate}
                                            onChange={(e) => statForm.setData('housing_relief_rate', Number(e.target.value))}
                                            className="h-8 text-xs font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <Button type="button" variant="outline" onClick={() => setConfigModalOpen(false)} size="sm">Cancel</Button>
                                <Button type="submit" disabled={statForm.processing} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                                    <Save className="w-3.5 h-3.5 mr-1" />
                                    Save Statutory Rules
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}