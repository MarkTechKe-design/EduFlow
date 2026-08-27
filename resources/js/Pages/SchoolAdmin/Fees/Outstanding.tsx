import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps, PaginatedData } from '@/Types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    DollarSign,
    Filter,
    Layers,
    Search,
    User
} from 'lucide-react';

interface StudentItem {
    id: number;
    first_name: string;
    last_name: string;
    admission_no: string;
    balance: number;
    guardian_phone?: string | null;
    school_class?: { name: string } | null;
    section?: { name: string } | null;
}

interface Props extends PageProps {
    students: PaginatedData<StudentItem>;
    classes: Array<{ id: number; name: string }>;
    totalOutstanding: number;
    filters: {
        search: string;
        class_id: string;
    };
}

export default function OutstandingFeesIndex({ auth, students, classes = [], totalOutstanding, filters }: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [selectedClass, setSelectedClass] = useState(filters.class_id || 'all');

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/school/fees/outstanding',
            { search: searchQuery, class_id: selectedClass },
            { preserveState: true, replace: true }
        );
    };

    return (
        <AppLayout header="Outstanding Fees & Arrears Schedule">
            <Head title="Fee Arrears - EduFlow" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <Link
                            href="/school/fees/payments"
                            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 mb-1"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                            Back to Payments
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-rose-600" />
                            Fee Arrears & Outstanding Balances
                        </h1>
                        <p className="text-xs text-slate-500">
                            Real-time learner ledger balances and fee collection schedules.
                        </p>
                    </div>

                    <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl px-4 py-2.5 flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-[11px] font-semibold text-rose-600 uppercase tracking-wider">Total Unpaid Arrears</div>
                            <div className="text-lg font-bold font-mono text-rose-700 dark:text-rose-300">
                                KSh {Number(totalOutstanding).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <form onSubmit={handleFilter} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div className="sm:col-span-2">
                            <Input
                                placeholder="Search by student name or admission number..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>

                        <div>
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
                            <Button type="submit" variant="outline" className="w-full h-9 text-xs font-semibold">
                                <Filter className="w-3.5 h-3.5 mr-1.5" />
                                Filter Balances
                            </Button>
                        </div>
                    </div>
                </form>

                {/* Outstanding Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                                    <th className="py-3 px-4">Admission No</th>
                                    <th className="py-3 px-4">Learner Name</th>
                                    <th className="py-3 px-4">Class & Stream</th>
                                    <th className="py-3 px-4">Guardian Contact</th>
                                    <th className="py-3 px-4 text-right">Outstanding Arrears</th>
                                    <th className="py-3 px-4 text-right">Ledger Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {students.data && students.data.length > 0 ? (
                                    students.data.map((st) => (
                                        <tr key={st.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                                                {st.admission_no}
                                            </td>

                                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                                                {st.first_name} {st.last_name}
                                            </td>

                                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                                                {st.school_class?.name || 'Class'} {st.section ? `(${st.section.name})` : ''}
                                            </td>

                                            <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                                                {st.guardian_phone || '-'}
                                            </td>

                                            <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                                                <span className={st.balance > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600'}>
                                                    KSh {Number(st.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>

                                            <td className="py-3 px-4 text-right">
                                                {st.balance > 0 ? (
                                                    <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                                                        Fee Balance
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        Cleared
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-10 text-center text-xs text-slate-500">
                                            No learner records found.
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