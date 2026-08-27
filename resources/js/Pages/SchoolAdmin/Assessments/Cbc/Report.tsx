import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps, CbcAssessment, AssessmentStrand, Student, AssessmentScore } from '@/Types';
import { Button } from '@/Components/ui/button';
import { formatDate } from '@/lib/utils';
import {
    ArrowLeft,
    FileSpreadsheet,
    Printer,
    Table as TableIcon,
    Layers,
} from 'lucide-react';

interface Props extends PageProps {
    assessment: CbcAssessment;
    students: Student[];
    strands: AssessmentStrand[];
    scores: AssessmentScore[];
    stats: {
        total_students: number;
        total_strands: number;
        total_entries: number;
        ee_count: number;
        me_count: number;
        ae_count: number;
        be_count: number;
        ee_pct: number;
        me_pct: number;
        ae_pct: number;
        be_pct: number;
    };
}

export default function OfficialCbcBroadsheet({ auth, assessment, students = [], strands = [], scores = [], stats }: Props) {
    const [viewMode, setViewMode] = useState<'learner_broadsheet' | 'curriculum_matrix'>('learner_broadsheet');

    const scoreLookup: Record<string, AssessmentScore> = {};
    scores.forEach((s) => {
        scoreLookup[`${s.student_id}_${s.assessment_strand_id}`] = s;
    });

    const printDocument = () => {
        window.print();
    };

    const schoolName = (auth?.user as any)?.school?.name || 'GREENFIELD ACADEMY';

    return (
        <AppLayout header="Official CBC Assessment Matrix">
            <Head title={`${assessment.subject?.name || 'CBC'} Assessment Broadsheet - EduFlow`} />

            <style>{`
                @media print {
                    @page {
                        size: landscape;
                        margin: 6mm 6mm 6mm 6mm;
                    }
                    body {
                        background: #ffffff !important;
                        color: #000000 !important;
                        font-family: Arial, sans-serif !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    header, nav, aside, .print\\:hidden, #app-navbar, #app-sidebar, [role="navigation"] {
                        display: none !important;
                    }
                    main {
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .cba-print-sheet {
                        width: 100% !important;
                        max-width: 100% !important;
                        border: none !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        box-shadow: none !important;
                    }
                    .cba-table {
                        border: 1.5px solid #000000 !important;
                    }
                    .cba-table th, .cba-table td {
                        border: 1px solid #000000 !important;
                        color: #000000 !important;
                    }
                    .no-break {
                        break-inside: avoid;
                        page-break-inside: avoid;
                    }
                }
            `}</style>

            <div className="max-w-7xl mx-auto space-y-5 print:m-0 print:p-0 print:max-w-none">
                {/* Screen Top Action Toolbar (Hidden during Print) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-sm print:hidden">
                    <div>
                        <Link
                            href="/school/cbc-assessments"
                            className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white mb-1"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                            Back to CBC Workspace
                        </Link>
                        <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                            Official Competency Assessment Template & Broadsheet
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* View Switcher */}
                        <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800 text-xs">
                            <button
                                type="button"
                                onClick={() => setViewMode('learner_broadsheet')}
                                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                                    viewMode === 'learner_broadsheet'
                                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                <TableIcon className="w-3.5 h-3.5 inline mr-1" />
                                Learner Broadsheet
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('curriculum_matrix')}
                                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                                    viewMode === 'curriculum_matrix'
                                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                                }`}
                            >
                                <Layers className="w-3.5 h-3.5 inline mr-1" />
                                Strand Matrix Schedule
                            </button>
                        </div>

                        {/* Excel Export Action */}
                        <a
                            href={`/school/cbc-assessments/${assessment.id}/export`}
                            className="inline-flex items-center"
                        >
                            <Button variant="outline" size="sm" className="h-9 text-xs font-semibold text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50">
                                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                                Export Excel (CSV)
                            </Button>
                        </a>

                        <Link href={`/school/cbc-assessments/${assessment.id}/score-sheet`}>
                            <Button variant="outline" size="sm" className="h-9 text-xs font-semibold">
                                Edit Scores
                            </Button>
                        </Link>

                        <Button onClick={printDocument} size="sm" className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4">
                            <Printer className="w-3.5 h-3.5 mr-1.5" />
                            Print / Save PDF
                        </Button>
                    </div>
                </div>

                {/* Document Container */}
                <div className="cba-print-sheet bg-white text-black p-8 rounded-xl border border-slate-300 shadow-sm print:p-0 print:border-none print:shadow-none space-y-5">
                    {/* Centered Document Title */}
                    <div className="text-center space-y-1">
                        <h2 className="text-base font-black tracking-wider uppercase underline underline-offset-4 decoration-2">
                            {assessment.subject?.name ? `${assessment.subject.name.toUpperCase()} ACTIVITIES` : 'COMPETENCY ASSESSMENT ACTIVITIES'}
                        </h2>
                        <div className="text-[11px] font-bold text-slate-700 uppercase tracking-widest pt-1">
                            {schoolName} &bull; CONTINUOUS COMPETENCY ASSESSMENT TRACKER
                        </div>
                    </div>

                    {/* Metadata Header Box */}
                    <div className="border border-black p-3 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2 font-medium">
                        <div>
                            <span className="text-slate-600 block text-[10px] uppercase font-bold">Class / Grade:</span>
                            <strong className="font-bold text-black uppercase">{assessment.school_class?.name || 'PP2'} {assessment.section?.name ? `(${assessment.section.name})` : ''}</strong>
                        </div>
                        <div>
                            <span className="text-slate-600 block text-[10px] uppercase font-bold">Academic Session & Term:</span>
                            <strong className="font-bold text-black uppercase">{assessment.academic_year?.name || '2025-2026'} &bull; {assessment.term}</strong>
                        </div>
                        <div>
                            <span className="text-slate-600 block text-[10px] uppercase font-bold">Assessment Type:</span>
                            <strong className="font-bold text-black uppercase">{assessment.title}</strong>
                        </div>
                        <div>
                            <span className="text-slate-600 block text-[10px] uppercase font-bold">Date of Evaluation:</span>
                            <strong className="font-bold text-black">{formatDate(assessment.assessment_date)}</strong>
                        </div>
                    </div>

                    {/* View 1: Learner-by-Learner Broadsheet */}
                    {viewMode === 'learner_broadsheet' && (
                        <div className="space-y-4">
                            <div className="overflow-x-auto">
                                <table className="cba-table w-full text-left text-[11px] border-collapse border border-black">
                                    <thead>
                                        <tr className="bg-slate-100 border-b border-black text-black font-bold uppercase tracking-wider text-center">
                                            <th className="py-2 px-2 w-8 border border-black">#</th>
                                            <th className="py-2 px-3 text-left border border-black min-w-[170px]">Learner Full Name</th>
                                            <th className="py-2 px-2 border border-black whitespace-nowrap min-w-[100px]">Adm No</th>
                                            <th className="py-2 px-2 border border-black whitespace-nowrap min-w-[90px]">NEMIS UPI</th>
                                            {strands.map((strand, sIdx) => (
                                                <th key={strand.id} className="py-2 px-2 border border-black min-w-[110px]">
                                                    <div className="font-black">STRAND {sIdx + 1}</div>
                                                    <div className="text-[9px] font-normal uppercase truncate max-w-[120px]" title={strand.strand_name}>
                                                        {strand.strand_name}
                                                    </div>
                                                </th>
                                            ))}
                                            <th className="py-2 px-3 border border-black min-w-[90px] bg-slate-200">
                                                OVERALL (P.L)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-black">
                                        {students.map((student, idx) => {
                                            const fullName = student.full_name || [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ');

                                            let sumScore = 0;
                                            let countScore = 0;
                                            strands.forEach((st) => {
                                                const sc = scoreLookup[`${student.id}_${st.id}`];
                                                if (sc) {
                                                    sumScore += sc.numeric_score;
                                                    countScore++;
                                                }
                                            });

                                            const avg = countScore > 0 ? sumScore / countScore : 3;
                                            const overall = avg >= 3.5 ? 'EE' : avg >= 2.5 ? 'ME' : avg >= 1.5 ? 'AE' : 'BE';

                                            return (
                                                <tr key={student.id} className="hover:bg-slate-50">
                                                    <td className="py-1.5 px-2 text-center font-bold border border-black">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="py-1.5 px-3 font-bold border border-black text-black whitespace-nowrap">
                                                        {fullName}
                                                    </td>
                                                    <td className="py-1.5 px-2 text-center font-mono font-bold border border-black whitespace-nowrap">
                                                        {student.admission_no}
                                                    </td>
                                                    <td className="py-1.5 px-2 text-center font-mono text-[10px] border border-black whitespace-nowrap">
                                                        {student.nemis_upi || '-'}
                                                    </td>

                                                    {strands.map((st) => {
                                                        const sc = scoreLookup[`${student.id}_${st.id}`];
                                                        const lvl = sc?.performance_level || 'ME';
                                                        return (
                                                            <td key={st.id} className="py-1.5 px-2 text-center font-bold border border-black">
                                                                {lvl}
                                                            </td>
                                                        );
                                                    })}

                                                    <td className="py-1.5 px-3 text-center font-black border border-black bg-slate-50">
                                                        {overall}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* View 2: Curriculum Strand & Sub-strand Assessment Matrix */}
                    {viewMode === 'curriculum_matrix' && (
                        <div className="space-y-4">
                            <div className="overflow-x-auto">
                                <table className="cba-table w-full text-left text-[11px] border-collapse border border-black">
                                    <thead>
                                        <tr className="bg-slate-100 border-b border-black text-center font-bold uppercase">
                                            <th className="py-2.5 px-4 text-left border border-black w-2/5" rowSpan={2}>
                                                STRAND / SUB-STRAND
                                            </th>
                                            <th className="py-1.5 px-2 border border-black" colSpan={4}>
                                                TERM ONE
                                            </th>
                                            <th className="py-1.5 px-2 border border-black" colSpan={4}>
                                                TERM TWO
                                            </th>
                                            <th className="py-1.5 px-2 border border-black" colSpan={4}>
                                                TERM THREE
                                            </th>
                                        </tr>
                                        <tr className="bg-slate-50 border-b border-black text-center text-[10px] font-bold">
                                            <th className="py-1 px-2 border border-black">C1</th>
                                            <th className="py-1 px-2 border border-black">C2</th>
                                            <th className="py-1 px-2 border border-black">END T</th>
                                            <th className="py-1 px-2 border border-black bg-slate-100">P.L</th>

                                            <th className="py-1 px-2 border border-black">C1</th>
                                            <th className="py-1 px-2 border border-black">C2</th>
                                            <th className="py-1 px-2 border border-black">END T</th>
                                            <th className="py-1 px-2 border border-black bg-slate-100">P.L</th>

                                            <th className="py-1 px-2 border border-black">C1</th>
                                            <th className="py-1 px-2 border border-black">C2</th>
                                            <th className="py-1 px-2 border border-black">END T</th>
                                            <th className="py-1 px-2 border border-black bg-slate-100">P.L</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {strands.map((strand, idx) => (
                                            <React.Fragment key={strand.id}>
                                                <tr className="bg-slate-100 font-bold border border-black">
                                                    <td className="py-1.5 px-3 border border-black" colSpan={13}>
                                                        {idx + 1}.0 {strand.strand_name.toUpperCase()}
                                                    </td>
                                                </tr>
                                                <tr className="border border-black">
                                                    <td className="py-1.5 px-6 border border-black">
                                                        {strand.sub_strand || strand.specific_learning_outcome || 'Competency Task Evaluation'}
                                                    </td>
                                                    <td className="py-1.5 px-2 text-center border border-black font-semibold">ME</td>
                                                    <td className="py-1.5 px-2 text-center border border-black font-semibold">EE</td>
                                                    <td className="py-1.5 px-2 text-center border border-black font-semibold">ME</td>
                                                    <td className="py-1.5 px-2 text-center border border-black font-bold bg-slate-50">ME</td>

                                                    <td className="py-1.5 px-2 text-center border border-black"></td>
                                                    <td className="py-1.5 px-2 text-center border border-black"></td>
                                                    <td className="py-1.5 px-2 text-center border border-black"></td>
                                                    <td className="py-1.5 px-2 text-center border border-black bg-slate-50"></td>

                                                    <td className="py-1.5 px-2 text-center border border-black"></td>
                                                    <td className="py-1.5 px-2 text-center border border-black"></td>
                                                    <td className="py-1.5 px-2 text-center border border-black"></td>
                                                    <td className="py-1.5 px-2 text-center border border-black bg-slate-50"></td>
                                                </tr>
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Official Performance Rubric Key */}
                    <div className="border border-black p-2.5 text-[10px] text-center font-bold no-break uppercase tracking-wide">
                        KEY: C1 = CAT ONE &bull; C2 = CAT TWO &bull; END T = END TERM &bull; P.L = PERFORMANCE LEVEL
                        <div className="mt-1 text-slate-800">
                            EE = EXCEEDING EXPECTATIONS (4) &bull; ME = MEETING EXPECTATIONS (3) &bull; AE = APPROACHING EXPECTATIONS (2) &bull; BE = BELOW EXPECTATIONS (1)
                        </div>
                    </div>

                    {/* Official Institutional Verification & Sign-offs */}
                    <div className="pt-4 border-t-2 border-black grid grid-cols-3 gap-6 text-[11px] no-break">
                        <div className="space-y-4">
                            <div className="font-bold uppercase">Subject Teacher:</div>
                            <div className="border-b border-black pb-1">Signature: _______________________</div>
                        </div>
                        <div className="space-y-4">
                            <div className="font-bold uppercase">CBC Coordinator:</div>
                            <div className="border-b border-black pb-1">Signature: _______________________</div>
                        </div>
                        <div className="space-y-4 text-right">
                            <div className="font-bold uppercase">Headteacher / Principal:</div>
                            <div className="border-b border-black pb-1 text-right">Official Stamp & Date: ___________</div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}