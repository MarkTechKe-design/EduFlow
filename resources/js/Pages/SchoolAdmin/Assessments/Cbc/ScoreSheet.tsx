import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps, CbcAssessment, AssessmentStrand, Student } from '@/Types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { ArrowLeft, Check, CheckCircle2, FileText, Printer, Save } from 'lucide-react';

interface Props extends PageProps {
    assessment: CbcAssessment;
    students: Student[];
    strands: AssessmentStrand[];
    scoresMatrix: Record<number, Record<number, { performance_level: 'EE' | 'ME' | 'AE' | 'BE'; teacher_comments?: string }>>;
}

export default function CbcScoreSheet({ auth, assessment, students = [], strands = [], scoresMatrix = {} }: Props) {
    // Local matrix state for fast interactive grading
    const [matrix, setMatrix] = useState<Record<number, Record<number, { performance_level: 'EE' | 'ME' | 'AE' | 'BE'; teacher_comments?: string }>>>(() => {
        const init: Record<number, Record<number, any>> = {};
        students.forEach((st) => {
            init[st.id] = {};
            strands.forEach((str) => {
                init[st.id][str.id] = scoresMatrix[st.id]?.[str.id] || {
                    performance_level: 'ME',
                    teacher_comments: '',
                };
            });
        });
        return init;
    });

    const setLevel = (studentId: number, strandId: number, level: 'EE' | 'ME' | 'AE' | 'BE') => {
        setMatrix((prev) => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [strandId]: {
                    ...prev[studentId]?.[strandId],
                    performance_level: level,
                },
            },
        }));
    };

    const setBulkLevelForStrand = (strandId: number, level: 'EE' | 'ME' | 'AE' | 'BE') => {
        setMatrix((prev) => {
            const updated = { ...prev };
            students.forEach((st) => {
                updated[st.id] = {
                    ...updated[st.id],
                    [strandId]: {
                        ...updated[st.id]?.[strandId],
                        performance_level: level,
                    },
                };
            });
            return updated;
        });
    };

    const { processing } = useForm();

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();

        const flatScores: Array<{
            student_id: number;
            assessment_strand_id: number;
            performance_level: string;
            teacher_comments?: string;
        }> = [];

        students.forEach((st) => {
            strands.forEach((str) => {
                const cell = matrix[st.id]?.[str.id];
                if (cell) {
                    flatScores.push({
                        student_id: st.id,
                        assessment_strand_id: str.id,
                        performance_level: cell.performance_level,
                        teacher_comments: cell.teacher_comments || '',
                    });
                }
            });
        });

        router.post(`/school/cbc-assessments/${assessment.id}/scores`, {
            scores: flatScores,
        }, {
            preserveScroll: true,
        });
    };

    const rubricColor = (level: string) => {
        switch (level) {
            case 'EE': return 'bg-emerald-600 text-white border-emerald-700';
            case 'ME': return 'bg-blue-600 text-white border-blue-700';
            case 'AE': return 'bg-amber-500 text-white border-amber-600';
            case 'BE': return 'bg-rose-500 text-white border-rose-600';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <AppLayout header="CBC Broadsheet Scoring">
            <Head title={`Score Sheet: ${assessment.title} - EduFlow`} />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <Link
                            href="/school/cbc-assessments"
                            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 mb-1"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                            Back to CBC Directory
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                            {assessment.title}
                        </h1>
                        <p className="text-xs text-slate-500">
                            Learning Area: <strong className="text-slate-800 dark:text-slate-200">{assessment.subject?.name}</strong> &bull; Class: <strong className="text-slate-800 dark:text-slate-200">{assessment.school_class?.name}</strong> &bull; Session: {assessment.academic_year?.name} ({assessment.term})
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href={`/school/cbc-assessments/${assessment.id}/report`}>
                            <Button variant="outline" size="sm" className="h-9 text-xs">
                                <FileText className="w-3.5 h-3.5 mr-1.5" />
                                Broadsheet Report
                            </Button>
                        </Link>

                        <Button
                            onClick={handleSave}
                            disabled={processing}
                            size="sm"
                            className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
                        >
                            <Save className="w-3.5 h-3.5 mr-1.5" />
                            {processing ? 'Saving...' : 'Save All Scores'}
                        </Button>
                    </div>
                </div>

                {/* Rubric Guide Banner */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="font-bold text-slate-700 dark:text-slate-300">KNEC Rubric Levels:</div>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200">
                            <strong>EE (4)</strong> - Exceeding Expectations
                        </span>
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200">
                            <strong>ME (3)</strong> - Meeting Expectations
                        </span>
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200">
                            <strong>AE (2)</strong> - Approaching Expectations
                        </span>
                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200">
                            <strong>BE (1)</strong> - Below Expectations
                        </span>
                    </div>
                </div>

                {/* Scoring Matrix Broadsheet */}
                <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                                    <th className="py-3 px-3 w-10 text-center">#</th>
                                    <th className="py-3 px-4 min-w-[200px]">Learner</th>
                                    <th className="py-3 px-3 min-w-[110px]">Adm No</th>
                                    {strands.map((strand, sIdx) => (
                                        <th key={strand.id} className="py-3 px-3 min-w-[220px]">
                                            <div className="font-bold text-slate-900 dark:text-white">
                                                Strand {sIdx + 1}: {strand.strand_name}
                                            </div>
                                            {strand.sub_strand && (
                                                <div className="text-[10px] text-slate-400 capitalize truncate max-w-[200px]">
                                                    {strand.sub_strand}
                                                </div>
                                            )}
                                            {/* Quick fill column header */}
                                            <div className="flex items-center gap-1 mt-1.5 font-normal">
                                                <span className="text-[10px] text-slate-400">Fill:</span>
                                                {(['EE', 'ME', 'AE', 'BE'] as const).map((lvl) => (
                                                    <button
                                                        key={lvl}
                                                        type="button"
                                                        onClick={() => setBulkLevelForStrand(strand.id, lvl)}
                                                        className="text-[10px] px-1 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 font-bold"
                                                    >
                                                        {lvl}
                                                    </button>
                                                ))}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {students.length > 0 ? (
                                    students.map((student, idx) => {
                                        const fullName = student.full_name || [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ');

                                        return (
                                            <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                <td className="py-3 px-3 text-center font-semibold text-slate-400">
                                                    {idx + 1}
                                                </td>

                                                <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                                                    {fullName}
                                                </td>

                                                <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300 font-semibold">
                                                    {student.admission_no}
                                                </td>

                                                {strands.map((strand) => {
                                                    const cell = matrix[student.id]?.[strand.id] || { performance_level: 'ME' };
                                                    const currentLevel = cell.performance_level;

                                                    return (
                                                        <td key={strand.id} className="py-3 px-3">
                                                            <div className="flex items-center gap-1">
                                                                {(['EE', 'ME', 'AE', 'BE'] as const).map((lvl) => {
                                                                    const isActive = currentLevel === lvl;
                                                                    return (
                                                                        <button
                                                                            key={lvl}
                                                                            type="button"
                                                                            onClick={() => setLevel(student.id, strand.id, lvl)}
                                                                            className={`px-2.5 py-1 rounded text-xs font-bold border transition-all ${
                                                                                isActive
                                                                                    ? rubricColor(lvl)
                                                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'
                                                                            }`}
                                                                        >
                                                                            {lvl}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={3 + strands.length} className="py-8 text-center text-slate-500">
                                            No active learners found in this class/stream.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                            Scoring {students.length} learners across {strands.length} curriculum strands.
                        </div>

                        <Button type="submit" disabled={processing} className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6">
                            <Save className="w-3.5 h-3.5 mr-1.5" />
                            {processing ? 'Saving Score Sheet...' : 'Commit Assessment Scores'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}