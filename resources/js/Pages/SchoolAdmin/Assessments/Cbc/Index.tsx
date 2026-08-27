import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps, CbcAssessment, AcademicYear, SchoolClass, PaginatedData } from '@/Types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { formatDate } from '@/lib/utils';
import {
    ArrowLeft,
    BookOpen,
    CheckCircle2,
    ClipboardList,
    FileSpreadsheet,
    Filter,
    Layers,
    Plus,
    Search,
    Trash2
} from 'lucide-react';

interface Props extends PageProps {
    assessments: PaginatedData<CbcAssessment>;
    academicYears: AcademicYear[];
    classes: SchoolClass[];
    filters: {
        academic_year_id: string;
        term: string;
        class_id: string;
        type: string;
        search: string;
    };
}

export default function CbcAssessmentIndex({ auth, assessments, academicYears = [], classes = [], filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [yearId, setYearId] = useState(filters.academic_year_id || '');
    const [term, setTerm] = useState(filters.term || '');
    const [classId, setClassId] = useState(filters.class_id || '');
    const [type, setType] = useState(filters.type || '');

    const handleFilter = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            '/school/cbc-assessments',
            {
                search,
                academic_year_id: yearId,
                term,
                class_id: classId,
                type,
            },
            { preserveState: true, replace: true }
        );
    };

    const typeBadge = (t: string) => {
        switch (t) {
            case 'formative_task':
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300';
            case 'summative_term':
                return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300';
            case 'project_work':
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300';
            case 'knec_cba':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const formatTypeLabel = (t: string) => {
        switch (t) {
            case 'formative_task': return 'Formative Task';
            case 'summative_term': return 'Summative Term';
            case 'project_work': return 'Project Work';
            case 'knec_cba': return 'KNEC CBA Assessment';
            default: return t;
        }
    };

    return (
        <AppLayout header="CBC / CBA Competency Assessments">
            <Head title="CBC Assessments - EduFlow" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Action Bar with Back Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors mb-1.5"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                            Back to Operations Cockpit
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                            CBC / CBA Competency Assessment Workspace
                        </h1>
                        <p className="text-xs text-slate-500">
                            Manage formative strands, learning outcomes, and 4-tier rubric evaluation (EE, ME, AE, BE).
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/school/cbc-assessments/create">
                            <Button size="sm" className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm">
                                <Plus className="w-3.5 h-3.5 mr-1.5" />
                                New Assessment Activity
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filter Bar */}
                <form onSubmit={handleFilter} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search title or learning area..."
                                className="h-9 pl-9 text-xs"
                            />
                        </div>

                        <div>
                            <Select value={yearId} onValueChange={setYearId}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Academic Years" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Academic Years</SelectItem>
                                    {academicYears.map((y) => (
                                        <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Select value={term} onValueChange={setTerm}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Terms" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Terms</SelectItem>
                                    <SelectItem value="Term 1">Term 1</SelectItem>
                                    <SelectItem value="Term 2">Term 2</SelectItem>
                                    <SelectItem value="Term 3">Term 3</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Select value={classId} onValueChange={setClassId}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Grades / Classes" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Grades</SelectItem>
                                    {classes.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Button type="submit" variant="outline" className="w-full h-9 text-xs font-semibold">
                                <Filter className="w-3.5 h-3.5 mr-1.5" />
                                Filter Records
                            </Button>
                        </div>
                    </div>
                </form>

                {/* Assessments Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                                    <th className="py-3 px-4 min-w-[240px]">Activity Title</th>
                                    <th className="py-3 px-4 min-w-[160px]">Learning Area</th>
                                    <th className="py-3 px-4 min-w-[130px]">Class & Stream</th>
                                    <th className="py-3 px-4 min-w-[120px]">Session & Term</th>
                                    <th className="py-3 px-4 min-w-[130px]">Type</th>
                                    <th className="py-3 px-4 min-w-[100px]">Date</th>
                                    <th className="py-3 px-4 min-w-[90px]">Strands</th>
                                    <th className="py-3 px-4 text-right min-w-[140px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {assessments.data && assessments.data.length > 0 ? (
                                    assessments.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3 px-4">
                                                <Link
                                                    href={`/school/cbc-assessments/${item.id}/score-sheet`}
                                                    className="font-bold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400"
                                                >
                                                    {item.title}
                                                </Link>
                                                {item.description && (
                                                    <div className="text-[10px] text-slate-400 truncate max-w-xs">{item.description}</div>
                                                )}
                                            </td>

                                            <td className="py-3 px-4">
                                                <div className="font-semibold text-slate-800 dark:text-slate-200">
                                                    {item.subject?.name || 'Learning Area'}
                                                </div>
                                                {item.subject?.code && (
                                                    <div className="text-[10px] text-slate-400 font-mono">{item.subject.code}</div>
                                                )}
                                            </td>

                                            <td className="py-3 px-4">
                                                <div className="font-semibold text-slate-800 dark:text-slate-200">
                                                    {item.school_class?.name || 'All Classes'}
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    {item.section?.name ? `Stream: ${item.section.name}` : 'All Streams'}
                                                </div>
                                            </td>

                                            <td className="py-3 px-4">
                                                <div className="font-medium text-slate-800 dark:text-slate-200">{item.academic_year?.name || '-'}</div>
                                                <div className="text-[10px] text-slate-400">{item.term}</div>
                                            </td>

                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center text-[10px] px-2.5 py-0.5 rounded-full border font-semibold whitespace-nowrap ${typeBadge(item.type)}`}>
                                                    {formatTypeLabel(item.type)}
                                                </span>
                                            </td>

                                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                {formatDate(item.assessment_date)}
                                            </td>

                                            <td className="py-3 px-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                    {item.strands_count ?? item.strands?.length ?? 0} strands
                                                </span>
                                            </td>

                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link href={`/school/cbc-assessments/${item.id}/score-sheet`}>
                                                        <Button size="sm" variant="outline" className="h-8 text-xs font-semibold">
                                                            <ClipboardList className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                                                            Score Sheet
                                                        </Button>
                                                    </Link>

                                                    <Link href={`/school/cbc-assessments/${item.id}/report`}>
                                                        <Button size="sm" variant="outline" className="h-8 text-xs" title="Official Broadsheet Report">
                                                            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-600" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="py-12 text-center text-xs text-slate-500">
                                            No CBC assessment activities recorded. Click <strong>New Assessment Activity</strong> to create one.
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