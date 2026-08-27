import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/Types';
import { Button } from '@/Components/ui/button';
import { formatDate } from '@/lib/utils';
import {
    ArrowLeft,
    CheckCircle2,
    CreditCard,
    DollarSign,
    Download,
    FileText,
    Receipt,
    ShieldCheck,
    Smartphone,
    User
} from 'lucide-react';

interface FeeInvoiceItem {
    id: number;
    amount: string | number;
    paid_amount: string | number;
    balance: string | number;
    vote_head?: { name: string; category: string } | null;
}

interface FeeInvoice {
    id: number;
    invoice_number: string;
    term: string;
    issue_date: string;
    due_date: string;
    total_amount: string | number;
    paid_amount: string | number;
    balance: string | number;
    status: string;
    items: FeeInvoiceItem[];
    academic_year?: { name: string } | null;
}

interface LedgerEntry {
    id: number;
    transaction_type: 'charge' | 'payment' | 'waiver' | 'adjustment' | 'refund';
    reference_number: string;
    debit: string | number;
    credit: string | number;
    running_balance: string | number;
    entry_date: string;
    description: string;
}

interface PaymentRecord {
    id: number;
    receipt_no: string;
    amount_paid: string | number;
    method: string;
    payment_date: string;
    note?: string | null;
}

interface StudentOption {
    id: number;
    first_name: string;
    last_name: string;
    admission_no: string;
    school_class?: { name: string } | null;
    section?: { name: string } | null;
}

interface Props extends PageProps {
    students: StudentOption[];
    activeStudent: StudentOption | null;
    financialSummary: {
        student_id: number;
        student_name: string;
        admission_no: string;
        class_name: string;
        stream_name: string;
        running_balance: number;
        total_invoiced: number;
        total_paid: number;
    } | null;
    invoices: FeeInvoice[];
    ledgerEntries: LedgerEntry[];
    paymentHistory: PaymentRecord[];
}

export default function ParentFees({
    auth,
    students = [],
    activeStudent,
    financialSummary,
    invoices = [],
    ledgerEntries = [],
    paymentHistory = [],
}: Props) {
    const [activeTab, setActiveTab] = useState<'invoices' | 'ledger' | 'history'>('invoices');
    const [showPayModal, setShowPayModal] = useState(false);

    const handleSelectStudent = (studentId: number) => {
        router.get('/school/parent/fees', { student_id: studentId }, { preserveState: true, replace: true });
    };

    return (
        <AppLayout header="Student Financial Ledger & Fee Portal">
            <Head title="Fees & Statements - Parent Portal" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header & Student Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-indigo-600" />
                            Fee Obligations & Payment Portal
                        </h1>
                        <p className="text-xs text-slate-500">
                            Real-time student billing statement, verified payments, and M-Pesa reconciliation.
                        </p>
                    </div>

                    {students.length > 1 && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 font-medium">Child:</span>
                            <div className="flex gap-1.5">
                                {students.map((s) => (
                                    <button
                                        key={s.id}
                                        onClick={() => handleSelectStudent(s.id)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                            activeStudent?.id === s.id
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                                        }`}
                                    >
                                        {s.first_name} ({s.admission_no})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {financialSummary ? (
                    <>
                        {/* Balance Card & Highlights */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 text-white rounded-xl p-5 shadow-sm space-y-2">
                                <div className="text-xs font-medium text-indigo-200">Current Outstanding Balance</div>
                                <div className="text-2xl font-bold font-mono">
                                    KSh {Number(financialSummary.running_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                <div className="pt-2 flex items-center justify-between">
                                    <span className="text-[11px] text-indigo-200">
                                        {financialSummary.student_name} &bull; {financialSummary.admission_no}
                                    </span>
                                    <Button
                                        onClick={() => setShowPayModal(true)}
                                        size="sm"
                                        className="h-7 text-xs bg-emerald-500 hover:bg-emerald-600 font-bold text-white"
                                    >
                                        <Smartphone className="w-3 h-3 mr-1" />
                                        Pay via M-Pesa
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-blue-600">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-slate-500">Total Invoiced to Date</div>
                                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                                        KSh {Number(financialSummary.total_invoiced).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-[11px] text-slate-400">Class: {financialSummary.class_name}</div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-slate-500">Total Payments Recorded</div>
                                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                                        KSh {Number(financialSummary.total_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                    <div className="text-[11px] text-emerald-600 font-semibold">Allocated & Cleared</div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                            <button
                                onClick={() => setActiveTab('invoices')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                                    activeTab === 'invoices'
                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                Term Invoices & Charges ({invoices.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('ledger')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                                    activeTab === 'ledger'
                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                Immutable Account Ledger ({ledgerEntries.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                                    activeTab === 'history'
                                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                Payment Receipts ({paymentHistory.length})
                            </button>
                        </div>

                        {/* TAB 1: Invoices */}
                        {activeTab === 'invoices' && (
                            <div className="space-y-4">
                                {invoices.length > 0 ? (
                                    invoices.map((inv) => (
                                        <div key={inv.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-bold text-slate-900 dark:text-white">{inv.invoice_number}</span>
                                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                                            inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                            {inv.status.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-500">
                                                        {inv.term} &bull; Issued: {formatDate(inv.issue_date)} &bull; Due: {formatDate(inv.due_date)}
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="text-xs text-slate-500">Invoice Total</div>
                                                    <div className="text-base font-bold text-slate-900 dark:text-white font-mono">
                                                        KSh {Number(inv.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Itemized Vote Heads */}
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left text-xs">
                                                    <thead>
                                                        <tr className="border-b text-slate-500 font-semibold">
                                                            <th className="py-2">Vote Head / Fee Item</th>
                                                            <th className="py-2 text-right">Invoiced (KSh)</th>
                                                            <th className="py-2 text-right">Paid (KSh)</th>
                                                            <th className="py-2 text-right">Arrears (KSh)</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                        {inv.items.map((item) => (
                                                            <tr key={item.id}>
                                                                <td className="py-2 font-medium text-slate-800 dark:text-slate-200">
                                                                    {item.vote_head?.name || 'Fee Charge'}
                                                                </td>
                                                                <td className="py-2 text-right font-mono">{Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                                <td className="py-2 text-right font-mono text-emerald-600">{Number(item.paid_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                                <td className="py-2 text-right font-mono font-bold text-slate-900 dark:text-white">{Number(item.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border text-xs text-slate-500">
                                        No active term fee invoices on record.
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 2: Immutable Account Ledger */}
                        {activeTab === 'ledger' && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                                                <th className="py-3 px-4">Date</th>
                                                <th className="py-3 px-4">Type</th>
                                                <th className="py-3 px-4">Reference</th>
                                                <th className="py-3 px-4">Description</th>
                                                <th className="py-3 px-4 text-right">Debit (+)</th>
                                                <th className="py-3 px-4 text-right">Credit (-)</th>
                                                <th className="py-3 px-4 text-right">Running Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {ledgerEntries.map((entry) => (
                                                <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                    <td className="py-3 px-4 text-slate-500">{formatDate(entry.entry_date)}</td>
                                                    <td className="py-3 px-4">
                                                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                                            entry.transaction_type === 'charge'
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : entry.transaction_type === 'payment'
                                                                ? 'bg-emerald-100 text-emerald-700'
                                                                : 'bg-blue-100 text-blue-700'
                                                        }`}>
                                                            {entry.transaction_type}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 font-mono">{entry.reference_number}</td>
                                                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200">{entry.description}</td>
                                                    <td className="py-3 px-4 text-right font-mono text-amber-700">
                                                        {Number(entry.debit) > 0 ? Number(entry.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono text-emerald-700">
                                                        {Number(entry.credit) > 0 ? Number(entry.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                        KSh {Number(entry.running_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: Payment History */}
                        {activeTab === 'history' && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                                                <th className="py-3 px-4">Receipt No</th>
                                                <th className="py-3 px-4">Payment Date</th>
                                                <th className="py-3 px-4">Method / Channel</th>
                                                <th className="py-3 px-4">Notes / Ref</th>
                                                <th className="py-3 px-4 text-right">Amount Paid</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {paymentHistory.map((pmt) => (
                                                <tr key={pmt.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{pmt.receipt_no}</td>
                                                    <td className="py-3 px-4 text-slate-500">{formatDate(pmt.payment_date)}</td>
                                                    <td className="py-3 px-4 font-semibold uppercase">{pmt.method}</td>
                                                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{pmt.note || '-'}</td>
                                                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">
                                                        KSh {Number(pmt.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <User className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <h3 className="font-bold text-slate-900 dark:text-white">No Linked Student Profile Found</h3>
                        <p className="text-xs text-slate-500 mt-1">Please contact school administration to link your guardian profile to your child's record.</p>
                    </div>
                )}
            </div>

            {/* M-Pesa Instructions Modal */}
            {showPayModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Smartphone className="w-4 h-4 text-emerald-600" />
                                Pay Fees via M-Pesa Paybill
                            </h3>
                            <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <p className="text-slate-600 dark:text-slate-400">
                                Use the school's official M-Pesa Paybill to clear fee balances. Transactions are automatically reconciled in real-time.
                            </p>

                            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                                <div className="flex justify-between">
                                    <span className="font-semibold text-slate-600 dark:text-slate-400">Business / Paybill:</span>
                                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">522522</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold text-slate-600 dark:text-slate-400">Account Number:</span>
                                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                                        {financialSummary?.admission_no || 'ADM-NO'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-semibold text-slate-600 dark:text-slate-400">Student Name:</span>
                                    <span className="font-bold text-slate-900 dark:text-white">
                                        {financialSummary?.student_name}
                                    </span>
                                </div>
                            </div>

                            <div className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg">
                                <strong>Important:</strong> Enter the student's exact admission number (<strong>{financialSummary?.admission_no}</strong>) as the Account Number to ensure instant ledger reconciliation.
                            </div>

                            <div className="flex justify-end pt-3 border-t">
                                <Button type="button" onClick={() => setShowPayModal(false)} size="sm" className="bg-slate-900 hover:bg-slate-800 text-white font-bold">
                                    Close Instructions
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}