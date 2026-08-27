import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps, PaginatedData } from '@/Types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { formatDate } from '@/lib/utils';
import {
    AlertTriangle,
    ArrowLeft,
    Award,
    BookOpen,
    Calendar,
    CheckCircle2,
    Clock,
    Filter,
    Plus,
    School,
    ShieldAlert,
    UserCheck,
    Users
} from 'lucide-react';

interface TeacherAssignment {
    id: number;
    staff_id: number;
    academic_year_id: number;
    class_id: number;
    section_id?: number | null;
    subject_id?: number | null;
    assignment_type: string;
    term?: string | null;
    start_date: string;
    end_date?: string | null;
    status: 'active' | 'ended' | 'transferred';
    remarks?: string | null;
    staff?: { id: number; first_name: string; last_name: string; emp_id: string; phone?: string };
    school_class?: { id: number; name: string };
    section?: { id: number; name: string };
    subject?: { id: number; name: string; code?: string };
    academic_year?: { id: number; name: string };
}

interface Props extends PageProps {
    assignments: PaginatedData<TeacherAssignment>;
    academicYears: Array<{ id: number; name: string }>;
    classes: Array<{ id: number; name: string; sections: Array<{ id: number; name: string }> }>;
    subjects: Array<{ id: number; name: string; code?: string }>;
    teachers: Array<{ id: number; first_name: string; last_name: string; emp_id: string }>;
    unassignedDiagnostics: {
        unassigned_classes: Array<{ class_id: number; class_name: string; section_id: number | null; section_name: string }>;
        teachers_without_assignments: Array<{ id: number; first_name: string; last_name: string; emp_id: string }>;
        total_unassigned_classes_count: number;
        total_unassigned_staff_count: number;
    };
    filters: {
        academic_year_id: string;
        staff_id: string;
        class_id: string;
        assignment_type: string;
        status: string;
    };
}

export default function TeacherAssignmentsIndex({
    auth,
    assignments,
    academicYears = [],
    classes = [],
    subjects = [],
    teachers = [],
    unassignedDiagnostics,
    filters,
}: Props) {
    const [selectedYear, setSelectedYear] = useState(filters.academic_year_id || '');
    const [selectedClass, setSelectedClass] = useState(filters.class_id || '');
    const [selectedType, setSelectedType] = useState(filters.assignment_type || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'active');

    // Create Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [staffId, setStaffId] = useState('');
    const [createClassId, setCreateClassId] = useState('');
    const [sectionId, setSectionId] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [assignType, setAssignType] = useState('class_teacher');
    const [term, setTerm] = useState('All Terms');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [remarks, setRemarks] = useState('');

    // Transfer Modal State
    const [transferAssignment, setTransferAssignment] = useState<TeacherAssignment | null>(null);
    const [transferAction, setTransferAction] = useState<'end' | 'transfer'>('transfer');
    const [transferDate, setTransferDate] = useState(new Date().toISOString().split('T')[0]);
    const [replacementStaffId, setReplacementStaffId] = useState('');
    const [transferRemarks, setTransferRemarks] = useState('');

    const handleFilter = () => {
        router.get(
            '/school/teacher-assignments',
            {
                academic_year_id: selectedYear,
                class_id: selectedClass,
                assignment_type: selectedType,
                status: selectedStatus,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleCreateAssignment = (e: React.FormEvent) => {
        e.preventDefault();
        router.post(
            '/school/teacher-assignments',
            {
                staff_id: staffId,
                academic_year_id: selectedYear,
                class_id: createClassId,
                section_id: sectionId || null,
                subject_id: assignType === 'subject_teacher' ? subjectId : null,
                assignment_type: assignType,
                term: term === 'All Terms' ? null : term,
                start_date: startDate,
                remarks,
            },
            {
                onSuccess: () => {
                    setShowCreateModal(false);
                    setRemarks('');
                },
            }
        );
    };

    const handleConcludeOrTransfer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!transferAssignment) return;

        router.post(
            `/school/teacher-assignments/${transferAssignment.id}/conclude`,
            {
                action: transferAction,
                end_date: transferDate,
                replacement_staff_id: transferAction === 'transfer' ? replacementStaffId : null,
                remarks: transferRemarks,
            },
            {
                onSuccess: () => {
                    setTransferAssignment(null);
                    setTransferRemarks('');
                },
            }
        );
    };

    const selectedClassObj = classes.find((c) => c.id.toString() === createClassId);

    return (
        <AppLayout header="Teaching Responsibilities & Class Allocation">
            <Head title="Teacher Responsibility Management - EduFlow" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 mb-1"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                            Back to Operations Cockpit
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Award className="w-5 h-5 text-indigo-600" />
                            Teacher & Classroom Responsibility Ledger
                        </h1>
                        <p className="text-xs text-slate-500">
                            Academic-period-aware allocations granting class operations and subject assessment authority.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            size="sm"
                            className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 font-bold"
                        >
                            <Plus className="w-3.5 h-3.5 mr-1.5" />
                            Assign Teacher Responsibility
                        </Button>
                    </div>
                </div>

                {/* Diagnostics / Alerts for Unassigned Classes */}
                {unassignedDiagnostics.total_unassigned_classes_count > 0 && (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-3 text-xs">
                        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <strong className="font-bold">
                                {unassignedDiagnostics.total_unassigned_classes_count} Class/Stream(s) Without Active Class Teacher:
                            </strong>
                            <div className="flex flex-wrap gap-2 mt-1.5">
                                {unassignedDiagnostics.unassigned_classes.map((uc, i) => (
                                    <span key={i} className="px-2 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900 font-bold text-[11px]">
                                        {uc.class_name} {uc.section_name !== 'Whole Class' ? `(${uc.section_name})` : ''}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Filter Toolbar */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                        <div>
                            <Select value={selectedYear} onValueChange={(val) => { setSelectedYear(val); }}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Academic Year" /></SelectTrigger>
                                <SelectContent>
                                    {academicYears.map((ay) => (
                                        <SelectItem key={ay.id} value={ay.id.toString()}>{ay.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Classes" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {classes.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.id.toString()}>{cls.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Responsibility Type" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="class_teacher">Class Teacher</SelectItem>
                                    <SelectItem value="co_class_teacher">Co-Class Teacher</SelectItem>
                                    <SelectItem value="subject_teacher">Subject / CBC Teacher</SelectItem>
                                    <SelectItem value="hod">Head of Department (HOD)</SelectItem>
                                    <SelectItem value="cbc_coordinator">CBC Coordinator</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="active">Active Only</SelectItem>
                                    <SelectItem value="transferred">Transferred</SelectItem>
                                    <SelectItem value="ended">Concluded / Ended</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Button onClick={handleFilter} variant="outline" className="w-full h-9 text-xs font-semibold">
                                <Filter className="w-3.5 h-3.5 mr-1.5" />
                                Filter Responsibilities
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Assignment Table */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                                    <th className="py-3 px-4">Teacher / Staff</th>
                                    <th className="py-3 px-4">Responsibility</th>
                                    <th className="py-3 px-4">Class & Stream</th>
                                    <th className="py-3 px-4">Learning Area / Subject</th>
                                    <th className="py-3 px-4">Effective Period</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {assignments.data && assignments.data.length > 0 ? (
                                    assignments.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-slate-900 dark:text-white">
                                                    {item.staff?.first_name} {item.staff?.last_name}
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-mono">
                                                    TSC/EMP: {item.staff?.emp_id || 'N/A'}
                                                </div>
                                            </td>

                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                                                    item.assignment_type === 'class_teacher'
                                                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                                                        : item.assignment_type === 'subject_teacher'
                                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                                                        : 'bg-emerald-100 text-emerald-700'
                                                }`}>
                                                    {item.assignment_type.replace(/_/g, ' ')}
                                                </span>
                                            </td>

                                            <td className="py-3 px-4">
                                                <div className="font-bold text-slate-800 dark:text-slate-200">
                                                    {item.school_class?.name || 'All Classes'}
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    Stream: {item.section?.name || 'All Streams'}
                                                </div>
                                            </td>

                                            <td className="py-3 px-4">
                                                {item.subject ? (
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white">
                                                            {item.subject.name}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-mono">
                                                            {item.subject.code || '-'}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">Entire Class Scope</span>
                                                )}
                                            </td>

                                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                                                <div>{formatDate(item.start_date)} &rarr; {item.end_date ? formatDate(item.end_date) : 'Current'}</div>
                                                <div className="text-[10px] text-slate-400">{item.academic_year?.name} ({item.term || 'Full Year'})</div>
                                            </td>

                                            <td className="py-3 px-4">
                                                <span className={`inline-flex items-center text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                                                    item.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                        : item.status === 'transferred'
                                                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                                        : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>

                                            <td className="py-3 px-4 text-right">
                                                {item.status === 'active' && (
                                                    <Button
                                                        onClick={() => setTransferAssignment(item)}
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-7 text-[11px] font-semibold text-rose-700 border-rose-200 hover:bg-rose-50"
                                                    >
                                                        Transfer / Reassign
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-10 text-center text-xs text-slate-500">
                                            No teaching assignments found matching the filter criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal 1: Assign Teaching Responsibility */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="font-bold text-slate-900 dark:text-white">Assign Teaching Responsibility</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
                        </div>

                        <form onSubmit={handleCreateAssignment} className="space-y-3 text-xs">
                            <div>
                                <label className="font-bold block mb-1">Select Teacher / Staff Member:</label>
                                <Select value={staffId} onValueChange={setStaffId}>
                                    <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Choose Teacher" /></SelectTrigger>
                                    <SelectContent>
                                        {teachers.map((t) => (
                                            <SelectItem key={t.id} value={t.id.toString()}>{t.first_name} {t.last_name} ({t.emp_id || 'Staff'})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold block mb-1">Responsibility Type:</label>
                                    <Select value={assignType} onValueChange={setAssignType}>
                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="class_teacher">Class Teacher (Full Ops)</SelectItem>
                                            <SelectItem value="co_class_teacher">Co-Class Teacher</SelectItem>
                                            <SelectItem value="subject_teacher">Subject / CBC Teacher</SelectItem>
                                            <SelectItem value="hod">Head of Department (HOD)</SelectItem>
                                            <SelectItem value="cbc_coordinator">CBC Coordinator</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <label className="font-bold block mb-1">Term Scope:</label>
                                    <Select value={term} onValueChange={setTerm}>
                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="All Terms">All Terms</SelectItem>
                                            <SelectItem value="Term 1">Term 1</SelectItem>
                                            <SelectItem value="Term 2">Term 2</SelectItem>
                                            <SelectItem value="Term 3">Term 3</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold block mb-1">Class / Grade:</label>
                                    <Select value={createClassId} onValueChange={(val) => { setCreateClassId(val); setSectionId(''); }}>
                                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select Class" /></SelectTrigger>
                                        <SelectContent>
                                            {classes.map((c) => (
                                                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="font-bold block mb-1">Stream / Section:</label>
                                    <Select value={sectionId} onValueChange={setSectionId}>
                                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Streams" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All Streams</SelectItem>
                                            {selectedClassObj?.sections.map((s) => (
                                                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {assignType === 'subject_teacher' && (
                                <div>
                                    <label className="font-bold block mb-1">Learning Area / Subject:</label>
                                    <Select value={subjectId} onValueChange={setSubjectId}>
                                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                                        <SelectContent>
                                            {subjects.map((sb) => (
                                                <SelectItem key={sb.id} value={sb.id.toString()}>{sb.name} ({sb.code || 'Sub'})</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div>
                                <label className="font-bold block mb-1">Effective Start Date:</label>
                                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-9 text-xs" />
                            </div>

                            <div>
                                <label className="font-bold block mb-1">Administrative Remarks / Notes:</label>
                                <Input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="e.g. Official appointment for 2026 academic cycle" className="h-9 text-xs" />
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} size="sm">Cancel</Button>
                                <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">Confirm Allocation</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 2: Historical Transfer / Conclude Assignment */}
            {transferAssignment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="font-bold text-slate-900 dark:text-white">Conclude / Transfer Responsibility</h3>
                            <button onClick={() => setTransferAssignment(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
                        </div>

                        <form onSubmit={handleConcludeOrTransfer} className="space-y-3 text-xs">
                            <p className="text-slate-600 dark:text-slate-400">
                                Ending responsibility for <strong>{transferAssignment.staff?.first_name} {transferAssignment.staff?.last_name}</strong> on {transferAssignment.school_class?.name}. Historical records will be preserved.
                            </p>

                            <div>
                                <label className="font-bold block mb-1">Action Type:</label>
                                <Select value={transferAction} onValueChange={(v: 'end' | 'transfer') => setTransferAction(v)}>
                                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="transfer">Transfer & Replace with Another Teacher</SelectItem>
                                        <SelectItem value="end">Conclude Assignment (No Replacement)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="font-bold block mb-1">Effective Conclude/Transfer Date:</label>
                                <Input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} className="h-9 text-xs" />
                            </div>

                            {transferAction === 'transfer' && (
                                <div>
                                    <label className="font-bold block mb-1">Select Replacement Teacher:</label>
                                    <Select value={replacementStaffId} onValueChange={setReplacementStaffId}>
                                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Choose Replacement Teacher" /></SelectTrigger>
                                        <SelectContent>
                                            {teachers.filter((t) => t.id !== transferAssignment.staff_id).map((t) => (
                                                <SelectItem key={t.id} value={t.id.toString()}>{t.first_name} {t.last_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            <div>
                                <label className="font-bold block mb-1">Transfer Remarks:</label>
                                <Input value={transferRemarks} onChange={(e) => setTransferRemarks(e.target.value)} placeholder="e.g. Mid-term departmental transfer" className="h-9 text-xs" />
                            </div>

                            <div className="flex justify-end gap-2 pt-3">
                                <Button type="button" variant="outline" onClick={() => setTransferAssignment(null)} size="sm">Cancel</Button>
                                <Button type="submit" size="sm" className="bg-rose-600 hover:bg-rose-700 text-white font-bold">Apply & Preserve History</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}