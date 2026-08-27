import AppLayout from '@/Layouts/AppLayout';
import { useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import type { PageProps, PaginatedData } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
    FileText,
    Plus,
    CheckCircle2,
    Clock,
    AlertCircle,
    XCircle,
    Eye,
    Check,
    X,
    UserCheck,
    BookmarkCheck,
    Layers,
    Calendar
} from 'lucide-react';

interface StaffItem {
    id: number;
    first_name: string;
    last_name: string;
    emp_id: string;
}

interface LessonPlanItem {
    id: number;
    title: string;
    class_id: number;
    subject_id: number;
    teacher_id?: number | null;
    term: string;
    strand?: string | null;
    sub_strand?: string | null;
    lesson_duration_mins: number;
    week_start: string;
    objectives: string;
    core_competencies?: string[] | null;
    values_addressed?: string[] | null;
    pcis?: string | null;
    content?: string | null;
    teaching_methods?: string | null;
    resources?: string | null;
    status: 'submitted' | 'approved' | 'rejected';
    reviewer_feedback?: string | null;
    reviewed_at?: string | null;
    teacher_reflection?: string | null;
    school_class?: { id: number; name: string };
    subject?: { id: number; name: string };
    teacher?: StaffItem | null;
    reviewer?: { id: number; name: string } | null;
}

interface Props extends PageProps {
    plans: PaginatedData<LessonPlanItem>;
    classes: { id: number; name: string }[];
    subjects: { id: number; name: string }[];
    staff: StaffItem[];
    stats: {
        total: number;
        approved: number;
        submitted: number;
        rejected: number;
    };
    filters: {
        status: string;
        class_id: string;
        subject_id: string;
        term: string;
    };
}

const AVAILABLE_COMPETENCIES = [
    'Critical thinking & problem solving',
    'Creativity & imagination',
    'Communication and collaboration',
    'Digital literacy',
    'Self-efficacy',
    'Citizenship',
    'Learning to learn'
];

const AVAILABLE_VALUES = [
    'Respect',
    'Integrity',
    'Responsibility',
    'Unity',
    'Love',
    'Peace',
    'Patriotism'
];

export default function LessonPlans({ plans, classes, subjects, staff, stats, filters }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [viewOpen, setViewOpen] = useState(false);
    const [reviewOpen, setReviewOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<LessonPlanItem | null>(null);

    const createForm = useForm({
        class_id: '',
        subject_id: '',
        teacher_id: '',
        term: 'Term 2',
        title: '',
        strand: '',
        sub_strand: '',
        lesson_duration_mins: 40,
        week_start: new Date().toISOString().split('T')[0],
        objectives: 'By the end of the lesson, the learner should be able to:\n1. \n2. ',
        core_competencies: [] as string[],
        values_addressed: [] as string[],
        pcis: '',
        content: "Introduction (5 mins):\n\nLesson Development (25 mins):\n- Step 1:\n- Step 2:\n\nConclusion (10 mins):\n",
        teaching_methods: 'Inquiry-based learning, guided demonstration, pair problem-solving',
        resources: 'KICD Approved Course Book, Chart visual, Concrete apparatus',
        teacher_reflection: '',
    });

    const reviewForm = useForm({
        action: 'approved' as 'approved' | 'rejected' | 'submitted',
        reviewer_feedback: '',
    });

    function handleCreateSubmit(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/school/homework/lesson-plans', {
            onSuccess: () => {
                createForm.reset();
                setCreateOpen(false);
            },
        });
    }

    function handleReviewSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedPlan) return;
        reviewForm.put(`/school/homework/lesson-plans/${selectedPlan.id}/review`, {
            onSuccess: () => {
                setReviewOpen(false);
                setSelectedPlan(null);
            },
        });
    }

    function toggleCompetency(c: string) {
        const current = [...createForm.data.core_competencies];
        const idx = current.indexOf(c);
        if (idx > -1) {
            current.splice(idx, 1);
        } else {
            current.push(c);
        }
        createForm.setData('core_competencies', current);
    }

    function toggleValue(v: string) {
        const current = [...createForm.data.values_addressed];
        const idx = current.indexOf(v);
        if (idx > -1) {
            current.splice(idx, 1);
        } else {
            current.push(v);
        }
        createForm.setData('values_addressed', current);
    }

    const statusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-emerald-50 text-emerald-800 border-emerald-200';
            case 'rejected':
                return 'bg-red-50 text-red-800 border-red-200';
            case 'submitted':
                return 'bg-amber-50 text-amber-800 border-amber-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <AppLayout title="Lesson Plans & Instructional Schemes">
            <div className="max-w-7xl space-y-6 pb-16">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-emerald-600" />
                            <span>Lesson Plans & Pedagogical Preparation</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Curate and review weekly instructional lesson plans aligned with TSC TPAD Standard 1 and KICD designs.
                        </p>
                    </div>

                    <Button
                        type="button"
                        onClick={() => setCreateOpen(true)}
                        className="h-10 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-2 shadow-2xs"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create Lesson Plan</span>
                    </Button>
                </div>

                {/* KPI Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Lesson Plans</span>
                        <p className="text-2xl font-black text-slate-900 mt-1">{stats?.total ?? 0}</p>
                        <span className="text-[10px] text-slate-500">Prepared pedagogical plans</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Approved & Verified</span>
                        <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.approved ?? 0}</p>
                        <span className="text-[10px] text-slate-500">Endorsed by HOD / Dean</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Review</span>
                        <p className="text-2xl font-black text-amber-600 mt-1">{stats?.submitted ?? 0}</p>
                        <span className="text-[10px] text-slate-500">Awaiting HOD signature</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Returned / Revision</span>
                        <p className="text-2xl font-black text-red-600 mt-1">{stats?.rejected ?? 0}</p>
                        <span className="text-[10px] text-slate-500">Requires refinement</span>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <Select
                            value={filters?.status ?? 'all'}
                            onValueChange={(v) => router.get('/school/homework/lesson-plans', { ...filters, status: v }, { preserveState: true })}
                        >
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Verification Statuses</SelectItem>
                                <SelectItem value="approved">Approved & Verified</SelectItem>
                                <SelectItem value="submitted">Pending HOD Review</SelectItem>
                                <SelectItem value="rejected">Requires Revision</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters?.class_id ?? 'all'}
                            onValueChange={(v) => router.get('/school/homework/lesson-plans', { ...filters, class_id: v }, { preserveState: true })}
                        >
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Classes" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes / Grades</SelectItem>
                                {classes.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters?.subject_id ?? 'all'}
                            onValueChange={(v) => router.get('/school/homework/lesson-plans', { ...filters, subject_id: v }, { preserveState: true })}
                        >
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Subjects" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Learning Areas</SelectItem>
                                {subjects.map((s) => (
                                    <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters?.term ?? 'all'}
                            onValueChange={(v) => router.get('/school/homework/lesson-plans', { ...filters, term: v }, { preserveState: true })}
                        >
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Terms" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Academic Terms</SelectItem>
                                <SelectItem value="Term 1">Term 1</SelectItem>
                                <SelectItem value="Term 2">Term 2</SelectItem>
                                <SelectItem value="Term 3">Term 3</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Lesson Plans Roster */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="py-3.5 px-4">Lesson Topic & Strand</th>
                                    <th className="py-3.5 px-4">Class & Learning Area</th>
                                    <th className="py-3.5 px-4">Teacher</th>
                                    <th className="py-3.5 px-4">Schedule & Duration</th>
                                    <th className="py-3.5 px-4">Verification</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {plans.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-slate-400">
                                            No lesson plans found matching criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    plans.data.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-slate-900">{p.title}</div>
                                                <div className="text-[11px] text-slate-500 truncate max-w-xs">
                                                    {p.strand ? `${p.strand} — ${p.sub_strand || ''}` : 'General Curriculum'}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span className="font-bold text-slate-900 block">{p.school_class?.name || 'Class'}</span>
                                                <span className="text-[11px] text-emerald-700 font-medium">{p.subject?.name || 'Subject'}</span>
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                {p.teacher ? (
                                                    <div>
                                                        <span className="font-bold text-slate-800">{p.teacher.first_name} {p.teacher.last_name}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono block">EMP: {p.teacher.emp_id}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">Unassigned</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                                                <div className="font-mono text-slate-800 font-bold">{p.week_start}</div>
                                                <div className="text-[10px] text-slate-400">{p.lesson_duration_mins} Mins • {p.term}</div>
                                            </td>
                                            <td className="py-3.5 px-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase ${statusBadge(p.status)}`}>
                                                    {p.status}
                                                </span>
                                                {p.reviewer && (
                                                    <span className="text-[10px] text-slate-400 block mt-0.5">
                                                        by {p.reviewer.name}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedPlan(p);
                                                            setViewOpen(true);
                                                        }}
                                                        className="h-7 text-xs font-bold rounded-lg border-slate-200"
                                                    >
                                                        <Eye className="w-3.5 h-3.5 mr-1" /> View
                                                    </Button>

                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedPlan(p);
                                                            reviewForm.setData({
                                                                action: p.status === 'approved' ? 'approved' : 'approved',
                                                                reviewer_feedback: p.reviewer_feedback || '',
                                                            });
                                                            setReviewOpen(true);
                                                        }}
                                                        className="h-7 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                                                    >
                                                        Endorse
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Create Lesson Plan Dialog */}
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogContent className="sm:max-w-3xl rounded-2xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <span>Create KICD-Aligned Lesson Plan</span>
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
                            <div className="grid sm:grid-cols-3 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Class / Grade *</Label>
                                    <Select value={createForm.data.class_id} onValueChange={(v) => createForm.setData('class_id', v)}>
                                        <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select Grade" /></SelectTrigger>
                                        <SelectContent>
                                            {classes.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Learning Area / Subject *</Label>
                                    <Select value={createForm.data.subject_id} onValueChange={(v) => createForm.setData('subject_id', v)}>
                                        <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select Subject" /></SelectTrigger>
                                        <SelectContent>
                                            {subjects.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Subject Teacher</Label>
                                    <Select value={createForm.data.teacher_id} onValueChange={(v) => createForm.setData('teacher_id', v)}>
                                        <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Assign Teacher" /></SelectTrigger>
                                        <SelectContent>
                                            {staff.map((st) => (
                                                <SelectItem key={st.id} value={String(st.id)}>
                                                    {st.first_name} {st.last_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-3 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Academic Term</Label>
                                    <Select value={createForm.data.term} onValueChange={(v) => createForm.setData('term', v)}>
                                        <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Term 1">Term 1</SelectItem>
                                            <SelectItem value="Term 2">Term 2</SelectItem>
                                            <SelectItem value="Term 3">Term 3</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Week Start Date *</Label>
                                    <Input
                                        type="date"
                                        value={createForm.data.week_start}
                                        onChange={(e) => createForm.setData('week_start', e.target.value)}
                                        className="h-9 text-xs mt-1"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Duration (Minutes)</Label>
                                    <Input
                                        type="number"
                                        value={createForm.data.lesson_duration_mins}
                                        onChange={(e) => createForm.setData('lesson_duration_mins', parseInt(e.target.value) || 40)}
                                        className="h-9 text-xs mt-1 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Lesson Topic Title *</Label>
                                <Input
                                    value={createForm.data.title}
                                    onChange={(e) => createForm.setData('title', e.target.value)}
                                    placeholder="e.g. Addition & Subtraction of Mixed Fractions"
                                    className="h-9 text-xs mt-1"
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Curriculum Strand</Label>
                                    <Input
                                        value={createForm.data.strand}
                                        onChange={(e) => createForm.setData('strand', e.target.value)}
                                        placeholder="e.g. 1.0 Numbers"
                                        className="h-9 text-xs mt-1"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Sub-Strand</Label>
                                    <Input
                                        value={createForm.data.sub_strand}
                                        onChange={(e) => createForm.setData('sub_strand', e.target.value)}
                                        placeholder="e.g. 1.1 Fractions"
                                        className="h-9 text-xs mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Specific Learning Outcomes (SLOs) *</Label>
                                <Textarea
                                    rows={3}
                                    value={createForm.data.objectives}
                                    onChange={(e) => createForm.setData('objectives', e.target.value)}
                                    className="text-xs resize-none mt-1"
                                />
                            </div>

                            {/* Core Competencies Selector */}
                            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                                <Label className="text-xs font-bold text-slate-800">CBC Core Competencies Developed</Label>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {AVAILABLE_COMPETENCIES.map((c) => {
                                        const isSelected = createForm.data.core_competencies.includes(c);
                                        return (
                                            <button
                                                type="button"
                                                key={c}
                                                onClick={() => toggleCompetency(c)}
                                                className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                                                    isSelected
                                                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                                }`}
                                            >
                                                {c}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Values Selector */}
                            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                                <Label className="text-xs font-bold text-slate-800">Values Addressed</Label>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {AVAILABLE_VALUES.map((v) => {
                                        const isSelected = createForm.data.values_addressed.includes(v);
                                        return (
                                            <button
                                                type="button"
                                                key={v}
                                                onClick={() => toggleValue(v)}
                                                className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                                                    isSelected
                                                        ? 'bg-purple-600 text-white border-purple-600 font-bold'
                                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                                }`}
                                            >
                                                {v}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Pertinent & Contemporary Issues (PCIs)</Label>
                                <Input
                                    value={createForm.data.pcis}
                                    onChange={(e) => createForm.setData('pcis', e.target.value)}
                                    placeholder="e.g. Financial literacy, environmental awareness..."
                                    className="h-9 text-xs mt-1"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Lesson Development Steps</Label>
                                <Textarea
                                    rows={4}
                                    value={createForm.data.content}
                                    onChange={(e) => createForm.setData('content', e.target.value)}
                                    className="text-xs font-mono resize-none mt-1"
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Learning Resources & Apparatus</Label>
                                    <Input
                                        value={createForm.data.resources}
                                        onChange={(e) => createForm.setData('resources', e.target.value)}
                                        className="h-9 text-xs mt-1"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Pedagogical Methods</Label>
                                    <Input
                                        value={createForm.data.teaching_methods}
                                        onChange={(e) => createForm.setData('teaching_methods', e.target.value)}
                                        className="h-9 text-xs mt-1"
                                    />
                                </div>
                            </div>

                            <DialogFooter className="gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="h-9 text-xs rounded-xl">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createForm.processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                                    Submit for HOD Verification
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* View Full Lesson Plan Sheet */}
                <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                    <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900">
                                Lesson Plan Inspection View
                            </DialogTitle>
                        </DialogHeader>

                        {selectedPlan && (
                            <div className="space-y-4 text-xs pt-2">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-900 text-sm">{selectedPlan.title}</span>
                                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${statusBadge(selectedPlan.status)}`}>
                                            {selectedPlan.status}
                                        </span>
                                    </div>
                                    <div className="text-slate-500">
                                        {selectedPlan.school_class?.name} • {selectedPlan.subject?.name} • {selectedPlan.term} ({selectedPlan.lesson_duration_mins} mins)
                                    </div>
                                    <div className="text-slate-600 font-medium pt-1">
                                        Teacher: {selectedPlan.teacher?.first_name} {selectedPlan.teacher?.last_name}
                                    </div>
                                </div>

                                <div>
                                    <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block">Specific Learning Outcomes</span>
                                    <p className="mt-1 whitespace-pre-line text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                                        {selectedPlan.objectives}
                                    </p>
                                </div>

                                {selectedPlan.core_competencies && selectedPlan.core_competencies.length > 0 && (
                                    <div>
                                        <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block">Core Competencies</span>
                                        <div className="flex flex-wrap gap-1.5 mt-1">
                                            {selectedPlan.core_competencies.map((c) => (
                                                <span key={c} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-medium">
                                                    {c}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px] block">Lesson Development</span>
                                    <p className="mt-1 whitespace-pre-line text-slate-700 bg-white p-3 rounded-xl border border-slate-200 font-mono text-[11px]">
                                        {selectedPlan.content}
                                    </p>
                                </div>

                                {selectedPlan.reviewer_feedback && (
                                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200">
                                        <span className="font-bold text-amber-900 block text-[11px]">HOD / Reviewer Feedback:</span>
                                        <p className="text-amber-800 mt-0.5 italic">{selectedPlan.reviewer_feedback}</p>
                                    </div>
                                )}

                                {selectedPlan.teacher_reflection && (
                                    <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                                        <span className="font-bold text-blue-900 block text-[11px]">Post-Lesson Reflection (Self-Evaluation):</span>
                                        <p className="text-blue-800 mt-0.5">{selectedPlan.teacher_reflection}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Review / Endorsement Modal */}
                <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
                    <DialogContent className="sm:max-w-md rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900">
                                Endorse / Verify Lesson Plan
                            </DialogTitle>
                        </DialogHeader>

                        {selectedPlan && (
                            <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2">
                                <div className="p-3 rounded-xl bg-slate-50 text-xs">
                                    <div className="font-bold text-slate-900">{selectedPlan.title}</div>
                                    <div className="text-slate-500">{selectedPlan.school_class?.name} • {selectedPlan.subject?.name}</div>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Verification Decision *</Label>
                                    <Select
                                        value={reviewForm.data.action}
                                        onValueChange={(v: any) => reviewForm.setData('action', v)}
                                    >
                                        <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="approved">Approve & Endorse Plan</SelectItem>
                                            <SelectItem value="rejected">Return for Pedagogical Revision</SelectItem>
                                            <SelectItem value="submitted">Mark Pending Verification</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Reviewer Feedback & Remarks</Label>
                                    <Textarea
                                        rows={3}
                                        value={reviewForm.data.reviewer_feedback}
                                        onChange={(e) => reviewForm.setData('reviewer_feedback', e.target.value)}
                                        placeholder="Add pedagogical remarks, pacing notes..."
                                        className="text-xs resize-none mt-1"
                                    />
                                </div>

                                <DialogFooter className="gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setReviewOpen(false)} className="h-9 text-xs rounded-xl">
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={reviewForm.processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                                        Record Endorsement
                                    </Button>
                                </DialogFooter>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}