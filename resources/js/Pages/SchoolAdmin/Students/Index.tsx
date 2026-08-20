import React, { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Plus, Upload, Download, Printer, Layers, GitBranch, Search, UserCheck, Users, GraduationCap, ArrowRightLeft, Eye, Edit } from 'lucide-react';

interface SchoolClass {
    id: number;
    name: string;
}

interface Section {
    id: number;
    class_id: number;
    name: string;
}

interface StudentItem {
    id: number;
    admission_no: string;
    first_name: string;
    last_name: string;
    gender: string;
    admission_date?: string;
    status: string;
    class?: { id: number; name: string };
    section?: { id: number; name: string };
    guardian?: { id: number; name: string; phone?: string };
    guardian_name?: string;
}

interface Props {
    students: {
        data: StudentItem[];
        meta: {
            total: number;
            per_page: number;
            current_page: number;
            last_page: number;
            from: number;
            to: number;
            links: Array<{ url: string | null; label: string; active: boolean }>;
        };
    };
    classes: SchoolClass[];
    sections: Section[];
    metrics: {
        total: number;
        active: number;
        alumni: number;
        transferred: number;
    };
    filters: {
        search: string;
        class_id: string;
        section_id: string;
        status: string;
    };
    capabilities: { import: boolean; export: boolean };
}

export default function StudentsIndex({ students, classes = [], sections = [], metrics, filters, capabilities }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [classId, setClassId] = useState(filters.class_id || 'all');
    const [sectionId, setSectionId] = useState(filters.section_id || 'all');
    const [status, setStatus] = useState(filters.status || 'all');

    // Filter streams dynamically by selected class
    const availableSections = useMemo(() => {
        if (classId === 'all') return sections;
        return sections.filter((s) => s.class_id === Number(classId));
    }, [classId, sections]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search, class_id: classId, section_id: sectionId, status });
    };

    const handleClassChange = (newClassId: string) => {
        setClassId(newClassId);
        setSectionId('all');
        applyFilters({ search, class_id: newClassId, section_id: 'all', status });
    };

    const handleSectionChange = (newSectionId: string) => {
        setSectionId(newSectionId);
        applyFilters({ search, class_id: classId, section_id: newSectionId, status });
    };

    const handleStatusChange = (newStatus: string) => {
        setStatus(newStatus);
        applyFilters({ search, class_id: classId, section_id: sectionId, status: newStatus });
    };

    const applyFilters = (newFilters: { search: string; class_id: string; section_id: string; status: string }) => {
        router.get('/school/students', newFilters, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const exportParams = new URLSearchParams();
    if (classId !== 'all') exportParams.append('class_id', classId);
    if (sectionId !== 'all') exportParams.append('section_id', sectionId);
    if (status !== 'all') exportParams.append('status', status);
    const exportUrl = `/school/students/export${exportParams.toString() ? '?' + exportParams.toString() : ''}`;

    return (
        <AppLayout>
            <Head title="Students Management Workspace" />

            <div className="space-y-6">
                {/* Header & Workspace Action Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Students Workspace</h1>
                        <p className="text-sm text-slate-500">Manage admissions, class streams, records, documents, and bulk data.</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 print:hidden">
                        {/* Class & Stream Shortcuts */}
                        <Link
                            href="/school/classes"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            <Layers className="h-4 w-4 text-slate-500" />
                            Classes
                        </Link>

                        <Link
                            href="/school/sections"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            <GitBranch className="h-4 w-4 text-slate-500" />
                            Streams
                        </Link>

                        {/* Import / Export / Print */}
                        <Link
                            href="/school/students/import"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            <Upload className="h-4 w-4 text-slate-500" />
                            Import (Excel/CSV)
                        </Link>

                        <a
                            href={exportUrl}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            <Download className="h-4 w-4 text-slate-500" />
                            Export
                        </a>

                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            <Printer className="h-4 w-4 text-slate-500" />
                            Print
                        </button>

                        {/* Primary Admit Student Button */}
                        <Link
                            href="/school/students/create"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700"
                        >
                            <Plus className="h-4 w-4" />
                            Admit Student
                        </Link>
                    </div>
                </div>

                {/* Metric Summary Cards */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total</span>
                            <Users className="h-5 w-5 text-slate-400" />
                        </div>
                        <p className="mt-2 text-3xl font-bold text-slate-900">{metrics.total}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active</span>
                            <UserCheck className="h-5 w-5 text-emerald-500" />
                        </div>
                        <p className="mt-2 text-3xl font-bold text-emerald-600">{metrics.active}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Alumni</span>
                            <GraduationCap className="h-5 w-5 text-blue-500" />
                        </div>
                        <p className="mt-2 text-3xl font-bold text-blue-600">{metrics.alumni}</p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Transferred</span>
                            <ArrowRightLeft className="h-5 w-5 text-amber-500" />
                        </div>
                        <p className="mt-2 text-3xl font-bold text-amber-600">{metrics.transferred}</p>
                    </div>
                </div>

                {/* Search & Dynamic Filter Bar */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
                    <form onSubmit={handleSearch} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
                        {/* Search Input */}
                        <div className="relative lg:col-span-4">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search name, admission no, UPI..."
                                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                        </div>

                        {/* Class Dropdown */}
                        <div className="lg:col-span-3">
                            <select
                                value={classId}
                                onChange={(e) => handleClassChange(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="all">All Classes / Grades</option>
                                {classes.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Stream Dropdown (Dynamic) */}
                        <div className="lg:col-span-2">
                            <select
                                value={sectionId}
                                onChange={(e) => handleSectionChange(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="all">All Streams</option>
                                {availableSections.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status Dropdown */}
                        <div className="lg:col-span-2">
                            <select
                                value={status}
                                onChange={(e) => handleStatusChange(e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="graduated">Alumni</option>
                                <option value="transferred">Transferred</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        {/* Filter Submit */}
                        <div className="lg:col-span-1">
                            <button
                                type="submit"
                                className="w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                Search
                            </button>
                        </div>
                    </form>
                </div>

                {/* Students Data Table */}
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-6 py-3.5">Student</th>
                                    <th className="px-6 py-3.5">Admission No</th>
                                    <th className="px-6 py-3.5">Class / Stream</th>
                                    <th className="px-6 py-3.5">Guardian</th>
                                    <th className="px-6 py-3.5">Status</th>
                                    <th className="px-6 py-3.5">Admitted</th>
                                    <th className="px-6 py-3.5 text-right print:hidden">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {students.data.length > 0 ? (
                                    students.data.map((student) => (
                                        <tr key={student.id} className="transition hover:bg-slate-50/70">
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                                                        {student.first_name?.[0] || 'S'}
                                                    </div>
                                                    <div>
                                                        <Link
                                                            href={`/school/students/${student.id}`}
                                                            className="font-semibold text-slate-900 hover:text-indigo-600"
                                                        >
                                                            {student.first_name} {student.last_name}
                                                        </Link>
                                                        <p className="text-xs text-slate-400 capitalize">{student.gender}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-slate-600">{student.admission_no}</td>
                                            <td className="px-6 py-4 text-slate-700">
                                                {student.class?.name ? (
                                                    <span>
                                                        <span className="font-semibold text-slate-900">{student.class.name}</span>
                                                        {student.section?.name && (
                                                            <span className="text-slate-500"> / {student.section.name}</span>
                                                        )}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {student.guardian?.name || student.guardian_name ? (
                                                    <div>
                                                        <p className="text-xs font-medium text-slate-900">
                                                            {student.guardian?.name || student.guardian_name}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400">
                                                            {student.guardian?.phone || '—'}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                                                        student.status === 'active'
                                                            ? 'bg-emerald-50 text-emerald-700'
                                                            : student.status === 'graduated'
                                                            ? 'bg-blue-50 text-blue-700'
                                                            : student.status === 'transferred'
                                                            ? 'bg-amber-50 text-amber-700'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    {student.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500">
                                                {student.admission_date
                                                    ? new Date(student.admission_date).toLocaleDateString()
                                                    : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-right print:hidden">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link
                                                        href={`/school/students/${student.id}`}
                                                        className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                                        title="View Record"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                    <Link
                                                        href={`/school/students/${student.id}/edit`}
                                                        className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                                        title="Edit Record"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400">
                                            No students found matching the selected filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {students.meta.links && students.meta.links.length > 3 && (
                        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3.5 print:hidden">
                            <span className="text-xs text-slate-500">
                                Showing {students.meta.from || 0} to {students.meta.to || 0} of {students.meta.total} learners
                            </span>
                            <div className="flex gap-1">
                                {students.meta.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        className={`rounded-md px-3 py-1 text-xs font-medium ${
                                            link.active
                                                ? 'bg-indigo-600 text-white'
                                                : link.url
                                                ? 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                                                : 'cursor-not-allowed text-slate-300'
                                        }`}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}