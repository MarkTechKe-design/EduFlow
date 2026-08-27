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
    ArrowLeft,
    CheckCircle2,
    Clock,
    DollarSign,
    Filter,
    HelpCircle,
    RotateCcw,
    Search,
    ShieldAlert,
    UserCheck,
    Users
} from 'lucide-react';

interface UnallocatedPayment {
    id: number;
    reference_code: string;
    channel: string;
    amount: string | number;
    payer_name?: string | null;
    payer_phone?: string | null;
    bill_reference_entered?: string | null;
    payment_date: string;
    status: 'unallocated' | 'allocated' | 'refunded' | 'disputed';
    allocated_student?: { id: number; first_name: string; last_name: string; admission_no: string } | null;
    resolver?: { id: number; name: string } | null;
    resolution_notes?: string | null;
}

interface Props extends PageProps {
    unallocatedPayments: PaginatedData<UnallocatedPayment>;
    stats: {
        total_unallocated_count: number;
        total_unallocated_amount: number;
        total_resolved_count: number;
    };
    filters: {
        status: string;
        search: string;
    };
}

export default function UnallocatedQueue({ auth, unallocatedPayments, stats, filters }: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'unallocated');

    // Resolution Modal State
    const [selectedPayment, setSelectedPayment] = useState<UnallocatedPayment | null>(null);
    const [studentIdInput, setStudentIdInput] = useState('');
    const [resolutionNotes, setResolutionNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/school/fees/unallocated',
            {
                status: selectedStatus,
                search: searchQuery,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleResolve = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPayment || !studentIdInput) return;

        setIsSubmitting(true);
        router.post(
            `/school/fees/unallocated/${selectedPayment.id}/resolve`,
            {
                student_id: studentIdInput,
                notes: resolutionNotes,
            },
            {
                onSuccess: () => {
                    setSelectedPayment(null);
                    setStudentIdInput('');
                    setResolutionNotes('');
                    setIsSubmitting(false);
                },
                onError: () => {
                    setIsSubmitting(false);
                },
            }
        );
    };

    return (
        <AppLayout header="Unallocated Payments Queue">
            <Head title="Unallocated Payments Queue - EduFlow" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <Link
                            href="/school/fees/payments"
                            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 mb-1"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                            Back to Payment Ledger
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-600" />
                            Bursar Unallocated Payments Queue
                        </h1>
                        <p className="text-xs text-slate-500">
                            Reconcile M-Pesa payments with invalid or ambiguous admission reference numbers.
                        </p>
                    </div>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/50 rounded-lg text-amber-600">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-medium text-slate-500">Unallocated Value</div>
                            <div className="text-lg font-bold text-slate-900 dark:text-white">
                                KSh {Number(stats.total_unallocated_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-[11px] text-amber-600 font-semibold">{stats.total_unallocated_count} Transactions Pending</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg text-emerald-600">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-medium text-slate-500">Resolved Transactions</div>
                            <div className="text-lg font-bold text-slate-900 dark:text-white">
                                {stats.total_resolved_count}
                            </div>
                            <div className="text-[11px] text-emerald-600 font-semibold">Allocated to Student Ledgers</div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg text-blue-600">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <div className="text-xs font-medium text-slate-500">Gateway Status</div>
                            <div className="text-lg font-bold text-slate-900 dark:text-white">Active (Daraja C2B)</div>
                            <div className="text-[11px] text-blue-600 font-semibold">Idempotency Protected</div>
                        </div>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <form onSubmit={handleFilter} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-2">
                            <Input
                                placeholder="Search by M-Pesa ref, phone, payer name or entered account ref..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>

                        <div>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="unallocated">Pending Unallocated Only</SelectItem>
                                    <SelectItem value="allocated">Resolved / Allocated</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Button type="submit" variant="outline" className="w-full h-9 text-xs font-semibold">
                                <Filter className="w-3.5 h-3.5 mr-1.5" />
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </form>

                {/* Transactions Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                                    <th className="py-3 px-4">Receipt / Ref</th>
                                    <th className="py-3 px-4">Payer Details</th>
                                    <th className="py-3 px-4">Account Ref Entered</th>
                                    <th className="py-3 px-4 text-right">Amount (KSh)</th>
                                    <th className="py-3 px-4">Payment Timestamp</th>
                                    <th className="py-3 px-4">Resolution Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {unallocatedPayments.data && unallocatedPayments.data.length > 0 ? (
                                    unallocatedPayments.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                                                {item.reference_code}
                                            </td>

                                            <td className="py-3 px-4">
                                                <div className="font-bold text-slate-900 dark:text-white">{item.payer_name || 'N/A'}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">{item.payer_phone || '-'}</div>
                                            </td>

                                            <td className="py-3 px-4">
                                                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                                                    {item.bill_reference_entered || '<EMPTY>'}
                                                </span>
                                            </td>

                                            <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                                                {Number(item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>

                                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                                                {formatDate(item.payment_date)}
                                            </td>

                                            <td className="py-3 px-4">
                                                {item.status === 'unallocated' ? (
                                                    <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                                                        Unallocated
                                                    </span>
                                                ) : (
                                                    <div>
                                                        <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                            Allocated
                                                        </span>
                                                        <div className="text-[10px] text-slate-500 mt-0.5">
                                                            {item.allocated_student ? `${item.allocated_student.first_name} (${item.allocated_student.admission_no})` : ''}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>

                                            <td className="py-3 px-4 text-right">
                                                {item.status === 'unallocated' && (
                                                    <Button
                                                        onClick={() => setSelectedPayment(item)}
                                                        size="sm"
                                                        className="h-7 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                                                    >
                                                        <UserCheck className="w-3 h-3 mr-1" />
                                                        Allocate
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-10 text-center text-xs text-slate-500">
                                            No unallocated payments found matching the selected filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Resolution Modal */}
            {selectedPayment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <UserCheck className="w-4 h-4 text-indigo-600" />
                                Allocate Payment to Student
                            </h3>
                            <button onClick={() => setSelectedPayment(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
                        </div>

                        <form onSubmit={handleResolve} className="space-y-3 text-xs">
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-1">
                                <div><strong>Transaction Ref:</strong> <span className="font-mono">{selectedPayment.reference_code}</span></div>
                                <div><strong>Amount:</strong> <span className="font-bold text-emerald-600">KSh {Number(selectedPayment.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
                                <div><strong>Payer Name:</strong> {selectedPayment.payer_name} ({selectedPayment.payer_phone})</div>
                                <div><strong>Original Entry:</strong> <span className="font-mono font-bold text-amber-600">{selectedPayment.bill_reference_entered || 'None'}</span></div>
                            </div>

                            <div>
                                <label className="font-bold block mb-1">Target Student ID (System Record ID):</label>
                                <Input
                                    type="number"
                                    required
                                    placeholder="Enter verified student database ID..."
                                    value={studentIdInput}
                                    onChange={(e) => setStudentIdInput(e.target.value)}
                                    className="h-9 text-xs"
                                />
                                <span className="text-[10px] text-slate-400">Enter the primary ID of the verified student.</span>
                            </div>

                            <div>
                                <label className="font-bold block mb-1">Bursar Resolution Notes:</label>
                                <Input
                                    placeholder="e.g. Verified parent identity via phone call..."
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    className="h-9 text-xs"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <Button type="button" variant="outline" onClick={() => setSelectedPayment(null)} size="sm">Cancel</Button>
                                <Button type="submit" disabled={isSubmitting} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                                    {isSubmitting ? 'Allocating...' : 'Confirm Allocation'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}