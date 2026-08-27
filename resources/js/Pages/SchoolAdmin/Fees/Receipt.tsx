import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/Types';
import { Button } from '@/Components/ui/button';
import { formatDate } from '@/lib/utils';
import {
    ArrowLeft,
    CheckCircle2,
    Printer
} from 'lucide-react';

interface FeeAllocation {
    id: number;
    amount: string | number;
    vote_head?: { name: string; category: string } | null;
    invoice?: { invoice_number: string; term: string } | null;
}

interface Props extends PageProps {
    payment: {
        id: number;
        receipt_no: string;
        amount_due: string | number;
        amount_paid: string | number;
        discount: string | number;
        payment_date: string;
        method: string;
        note?: string | null;
        student?: {
            first_name: string;
            last_name: string;
            admission_no: string;
            school_class?: { name: string } | null;
            section?: { name: string } | null;
        } | null;
        allocations: FeeAllocation[];
    };
    school?: {
        name: string;
        address?: string | null;
        phone?: string | null;
        email?: string | null;
    } | null;
    currentBalance: number;
}

export default function FeeReceiptView({ payment, school, currentBalance }: Props) {
    const handlePrint = () => {
        window.print();
    };

    return (
        <AppLayout header={`Official Receipt #${payment.receipt_no}`}>
            <Head title={`Receipt ${payment.receipt_no} - EduFlow`} />

            <div className="max-w-3xl mx-auto space-y-6">
                <div className="print:hidden flex items-center justify-between gap-4">
                    <Link
                        href="/school/fees/payments"
                        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                        Back to Payments List
                    </Link>

                    <Button
                        onClick={handlePrint}
                        size="sm"
                        className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                    >
                        <Printer className="w-3.5 h-3.5 mr-1.5" />
                        Print Official Receipt
                    </Button>
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm space-y-6 print:border-0 print:p-0 print:shadow-none text-slate-900 dark:text-white">
                    <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-6">
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
                                {school?.name || 'EduFlow Academy'}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {school?.address || 'P.O. Box 100 - Nairobi, Kenya'} &bull; Tel: {school?.phone || '+254 700 000000'}
                            </p>
                            <p className="text-xs text-slate-500">Email: {school?.email || 'bursar@eduflow.test'}</p>
                        </div>

                        <div className="text-right">
                            <span className="inline-block px-3 py-1 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-mono text-xs font-bold uppercase tracking-wider">
                                Official Fee Receipt
                            </span>
                            <div className="mt-2 text-xs text-slate-500">
                                Receipt No: <strong className="font-mono text-slate-900 dark:text-white">{payment.receipt_no}</strong>
                            </div>
                            <div className="text-xs text-slate-500">
                                Date: <strong>{formatDate(payment.payment_date)}</strong>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                        <div className="space-y-1">
                            <div className="text-slate-500 font-semibold">Learner Information:</div>
                            <div className="font-bold text-sm text-slate-900 dark:text-white">
                                {payment.student?.first_name} {payment.student?.last_name}
                            </div>
                            <div>Admission Number: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{payment.student?.admission_no}</span></div>
                            <div>Class / Stream: <strong>{payment.student?.school_class?.name || 'Class'} {payment.student?.section ? `(${payment.student.section.name})` : ''}</strong></div>
                        </div>

                        <div className="space-y-1 text-right">
                            <div className="text-slate-500 font-semibold">Payment Channel:</div>
                            <div className="font-bold text-sm uppercase text-slate-900 dark:text-white">
                                {payment.method.replace(/_/g, ' ')}
                            </div>
                            <div>Transaction Note: <span className="text-slate-600 dark:text-slate-400">{payment.note || 'Direct Settlement'}</span></div>
                            <div className="inline-flex items-center gap-1 text-emerald-600 font-bold mt-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Verified & Cleared
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Vote Head Allocation Breakdown
                        </h4>
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                                    <th className="py-2.5">Item / Vote Head</th>
                                    <th className="py-2.5">Target Obligation</th>
                                    <th className="py-2.5 text-right">Amount Allocated</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {payment.allocations && payment.allocations.length > 0 ? (
                                    payment.allocations.map((alloc) => (
                                        <tr key={alloc.id}>
                                            <td className="py-2.5 font-medium text-slate-900 dark:text-white">
                                                {alloc.vote_head?.name || 'General Tuition'}
                                            </td>
                                            <td className="py-2.5 text-slate-500 font-mono">
                                                {alloc.invoice?.invoice_number ? `${alloc.invoice.invoice_number} (${alloc.invoice.term})` : 'Term Obligation'}
                                            </td>
                                            <td className="py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                KSh {Number(alloc.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td className="py-2.5 font-medium text-slate-900 dark:text-white">General Fee Account Credit</td>
                                        <td className="py-2.5 text-slate-500 font-mono">Student Account Ledger</td>
                                        <td className="py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                                            KSh {Number(payment.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="border-t border-slate-200 dark:border-slate-800 pt-4 flex justify-end">
                        <div className="w-64 space-y-2 text-xs">
                            <div className="flex justify-between text-slate-600 dark:text-slate-400">
                                <span>Amount Received:</span>
                                <span className="font-bold text-slate-900 dark:text-white font-mono">
                                    KSh {Number(payment.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 text-sm font-bold">
                                <span>Remaining Ledger Balance:</span>
                                <span className={`font-mono ${currentBalance > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600'}`}>
                                    KSh {Number(currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 flex justify-between items-end text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800">
                        <div>
                            <div className="w-44 border-b border-slate-300 dark:border-slate-700 pb-1 font-semibold text-slate-900 dark:text-white text-center">
                                Accounts / Bursar
                            </div>
                            <div className="text-[10px] text-center mt-1">Authorized Official Signature</div>
                        </div>

                        <div className="text-right space-y-1">
                            <div className="text-[10px] text-slate-400 font-mono">Verified by EduFlow Ledger Engine</div>
                            <div className="text-[10px] text-slate-400">Generated on {new Date().toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}