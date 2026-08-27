import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/Types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { formatDate } from '@/lib/utils';
import {
    AlertCircle,
    ArrowLeft,
    BarChart3,
    BookOpen,
    Check,
    CheckCircle2,
    Clock,
    DollarSign,
    Download,
    FileSpreadsheet,
    FileText,
    Filter,
    Layers,
    MessageSquare,
    Printer,
    Send,
    Smartphone,
    Users
} from 'lucide-react';

interface BroadsheetItem {
    vote_head_id: number;
    name: string;
    category: string;
    total_collected: number;
    transaction_count: number;
    percentage_share: number;
}

interface ArrearsStudent {
    id: number;
    first_name: string;
    last_name: string;
    admission_no: string;
    outstanding_balance: number;
    guardian_phone?: string | null;
    school_class?: { name: string } | null;
    section?: { name: string } | null;
}

interface Props extends PageProps {
    activeTab: 'cashbook' | 'broadsheet' | 'arrears';
    classes: Array<{ id: number; name: string }>;
    cashbookData: {
        date: string;
        grand_total: number;
        total_transactions: number;
        channels: Record<string, { label: string; total: number; count: number }>;
        records: Array<{
            id: number;
            receipt_no: string;
            amount_paid: number;
            method: string;
            payment_date: string;
            note?: string | null;
            student?: { first_name: string; last_name: string; admission_no: string } | null;
        }>;
    };
    broadsheetData: {
        items: BroadsheetItem[];
        total_collected: number;
    };
    arrearsData: ArrearsStudent[];
    filters: {
        date: string;
        start_date: string;
        end_date: string;
        min_balance: number;
        class_id: string;
    };
}

export default function FinancialReports({
    auth,
    activeTab: initialTab = 'cashbook',
    classes = [],
    cashbookData,
    broadsheetData,
    arrearsData = [],
    filters,
}: Props) {
    const [tab, setTab] = useState<'cashbook' | 'broadsheet' | 'arrears'>(initialTab);
    const [selectedDate, setSelectedDate] = useState(filters.date);
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);
    const [selectedClass, setSelectedClass] = useState(filters.class_id || 'all');
    const [minBal, setMinBal] = useState(filters.min_balance.toString());

    // Batch SMS State
    const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
    const [smsModalOpen, setSmsModalOpen] = useState(false);
    const [customSmsMessage, setCustomSmsMessage] = useState('');
    const [isSendingSms, setIsSendingSms] = useState(false);

    const handleCashbookFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/school/fees/reports', { tab: 'cashbook', date: selectedDate }, { preserveState: true, replace: true });
    };

    const handleBroadsheetFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/school/fees/reports', { tab: 'broadsheet', start_date: startDate, end_date: endDate }, { preserveState: true, replace: true });
    };

    const handleArrearsFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/school/fees/reports',
            { tab: 'arrears', min_balance: minBal, class_id: selectedClass },
            { preserveState: true, replace: true }
        );
    };

    const handleSelectAllDebtors = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedStudentIds(arrearsData.map((s) => s.id));
        } else {
            setSelectedStudentIds([]);
        }
    };

    const handleToggleStudent = (id: number) => {
        if (selectedStudentIds.includes(id)) {
            setSelectedStudentIds(selectedStudentIds.filter((item) => item !== id));
        } else {
            setSelectedStudentIds([...selectedStudentIds, id]);
        }
    };

    const handleSendBatchSms = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedStudentIds.length === 0) return;

        setIsSendingSms(true);
        router.post(
            '/school/fees/reports/sms-defaulters',
            {
                student_ids: selectedStudentIds,
                custom_message: customSmsMessage,
            },
            {
                onSuccess: () => {
                    setSmsModalOpen(false);
                    setSelectedStudentIds([]);
                    setIsSendingSms(false);
                },
                onError: () => {
                    setIsSendingSms(false);
                },
            }
        );
    };

    return (
        <AppLayout header="Financial Audit Reports & Broadsheets">
            <Head title="Financial Reports - EduFlow" />

            <div className="max-w-7xl mx-auto space-y-6 pb-16">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                    <div>
                        <Link
                            href="/school/fees/payments"
                            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 mb-1 transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                            Back to Payment Ledger
                        </Link>
                        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                            Financial Intelligence & Audit Reports
                        </h1>
                        <p className="text-xs text-slate-500">
                            Real-time bursar cashbook, vote-head broadsheets, and arrears recovery schedules.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => window.print()}
                            size="sm"
                            variant="outline"
                            className="h-9 text-xs font-semibold"
                        >
                            <Printer className="w-3.5 h-3.5 mr-1.5" />
                            Print Report
                        </Button>
                    </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <button
                        onClick={() => setTab('cashbook')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                            tab === 'cashbook'
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        Daily Bursar Cashbook
                    </button>
                    <button
                        onClick={() => setTab('broadsheet')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                            tab === 'broadsheet'
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        Vote-Head Collection Broadsheet
                    </button>
                    <button
                        onClick={() => setTab('arrears')}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                            tab === 'arrears'
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                    >
                        Term Arrears & SMS Defaulters ({arrearsData.length})
                    </button>
                </div>

                {/* TAB 1: DAILY BURSAR CASHBOOK */}
                {tab === 'cashbook' && (
                    <div className="space-y-6">
                        {/* Filter Bar */}
                        <form onSubmit={handleCashbookFilter} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
                            <div className="flex-1 w-full flex items-center gap-2">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Audit Date:</label>
                                <Input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="h-9 text-xs max-w-xs font-mono"
                                />
                            </div>
                            <Button type="submit" size="sm" className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold w-full sm:w-auto">
                                <Filter className="w-3.5 h-3.5 mr-1" />
                                Generate Cashbook
                            </Button>
                        </form>

                        {/* Channel Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-1">
                                <div className="text-xs font-medium text-slate-500">Total Day Inflow</div>
                                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                                    KSh {Number(cashbookData.grand_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                <div className="text-[11px] text-indigo-600 font-semibold">{cashbookData.total_transactions} Transactions Audited</div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-1">
                                <div className="text-xs font-medium text-emerald-600 font-semibold flex items-center gap-1">
                                    <Smartphone className="w-3.5 h-3.5" /> M-Pesa Daraja
                                </div>
                                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                                    KSh {Number(cashbookData.channels.mpesa?.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                <div className="text-[11px] text-slate-500">{cashbookData.channels.mpesa?.count || 0} Transactions</div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-1">
                                <div className="text-xs font-medium text-blue-600 font-semibold">Bank Transfers & Slips</div>
                                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                                    KSh {Number((cashbookData.channels.bank_transfer?.total || 0) + (cashbookData.channels.direct_deposit?.total || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                <div className="text-[11px] text-slate-500">{(cashbookData.channels.bank_transfer?.count || 0) + (cashbookData.channels.direct_deposit?.count || 0)} Transactions</div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm space-y-1">
                                <div className="text-xs font-medium text-amber-600 font-semibold">Bursar Cash & Cheques</div>
                                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                                    KSh {Number((cashbookData.channels.cash?.total || 0) + (cashbookData.channels.cheque?.total || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </div>
                                <div className="text-[11px] text-slate-500">{(cashbookData.channels.cash?.count || 0) + (cashbookData.channels.cheque?.count || 0)} Transactions</div>
                            </div>
                        </div>

                        {/* Transactions Table */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    Itemized Cashbook Transactions for {formatDate(selectedDate)}
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                                            <th className="py-3 px-4">Receipt No</th>
                                            <th className="py-3 px-4">Student Name</th>
                                            <th className="py-3 px-4">Channel</th>
                                            <th className="py-3 px-4">Notes / Reference</th>
                                            <th className="py-3 px-4 text-right">Amount (KSh)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {cashbookData.records && cashbookData.records.length > 0 ? (
                                            cashbookData.records.map((r) => (
                                                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{r.receipt_no}</td>
                                                    <td className="py-3 px-4">
                                                        <div className="font-bold">{r.student ? `${r.student.first_name} ${r.student.last_name}` : 'N/A'}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono">{r.student?.admission_no || '-'}</div>
                                                    </td>
                                                    <td className="py-3 px-4 uppercase font-semibold">{r.method}</td>
                                                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{r.note || '-'}</td>
                                                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                        {Number(r.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="py-10 text-center text-xs text-slate-500">
                                                    No collections recorded on {selectedDate}.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: VOTE-HEAD COLLECTION BROADSHEET */}
                {tab === 'broadsheet' && (
                    <div className="space-y-6">
                        <form onSubmit={handleBroadsheetFilter} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">From:</label>
                                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 text-xs font-mono" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">To:</label>
                                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-9 text-xs font-mono" />
                            </div>
                            <Button type="submit" size="sm" className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                                <Filter className="w-3.5 h-3.5 mr-1" />
                                Filter Range
                            </Button>
                        </form>

                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                <span className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                    Vote Head Revenue Distribution & Allocations
                                </span>
                                <span className="text-xs font-mono font-bold text-indigo-600">
                                    Total Revenue: KSh {Number(broadsheetData.total_collected).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                                            <th className="py-3 px-4">Vote Head Name</th>
                                            <th className="py-3 px-4">Category</th>
                                            <th className="py-3 px-4">Settled Transactions</th>
                                            <th className="py-3 px-4 text-right">Collected (KSh)</th>
                                            <th className="py-3 px-4 text-right">Revenue Share</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {broadsheetData.items && broadsheetData.items.length > 0 ? (
                                            broadsheetData.items.map((item) => (
                                                <tr key={item.vote_head_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{item.name}</td>
                                                    <td className="py-3 px-4 uppercase font-semibold text-slate-500">{item.category}</td>
                                                    <td className="py-3 px-4 font-mono">{item.transaction_count}</td>
                                                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                        {Number(item.total_collected).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="py-3 px-4 text-right font-mono font-bold text-indigo-600">
                                                        {item.percentage_share}%
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="py-10 text-center text-xs text-slate-500">
                                                    No vote head allocations recorded in this date range.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 3: ARREARS DEFAULTERS & BATCH SMS */}
                {tab === 'arrears' && (
                    <div className="space-y-6">
                        {/* Filter Bar */}
                        <form onSubmit={handleArrearsFilter} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div>
                                <label className="text-xs font-bold block mb-1">Target Class:</label>
                                <Select value={selectedClass} onValueChange={setSelectedClass}>
                                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Classes" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Classes</SelectItem>
                                        {classes.map((c) => (
                                            <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-xs font-bold block mb-1">Minimum Arrears (KSh):</label>
                                <Input type="number" value={minBal} onChange={(e) => setMinBal(e.target.value)} className="h-9 text-xs font-mono" />
                            </div>

                            <div className="sm:col-span-2 flex items-end justify-between gap-2">
                                <Button type="submit" size="sm" variant="outline" className="h-9 text-xs font-bold">
                                    <Filter className="w-3.5 h-3.5 mr-1" />
                                    Filter Defaulters
                                </Button>

                                <Button
                                    type="button"
                                    onClick={() => setSmsModalOpen(true)}
                                    disabled={selectedStudentIds.length === 0}
                                    size="sm"
                                    className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                >
                                    <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                                    Send Batch SMS ({selectedStudentIds.length})
                                </Button>
                            </div>
                        </form>

                        {/* Defaulters Table */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                                            <th className="py-3 px-4 w-10">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStudentIds.length === arrearsData.length && arrearsData.length > 0}
                                                    onChange={handleSelectAllDebtors}
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                            </th>
                                            <th className="py-3 px-4">Admission No</th>
                                            <th className="py-3 px-4">Student Name</th>
                                            <th className="py-3 px-4">Class</th>
                                            <th className="py-3 px-4">Guardian Phone</th>
                                            <th className="py-3 px-4 text-right">Outstanding Arrears</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {arrearsData.length > 0 ? (
                                            arrearsData.map((st) => (
                                                <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                    <td className="py-3 px-4">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedStudentIds.includes(st.id)}
                                                            onChange={() => handleToggleStudent(st.id)}
                                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                    </td>
                                                    <td className="py-3 px-4 font-mono font-bold">{st.admission_no}</td>
                                                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{st.first_name} {st.last_name}</td>
                                                    <td className="py-3 px-4">{st.school_class?.name || 'Class'}</td>
                                                    <td className="py-3 px-4 font-mono text-slate-500">{st.guardian_phone || 'No phone'}</td>
                                                    <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                                                        KSh {Number(st.outstanding_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="py-10 text-center text-xs text-slate-500">
                                                    No defaulters found above KSh {minBal}.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* BATCH SMS MODAL */}
            {smsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-emerald-600" />
                                Send Fee Balance Reminders
                            </h3>
                            <button onClick={() => setSmsModalOpen(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
                        </div>

                        <form onSubmit={handleSendBatchSms} className="space-y-3 text-xs">
                            <p className="text-slate-600 dark:text-slate-400">
                                You are about to dispatch automated arrears SMS reminders to <strong>{selectedStudentIds.length}</strong> selected guardians.
                            </p>

                            <div>
                                <label className="font-bold block mb-1">Custom Message Template (Optional):</label>
                                <textarea
                                    rows={3}
                                    placeholder="Leave blank to use system default: 'Dear Parent, reminder that [Student] has a balance of KSh [Amount]...'"
                                    value={customSmsMessage}
                                    onChange={(e) => setCustomSmsMessage(e.target.value)}
                                    className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-transparent p-2 text-xs"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <Button type="button" variant="outline" onClick={() => setSmsModalOpen(false)} size="sm">Cancel</Button>
                                <Button type="submit" disabled={isSendingSms} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                                    <Send className="w-3.5 h-3.5 mr-1" />
                                    {isSendingSms ? 'Dispatching...' : 'Dispatch Reminders'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}