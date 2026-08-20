import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Download, Printer, ArrowLeft, Award, Calendar, CheckCircle2, User, ShieldCheck } from 'lucide-react';

interface Props {
    report: {
        school: {
            name: string;
            motto: string;
            address: string;
            phone: string;
            email: string;
            registration_number: string;
            knec_code: string;
            curriculum: string;
        };
        student: {
            id: number;
            full_name: string;
            admission_no: string;
            class_name: string;
            section_name: string;
            gender: string;
            photo_url?: string;
        };
        exam: {
            id: number;
            name: string;
        };
        subjects: Array<{
            subject_id: number;
            subject_name: string;
            subject_code: string;
            display_mark: string;
            full_marks: number;
            percentage: number | null;
            grade: string;
            points: number | null;
            remarks: string;
        }>;
        summary: {
            total_marks: number;
            max_possible_marks: number;
            average_percentage: number;
            mean_grade: string;
            class_position: number | null;
            stream_position: number | null;
            total_students_class: number;
            total_students_stream: number;
            class_teacher_remarks: string;
            headteacher_remarks: string;
        };
        attendance: {
            days_present: number;
            days_absent: number;
            total_days: number;
            attendance_rate: number;
        };
        calendar: {
            academic_year: string;
            term: string;
            next_term_opening_date: string;
            closing_date: string;
        };
    };
}

export default function ReportCardView({ report }: Props) {
    const { school, student, exam, subjects, summary, attendance, calendar } = report;

    return (
        <AppLayout>
            <Head title={`Official Report Card - ${student.full_name}`} />

            <div className="space-y-6 max-w-5xl mx-auto">
                {/* Actions Top Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
                    <Link
                        href={`/school/exams/${exam.id}/results`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Merit List
                    </Link>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50"
                        >
                            <Printer className="w-4 h-4" />
                            Print A4
                        </button>

                        <a
                            href={`/school/reports/academic/student/${student.id}/exam/${exam.id}/pdf`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700"
                        >
                            <Download className="w-4 h-4" />
                            Download Official PDF
                        </a>
                    </div>
                </div>

                {/* Report Card Document Sheet */}
                <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm text-slate-900">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-slate-900 pb-6 gap-4">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950">{school.name}</h1>
                            <p className="text-xs italic text-slate-500">"{school.motto}"</p>
                            <p className="text-[11px] text-slate-500 mt-1">
                                {school.address} | Phone: {school.phone} | Email: {school.email}
                            </p>
                            <p className="text-[10px] text-slate-400">
                                Registration: {school.registration_number || 'REG-PENDING'} | KNEC Code: {school.knec_code || 'KNEC-CBC'}
                            </p>
                        </div>

                        <div className="w-[35mm] h-[45mm] shrink-0 border border-dashed border-slate-300 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center text-center">
                            {student.photo_url ? (
                                <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-[10px] font-bold text-slate-400">PHOTO SPACE</div>
                            )}
                        </div>
                    </div>

                    {/* Student Meta Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6 text-xs border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                        <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Learner Name</span>
                            <span className="font-bold text-slate-900">{student.full_name}</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Admission Number</span>
                            <span className="font-bold text-slate-900">{student.admission_no}</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Class & Stream</span>
                            <span className="font-bold text-slate-900">{student.class_name} ({student.section_name})</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Term & Year</span>
                            <span className="font-bold text-slate-900">{exam.name} ({calendar.academic_year})</span>
                        </div>
                    </div>

                    {/* Subject Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-900 text-white text-[10px] uppercase tracking-wider">
                                    <th className="py-2.5 px-3">Subject</th>
                                    <th className="py-2.5 px-3 text-center">Score</th>
                                    <th className="py-2.5 px-3 text-center">Out of</th>
                                    <th className="py-2.5 px-3 text-center">%</th>
                                    <th className="py-2.5 px-3 text-center">Grade</th>
                                    <th className="py-2.5 px-3">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {subjects.map((sub) => (
                                    <tr key={sub.subject_id} className="hover:bg-slate-50">
                                        <td className="py-2.5 px-3 font-semibold text-slate-900">{sub.subject_name}</td>
                                        <td className="py-2.5 px-3 text-center">{sub.display_mark}</td>
                                        <td className="py-2.5 px-3 text-center text-slate-500">{sub.full_marks}</td>
                                        <td className="py-2.5 px-3 text-center font-medium">{sub.percentage !== null ? `${sub.percentage}%` : '—'}</td>
                                        <td className="py-2.5 px-3 text-center font-bold text-indigo-600">{sub.grade}</td>
                                        <td className="py-2.5 px-3 text-slate-600">{sub.remarks}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary Metrics Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 my-6 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                        <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Total Marks</span>
                            <span className="font-bold text-slate-900">{summary.total_marks} / {summary.max_possible_marks}</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Mean Percentage</span>
                            <span className="font-bold text-indigo-600">{summary.average_percentage}%</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Mean Grade</span>
                            <span className="font-bold text-emerald-600">{summary.mean_grade}</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Class Position</span>
                            <span className="font-bold text-slate-900">{summary.class_position || '—'} / {summary.total_students_class}</span>
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Stream Position</span>
                            <span className="font-bold text-slate-900">{summary.stream_position || '—'} / {summary.total_students_stream}</span>
                        </div>
                    </div>

                    {/* Teacher Remarks Box */}
                    <div className="space-y-3 my-6">
                        <div className="rounded-xl border border-slate-200 p-4 bg-white">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Class Teacher's Remarks</span>
                            <p className="text-xs text-slate-800">{summary.class_teacher_remarks}</p>
                        </div>

                        <div className="rounded-xl border border-slate-200 p-4 bg-white">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Principal / Headteacher's Remarks</span>
                            <p className="text-xs text-slate-800">{summary.headteacher_remarks}</p>
                        </div>
                    </div>

                    {/* Footer Info & Signatures */}
                    <div className="pt-6 border-t border-slate-200">
                        <div className="flex justify-between text-xs text-slate-600 mb-8">
                            <span>Term Closing Date: <strong>{calendar.closing_date}</strong></span>
                            <span>Next Term Opening Date: <strong>{calendar.next_term_opening_date}</strong></span>
                        </div>

                        <div className="grid grid-cols-3 gap-8 pt-4 text-center text-xs text-slate-500">
                            <div className="border-t border-dotted border-slate-400 pt-2">Class Teacher Signature</div>
                            <div className="border-t border-dotted border-slate-400 pt-2">Principal Signature & Stamp</div>
                            <div className="border-t border-dotted border-slate-400 pt-2">Parent / Guardian Signature</div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}