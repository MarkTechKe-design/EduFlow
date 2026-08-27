import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/Types';
import { Button } from '@/Components/ui/button';
import { formatDate } from '@/lib/utils';
import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    CreditCard,
    DollarSign,
    FileText,
    Printer,
    ShieldCheck,
    User
} from 'lucide-react';

interface DeductionItem {
    label: string;
    amount: number;
    type: 'statutory' | 'custom';
    code?: string;
    gross_tax?: number;
    reliefs?: number;
}

interface AllowanceItem {
    label: string;
    amount: number;
}

interface Props extends PageProps {
    payroll: {
        id: number;
        month_year: string;
        basic_salary: number;
        total_allowances: number;
        total_deductions: number;
        net_salary: number;
        working_days: number;
        present_days: number;
        leave_days: number;
        status: string;
        paid_on?: string | null;
        allowances_snapshot?: AllowanceItem[] | null;
        deductions_snapshot?: DeductionItem[] | null;
        staff?: {
            id: number;
            first_name: string;
            last_name: string;
            emp_id?: string | null;
            joining_date?: string | null;
            email?: string | null;
            phone?: string | null;
            department?: { name: string } | null;
            designation?: { name: string } | null;
        } | null;
    };
    school?: {
        name: string;
        address?: string;
        phone?: string;
        email?: string;
    } | null;
}

export default function PayslipView({ auth, payroll, school }: Props) {
    const allowances = payroll.allowances_snapshot || [];
    const deductions = payroll.deductions_snapshot || [];
    const grossPay = Number(payroll.basic_salary) + Number(payroll.total_allowances);

    return (
        <AppLayout header={`Official Payslip - ${payroll.month_year}`}>
            <Head title={`Payslip - ${payroll.staff?.first_name} ${payroll.staff?.last_name}`} />

            <div className="max-w-4xl mx-auto space-y-6 pb-16">
                {/* Screen Action Bar */}
                <div className="flex items-center justify-between print:hidden">
                    <Link
                        href="/school/hr/payroll"
                        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                        Back to Payroll Records
                    </Link>

                    <Button
                        onClick={() => window.print()}
                        size="sm"
                        className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold"
                    >
                        <Printer className="w-3.5 h-3.5 mr-1.5" />
                        Print Official Payslip
                    </Button>
                </div>

                {/* Printable Payslip Card */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm print:border-none print:shadow-none print:p-0 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-5 gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-indigo-600" />
                                <h1 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                    {school?.name || 'EduFlow School Management'}
                                </h1>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {school?.address || 'Official Staff Payroll & Statutory Remittance Slip'}
                            </p>
                        </div>

                        <div className="text-right">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Pay Period</div>
                            <div className="text-sm font-bold font-mono text-indigo-600 dark:text-indigo-400">
                                {payroll.month_year}
                            </div>
                            <div className="mt-1">
                                {payroll.status === 'paid' ? (
                                    <span className="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        Disbursed ({payroll.paid_on})
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                                        Processed Draft
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Employee Profile Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                        <div>
                            <span className="text-slate-400 block text-[11px]">Staff Name:</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                                {payroll.staff?.first_name} {payroll.staff?.last_name}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[11px]">Employee ID:</span>
                            <span className="font-mono font-bold text-slate-900 dark:text-white">
                                {payroll.staff?.emp_id || 'N/A'}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[11px]">Department:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {payroll.staff?.department?.name || 'General Staff'}
                            </span>
                        </div>
                        <div>
                            <span className="text-slate-400 block text-[11px]">Designation:</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {payroll.staff?.designation?.name || 'Educator'}
                            </span>
                        </div>
                    </div>

                    {/* Earnings & Deductions Tables */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
                        {/* EARNINGS */}
                        <div className="space-y-3">
                            <div className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b pb-1.5">
                                Earnings Breakdown
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-slate-800">
                                    <span className="text-slate-600 dark:text-slate-400">Basic Salary</span>
                                    <span className="font-mono font-bold">
                                        KSh {Number(payroll.basic_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                {allowances.map((a, idx) => (
                                    <div key={idx} className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-slate-800">
                                        <span className="text-slate-600 dark:text-slate-400">{a.label}</span>
                                        <span className="font-mono font-bold">
                                            KSh {Number(a.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between pt-2 border-t font-bold text-slate-900 dark:text-white">
                                <span>Gross Pay</span>
                                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                                    KSh {grossPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        {/* DEDUCTIONS */}
                        <div className="space-y-3">
                            <div className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 border-b pb-1.5">
                                Statutory & Voluntary Deductions
                            </div>
                            <div className="space-y-2">
                                {deductions.map((d, idx) => (
                                    <div key={idx} className="flex justify-between py-1 border-b border-dashed border-slate-100 dark:border-slate-800">
                                        <div>
                                            <span className="text-slate-600 dark:text-slate-400">{d.label}</span>
                                            {d.code === 'PAYE' && d.reliefs && (
                                                <span className="block text-[10px] text-emerald-600 font-mono">
                                                    Reliefs Applied: -KSh {Number(d.reliefs).toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                        <span className="font-mono font-bold text-rose-600">
                                            -KSh {Number(d.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between pt-2 border-t font-bold text-slate-900 dark:text-white">
                                <span>Total Deductions</span>
                                <span className="font-mono text-rose-600">
                                    -KSh {Number(payroll.total_deductions).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Net Pay Total Banner */}
                    <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex justify-between items-center">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 block">
                                Net Remittance / Take-Home Pay
                            </span>
                            <span className="text-[11px] text-slate-500">
                                Deposited to official registered employee bank account.
                            </span>
                        </div>
                        <div className="text-2xl font-bold font-mono text-indigo-700 dark:text-indigo-300">
                            KSh {Number(payroll.net_salary).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    {/* Footer Authorization */}
                    <div className="pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-8 text-[11px] text-slate-500">
                        <div>
                            <div className="border-b border-slate-400 w-48 mb-1"></div>
                            <span>Prepared By (Bursar / Accountant)</span>
                        </div>
                        <div className="text-right">
                            <div className="border-b border-slate-400 w-48 ml-auto mb-1"></div>
                            <span>Authorized By (Principal / Director)</span>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}