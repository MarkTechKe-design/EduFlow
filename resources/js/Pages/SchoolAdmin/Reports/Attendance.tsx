import { useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    CalendarCheck, Filter, Download, UserCheck, UserX, Clock, ShieldCheck, Search
} from 'lucide-react';
import type { PageProps } from '@/types';

interface SchoolClass {
    id: number;
    name: string;
}

interface AttendanceRecord {
    id: number;
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    remarks?: string;
    name: string;
    identifier: string;
    class_name: string;
    attendable_type: string;
}

interface PaginatedRecords {
    data: AttendanceRecord[];
    total: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props extends PageProps {
    records: PaginatedRecords;
    stats: {
        total_logs: number;
        present_count: number;
        absent_count: number;
        late_count: number;
        excused_count: number;
        attendance_rate: number;
    };
    classes: SchoolClass[];
    filters: {
        from_date: string;
        to_date: string;
        status: string;
        type: string;
        class_id: string;
        search: string;
    };
}

export default function AttendanceReport({
    records = { data: [], total: 0, current_page: 1, last_page: 1, from: 0, to: 0, links: [] },
    stats = { total_logs: 0, present_count: 0, absent_count: 0, late_count: 0, excused_count: 0, attendance_rate: 100 },
    classes = [],
    filters = { from_date: '', to_date: '', status: 'all', type: 'student', class_id: 'all', search: '' },
}: Props) {
    const [type, setType] = useState(filters.type || 'student');
    const [classId, setClassId] = useState(filters.class_id || 'all');
    const [status, setStatus] = useState(filters.status || 'all');
    const [fromDate, setFromDate] = useState(filters.from_date || '');
    const [toDate, setToDate] = useState(filters.to_date || '');
    const [search, setSearch] = useState(filters.search || '');

    function applyFilter() {
        router.get(
            '/school/reports/attendance',
            {
                type,
                class_id: classId !== 'all' ? classId : undefined,
                status: status !== 'all' ? status : undefined,
                from_date: fromDate || undefined,
                to_date: toDate || undefined,
                search: search || undefined,
            },
            { preserveState: true }
        );
    }

    function resetFilter() {
        router.get('/school/reports/attendance', {}, { preserveState: false });
    }

    function printReport() {
        window.print();
    }

    function getStatusBadge(st: string) {
        switch (st) {
            case 'present':
                return <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 font-bold">Present</Badge>;
            case 'absent':
                return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200 font-bold">Absent</Badge>;
            case 'late':
                return <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 font-bold">Late Arrival</Badge>;
            case 'excused':
                return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 font-bold">Excused / Medical</Badge>;
            default:
                return <Badge variant="outline" className="bg-slate-100 text-slate-700 capitalize font-bold">{st}</Badge>;
        }
    }

    return (
        <AppLayout title="Attendance & Roll Call Analytics Report">
            <div className="space-y-6 max-w-7xl mx-auto pb-16">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <CalendarCheck className="w-5 h-5 text-indigo-600" />
                            <span>Attendance & Roll Call Analytics</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Comprehensive daily attendance audit, termly class presence rates, and absentee tracking ledger.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button onClick={printReport} variant="outline" className="h-9 px-3 text-xs font-bold rounded-xl border-slate-200 shadow-2xs gap-1.5">
                            <Download className="w-3.5 h-3.5" /> Print / Export
                        </Button>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Presence Rate</span>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">{stats?.attendance_rate ?? 100}%</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Present</span>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.present_count ?? 0}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Absent</span>
                        <p className="text-2xl font-bold text-red-600 mt-1">{stats?.absent_count ?? 0}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Late Arrivals</span>
                        <p className="text-2xl font-bold text-amber-600 mt-1">{stats?.late_count ?? 0}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Excused Absence</span>
                        <p className="text-2xl font-bold text-blue-600 mt-1">{stats?.excused_count ?? 0}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end">
                        <div>
                            <Label className="text-xs font-bold mb-1 block">Scope / Type</Label>
                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="student">Student Roll Call</SelectItem>
                                    <SelectItem value="staff">Staff Attendance</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {type === 'student' && (
                            <div>
                                <Label className="text-xs font-bold mb-1 block">Class / Grade</Label>
                                <Select value={classId} onValueChange={setClassId}>
                                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Classes" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Classes</SelectItem>
                                        {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div>
                            <Label className="text-xs font-bold mb-1 block">Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="present">Present</SelectItem>
                                    <SelectItem value="absent">Absent</SelectItem>
                                    <SelectItem value="late">Late Arrival</SelectItem>
                                    <SelectItem value="excused">Excused</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs font-bold mb-1 block">From Date</Label>
                            <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="h-9 text-xs font-mono" />
                        </div>

                        <div>
                            <Label className="text-xs font-bold mb-1 block">To Date</Label>
                            <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="h-9 text-xs font-mono" />
                        </div>

                        <div className="flex gap-2">
                            <Button onClick={applyFilter} className="h-9 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-2xs gap-1 flex-1">
                                <Filter className="w-3.5 h-3.5" /> Filter
                            </Button>
                            <Button onClick={resetFilter} variant="outline" className="h-9 px-3 text-xs font-bold rounded-xl border-slate-200">
                                Reset
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Records Table */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Date</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">{type === 'student' ? 'Student Name & Adm' : 'Staff Name & Staff ID'}</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">{type === 'student' ? 'Class / Grade' : 'Department'}</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Attendance Status</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Remarks / Explanation</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="font-medium text-xs divide-y divide-slate-100">
                            {(!records?.data || records.data.length === 0) ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-16 text-slate-400">
                                        No attendance log records found for the selected period and criteria.
                                    </TableCell>
                                </TableRow>
                            ) : records.data.map(rec => (
                                <TableRow key={rec.id} className="hover:bg-slate-50/50">
                                    <TableCell className="py-3.5 px-4 font-mono text-slate-700">
                                        {rec.date}
                                    </TableCell>
                                    <TableCell className="py-3.5 px-4">
                                        <p className="font-bold text-slate-900">{rec.name}</p>
                                        <p className="text-[10px] font-mono text-slate-400">ID: {rec.identifier}</p>
                                    </TableCell>
                                    <TableCell className="py-3.5 px-4 font-semibold text-slate-700">
                                        {rec.class_name}
                                    </TableCell>
                                    <TableCell className="py-3.5 px-4">
                                        {getStatusBadge(rec.status)}
                                    </TableCell>
                                    <TableCell className="py-3.5 px-4 text-slate-600">
                                        {rec.remarks || '—'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}