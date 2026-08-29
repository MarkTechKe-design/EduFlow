import React, { useState } from 'react';
import { Printer, FileText, Archive, CheckCircle2, Layers } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';

interface CbcBatchActionsProps {
    selectedStudentIds: (number | string)[];
    activeClassId?: number | string | null;
    activeSectionId?: number | string | null;
    totalClassStudentsCount?: number;
    className?: string;
}

export const CbcBatchActions: React.FC<CbcBatchActionsProps> = ({
    selectedStudentIds,
    activeClassId,
    activeSectionId,
    totalClassStudentsCount = 0,
    className = '',
}) => {
    const [selectedTemplate, setSelectedTemplate] = useState<'executive' | 'transcript'>('executive');

    const triggerBulkAction = (exportType: 'pdf_combined' | 'zip' | null = null) => {
        const params = new URLSearchParams();
        params.append('template', selectedTemplate);

        if (selectedStudentIds.length > 0) {
            params.append('student_ids', selectedStudentIds.join(','));
        } else if (activeSectionId) {
            params.append('section_id', String(activeSectionId));
        } else if (activeClassId) {
            params.append('class_id', String(activeClassId));
        }

        if (exportType) {
            params.append('export', exportType);
        }

        const targetUrl = `/school/reports/cbc/bulk?${params.toString()}`;
        window.open(targetUrl, '_blank');
    };

    const hasSelection = selectedStudentIds.length > 0;
    const countLabel = hasSelection
        ? `${selectedStudentIds.length} Selected`
        : activeClassId
        ? `Whole Cohort (${totalClassStudentsCount || 'Class'})`
        : 'All Active Students';

    return (
        <div className={`flex flex-wrap items-center justify-between gap-3 bg-slate-900 text-slate-100 p-3 px-4 rounded-xl border border-slate-800 shadow-md ${className}`}>
            {/* Status & Scope Indicator */}
            <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                    <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                        <span>CBC Report Card Engine</span>
                        <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            {countLabel}
                        </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                        {hasSelection ? 'Generating reports for checked learners' : 'Select learners above or export for entire cohort'}
                    </div>
                </div>
            </div>

            {/* Actions & Template Switcher */}
            <div className="flex flex-wrap items-center gap-2 ml-auto">
                <div className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-slate-400" />
                    <Select value={selectedTemplate} onValueChange={(val: 'executive' | 'transcript') => setSelectedTemplate(val)}>
                        <SelectTrigger className="h-8 w-44 bg-slate-800 border-slate-700 text-xs text-slate-200 focus:ring-emerald-500">
                            <SelectValue placeholder="Select Template" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700 text-slate-200 text-xs">
                            <SelectItem value="executive">Executive CBE (Emerald)</SelectItem>
                            <SelectItem value="transcript">Transcript (With Analytics)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Print Browser View */}
                <Button
                    type="button"
                    size="sm"
                    onClick={() => triggerBulkAction(null)}
                    className="h-8 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium gap-1.5 shadow-sm"
                >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Reports</span>
                </Button>

                {/* Combined PDF Export */}
                <Button
                    type="button"
                    size="sm"
                    onClick={() => triggerBulkAction('pdf_combined')}
                    className="h-8 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium gap-1.5 shadow-sm"
                >
                    <FileText className="h-3.5 w-3.5" />
                    <span>Combined PDF</span>
                </Button>

                {/* ZIP Archive Export */}
                <Button
                    type="button"
                    size="sm"
                    onClick={() => triggerBulkAction('zip')}
                    className="h-8 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium gap-1.5 shadow-sm"
                >
                    <Archive className="h-3.5 w-3.5" />
                    <span>Download ZIP</span>
                </Button>
            </div>
        </div>
    );
};

export default CbcBatchActions;