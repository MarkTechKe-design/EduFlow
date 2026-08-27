import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps, AcademicYear, SchoolClass, Section } from '@/Types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { ArrowLeft, Plus, Trash2, Layers, BookOpen } from 'lucide-react';

interface SubjectItem {
    id: number;
    class_id: number;
    name: string;
    code?: string | null;
    type: string;
}

interface Props extends PageProps {
    academicYears: AcademicYear[];
    classes: (SchoolClass & { sections?: Section[] })[];
    subjects: SubjectItem[];
}

export default function CreateCbcAssessment({ auth, academicYears = [], classes = [], subjects = [] }: Props) {
    const activeYear = academicYears.find((y) => y.is_current) || academicYears[0];

    const { data, setData, post, processing, errors } = useForm({
        academic_year_id: activeYear ? String(activeYear.id) : '',
        term: 'Term 1',
        class_id: '',
        section_id: '',
        subject_id: '',
        title: '',
        type: 'formative_task',
        assessment_date: new Date().toISOString().split('T')[0],
        description: '',
        strands: [
            { strand_name: '', sub_strand: '', specific_learning_outcome: '' },
        ],
    });

    const selectedClass = classes.find((c) => String(c.id) === String(data.class_id));
    const availableSections = selectedClass?.sections || [];
    const availableSubjects = subjects.filter((s) => String(s.class_id) === String(data.class_id));

    const addStrand = () => {
        setData('strands', [
            ...data.strands,
            { strand_name: '', sub_strand: '', specific_learning_outcome: '' },
        ]);
    };

    const removeStrand = (index: number) => {
        if (data.strands.length === 1) return;
        setData('strands', data.strands.filter((_, i) => i !== index));
    };

    const updateStrand = (index: number, field: string, value: string) => {
        const updated = [...data.strands];
        (updated[index] as any)[field] = value;
        setData('strands', updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/school/cbc-assessments');
    };

    return (
        <AppLayout header="Create CBC Assessment">
            <Head title="Create CBC Assessment - EduFlow" />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <Link
                        href="/school/cbc-assessments"
                        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 mb-1"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                        Back to CBC Directory
                    </Link>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                        Create Assessment Activity
                    </h1>
                    <p className="text-xs text-slate-500">
                        Define curriculum strands, sub-strands, and specific learning outcomes for rubric evaluation.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Activity Overview Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
                        <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                1. Assessment Context & Schedule
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <Label className="text-xs">Academic Session *</Label>
                                <Select value={data.academic_year_id} onValueChange={(val) => setData('academic_year_id', val)}>
                                    <SelectTrigger className="h-9 mt-1 text-xs"><SelectValue placeholder="Academic Year" /></SelectTrigger>
                                    <SelectContent>
                                        {academicYears.map((y) => (
                                            <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs">Term *</Label>
                                <Select value={data.term} onValueChange={(val) => setData('term', val)}>
                                    <SelectTrigger className="h-9 mt-1 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Term 1">Term 1</SelectItem>
                                        <SelectItem value="Term 2">Term 2</SelectItem>
                                        <SelectItem value="Term 3">Term 3</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs">Assessment Date *</Label>
                                <Input
                                    type="date"
                                    value={data.assessment_date}
                                    onChange={(e) => setData('assessment_date', e.target.value)}
                                    className="h-9 mt-1 text-xs"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                            <div>
                                <Label className="text-xs">Class / Grade *</Label>
                                <Select
                                    value={data.class_id}
                                    onValueChange={(val) => {
                                        setData((prev) => ({ ...prev, class_id: val, section_id: '', subject_id: '' }));
                                    }}
                                >
                                    <SelectTrigger className="h-9 mt-1 text-xs"><SelectValue placeholder="Select Class" /></SelectTrigger>
                                    <SelectContent>
                                        {classes.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.class_id && <p className="text-[11px] text-rose-500 mt-1">{errors.class_id}</p>}
                            </div>

                            <div>
                                <Label className="text-xs">Stream / Section</Label>
                                <Select
                                    value={data.section_id}
                                    onValueChange={(val) => setData('section_id', val)}
                                    disabled={!data.class_id || availableSections.length === 0}
                                >
                                    <SelectTrigger className="h-9 mt-1 text-xs">
                                        <SelectValue placeholder={availableSections.length === 0 ? 'All Streams' : 'Select Stream'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">All Streams</SelectItem>
                                        {availableSections.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs">Learning Area (Subject) *</Label>
                                <Select
                                    value={data.subject_id}
                                    onValueChange={(val) => setData('subject_id', val)}
                                    disabled={!data.class_id || availableSubjects.length === 0}
                                >
                                    <SelectTrigger className="h-9 mt-1 text-xs">
                                        <SelectValue placeholder={!data.class_id ? 'Select Class first' : (availableSubjects.length === 0 ? 'No subjects found' : 'Select Learning Area')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableSubjects.map((sub) => (
                                            <SelectItem key={sub.id} value={String(sub.id)}>{sub.name} {sub.code ? `(${sub.code})` : ''}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.subject_id && <p className="text-[11px] text-rose-500 mt-1">{errors.subject_id}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                            <div className="sm:col-span-2">
                                <Label className="text-xs">Activity Title *</Label>
                                <Input
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="e.g. Mid-Term 1 Numbers & Operations Assessment"
                                    className="h-9 mt-1 text-xs"
                                    required
                                />
                                {errors.title && <p className="text-[11px] text-rose-500 mt-1">{errors.title}</p>}
                            </div>

                            <div>
                                <Label className="text-xs">Assessment Type *</Label>
                                <Select value={data.type} onValueChange={(val) => setData('type', val as any)}>
                                    <SelectTrigger className="h-9 mt-1 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="formative_task">Formative Task / Continuous</SelectItem>
                                        <SelectItem value="summative_term">Summative End of Term</SelectItem>
                                        <SelectItem value="project_work">Project / Practical Activity</SelectItem>
                                        <SelectItem value="knec_cba">Official KNEC CBA Upload</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs">Description / Teacher Instructions</Label>
                            <Input
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Optional instructions or context for the assessment activity"
                                className="h-9 mt-1 text-xs"
                            />
                        </div>
                    </div>

                    {/* Strands & Specific Learning Outcomes Builder */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div>
                                <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                    2. Strands & Specific Learning Outcomes
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Define each competency strand evaluated in this assessment activity.
                                </p>
                            </div>

                            <Button type="button" onClick={addStrand} size="sm" variant="outline" className="h-8 text-xs font-semibold">
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                Add Strand
                            </Button>
                        </div>

                        <div className="space-y-4">
                            {data.strands.map((strand, index) => (
                                <div
                                    key={index}
                                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                            Strand #{index + 1}
                                        </span>
                                        {data.strands.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeStrand(index)}
                                                className="text-slate-400 hover:text-rose-500 text-xs flex items-center"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-xs">Curriculum Strand *</Label>
                                            <Input
                                                value={strand.strand_name}
                                                onChange={(e) => updateStrand(index, 'strand_name', e.target.value)}
                                                placeholder="e.g. Numbers, Algebra, Measurement"
                                                className="h-9 mt-1 text-xs"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <Label className="text-xs">Sub-Strand</Label>
                                            <Input
                                                value={strand.sub_strand}
                                                onChange={(e) => updateStrand(index, 'sub_strand', e.target.value)}
                                                placeholder="e.g. Addition with regrouping, Fractions"
                                                className="h-9 mt-1 text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-xs">Specific Learning Outcome / Competency Target</Label>
                                        <Input
                                            value={strand.specific_learning_outcome}
                                            onChange={(e) => updateStrand(index, 'specific_learning_outcome', e.target.value)}
                                            placeholder="e.g. Learner is able to accurately sum two-digit numbers with regrouping"
                                            className="h-9 mt-1 text-xs"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3">
                        <Link href="/school/cbc-assessments">
                            <Button type="button" variant="outline" className="h-9 text-xs">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing} className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6">
                            {processing ? 'Saving Activity...' : 'Create & Proceed to Score Sheet'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}