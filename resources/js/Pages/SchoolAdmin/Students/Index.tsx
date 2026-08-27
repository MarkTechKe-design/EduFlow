import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps, Student, SchoolClass, Section } from '@/Types';
import { Button } from '@/Components/ui/button';
import { formatDate } from '@/lib/utils';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import {
    Download,
    Eye,
    FileSpreadsheet,
    Filter,
    GraduationCap,
    Pencil,
    Plus,
    Printer,
    Search,
    Users
} from 'lucide-react';

interface Props extends PageProps {
    students: {
        data: Student[];
        links: any[];
        total: number;
        current_page: number;
        last_page: number;
        from: number;
        to: number;
    };
    classes: SchoolClass[];
    sections: Section[];
    filters: {
        search?: string;
        class_id?: string;
        section_id?: string;
        status?: string;
    };
    counts?: {
        total: number;
        active: number;
        alumni: number;
        transferred: number;
    };
}

export default function StudentIndex({
    auth,
    students,
    classes = [],
    sections = [],
    filters = {},
    counts,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [classId, setClassId] = useState(filters.class_id || 'all');
    const [sectionId, setSectionId] = useState(filters.section_id || 'all');
    const [status, setStatus] = useState(filters.status || 'all');

    const filteredSections = classId && classId !== 'all'
        ? sections.filter((s) => String(s.class_id) === String(classId))
        : sections;

    const handleFilterChange = (key: string, val: string) => {
        const query: Record<string, string> = {
            search,
            class_id: classId,
            section_id: sectionId,
            status,
            [key]: val,
        };

        if (key === 'class_id') {
            query.section_id = 'all';
            setSectionId('all');
        }

        Object.keys(query).forEach((k) => {
            if (query[k] === 'all' || !query[k]) delete query[k];
        });

        router.get('/school/students', query, { preserveState: true, replace: true });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilterChange('search', search);
    };

    const statusBadgeVariant = (s: string) => {
        switch (s?.toLowerCase()) {
            case 'active':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
            case 'inactive':
                return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
            case 'transferred':
            case 'transferred_out':
                return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
            case 'graduated':
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const totalStudents = counts?.total ?? students.total ?? 0;
    const activeStudents = counts?.active ?? 0;
    const alumniStudents = counts?.alumni ?? 0;
    const transferredStudents = counts?.transferred ?? 0;

    return (
        <AppLayout header="Student Directory">
            <Head title="Students Directory - EduFlow" />

            <div className="space-y-6">
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Students Workspace</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Manage student admissions, national identifiers (NEMIS/CBA), and class progression.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button asChild variant="outline" size="sm" className="h-9 text-xs">
                            <Link href="/school/students-promotion">
                                <GraduationCap className="w-3.5 h-3.5 mr-1.5 text-indigo-600 dark:text-indigo-400" />
                                Bulk Promotion
                            </Link>
                        </Button>

                        <Button asChild variant="outline" size="sm" className="h-9 text-xs">
                            <Link href="/school/students/import">
                                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                                Bulk Import
                            </Link>
                        </Button>

                        <Button asChild variant="outline" size="sm" className="h-9 text-xs">
                            <a href={`/school/students/export?${new URLSearchParams(window.location.search).toString()}`}>
                                <Download className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                                Export CSV
                            </a>
                        </Button>

                        <Button asChild variant="outline" size="sm" className="h-9 text-xs">
                            <a
                                href={`/school/students/print?${new URLSearchParams(window.location.search).toString()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                                Print Roster
                            </a>
                        </Button>

                        <Button asChild size="sm" className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                            <Link href="/school/students/create">
                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                Admit Student
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Enrolled</span>
                            <Users className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{totalStudents}</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Active Learners</span>
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        </div>
                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{activeStudents || totalStudents}</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Alumni / Graduated</span>
                            <GraduationCap className="w-4 h-4 text-slate-400" />
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{alumniStudents}</div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Transferred Out</span>
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{transferredStudents}</div>
                    </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div className="lg:col-span-2 relative">
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by name, Adm No, NEMIS UPI, Birth Cert..."
                                className="h-9 pl-9 text-xs"
                            />
                        </div>

                        <div>
                            <Select
                                value={classId}
                                onValueChange={(val) => {
                                    setClassId(val);
                                    handleFilterChange('class_id', val);
                                }}
                            >
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Classes" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes / Grades</SelectItem>
                                    {classes.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Select
                                value={sectionId}
                                onValueChange={(val) => {
                                    setSectionId(val);
                                    handleFilterChange('section_id', val);
                                }}
                                disabled={classId === 'all'}
                            >
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Streams" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Streams</SelectItem>
                                    {filteredSections.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex gap-2">
                            <Select
                                value={status}
                                onValueChange={(val) => {
                                    setStatus(val);
                                    handleFilterChange('status', val);
                                }}
                            >
                                <SelectTrigger className="h-9 text-xs flex-1"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="transferred">Transferred</SelectItem>
                                    <SelectItem value="graduated">Graduated</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button type="submit" size="sm" className="h-9 px-4 text-xs font-semibold">
                                Search
                            </Button>
                        </div>
                    </form>
                </div>

                {/* Student Directory Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                                    <th className="py-3 px-4">Learner Identity</th>
                                    <th className="py-3 px-4">Identifiers (Adm / UPI)</th>
                                    <th className="py-3 px-4">Class & Stream</th>
                                    <th className="py-3 px-4">Guardian Contact</th>
                                    <th className="py-3 px-4">Status & Type</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                                {students.data.length > 0 ? (
                                    students.data.map((student) => {
                                        const fullName = student.full_name || [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ');
                                        const initials = (student.first_name?.[0] || '') + (student.last_name?.[0] || '');

                                        return (
                                            <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                                {/* Learner Identity */}
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                            {initials || 'ST'}
                                                        </div>
                                                        <div>
                                                            <Link
                                                                href={`/school/students/${student.id}`}
                                                                className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                            >
                                                                {fullName}
                                                            </Link>
                                                            <div className="text-[11px] text-slate-400 capitalize">
                                                                {student.gender} {student.birth_certificate_no ? `? BC: ${student.birth_certificate_no}` : ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Identifiers */}
                                                <td className="py-3 px-4">
                                                    <div className="font-semibold text-slate-900 dark:text-white">
                                                        {student.admission_no}
                                                    <div className="text-[10px] text-slate-400">Adm: {formatDate(student.admission_date)}</div>
                                                    </div>
                                                    {student.nemis_upi ? (
                                                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                                            UPI: <span className="font-mono text-slate-700 dark:text-slate-300">{student.nemis_upi}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-[10px] text-slate-400">UPI: Not Linked</div>
                                                    )}
                                                </td>

                                                {/* Class & Stream */}
                                                <td className="py-3 px-4">
                                                    <div className="font-semibold text-slate-900 dark:text-white">
                                                        {student.school_class?.name ?? student.class?.name ?? 'Unassigned'}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                                        Stream: {student.section?.name || 'General'}
                                                    </div>
                                                </td>

                                                {/* Guardian Contact */}
                                                <td className="py-3 px-4">
                                                    <div className="font-medium text-slate-900 dark:text-white">
                                                        {student.guardian?.name || student.guardian_name || '-'}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400">
                                                        {student.guardian?.phone || student.guardian_phone || student.phone || 'No phone'}
                                                    </div>
                                                </td>

                                                {/* Status & Type */}
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold capitalize ${statusBadgeVariant(student.status)}`}>
                                                            {student.status}
                                                        </span>
                                                        {student.admission_type && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 capitalize">
                                                                {student.admission_type.replace('_', ' ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link href={`/school/students/${student.id}`}>
                                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white">
                                                                <Eye className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/school/students/${student.id}/edit`}>
                                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-500 hover:text-slate-900 dark:hover:text-white">
                                                                <Pencil className="w-3.5 h-3.5" />
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400">
                                            No students found matching the selected criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {(() => {
                        const links = (students as any).links || (students as any).meta?.links || [];
                        const total = (students as any).total ?? (students as any).meta?.total ?? 0;
                        const from = (students as any).from ?? (students as any).meta?.from ?? 0;
                        const to = (students as any).to ?? (students as any).meta?.to ?? 0;

                        if (!links || links.length <= 3) return null;

                        return (
                            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900">
                                <div>
                                    Showing <span className="font-semibold text-slate-900 dark:text-white">{from}</span> to{' '}
                                    <span className="font-semibold text-slate-900 dark:text-white">{to}</span> of{' '}
                                    <span className="font-semibold text-slate-900 dark:text-white">{total}</span> learners
                                </div>

                                <div className="flex items-center flex-wrap gap-1">
                                    {links.map((link: any, idx: number) => {
                                        if (!link.url && !link.active) {
                                            return (
                                                <span
                                                    key={idx}
                                                    children={link.label.replace(/<[^>]*>/g, '')}
                                                    className="px-3 py-1.5 rounded border border-transparent text-slate-400 dark:text-slate-600 text-xs cursor-not-allowed select-none"
                                                />
                                            );
                                        }

                                        return (
                                            <Link
                                                key={idx}
                                                href={link.url}
                                                children={link.label.replace(/<[^>]*>/g, '')}
                                                className={`px-3 py-1.5 rounded border text-xs font-medium transition-colors ${
                                                    link.active
                                                        ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-sm'
                                                        : 'text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </AppLayout>
    );
}