import React, { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { ArrowLeft, Save, CheckCircle2, Search, Table as TableIcon, List, Download, Upload, X, FileSpreadsheet } from 'lucide-react';

interface Subject {
    id: number;
    name: string;
    code?: string;
    full_marks: number;
    pass_marks: number;
}

interface Student {
    id: number;
    first_name: string;
    last_name?: string;
    admission_no?: string;
    roll_no?: string;
    section_id?: number;
    section?: { id: number; name: string };
}

interface ExistingMark {
    id?: number;
    marks_obtained?: number | string | null;
    grade?: string;
    gpa?: number;
    is_absent?: boolean;
    remarks?: string;
}

interface Props {
    exam: {
        id: number;
        name: string;
        type: string;
        status: string;
        school_class?: { id: number; name: string };
        schoolClass?: { id: number; name: string };
    };
    subjects: Subject[];
    students: Student[];
    existingMarks: Record<number, Record<number, ExistingMark>>;
    sections: Array<{ id: number; name: string }>;
    filters: {
        section_id?: number | string;
    };
}

export default function MarksEntry({ exam, subjects = [], students = [], existingMarks = {}, sections = [], filters }: Props) {
    const [viewMode, setViewMode] = useState<'matrix' | 'single'>('matrix');
    const [selectedSubjectId, setSelectedSubjectId] = useState<number>(subjects[0]?.id || 0);
    const [selectedSectionId, setSelectedSectionId] = useState<string>(String(filters.section_id || ''));
    const [searchQuery, setSearchQuery] = useState('');
    const [processing, setProcessing] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [csvFile, setCsvFile] = useState<File | null>(null);

    const className = exam.schoolClass?.name || exam.school_class?.name || 'Class';

    // Grid state: student_id -> subject_id -> { marks_obtained, is_absent, remarks }
    const [gridMarks, setGridMarks] = useState<Record<number, Record<number, { marks_obtained: string; is_absent: boolean; remarks: string }>>>(() => {
        const initial: Record<number, Record<number, { marks_obtained: string; is_absent: boolean; remarks: string }>> = {};
        students.forEach((student) => {
            initial[student.id] = {};
            subjects.forEach((subject) => {
                const existing = existingMarks[student.id]?.[subject.id];
                initial[student.id][subject.id] = {
                    marks_obtained: existing?.marks_obtained !== undefined && existing?.marks_obtained !== null ? String(existing.marks_obtained) : '',
                    is_absent: Boolean(existing?.is_absent),
                    remarks: existing?.remarks || '',
                };
            });
        });
        return initial;
    });

    const handleMarkChange = (studentId: number, subjectId: number, value: string) => {
        setGridMarks((prev) => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [subjectId]: {
                    ...prev[studentId]?.[subjectId],
                    marks_obtained: value,
                    is_absent: false,
                },
            },
        }));
    };

    const handleAbsentToggle = (studentId: number, subjectId: number, isAbsent: boolean) => {
        setGridMarks((prev) => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [subjectId]: {
                    ...prev[studentId]?.[subjectId],
                    is_absent: isAbsent,
                    marks_obtained: isAbsent ? '' : prev[studentId]?.[subjectId]?.marks_obtained || '',
                },
            },
        }));
    };

    const filteredStudents = useMemo(() => {
        return students.filter((s) => {
            const fullName = `${s.first_name} ${s.last_name || ''}`.toLowerCase();
            const adm = (s.admission_no || '').toLowerCase();
            const q = searchQuery.toLowerCase();
            return fullName.includes(q) || adm.includes(q);
        });
    }, [students, searchQuery]);

    const handleSave = () => {
        setProcessing(true);
        const marksPayload: Array<{
            student_id: number;
            subject_id: number;
            marks_obtained: number | null;
            is_absent: boolean;
            remarks: string | null;
        }> = [];

        Object.entries(gridMarks).forEach(([studentIdStr, subjectObj]) => {
            const studentId = parseInt(studentIdStr, 10);
            Object.entries(subjectObj).forEach(([subjectIdStr, data]) => {
                const subjectId = parseInt(subjectIdStr, 10);
                if (data.is_absent || data.marks_obtained.trim() !== '') {
                    marksPayload.push({
                        student_id: studentId,
                        subject_id: subjectId,
                        marks_obtained: data.is_absent || data.marks_obtained.trim() === '' ? null : parseFloat(data.marks_obtained),
                        is_absent: data.is_absent,
                        remarks: data.remarks.trim() || null,
                    });
                }
            });
        });

        router.post(`/school/exams/${exam.id}/marks`, {
            section_id: selectedSectionId ? parseInt(selectedSectionId, 10) : null,
            marks: marksPayload,
        }, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
        });
    };

    const handleImportSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!csvFile) return;

        setProcessing(true);
        const formData = new FormData();
        formData.append('file', csvFile);

        router.post(`/school/exams/${exam.id}/marks/import`, formData, {
            onSuccess: () => {
                setProcessing(false);
                setIsImportModalOpen(false);
                setCsvFile(null);
            },
            onError: () => setProcessing(false),
        });
    };

    const activeSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

    return (
        <AppLayout>
            <Head title={`Marks Entry - ${exam.name}`} />

            <div className="space-y-6">
                {/* Header and Controls */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Link href="/school/exams" className="text-slate-400 hover:text-slate-600">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{exam.name}</h1>
                        </div>
                        <p className="text-sm text-slate-500 mt-1">
                            Class: <strong className="text-slate-700">{className}</strong> • Multi-subject marks entry matrix.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* View Mode Toggle */}
                        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
                            <button
                                type="button"
                                onClick={() => setViewMode('matrix')}
                                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                                    viewMode === 'matrix' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <TableIcon className="h-3.5 w-3.5" />
                                Class Matrix
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('single')}
                                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                                    viewMode === 'single' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <List className="h-3.5 w-3.5" />
                                Single Subject
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsImportModalOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
                        >
                            <Upload className="h-4 w-4" />
                            Import CSV
                        </button>

                        <a
                            href={`/school/exams/${exam.id}/marks/template${selectedSectionId ? `?section_id=${selectedSectionId}` : ''}`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
                        >
                            <Download className="h-4 w-4" />
                            Template
                        </a>

                        <Link
                            href={`/school/exams/${exam.id}/results`}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
                        >
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            Merit List
                        </Link>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={processing}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {processing ? 'Saving...' : 'Save All Marks'}
                        </button>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Filter Stream / Section</label>
                        <select
                            value={selectedSectionId}
                            onChange={(e) => {
                                setSelectedSectionId(e.target.value);
                                router.get(`/school/exams/${exam.id}/marks`, {
                                    section_id: e.target.value || undefined,
                                }, { preserveState: true });
                            }}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
                        >
                            <option value="">All Streams</option>
                            {sections.map((sec) => (
                                <option key={sec.id} value={sec.id}>{sec.name}</option>
                            ))}
                        </select>
                    </div>

                    {viewMode === 'single' && (
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Select Subject</label>
                            <select
                                value={selectedSubjectId}
                                onChange={(e) => setSelectedSubjectId(parseInt(e.target.value, 10))}
                                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
                            >
                                {subjects.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name} (Max: {s.full_marks})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className={viewMode === 'matrix' ? 'sm:col-span-2' : ''}>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">Search Learner</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by name or admission number..."
                                className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* MODE A: Class-Wide Multi-Subject Matrix */}
                {viewMode === 'matrix' && (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="border-b border-slate-200 bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                                    <tr>
                                        <th className="py-3 px-3 w-10 text-center">#</th>
                                        <th className="py-3 px-4 min-w-[180px]">Learner Details</th>
                                        {subjects.map((sub) => (
                                            <th key={sub.id} className="py-3 px-3 text-center min-w-[110px]">
                                                <div>{sub.name}</div>
                                                <div className="text-[9px] font-normal text-slate-400">/{sub.full_marks}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredStudents.length > 0 ? (
                                        filteredStudents.map((student, idx) => (
                                            <tr key={student.id} className="hover:bg-slate-50/70 transition">
                                                <td className="py-2.5 px-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                                                <td className="py-2.5 px-4">
                                                    <div className="font-bold text-slate-900">{student.first_name} {student.last_name}</div>
                                                    <div className="text-[10px] text-slate-500">
                                                        Adm: {student.admission_no || '—'} {student.section?.name ? `(${student.section.name})` : ''}
                                                    </div>
                                                </td>
                                                {subjects.map((sub) => {
                                                    const current = gridMarks[student.id]?.[sub.id] || { marks_obtained: '', is_absent: false, remarks: '' };
                                                    return (
                                                        <td key={sub.id} className="py-2 px-2 text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    max={sub.full_marks}
                                                                    step="0.5"
                                                                    disabled={current.is_absent}
                                                                    value={current.marks_obtained}
                                                                    onChange={(e) => handleMarkChange(student.id, sub.id, e.target.value)}
                                                                    placeholder="—"
                                                                    className={`w-16 rounded border px-2 py-1 text-center font-semibold text-xs focus:border-indigo-500 focus:outline-none ${
                                                                        current.is_absent ? 'bg-slate-100 text-slate-400 border-slate-200' : 'border-slate-300 text-slate-900 bg-white'
                                                                    }`}
                                                                />
                                                                <button
                                                                    type="button"
                                                                    title={current.is_absent ? 'Mark Present' : 'Mark Absent'}
                                                                    onClick={() => handleAbsentToggle(student.id, sub.id, !current.is_absent)}
                                                                    className={`px-1.5 py-1 text-[9px] font-bold rounded uppercase transition ${
                                                                        current.is_absent ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                                    }`}
                                                                >
                                                                    {current.is_absent ? 'ABS' : 'AB'}
                                                                </button>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={subjects.length + 2} className="py-12 text-center text-slate-400">
                                                No learners found matching the search/filter criteria.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* MODE B: Single Subject Entry */}
                {viewMode === 'single' && activeSubject && (
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                            <div>
                                <h3 className="font-bold text-slate-900">{activeSubject.name}</h3>
                                <p className="text-xs text-slate-500">Max Marks: {activeSubject.full_marks} • Pass Marks: {activeSubject.pass_marks}</p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="border-b border-slate-200 bg-slate-100 text-[10px] uppercase font-bold text-slate-500">
                                    <tr>
                                        <th className="py-3 px-4 w-12 text-center">#</th>
                                        <th className="py-3 px-4">Learner</th>
                                        <th className="py-3 px-4 text-center w-36">Score (/ {activeSubject.full_marks})</th>
                                        <th className="py-3 px-4 text-center w-28">Status</th>
                                        <th className="py-3 px-4">Subject Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredStudents.map((student, idx) => {
                                        const current = gridMarks[student.id]?.[activeSubject.id] || { marks_obtained: '', is_absent: false, remarks: '' };
                                        return (
                                            <tr key={student.id} className="hover:bg-slate-50">
                                                <td className="py-2.5 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                                                <td className="py-2.5 px-4">
                                                    <div className="font-bold text-slate-900">{student.first_name} {student.last_name}</div>
                                                    <div className="text-[10px] text-slate-500">Adm: {student.admission_no || '—'}</div>
                                                </td>
                                                <td className="py-2.5 px-4 text-center">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={activeSubject.full_marks}
                                                        step="0.5"
                                                        disabled={current.is_absent}
                                                        value={current.marks_obtained}
                                                        onChange={(e) => handleMarkChange(student.id, activeSubject.id, e.target.value)}
                                                        placeholder="—"
                                                        className="w-24 rounded-lg border border-slate-300 px-3 py-1.5 text-center font-bold text-xs text-slate-900 focus:border-indigo-500 focus:outline-none"
                                                    />
                                                </td>
                                                <td className="py-2.5 px-4 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAbsentToggle(student.id, activeSubject.id, !current.is_absent)}
                                                        className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                                                            current.is_absent ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                        }`}
                                                    >
                                                        {current.is_absent ? 'Absent' : 'Present'}
                                                    </button>
                                                </td>
                                                <td className="py-2.5 px-4">
                                                    <input
                                                        type="text"
                                                        value={current.remarks}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            setGridMarks((prev) => ({
                                                                ...prev,
                                                                [student.id]: {
                                                                    ...prev[student.id],
                                                                    [activeSubject.id]: {
                                                                        ...prev[student.id]?.[activeSubject.id],
                                                                        remarks: val,
                                                                    },
                                                                },
                                                            }));
                                                        }}
                                                        placeholder="e.g. Good progress in algebra..."
                                                        className="w-full rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-700 focus:border-indigo-500 focus:outline-none"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* CSV Import Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
                                <h2 className="text-base font-bold text-slate-900">Import Assessment Marks</h2>
                            </div>
                            <button onClick={() => setIsImportModalOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleImportSubmit} className="mt-4 space-y-4">
                            <p className="text-xs text-slate-600">
                                Upload a CSV file matching the exported template. Enter <strong>ABS</strong> in subject columns for absent students.
                            </p>

                            <div>
                                <input
                                    type="file"
                                    accept=".csv,text/csv"
                                    required
                                    onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-indigo-700"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsImportModalOpen(false)}
                                    className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing || !csvFile}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {processing ? 'Importing...' : 'Upload & Process'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}