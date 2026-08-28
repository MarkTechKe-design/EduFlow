import React from 'react';
import { Award, CheckCircle2, BookOpen } from 'lucide-react';

export interface CbcAssessment {
    id: number | string;
    learning_area: string;
    strand: string;
    rubric: 'EE' | 'ME' | 'AE' | 'BE';
    teacher_comment?: string;
    assessed_at?: string;
}

interface Props {
    assessments?: CbcAssessment[];
    title?: string;
    emptyMessage?: string;
}

export default function CbcRubricMeter({
    assessments = [],
    title = 'CBC Continuous Assessment Rubrics',
    emptyMessage = 'No CBC rubric assessments recorded for this term yet.',
}: Props) {
    const rubricDetails = {
        EE: { label: 'Exceeding Expectations', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
        ME: { label: 'Meeting Expectations', badge: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
        AE: { label: 'Approaching Expectations', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
        BE: { label: 'Below Expectations', badge: 'bg-rose-100 text-rose-800 border-rose-200' },
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-base font-bold text-slate-950">{title}</h3>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                    Kenyan CBC Standard
                </span>
            </div>

            {assessments.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl space-y-2">
                    <BookOpen className="w-6 h-6 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-500">{emptyMessage}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {assessments.map((a) => {
                        const rubricInfo = rubricDetails[a.rubric] || rubricDetails.ME;
                        return (
                            <div key={a.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-xs font-bold text-slate-900">{a.learning_area}</h4>
                                        <span className="text-xs text-slate-400">· {a.strand}</span>
                                    </div>
                                    {a.teacher_comment && (
                                        <p className="text-xs text-slate-600">{a.teacher_comment}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`px-2.5 py-1 rounded-lg border font-extrabold text-xs ${rubricInfo.badge}`}>
                                        {a.rubric}
                                    </span>
                                    <span className="text-[11px] font-semibold text-slate-500 hidden md:inline">
                                        {rubricInfo.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}