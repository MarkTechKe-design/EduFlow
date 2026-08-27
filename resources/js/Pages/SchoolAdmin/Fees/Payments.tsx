import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps, PaginatedData } from '@/Types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { formatDate } from '@/lib/utils';
import {
    AlertCircle,
    CreditCard,
    Filter,
    Receipt,
    Smartphone
} from 'lucide-react';

interface FeePaymentItem {
    id: number;
    receipt_no: string;
    amount_paid: string | number;
    payment_date: string;
    method: string;
    note?: string | null;
    student?: {
        id: number;
        first_name: string;
        last_name: string;
        admission_no: string;
        school_class?: { name: string } | null;
    } | null;
}

interface Props extends PageProps {
    payments: PaginatedData<FeePaymentItem>;
    stats: {
        total_collections: number;
        mpesa_collections: number;
        bank_collections: number;
        cash_collections: number;
    };
    filters: {
        search: string;
        method: string;
    };
}

export default function FeePaymentsIndex({ auth, payments, stats, filters }: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedMethod, setSelectedMethod] = useState(filters.method || 'all');

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/school/fees/payments',
            { search: searchQuery, method: selectedMethod },
            { preserveState: true, replace: true }
        );
    };

    return (
        <AppLayout header="Student Fee Collections & Payment Ledger">
            <Head title="Fee Payments - EduFlow" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-indigo-600" />
                            Fee Collections & Payment Ledger
                        </h1>
                        <p className="text-xs text-slate-500">
                            Immutable transaction history, M-Pesa automated allocations, and manual payment receipts.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/school/fees/unallocated">
                            <Button variant="outline" size="sm" className="h-9 text-xs font-bold text-amber-600 border-amber-300">
                                <AlertCircle className="w-3.5 h-3.5 mr-1.5" />
                                Unallocated Queue
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                        <div className="text-xs font-medium text-slate-500">Total Collections</div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                            KSh {Number(stats.total_collections).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                        <div className="text-xs font-medium text-emerald-600 font-semibold flex items-center gap-1">
                            <Smartphone className="w-3.5 h-3.5" /> M-Pesa Ingestions
                        </div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                            KSh {Number(stats.mpesa_collections).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                        <div className="text-xs font-medium text-blue-600 font-semibold">Bank Deposits / Cheques</div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                            KSh {Number(stats.bank_collections).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
                        <div className="text-xs font-medium text-slate-500">Cash Collections</div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                            KSh {Number(stats.cash_collections).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleFilter} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-2">
                            <Input
                                placeholder="Search by student name, admission no, receipt no, or M-Pesa ref..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>

                        <div>
                            <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Payment Method" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Channels</SelectItem>
                                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="cheque">Cheque</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Button type="submit" variant="outline" className="w-full h-9 text-xs font-semibold">
                                <Filter className="w-3.5 h-3.5 mr-1.5" />
                                Filter Transactions
                            </Button>
                        </div>
                    </div>
                </form>

                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                                    <th className="py-3 px-4">Receipt No</th>
                                    <th className="py-3 px-4">Student Details</th>
                                    <th className="py-3 px-4">Method</th>
                                    <th className="py-3 px-4">Transaction Reference / Notes</th>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4 text-right">Amount (KSh)</th>
                                    <th className="py-3 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {payments.data && payments.data.length > 0 ? (
                                    payments.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3 px-4 font-mono font-bold text-indigo-600">
                                                {item.receipt_no}
                                            </td>

                                            <td className="py-3 px-4">
                                                <div className="font-bold text-slate-900 dark:text-white">
                                                    {item.student ? `${item.student.first_name} ${item.student.last_name}` : 'N/A'}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-mono">
                                                    ADM: {item.student?.admission_no || '-'} &bull; {item.student?.school_class?.name || ''}
                                                </div>
                                            </td>

                                            <td className="py-3 px-4 font-semibold uppercase">
                                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                                                    item.method === 'mpesa' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {item.method}
                                                </span>
                                            </td>

                                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                                                {item.note || '-'}
                                            </td>

                                            <td className="py-3 px-4 text-slate-500">
                                                {formatDate(item.payment_date)}
                                            </td>

                                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                {Number(item.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>

                                            <td className="py-3 px-4 text-right">
                                                <Link href={`/school/fees/payments/${item.id}`}>
                                                    <Button size="sm" variant="outline" className="h-7 text-[11px] font-semibold">
                                                        <Receipt className="w-3 h-3 mr-1" />
                                                        Receipt
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-10 text-center text-xs text-slate-500">
                                            No fee payment transactions found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}