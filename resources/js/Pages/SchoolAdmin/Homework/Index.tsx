import { useState } from 'react';
import { usePage, useForm, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    BookOpen, Plus, Pencil, Trash2, CheckCircle2, FileText, ClipboardList, Award, CheckSquare, Search, Download
} from 'lucide-react';
import type { PageProps, Staff } from '@/types';

interface ClassItem {
    id: number;
    name: string;
}

interface SubjectItem {
    id: number;
    name: string;
    code?: string;
    class_id?: number;
}

interface HomeworkItem {
    id: number;
    title: string;
    class_id: number;
    subject_id: number;
    teacher_id?: number;
    task_type: 'homework' | 'cbc_project' | 'practical_activity' | 'assignment';
    strand?: string;
    sub_strand?: string;
    total_points: number;
    due_date: string;
    description: string;
    attachment?: string;
    submissions_count?: number;
    graded_count?: number;
    school_class?: ClassItem;
    subject?: SubjectItem;
    teacher?: Staff;
}

interface SubmissionItem {
    id: number;
    student_id: number;
    homework_id: number;
    file?: string;
    text_response?: string;
    status: string;
    score?: number;
    performance_level?: 'EE' | 'ME' | 'AE' | 'BE';
    teacher_remarks?: string;
    created_at: string;
    student?: {
        id: number;
        first_name: string;
        last_name: string;
        admission_no: string;
        school_class?: { name: string };
    };
}

interface Props extends PageProps {
    homeworks: { data: HomeworkItem[]; current_page: number; last_page: number };
    classes: ClassItem[];
    subjects: SubjectItem[];
    teachers: Staff[];
    stats: {
        total_tasks: number;
        active_tasks: number;
        total_submissions: number;
        pending_grading: number;
    };
    filters: { class_id?: string; subject_id?: string; task_type?: string; search?: string };
}

export default function HomeworkIndex({
    homeworks,
    classes = [],
    subjects = [],
    teachers = [],
    stats,
    filters,
}: Props) {
    const { flash } = usePage<PageProps>().props;
    const [activeTab, setActiveTab] = useState<'tasks' | 'cbc_summary'>('tasks');

    // Modal States
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<HomeworkItem | null>(null);
    const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false);
    const [selectedTaskForSubmissions, setSelectedTaskForSubmissions] = useState<HomeworkItem | null>(null);
    const [submissionsList, setSubmissionsList] = useState<SubmissionItem[]>([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);

    // Grading Modal State
    const [gradingModalOpen, setGradingModalOpen] = useState(false);
    const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null);

    // Task Form
    const taskForm = useForm({
        class_id: classes.length > 0 ? String(classes[0].id) : '',
        subject_id: subjects.length > 0 ? String(subjects[0].id) : '',
        teacher_id: teachers.length > 0 ? String(teachers[0].id) : '',
        title: '',
        task_type: 'homework' as 'homework' | 'cbc_project' | 'practical_activity' | 'assignment',
        strand: '',
        sub_strand: '',
        total_points: 100,
        due_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        description: '',
        attachment: null as File | null,
    });

    // Grading Form
    const gradeForm = useForm({
        performance_level: 'ME' as 'EE' | 'ME' | 'AE' | 'BE',
        score: '80',
        teacher_remarks: '',
    });

    function openTaskCreate() {
        taskForm.reset();
        setEditingTask(null);
        setTaskModalOpen(true);
    }

    function openTaskEdit(item: HomeworkItem) {
        setEditingTask(item);
        taskForm.setData({
            class_id: String(item.class_id),
            subject_id: String(item.subject_id),
            teacher_id: item.teacher_id ? String(item.teacher_id) : '',
            title: item.title,
            task_type: item.task_type,
            strand: item.strand || '',
            sub_strand: item.sub_strand || '',
            total_points: Number(item.total_points || 100),
            due_date: item.due_date,
            description: item.description,
            attachment: null,
        });
        setTaskModalOpen(true);
    }

    function handleTaskSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingTask) {
            taskForm.put(`/school/homework/${editingTask.id}`, {
                onSuccess: () => { setTaskModalOpen(false); taskForm.reset(); },
            });
        } else {
            taskForm.post('/school/homework', {
                onSuccess: () => { setTaskModalOpen(false); taskForm.reset(); },
            });
        }
    }

    function handleTaskDelete(id: number) {
        if (confirm('Are you sure you want to delete this learning task?')) {
            router.delete(`/school/homework/${id}`);
        }
    }

    function viewSubmissions(task: HomeworkItem) {
        setSelectedTaskForSubmissions(task);
        setLoadingSubmissions(true);
        setSubmissionsModalOpen(true);

        fetch(`/school/homework/${task.id}/submissions`)
            .then(res => res.json())
            .then(data => {
                setSubmissionsList(data.submissions || []);
                setLoadingSubmissions(false);
            })
            .catch(() => setLoadingSubmissions(false));
    }

    function openGradingModal(submission: SubmissionItem) {
        setSelectedSubmission(submission);
        gradeForm.setData({
            performance_level: submission.performance_level || 'ME',
            score: submission.score ? String(submission.score) : '80',
            teacher_remarks: submission.teacher_remarks || '',
        });
        setGradingModalOpen(true);
    }

    function handleGradeSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!selectedSubmission) return;
        gradeForm.post(`/school/homework/submissions/${selectedSubmission.id}/grade`, {
            preserveScroll: true,
            onSuccess: () => {
                setGradingModalOpen(false);
                if (selectedTaskForSubmissions) {
                    viewSubmissions(selectedTaskForSubmissions);
                }
            },
        });
    }

    function getLevelBadge(level?: string) {
        switch (level) {
            case 'EE':
                return <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 font-bold">EE • Exceeding Expectations</Badge>;
            case 'ME':
                return <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 font-bold">ME • Meeting Expectations</Badge>;
            case 'AE':
                return <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200 font-bold">AE • Approaching Expectations</Badge>;
            case 'BE':
                return <Badge variant="outline" className="bg-red-50 text-red-800 border-red-200 font-bold">BE • Below Expectations</Badge>;
            default:
                return <Badge variant="outline" className="bg-slate-100 text-slate-600 font-bold">Ungraded</Badge>;
        }
    }

    return (
        <AppLayout title="Learning Tasks, CBC Assignments & Homework">
            <div className="space-y-6 max-w-7xl mx-auto pb-16">
                {/* Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-indigo-600" />
                            <span>CBC Learning Tasks & Homework Hub</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Curriculum competency tasks, strand assignments, digital submissions, and formative rubric assessments.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button onClick={openTaskCreate} className="h-9 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-2xs flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Create Learning Task
                        </Button>
                    </div>
                </div>

                {flash?.success && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-800 font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Learning Tasks</span>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.total_tasks ?? 0}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active / Pending Due</span>
                        <p className="text-2xl font-bold text-indigo-600 mt-1">{stats?.active_tasks ?? 0}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Student Submissions</span>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">{stats?.total_submissions ?? 0}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Awaiting CBC Grading</span>
                        <p className="text-2xl font-bold text-amber-600 mt-1">{stats?.pending_grading ?? 0}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                    <div className="w-64">
                        <Input
                            value={filters?.search ?? ''}
                            onChange={e => router.get('/school/homework', { ...filters, search: e.target.value || undefined }, { preserveState: true })}
                            placeholder="Search task title or strand..."
                            className="h-9 text-xs"
                        />
                    </div>
                    <div className="w-48">
                        <Select
                            value={filters?.class_id ?? 'all'}
                            onValueChange={v => router.get('/school/homework', { ...filters, class_id: v === 'all' ? undefined : v }, { preserveState: true })}
                        >
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Classes" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Classes</SelectItem>
                                {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="w-48">
                        <Select
                            value={filters?.task_type ?? 'all'}
                            onValueChange={v => router.get('/school/homework', { ...filters, task_type: v === 'all' ? undefined : v }, { preserveState: true })}
                        >
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Task Types" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Task Types</SelectItem>
                                <SelectItem value="homework">Standard Homework</SelectItem>
                                <SelectItem value="cbc_project">CBC Integrated Project</SelectItem>
                                <SelectItem value="practical_activity">Practical Activity</SelectItem>
                                <SelectItem value="assignment">Written Assignment</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Tasks Table */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Task Title & Strand</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Class & Learning Area</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Task Type</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Teacher</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Due Date</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Submissions</TableHead>
                                <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="font-medium text-xs divide-y divide-slate-100">
                            {homeworks.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-16 text-slate-400">
                                        No homework assignments or CBC tasks found for the selected criteria.
                                    </TableCell>
                                </TableRow>
                            ) : homeworks.data.map(item => {
                                const isPastDue = new Date(item.due_date) < new Date();
                                return (
                                    <TableRow key={item.id} className="hover:bg-slate-50/50">
                                        <TableCell className="py-3.5 px-4">
                                            <p className="font-bold text-slate-900">{item.title}</p>
                                            {item.strand && (
                                                <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                                                    Strand: {item.strand} {item.sub_strand ? `› ${item.sub_strand}` : ''}
                                                </p>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4">
                                            <p className="font-bold text-slate-800">{item.school_class?.name ?? '—'}</p>
                                            <p className="text-[10px] text-slate-400">{item.subject?.name ?? '—'}</p>
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4">
                                            <Badge variant="outline" className="capitalize text-[10px] font-bold bg-slate-50 text-slate-700 border-slate-200">
                                                {item.task_type.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 text-slate-700">
                                            {item.teacher ? `${item.teacher.first_name} ${item.teacher.last_name}` : '—'}
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 font-mono">
                                            <span className={isPastDue ? 'text-red-600 font-bold' : 'text-slate-600'}>
                                                {item.due_date}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => viewSubmissions(item)}
                                                className="h-7 px-2 text-xs font-bold rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                            >
                                                <ClipboardList className="w-3.5 h-3.5 mr-1" />
                                                {item.submissions_count ?? 0} Submissions
                                            </Button>
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button size="sm" variant="outline" onClick={() => openTaskEdit(item)} className="h-7 px-2 text-xs font-bold rounded-lg border-slate-200">
                                                    <Pencil className="w-3 h-3 mr-1" /> Edit
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => handleTaskDelete(item.id)} className="h-7 w-7 p-0 text-red-500 hover:text-red-700 rounded-lg">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* MODAL 1: CREATE / EDIT TASK */}
            <Dialog open={taskModalOpen} onOpenChange={setTaskModalOpen}>
                <DialogContent className="sm:max-w-xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900">
                            {editingTask ? 'Edit Learning Task' : 'Create CBC Learning Task / Homework'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleTaskSubmit} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Class / Grade *</Label>
                                <Select value={taskForm.data.class_id} onValueChange={v => taskForm.setData('class_id', v)}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select class..." /></SelectTrigger>
                                    <SelectContent>
                                        {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Learning Area / Subject *</Label>
                                <Select value={taskForm.data.subject_id} onValueChange={v => taskForm.setData('subject_id', v)}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select subject..." /></SelectTrigger>
                                    <SelectContent>
                                        {subjects.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.code || 'Sub'})</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Task Title *</Label>
                                <Input value={taskForm.data.title} onChange={e => taskForm.setData('title', e.target.value)} placeholder="e.g. Soil Texture Investigation" className="h-9 text-xs mt-1" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Task Type *</Label>
                                <Select value={taskForm.data.task_type} onValueChange={(v: any) => taskForm.setData('task_type', v)}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="homework">Standard Homework</SelectItem>
                                        <SelectItem value="cbc_project">CBC Integrated Project</SelectItem>
                                        <SelectItem value="practical_activity">Practical Activity</SelectItem>
                                        <SelectItem value="assignment">Written Assignment</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">CBC Strand</Label>
                                <Input value={taskForm.data.strand} onChange={e => taskForm.setData('strand', e.target.value)} placeholder="e.g. Living Things" className="h-9 text-xs mt-1" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Sub-Strand / Learning Outcome</Label>
                                <Input value={taskForm.data.sub_strand} onChange={e => taskForm.setData('sub_strand', e.target.value)} placeholder="e.g. Plants Structure" className="h-9 text-xs mt-1" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Assigned Teacher</Label>
                                <Select value={taskForm.data.teacher_id} onValueChange={v => taskForm.setData('teacher_id', v)}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select teacher..." /></SelectTrigger>
                                    <SelectContent>
                                        {teachers.map(t => <SelectItem key={t.id} value={String(t.id)}>{t.first_name} {t.last_name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Due Date *</Label>
                                <Input type="date" value={taskForm.data.due_date} onChange={e => taskForm.setData('due_date', e.target.value)} className="h-9 text-xs mt-1 font-mono" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Total Max Score</Label>
                                <Input type="number" value={taskForm.data.total_points} onChange={e => taskForm.setData('total_points', Number(e.target.value))} className="h-9 text-xs mt-1 font-mono" />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-bold">Instructions & Description *</Label>
                            <Textarea
                                rows={3}
                                value={taskForm.data.description}
                                onChange={e => taskForm.setData('description', e.target.value)}
                                placeholder="Describe the task instructions, guiding questions, or portfolio expectations..."
                                className="text-xs resize-none mt-1"
                            />
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setTaskModalOpen(false)} className="h-9 text-xs rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={taskForm.processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">Save Task</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 2: SUBMISSIONS & CBC ASSESSMENT GRADEBOOK */}
            <Dialog open={submissionsModalOpen} onOpenChange={setSubmissionsModalOpen}>
                <DialogContent className="sm:max-w-3xl rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900">
                            Submissions & Assessment: {selectedTaskForSubmissions?.title}
                        </DialogTitle>
                    </DialogHeader>

                    {loadingSubmissions ? (
                        <div className="py-12 text-center text-xs text-slate-400">Loading student submissions...</div>
                    ) : submissionsList.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400">No student submissions recorded for this assignment yet.</div>
                    ) : (
                        <div className="max-h-[60vh] overflow-y-auto space-y-3 pt-2">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-2.5 px-3">Student</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-2.5 px-3">Submission Details</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-2.5 px-3">CBC Rubric Level</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-2.5 px-3">Score</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-2.5 px-3 text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="text-xs divide-y divide-slate-100 font-medium">
                                    {submissionsList.map(sub => (
                                        <TableRow key={sub.id} className="hover:bg-slate-50/50">
                                            <TableCell className="py-2.5 px-3 font-bold text-slate-900">
                                                {sub.student?.first_name} {sub.student?.last_name}
                                                <div className="text-[10px] font-mono text-slate-400">Adm: {sub.student?.admission_no}</div>
                                            </TableCell>
                                            <TableCell className="py-2.5 px-3">
                                                {sub.text_response ? (
                                                    <p className="text-xs text-slate-700 line-clamp-2">{sub.text_response}</p>
                                                ) : sub.file ? (
                                                    <span className="text-xs font-mono text-indigo-600">Attached File Submission</span>
                                                ) : (
                                                    <span className="text-xs text-slate-400">No content attached</span>
                                                )}
                                                {sub.teacher_remarks && (
                                                    <p className="text-[10px] text-slate-500 italic mt-0.5">Remarks: {sub.teacher_remarks}</p>
                                                )}
                                            </TableCell>
                                            <TableCell className="py-2.5 px-3">
                                                {getLevelBadge(sub.performance_level)}
                                            </TableCell>
                                            <TableCell className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                                {sub.score !== null && sub.score !== undefined ? `${sub.score}` : '—'}
                                            </TableCell>
                                            <TableCell className="py-2.5 px-3 text-right">
                                                <Button
                                                    size="sm"
                                                    onClick={() => openGradingModal(sub)}
                                                    className="h-7 px-3 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                                                >
                                                    <Award className="w-3.5 h-3.5 mr-1" /> Assess
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* MODAL 3: GRADE SUBMISSION (CBC 4-LEVEL RUBRIC) */}
            <Dialog open={gradingModalOpen} onOpenChange={setGradingModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900">
                            CBC Competency Assessment Rubric
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleGradeSubmit} className="space-y-4 pt-2">
                        <div className="p-3 bg-slate-50 rounded-xl text-xs">
                            <span className="font-bold text-slate-900">{selectedSubmission?.student?.first_name} {selectedSubmission?.student?.last_name}</span>
                            <span className="text-slate-400 block font-mono">Adm: {selectedSubmission?.student?.admission_no}</span>
                        </div>

                        <div>
                            <Label className="text-xs font-bold">CBC Competency Level *</Label>
                            <Select value={gradeForm.data.performance_level} onValueChange={(v: any) => gradeForm.setData('performance_level', v)}>
                                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EE">Exceeding Expectations (EE)</SelectItem>
                                    <SelectItem value="ME">Meeting Expectations (ME)</SelectItem>
                                    <SelectItem value="AE">Approaching Expectations (AE)</SelectItem>
                                    <SelectItem value="BE">Below Expectations (BE)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs font-bold">Numerical Score (Optional)</Label>
                            <Input type="number" step="0.1" value={gradeForm.data.score} onChange={e => gradeForm.setData('score', e.target.value)} className="h-9 text-xs mt-1 font-mono" />
                        </div>

                        <div>
                            <Label className="text-xs font-bold">Formative Teacher Remarks</Label>
                            <Textarea
                                rows={3}
                                value={gradeForm.data.teacher_remarks}
                                onChange={e => gradeForm.setData('teacher_remarks', e.target.value)}
                                placeholder="Constructive feedback on skill acquisition and core competency demonstration..."
                                className="text-xs resize-none mt-1"
                            />
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setGradingModalOpen(false)} className="h-9 text-xs rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={gradeForm.processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">Save Assessment</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}