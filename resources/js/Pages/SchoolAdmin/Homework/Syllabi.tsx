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
    BookOpen,
    Plus,
    Pencil,
    CheckCircle2,
    Clock,
    Layers,
    ChevronDown,
    ChevronUp,
    BookmarkCheck,
    GraduationCap,
    CheckSquare,
    UserCheck
} from 'lucide-react';

interface SubStrandItem {
    title: string;
    lessons_planned: number;
    lessons_taught: number;
    covered: boolean;
}

interface StrandItem {
    name: string;
    sub_strands: SubStrandItem[];
}

interface SyllabusItem {
    id: number;
    title: string;
    academic_year: string;
    term: string;
    curriculum_type: 'CBC' | '8-4-4' | 'IGCSE';
    class_id: number;
    subject_id: number;
    teacher_id?: number | null;
    completion_percent: number;
    total_lessons_planned: number;
    total_lessons_taught: number;
    status: string;
    reviewer_feedback?: string | null;
    reviewed_at?: string | null;
    strands: StrandItem[] | null;
    school_class?: { id: number; name: string };
    subject?: { id: number; name: string };
    teacher?: { id: number; first_name: string; last_name: string } | null;
    reviewer?: { id: number; name: string } | null;
}

interface Props extends PageProps {
    syllabi: PaginatedData<SyllabusItem>;
    classes: { id: number; name: string }[];
    subjects: { id: number; name: string }[];
    stats: {
        total_syllabi: number;
        completed: number;
        in_progress: number;
        average_progress: number;
    };
    filters: {
        class_id: string;
        subject_id: string;
        term: string;
        academic_year: string;
    };
}

export default function Syllabi({ syllabi, classes, subjects, stats, filters }: Props) {
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [endorseOpen, setEndorseOpen] = useState(false);
    const [activeSyllabus, setActiveSyllabus] = useState<SyllabusItem | null>(null);
    const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});

    const createForm = useForm({
        class_id: '',
        subject_id: '',
        academic_year: filters.academic_year || '2026',
        term: filters.term || 'Term 2',
        curriculum_type: 'CBC' as 'CBC' | '8-4-4' | 'IGCSE',
        title: '',
        strands: [
            {
                name: '1.0 Core Area / Topic',
                sub_strands: [
                    { title: '1.1 Specific Sub-concept', lessons_planned: 5, lessons_taught: 0, covered: false }
                ]
            }
        ] as StrandItem[],
    });

    const editForm = useForm({
        title: '',
        term: 'Term 2',
        curriculum_type: 'CBC' as 'CBC' | '8-4-4' | 'IGCSE',
        strands: [] as StrandItem[],
    });

    const endorseForm = useForm({
        action: 'approved' as 'approved' | 'rejected' | 'submitted',
        reviewer_feedback: '',
    });

    function toggleExpand(id: number) {
        setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
    }

    function openEditModal(s: SyllabusItem) {
        setActiveSyllabus(s);
        editForm.setData({
            title: s.title,
            term: s.term || 'Term 2',
            curriculum_type: s.curriculum_type || 'CBC',
            strands: s.strands && s.strands.length > 0 ? JSON.parse(JSON.stringify(s.strands)) : [
                {
                    name: s.curriculum_type === '8-4-4' ? 'Topic 1.0: Foundation Concept' : '1.0 Primary Strand',
                    sub_strands: [
                        { title: '1.1 Specific objective item', lessons_planned: 5, lessons_taught: 0, covered: false }
                    ]
                }
            ],
        });
        setEditOpen(true);
    }

    function openEndorseModal(s: SyllabusItem) {
        setActiveSyllabus(s);
        endorseForm.setData({
            action: s.status === 'approved' ? 'approved' : 'approved',
            reviewer_feedback: s.reviewer_feedback || '',
        });
        setEndorseOpen(true);
    }

    function handleCreateSubmit(e: React.FormEvent) {
        e.preventDefault();
        createForm.post('/school/homework/syllabi', {
            onSuccess: () => {
                createForm.reset();
                setCreateOpen(false);
            },
        });
    }

    function handleEditSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!activeSyllabus) return;
        editForm.put(`/school/homework/syllabi/${activeSyllabus.id}`, {
            onSuccess: () => {
                setEditOpen(false);
                setActiveSyllabus(null);
            },
        });
    }

    function handleEndorseSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!activeSyllabus) return;
        endorseForm.put(`/school/homework/syllabi/${activeSyllabus.id}/review`, {
            onSuccess: () => {
                setEndorseOpen(false);
                setActiveSyllabus(null);
            },
        });
    }

    function addEditStrand() {
        const isLegacy = editForm.data.curriculum_type === '8-4-4';
        editForm.setData('strands', [
            ...editForm.data.strands,
            {
                name: isLegacy ? `Topic ${editForm.data.strands.length + 1}.0: New Topic` : `${editForm.data.strands.length + 1}.0 New Strand`,
                sub_strands: [
                    { title: isLegacy ? 'Sub-topic objective' : 'Sub-strand outcome', lessons_planned: 5, lessons_taught: 0, covered: false }
                ]
            }
        ]);
    }

    function addEditSubStrand(strandIdx: number) {
        const updated = [...editForm.data.strands];
        const isLegacy = editForm.data.curriculum_type === '8-4-4';
        updated[strandIdx].sub_strands.push({
            title: isLegacy ? 'New Sub-topic' : 'New Sub-strand',
            lessons_planned: 4,
            lessons_taught: 0,
            covered: false,
        });
        editForm.setData('strands', updated);
    }

    function updateEditSubStrand(strandIdx: number, subIdx: number, field: string, value: any) {
        const updated = [...editForm.data.strands];
        updated[strandIdx].sub_strands[subIdx] = {
            ...updated[strandIdx].sub_strands[subIdx],
            [field]: value,
        };
        editForm.setData('strands', updated);
    }

    function removeEditSubStrand(strandIdx: number, subIdx: number) {
        const updated = [...editForm.data.strands];
        updated[strandIdx].sub_strands.splice(subIdx, 1);
        editForm.setData('strands', updated);
    }

    return (
        <AppLayout title="Curriculum Schemes & Course Plans">
            <div className="max-w-7xl space-y-6 pb-16">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-emerald-600" />
                            <span>Curriculum Schemes of Work & Course Plans</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Dual-curriculum tracking with HOD / Dean verification and termly lesson pacing.
                        </p>
                    </div>

                    <Button
                        type="button"
                        onClick={() => setCreateOpen(true)}
                        className="h-10 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-2 shadow-2xs"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Register Course Scheme</span>
                    </Button>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Schemes</span>
                        <p className="text-2xl font-black text-slate-900 mt-1">{stats?.total_syllabi ?? 0}</p>
                        <span className="text-[10px] text-slate-500">Active Course Plans</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">In Progress</span>
                        <p className="text-2xl font-black text-amber-600 mt-1">{stats?.in_progress ?? 0}</p>
                        <span className="text-[10px] text-slate-500">Currently being taught</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fully Completed</span>
                        <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.completed ?? 0}</p>
                        <span className="text-[10px] text-slate-500">100% syllabus delivered</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Average Pacing</span>
                        <p className="text-2xl font-black text-blue-600 mt-1">{stats?.average_progress ?? 0}%</p>
                        <span className="text-[10px] text-slate-500">Institutional syllabus velocity</span>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <Select
                            value={filters?.term ?? 'all'}
                            onValueChange={(v) => router.get('/school/homework/syllabi', { ...filters, term: v }, { preserveState: true })}
                        >
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Academic Term" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Terms</SelectItem>
                                <SelectItem value="Term 1">Term 1</SelectItem>
                                <SelectItem value="Term 2">Term 2</SelectItem>
                                <SelectItem value="Term 3">Term 3</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters?.class_id ?? 'all'}
                            onValueChange={(v) => router.get('/school/homework/syllabi', { ...filters, class_id: v }, { preserveState: true })}
                        >
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select Class / Grade" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {classes.map((c) => (
                                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters?.subject_id ?? 'all'}
                            onValueChange={(v) => router.get('/school/homework/syllabi', { ...filters, subject_id: v }, { preserveState: true })}
                        >
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Learning Area / Subject" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Subjects</SelectItem>
                                {subjects.map((sb) => (
                                    <SelectItem key={sb.id} value={String(sb.id)}>{sb.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters?.academic_year ?? 'all'}
                            onValueChange={(v) => router.get('/school/homework/syllabi', { ...filters, academic_year: v }, { preserveState: true })}
                        >
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Academic Year" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Years</SelectItem>
                                <SelectItem value="2026">2026</SelectItem>
                                <SelectItem value="2025">2025</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Syllabi List & Expandable Strands/Topics */}
                <div className="space-y-4">
                    {syllabi.data.length === 0 ? (
                        <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white text-slate-400 text-xs">
                            No course schemes found matching filter criteria.
                        </div>
                    ) : (
                        syllabi.data.map((s) => {
                            const isExpanded = Boolean(expandedIds[s.id]);
                            const strandsList = s.strands || [];
                            const is844 = s.curriculum_type === '8-4-4';

                            return (
                                <div key={s.id} className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                                    <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                                    is844 
                                                        ? 'bg-blue-50 text-blue-800 border-blue-200' 
                                                        : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                                }`}>
                                                    {s.curriculum_type || 'CBC'}
                                                </span>
                                                <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                                                    {s.term} ({s.academic_year})
                                                </span>
                                                <span className="text-xs font-bold text-slate-900">
                                                    {s.school_class?.name || 'Class'} • {s.subject?.name || 'Subject'}
                                                </span>
                                                {s.status === 'approved' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                                        <CheckCircle2 className="w-3 h-3" /> HOD Endorsed
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-sm font-bold text-slate-900">{s.title}</h3>
                                            <div className="text-[11px] text-slate-400">
                                                {is844 ? 'KCSE Topic Pacing:' : 'CBC Strand Pacing:'} <span className="font-bold text-slate-700">{s.total_lessons_taught}</span> of <span className="font-bold text-slate-700">{s.total_lessons_planned}</span> planned lessons delivered
                                                {s.reviewer && <span className="ml-2 text-slate-500">• Verified by {s.reviewer.name}</span>}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 sm:gap-6">
                                            {/* Progress Bar */}
                                            <div className="w-36 space-y-1">
                                                <div className="flex items-center justify-between text-[11px] font-bold">
                                                    <span className="text-slate-500">Coverage</span>
                                                    <span className={Number(s.completion_percent) >= 100 ? 'text-emerald-600' : 'text-slate-900'}>
                                                        {s.completion_percent}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all ${
                                                            Number(s.completion_percent) >= 100 
                                                                ? 'bg-emerald-600' 
                                                                : (is844 ? 'bg-blue-600' : 'bg-slate-900')
                                                        }`}
                                                        style={{ width: `${Math.min(100, Number(s.completion_percent))}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => openEditModal(s)}
                                                    className="h-8 text-xs font-bold rounded-xl border-slate-200"
                                                >
                                                    <Pencil className="w-3.5 h-3.5 mr-1" />
                                                    <span>Update</span>
                                                </Button>

                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => openEndorseModal(s)}
                                                    className="h-8 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
                                                >
                                                    <UserCheck className="w-3.5 h-3.5 mr-1" />
                                                    <span>HOD Verify</span>
                                                </Button>

                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => toggleExpand(s.id)}
                                                    className="h-8 w-8 p-0 rounded-xl"
                                                >
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Strands / Topics Hierarchy */}
                                    {isExpanded && (
                                        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 space-y-4">
                                            {s.reviewer_feedback && (
                                                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs">
                                                    <span className="font-bold text-amber-900 block">HOD / Curriculum Dean Remarks:</span>
                                                    <p className="text-amber-800 mt-0.5 italic">{s.reviewer_feedback}</p>
                                                </div>
                                            )}

                                            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                                {is844 ? '8-4-4 KCSE Main Topics & Sub-Topic Lesson Plan' : 'KICD Strands & Sub-Strand Learning Outcomes'}
                                            </div>

                                            {strandsList.length === 0 ? (
                                                <p className="text-xs text-slate-400">No syllabus items defined yet.</p>
                                            ) : (
                                                strandsList.map((st, idx) => (
                                                    <div key={idx} className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-2">
                                                        <div className="font-bold text-xs text-slate-900 flex items-center gap-2">
                                                            <BookmarkCheck className={`w-4 h-4 ${is844 ? 'text-blue-600' : 'text-emerald-600'}`} />
                                                            <span>{st.name}</span>
                                                        </div>

                                                        <div className="divide-y divide-slate-100 pl-6">
                                                            {(st.sub_strands || []).map((sub, sIdx) => (
                                                                <div key={sIdx} className="py-2 flex items-center justify-between text-xs">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className={`w-2 h-2 rounded-full ${sub.covered ? (is844 ? 'bg-blue-500' : 'bg-emerald-500') : 'bg-slate-300'}`} />
                                                                        <span className={sub.covered ? 'line-through text-slate-400' : 'text-slate-700 font-medium'}>
                                                                            {sub.title}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-4 text-[11px] text-slate-500">
                                                                        <span>{sub.lessons_taught} / {sub.lessons_planned} Lessons</span>
                                                                        <span className={`font-bold px-2 py-0.5 rounded-full ${
                                                                            sub.covered 
                                                                                ? (is844 ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700')
                                                                                : 'bg-amber-50 text-amber-700'
                                                                        }`}>
                                                                            {sub.covered ? 'Covered' : 'Pending'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Create Scheme Modal */}
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogContent className="sm:max-w-xl rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900">
                                Register Curriculum Course Plan
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-2">
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Curriculum System *</Label>
                                    <Select value={createForm.data.curriculum_type} onValueChange={(v: any) => createForm.setData('curriculum_type', v)}>
                                        <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CBC">CBC (Competency-Based Curriculum)</SelectItem>
                                            <SelectItem value="8-4-4">8-4-4 (Secondary KCSE Cohort)</SelectItem>
                                            <SelectItem value="IGCSE">IGCSE (British Curriculum)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Class / Grade *</Label>
                                    <Select value={createForm.data.class_id} onValueChange={(v) => createForm.setData('class_id', v)}>
                                        <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select Class" /></SelectTrigger>
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
                                            {subjects.map((sb) => (
                                                <SelectItem key={sb.id} value={String(sb.id)}>{sb.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Term *</Label>
                                    <Select value={createForm.data.term} onValueChange={(v) => createForm.setData('term', v)}>
                                        <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Term 1">Term 1</SelectItem>
                                            <SelectItem value="Term 2">Term 2</SelectItem>
                                            <SelectItem value="Term 3">Term 3</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Scheme Title *</Label>
                                <Input
                                    value={createForm.data.title}
                                    onChange={(e) => createForm.setData('title', e.target.value)}
                                    placeholder={
                                        createForm.data.curriculum_type === '8-4-4'
                                            ? 'e.g. Form 4 Mathematics Term 2 KCSE Schemes of Work'
                                            : 'e.g. Grade 7 Mathematics Term 2 Curriculum Strands'
                                    }
                                    className="h-9 text-xs mt-1"
                                />
                            </div>

                            <DialogFooter className="gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="h-9 text-xs rounded-xl">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createForm.processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                                    Register Course Plan
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Pacing Modal */}
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogContent className="sm:max-w-3xl rounded-2xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900">
                                {editForm.data.curriculum_type === '8-4-4' ? 'Update 8-4-4 Topic Coverage & Lessons' : 'Update CBC Strands Pacing & Outcomes'}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleEditSubmit} className="space-y-4 pt-2">
                            <div>
                                <Label className="text-xs font-bold">Scheme Title</Label>
                                <Input
                                    value={editForm.data.title}
                                    onChange={(e) => editForm.setData('title', e.target.value)}
                                    className="h-9 text-xs mt-1"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-slate-900">
                                        {editForm.data.curriculum_type === '8-4-4' ? 'KCSE Topics & Sub-topics' : 'KICD Strands & Sub-Strands'}
                                    </span>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={addEditStrand}
                                        className="h-7 text-xs font-bold rounded-lg border-slate-200"
                                    >
                                        <Plus className="w-3 h-3 mr-1" /> {editForm.data.curriculum_type === '8-4-4' ? 'Add Topic' : 'Add Strand'}
                                    </Button>
                                </div>

                                {editForm.data.strands.map((strand, stIdx) => (
                                    <div key={stIdx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                                        <Input
                                            value={strand.name}
                                            onChange={(e) => {
                                                const updated = [...editForm.data.strands];
                                                updated[stIdx].name = e.target.value;
                                                editForm.setData('strands', updated);
                                            }}
                                            placeholder={editForm.data.curriculum_type === '8-4-4' ? 'Topic Title' : 'Strand Name'}
                                            className="h-8 text-xs font-bold bg-white"
                                        />

                                        <div className="space-y-2 pl-2">
                                            {strand.sub_strands.map((sub, sbIdx) => (
                                                <div key={sbIdx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-slate-200 text-xs">
                                                    <div className="sm:col-span-5">
                                                        <Input
                                                            value={sub.title}
                                                            onChange={(e) => updateEditSubStrand(stIdx, sbIdx, 'title', e.target.value)}
                                                            placeholder={editForm.data.curriculum_type === '8-4-4' ? 'Sub-topic objective' : 'Sub-strand outcome'}
                                                            className="h-7 text-xs"
                                                        />
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                        <Input
                                                            type="number"
                                                            value={sub.lessons_planned}
                                                            onChange={(e) => updateEditSubStrand(stIdx, sbIdx, 'lessons_planned', parseInt(e.target.value) || 0)}
                                                            placeholder="Planned"
                                                            className="h-7 text-xs font-mono"
                                                        />
                                                    </div>
                                                    <div className="sm:col-span-2">
                                                        <Input
                                                            type="number"
                                                            value={sub.lessons_taught}
                                                            onChange={(e) => updateEditSubStrand(stIdx, sbIdx, 'lessons_taught', parseInt(e.target.value) || 0)}
                                                            placeholder="Taught"
                                                            className="h-7 text-xs font-mono"
                                                        />
                                                    </div>
                                                    <div className="sm:col-span-2 flex items-center">
                                                        <label className="flex items-center gap-1 cursor-pointer text-[11px] font-semibold text-slate-700">
                                                            <input
                                                                type="checkbox"
                                                                checked={sub.covered}
                                                                onChange={(e) => updateEditSubStrand(stIdx, sbIdx, 'covered', e.target.checked)}
                                                                className={`rounded border-slate-300 ${editForm.data.curriculum_type === '8-4-4' ? 'text-blue-600' : 'text-emerald-600'}`}
                                                            />
                                                            <span>Covered</span>
                                                        </label>
                                                    </div>
                                                    <div className="sm:col-span-1 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeEditSubStrand(stIdx, sbIdx)}
                                                            className="text-red-500 hover:text-red-700 text-xs font-bold"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => addEditSubStrand(stIdx)}
                                                className={`h-6 text-[11px] font-bold ${editForm.data.curriculum_type === '8-4-4' ? 'text-blue-700 hover:text-blue-800' : 'text-emerald-700 hover:text-emerald-800'}`}
                                            >
                                                + {editForm.data.curriculum_type === '8-4-4' ? 'Add Sub-Topic' : 'Add Sub-Strand'}
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <DialogFooter className="gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setEditOpen(false)} className="h-9 text-xs rounded-xl">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={editForm.processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                                    Save Coverage Progress
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* HOD Endorsement Modal */}
                <Dialog open={endorseOpen} onOpenChange={setEndorseOpen}>
                    <DialogContent className="sm:max-w-md rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900">
                                Endorse Course Plan / Scheme of Work
                            </DialogTitle>
                        </DialogHeader>

                        {activeSyllabus && (
                            <form onSubmit={handleEndorseSubmit} className="space-y-4 pt-2">
                                <div className="p-3 rounded-xl bg-slate-50 text-xs">
                                    <div className="font-bold text-slate-900">{activeSyllabus.title}</div>
                                    <div className="text-slate-500">{activeSyllabus.school_class?.name} • {activeSyllabus.subject?.name} ({activeSyllabus.term})</div>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">HOD Verification Decision *</Label>
                                    <Select
                                        value={endorseForm.data.action}
                                        onValueChange={(v: any) => endorseForm.setData('action', v)}
                                    >
                                        <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="approved">Approve & Endorse Scheme</SelectItem>
                                            <SelectItem value="rejected">Return for Pedagogical Revision</SelectItem>
                                            <SelectItem value="submitted">Mark Pending Verification</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Reviewer Feedback & Remarks</Label>
                                    <Textarea
                                        rows={3}
                                        value={endorseForm.data.reviewer_feedback}
                                        onChange={(e) => endorseForm.setData('reviewer_feedback', e.target.value)}
                                        placeholder="Add comments on strand coverage, lesson pacing..."
                                        className="text-xs resize-none mt-1"
                                    />
                                </div>

                                <DialogFooter className="gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setEndorseOpen(false)} className="h-9 text-xs rounded-xl">
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={endorseForm.processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
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