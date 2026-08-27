import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps, Student, SchoolClass, Section, AcademicYear } from '@/Types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import {
    ArrowLeft,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Filter,
    GraduationCap,
    Layers,
    RefreshCw,
    Users,
    AlertCircle
} from 'lucide-react';

interface RolloverClassStat {
    class_id: number;
    class_name: string;
    numeric_rank: number;
    total_active: number;
    promoted: number;
    percentage: number;
    status: 'completed' | 'in_progress' | 'pending' | 'empty';
}

interface Props extends PageProps {
    academicYears: AcademicYear[];
    classes: (SchoolClass & { sections?: Section[] })[];
    students: Student[];
    rolloverMatrix: RolloverClassStat[];
    filters: {
        source_class_id: string;
        source_section_id: string;
        source_academic_year_id: string;
        target_academic_year_id: string;
    };
}

interface LearnerPromotionState {
    student_id: number;
    action: 'promote' | 'repeat' | 'stream_transfer' | 'transfer_out' | 'graduated' | 'skip';
    target_class_id: string;
    target_section_id: string;
    roll_no: string;
    remarks: string;
}

export default function BulkPromote({
    auth,
    academicYears = [],
    classes = [],
    students = [],
    rolloverMatrix = [],
    filters,
}: Props) {
    const [sourceClassId, setSourceClassId] = useState(filters.source_class_id || '');
    const [sourceSectionId, setSourceSectionId] = useState(filters.source_section_id || '');
    const [sourceYearId, setSourceYearId] = useState(filters.source_academic_year_id || '');

    const currentYear = academicYears.find((y) => y.is_current) || academicYears[0];
    const defaultTargetYear = academicYears.find((y) => !y.is_current && Number(y.id) > Number(currentYear?.id || 0)) || currentYear;

    const [targetYearId, setTargetYearId] = useState(filters.target_academic_year_id || String(defaultTargetYear?.id || ''));
    const [targetTerm, setTargetTerm] = useState('Term 1');
    const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);

    // Compute default target class based on numeric_name rank sequence
    const currentSourceClass = classes.find((c) => String(c.id) === String(sourceClassId));
    const nextClassInSequence = currentSourceClass
        ? classes.find((c) => (c.numeric_name || 0) > (currentSourceClass.numeric_name || 0)) || currentSourceClass
        : null;

    const [defaultTargetClassId, setDefaultTargetClassId] = useState(nextClassInSequence ? String(nextClassInSequence.id) : '');
    const [defaultTargetSectionId, setDefaultTargetSectionId] = useState('');

    useEffect(() => {
        if (nextClassInSequence) {
            setDefaultTargetClassId(String(nextClassInSequence.id));
        }
    }, [sourceClassId]);

    // Local state for individual learner actions
    const [selectedStudents, setSelectedStudents] = useState<Record<number, boolean>>({});
    const [learnerStates, setLearnerStates] = useState<Record<number, LearnerPromotionState>>({});

    useEffect(() => {
        const initialSelected: Record<number, boolean> = {};
        const initialStates: Record<number, LearnerPromotionState> = {};

        students.forEach((s) => {
            initialSelected[s.id] = true;
            initialStates[s.id] = {
                student_id: s.id,
                action: 'promote',
                target_class_id: defaultTargetClassId || String(s.class_id || ''),
                target_section_id: defaultTargetSectionId || String(s.section_id || ''),
                roll_no: s.roll_no || '',
                remarks: '',
            };
        });

        setSelectedStudents(initialSelected);
        setLearnerStates(initialStates);
    }, [students, defaultTargetClassId, defaultTargetSectionId]);

    const handleFilterSubmit = (e?: React.FormEvent, overrideClassId?: string) => {
        if (e) e.preventDefault();
        const activeClass = overrideClassId !== undefined ? overrideClassId : sourceClassId;
        router.get(
            '/school/students-promotion',
            {
                source_class_id: activeClass,
                source_section_id: overrideClassId !== undefined ? '' : sourceSectionId,
                source_academic_year_id: sourceYearId,
                target_academic_year_id: targetYearId,
            },
            { preserveState: true, replace: true }
        );
    };

    const handleQuickLoad = (classId: number) => {
        setSourceClassId(String(classId));
        setSourceSectionId('');
        handleFilterSubmit(undefined, String(classId));
    };

    const toggleSelectAll = () => {
        const allSelected = students.every((s) => selectedStudents[s.id]);
        const updated: Record<number, boolean> = {};
        students.forEach((s) => {
            updated[s.id] = !allSelected;
        });
        setSelectedStudents(updated);
    };

    const updateLearnerAction = (studentId: number, action: LearnerPromotionState['action']) => {
        setLearnerStates((prev) => {
            const current = prev[studentId];
            let targetClass = defaultTargetClassId;

            if (action === 'repeat') {
                targetClass = String(sourceClassId);
            }

            return {
                ...prev,
                [studentId]: {
                    ...current,
                    action,
                    target_class_id: targetClass,
                },
            };
        });
    };

    const { processing } = useForm();

    const handleCommitPromotion = (e: React.FormEvent) => {
        e.preventDefault();

        const promotionsPayload = students
            .filter((s) => selectedStudents[s.id])
            .map((s) => learnerStates[s.id]);

        if (promotionsPayload.length === 0) {
            alert('Please select at least one learner to process.');
            return;
        }

        const selectedYearObj = academicYears.find((y) => String(y.id) === String(targetYearId));

        router.post('/school/students-promotion', {
            source_academic_year_id: sourceYearId || null,
            target_academic_year_id: Number(targetYearId),
            target_academic_year: selectedYearObj?.name || '2026/2027',
            target_term: targetTerm,
            effective_date: effectiveDate,
            promotions: promotionsPayload,
        });
    };

    const sourceStreams = currentSourceClass?.sections || [];
    const targetClassObj = classes.find((c) => String(c.id) === String(defaultTargetClassId));
    const targetStreams = targetClassObj?.sections || [];

    const selectedCount = students.filter((s) => selectedStudents[s.id]).length;
    const promoteCount = students.filter((s) => selectedStudents[s.id] && learnerStates[s.id]?.action === 'promote').length;
    const repeatCount = students.filter((s) => selectedStudents[s.id] && learnerStates[s.id]?.action === 'repeat').length;
    const graduateCount = students.filter((s) => selectedStudents[s.id] && learnerStates[s.id]?.action === 'graduated').length;

    // Aggregates for matrix header
    const totalSchoolLearners = rolloverMatrix.reduce((acc, curr) => acc + curr.total_active, 0);
    const totalPromotedToTarget = rolloverMatrix.reduce((acc, curr) => acc + curr.promoted, 0);
    const overallSchoolPct = totalSchoolLearners > 0 ? Math.round((totalPromotedToTarget / totalSchoolLearners) * 100) : 100;

    return (
        <AppLayout header="Bulk Academic Promotion & Rollover">
            <Head title="Bulk Student Promotion - EduFlow" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <Link
                            href="/school/students"
                            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 mb-1"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                            Back to Student Directory
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                            Bulk Academic Promotion & Rollover Engine
                        </h1>
                        <p className="text-xs text-slate-500">
                            Batch transition learners across academic years, grades, and streams with atomic ledger records.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/school/students">
                            <Button variant="outline" size="sm" className="h-9 text-xs">
                                Students Directory
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* 1. Class-by-Class Rollover Progress Matrix */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div>
                            <div className="flex items-center gap-2">
                                <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                    Class Rollover Completion Matrix
                                </h2>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Progress status for incoming academic session target across all 18 standard grades.
                            </p>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-medium">
                            <div className="text-slate-600 dark:text-slate-300">
                                Target Session: <strong className="text-slate-900 dark:text-white">{academicYears.find((y) => String(y.id) === String(targetYearId))?.name || 'Next Session'}</strong>
                            </div>
                            <div className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs">
                                Overall: {overallSchoolPct}% ({totalPromotedToTarget}/{totalSchoolLearners})
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                        {rolloverMatrix.map((item) => {
                            const isCurrentSelected = String(item.class_id) === String(sourceClassId);
                            let statusBadge = (
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                    0% Pending
                                </span>
                            );

                            if (item.status === 'completed') {
                                statusBadge = (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                        100% Done
                                    </span>
                                );
                            } else if (item.status === 'in_progress') {
                                statusBadge = (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                        {item.percentage}% Partial
                                    </span>
                                );
                            }

                            return (
                                <button
                                    key={item.class_id}
                                    type="button"
                                    onClick={() => handleQuickLoad(item.class_id)}
                                    className={`p-3 rounded-lg border text-left transition-all ${
                                        isCurrentSelected
                                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-1 ring-indigo-600'
                                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-1">
                                        <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                                            {item.class_name}
                                        </div>
                                        {statusBadge}
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-1 flex justify-between">
                                        <span>Active: {item.total_active}</span>
                                        <span>Done: {item.promoted}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${
                                                item.status === 'completed'
                                                    ? 'bg-emerald-500'
                                                    : item.status === 'in_progress'
                                                    ? 'bg-amber-500'
                                                    : 'bg-slate-300 dark:bg-slate-600'
                                            }`}
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Source Cohort Selection */}
                <form onSubmit={handleFilterSubmit} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-500" />
                            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                Select Source Class & Stream Cohort
                            </h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                            <Label className="text-xs">Source Academic Year</Label>
                            <Select value={sourceYearId} onValueChange={setSourceYearId}>
                                <SelectTrigger className="h-9 mt-1 text-xs"><SelectValue placeholder="All Academic Years" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Academic Years</SelectItem>
                                    {academicYears.map((y) => (
                                        <SelectItem key={y.id} value={String(y.id)}>{y.name} {y.is_current ? '(Current)' : ''}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs">Source Class / Grade *</Label>
                            <Select value={sourceClassId} onValueChange={(val) => { setSourceClassId(val); setSourceSectionId(''); }}>
                                <SelectTrigger className="h-9 mt-1 text-xs"><SelectValue placeholder="Select Source Class" /></SelectTrigger>
                                <SelectContent>
                                    {classes.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs">Source Stream</Label>
                            <Select value={sourceSectionId} onValueChange={setSourceSectionId} disabled={!sourceClassId || sourceStreams.length === 0}>
                                <SelectTrigger className="h-9 mt-1 text-xs">
                                    <SelectValue placeholder={sourceStreams.length === 0 ? 'All Streams' : 'Filter Stream'} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Streams</SelectItem>
                                    {sourceStreams.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-end">
                            <Button type="submit" disabled={!sourceClassId} className="w-full h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                Load Learners
                            </Button>
                        </div>
                    </div>
                </form>

                {/* 3. Target Configuration & Granular Decision Roster */}
                {students.length > 0 ? (
                    <form onSubmit={handleCommitPromotion} className="space-y-6">
                        {/* Target Configuration Panel */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                        Configure Target Destination Parameters
                                    </h2>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                                <div>
                                    <Label className="text-xs">Target Academic Year *</Label>
                                    <Select value={targetYearId} onValueChange={setTargetYearId}>
                                        <SelectTrigger className="h-9 mt-1 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {academicYears.map((y) => (
                                                <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs">Target Term *</Label>
                                    <Select value={targetTerm} onValueChange={setTargetTerm}>
                                        <SelectTrigger className="h-9 mt-1 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Term 1">Term 1</SelectItem>
                                            <SelectItem value="Term 2">Term 2</SelectItem>
                                            <SelectItem value="Term 3">Term 3</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs">Default Target Class *</Label>
                                    <Select value={defaultTargetClassId} onValueChange={setDefaultTargetClassId}>
                                        <SelectTrigger className="h-9 mt-1 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {classes.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs">Default Target Stream</Label>
                                    <Select value={defaultTargetSectionId} onValueChange={setDefaultTargetSectionId}>
                                        <SelectTrigger className="h-9 mt-1 text-xs">
                                            <SelectValue placeholder={targetStreams.length === 0 ? 'Same / General' : 'Select Stream'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Same as Current Stream</SelectItem>
                                            {targetStreams.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs">Effective Date *</Label>
                                    <Input
                                        type="date"
                                        value={effectiveDate}
                                        onChange={(e) => setEffectiveDate(e.target.value)}
                                        className="h-9 mt-1 text-xs"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Learners Roster Matrix */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                        Learner Promotion Roster ({students.length} Learners)
                                    </h3>
                                    <p className="text-[11px] text-slate-500">
                                        Review individual learner actions. Mark students to Repeat, Graduate, or Transfer as required.
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Button type="button" variant="outline" size="sm" onClick={toggleSelectAll} className="h-8 text-xs">
                                        {students.every((s) => selectedStudents[s.id]) ? 'Deselect All' : 'Select All'}
                                    </Button>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                                            <th className="py-2.5 px-3 w-10 text-center">#</th>
                                            <th className="py-2.5 px-3">Learner Identity</th>
                                            <th className="py-2.5 px-3">Admission No</th>
                                            <th className="py-2.5 px-3">Current Placement</th>
                                            <th className="py-2.5 px-3 w-40">Promotion Action</th>
                                            <th className="py-2.5 px-3 w-44">Target Class</th>
                                            <th className="py-2.5 px-3 w-32">Target Stream</th>
                                            <th className="py-2.5 px-3 w-28">Roll No</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {students.map((student) => {
                                            const isSelected = !!selectedStudents[student.id];
                                            const state = learnerStates[student.id] || {
                                                action: 'promote',
                                                target_class_id: defaultTargetClassId,
                                                target_section_id: defaultTargetSectionId,
                                                roll_no: '',
                                                remarks: '',
                                            };

                                            const targetClassForLearner = classes.find((c) => String(c.id) === String(state.target_class_id));
                                            const learnerStreams = targetClassForLearner?.sections || [];

                                            return (
                                                <tr
                                                    key={student.id}
                                                    className={`transition-colors ${
                                                        isSelected ? 'hover:bg-slate-50 dark:hover:bg-slate-800/30' : 'opacity-40 bg-slate-50/50 dark:bg-slate-900/50'
                                                    }`}
                                                >
                                                    <td className="py-2.5 px-3 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) =>
                                                                setSelectedStudents((prev) => ({
                                                                    ...prev,
                                                                    [student.id]: e.target.checked,
                                                                }))
                                                            }
                                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                    </td>

                                                    <td className="py-2.5 px-3">
                                                        <div className="font-bold text-slate-900 dark:text-white">
                                                            {student.full_name || `${student.first_name} ${student.last_name}`}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 capitalize">{student.gender}</div>
                                                    </td>

                                                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 dark:text-slate-300">
                                                        {student.admission_no}
                                                    </td>

                                                    <td className="py-2.5 px-3">
                                                        <div className="font-semibold text-slate-900 dark:text-white">
                                                            {student.school_class?.name || student.class?.name || '-'}
                                                        </div>
                                                        <div className="text-[10px] text-slate-500">
                                                            Stream: {student.section?.name || 'General'}
                                                        </div>
                                                    </td>

                                                    <td className="py-2.5 px-3">
                                                        <Select
                                                            value={state.action}
                                                            onValueChange={(val: any) => updateLearnerAction(student.id, val)}
                                                            disabled={!isSelected}
                                                        >
                                                            <SelectTrigger className="h-8 text-xs font-semibold"><SelectValue /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="promote">Promote (Next Grade)</SelectItem>
                                                                <SelectItem value="repeat">Repeat (Retain Grade)</SelectItem>
                                                                <SelectItem value="stream_transfer">Stream Transfer</SelectItem>
                                                                <SelectItem value="graduated">Graduated / Alum</SelectItem>
                                                                <SelectItem value="transfer_out">Transferred Out</SelectItem>
                                                                <SelectItem value="skip">Skip / No Change</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </td>

                                                    <td className="py-2.5 px-3">
                                                        <Select
                                                            value={String(state.target_class_id || '')}
                                                            onValueChange={(val) =>
                                                                setLearnerStates((prev) => ({
                                                                    ...prev,
                                                                    [student.id]: { ...prev[student.id], target_class_id: val, target_section_id: '' },
                                                                }))
                                                            }
                                                            disabled={!isSelected || state.action === 'graduated' || state.action === 'transfer_out'}
                                                        >
                                                            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Target Class" /></SelectTrigger>
                                                            <SelectContent>
                                                                {classes.map((c) => (
                                                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </td>

                                                    <td className="py-2.5 px-3">
                                                        <Select
                                                            value={String(state.target_section_id || '')}
                                                            onValueChange={(val) =>
                                                                setLearnerStates((prev) => ({
                                                                    ...prev,
                                                                    [student.id]: { ...prev[student.id], target_section_id: val },
                                                                }))
                                                            }
                                                            disabled={!isSelected || learnerStreams.length === 0 || state.action === 'graduated' || state.action === 'transfer_out'}
                                                        >
                                                            <SelectTrigger className="h-8 text-xs">
                                                                <SelectValue placeholder={learnerStreams.length === 0 ? 'General' : 'Stream'} />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="">General</SelectItem>
                                                                {learnerStreams.map((sec) => (
                                                                    <SelectItem key={sec.id} value={String(sec.id)}>{sec.name}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </td>

                                                    <td className="py-2.5 px-3">
                                                        <Input
                                                            value={state.roll_no || ''}
                                                            onChange={(e) =>
                                                                setLearnerStates((prev) => ({
                                                                    ...prev,
                                                                    [student.id]: { ...prev[student.id], roll_no: e.target.value },
                                                                }))
                                                            }
                                                            placeholder="Roll No"
                                                            className="h-8 text-xs font-mono"
                                                            disabled={!isSelected}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary Footer & Commit Action */}
                            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex flex-wrap items-center gap-4 text-xs">
                                    <div>Selected: <strong className="text-slate-900 dark:text-white font-bold">{selectedCount}</strong></div>
                                    <div className="text-emerald-600 dark:text-emerald-400">Promoting: <strong>{promoteCount}</strong></div>
                                    <div className="text-amber-600 dark:text-amber-400">Repeating: <strong>{repeatCount}</strong></div>
                                    {graduateCount > 0 && <div className="text-indigo-600 dark:text-indigo-400">Graduating: <strong>{graduateCount}</strong></div>}
                                </div>

                                <div className="flex items-center gap-3">
                                    <Link href="/school/students">
                                        <Button type="button" variant="outline" size="sm" className="h-9 text-xs">
                                            Cancel
                                        </Button>
                                    </Link>

                                    <Button
                                        type="submit"
                                        disabled={processing || selectedCount === 0}
                                        className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6"
                                    >
                                        <ArrowUpRight className="w-4 h-4 mr-1.5" />
                                        {processing ? 'Processing Ledger...' : `Commit Promotion (${selectedCount} Learners)`}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center text-xs text-slate-500 space-y-2">
                        <GraduationCap className="w-8 h-8 text-slate-400 mx-auto" />
                        <div className="font-semibold text-slate-700 dark:text-slate-300">No Class Cohort Loaded</div>
                        <div>Click any class card in the completion matrix above or choose from the dropdown to review learners.</div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}