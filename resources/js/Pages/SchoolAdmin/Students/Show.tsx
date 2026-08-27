import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps, Student, SchoolClass, AcademicYear, Section, StudentGuardian, StudentMedicalProfile } from '@/Types';
import { Button } from '@/Components/ui/button';
import { formatDate, toInputDate } from '@/lib/utils';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import {
    Activity,
    AlertCircle,
    ArrowLeft,
    ArrowUpRight,
    Check,
    CheckCircle2,
    Edit,
    FileText,
    GraduationCap,
    HeartPulse,
    History,
    Mail,
    MapPin,
    Phone,
    Plus,
    Printer,
    Shield,
    ShieldAlert,
    User,
    UserPlus,
    Users,
    X
} from 'lucide-react';

interface Props extends PageProps {
    student: Student & {
        student_guardians?: StudentGuardian[];
        medical_profile?: StudentMedicalProfile | null;
    };
    classes: (SchoolClass & { sections?: Section[] })[];
    academicYears: AcademicYear[];
}

export default function ShowStudent({ auth, student, classes = [], academicYears = [] }: Props) {
    const [tab, setTab] = useState<'academic' | 'personal' | 'guardian' | 'medical' | 'documents'>('academic');
    const [showProgressionModal, setShowProgressionModal] = useState(false);
    const [showGuardianModal, setShowGuardianModal] = useState(false);
    const [showMedicalModal, setShowMedicalModal] = useState(false);

    const activeYearName = academicYears.find((y) => y.is_current)?.name ?? (academicYears[0]?.name || '2026');
    const activeYearId = academicYears.find((y) => y.is_current)?.id ?? (academicYears[0]?.id || null);

    // Progression Form
    const progressionForm = useForm({
        action: 'promote',
        academic_year_id: activeYearId,
        academic_year: activeYearName,
        term: 'Term 1',
        class_id: student.class_id ? String(student.class_id) : '',
        section_id: student.section_id ? String(student.section_id) : '',
        roll_no: student.roll_no || '',
        effective_date: new Date().toISOString().split('T')[0],
        remarks: '',
    });

    // Guardian Attachment Form
    const guardianForm = useForm({
        name: '',
        relation: 'Mother',
        phone: '',
        email: '',
        address: '',
        is_primary: false,
        has_legal_custody: true,
        receives_sms_notifications: true,
        receives_report_cards: true,
        emergency_priority: 2,
    });

    // Medical Profile Form
    const medProfile = student.medical_profile;
    const medicalForm = useForm({
        blood_group: medProfile?.blood_group || student.blood_group || '',
        sha_nhif_no: medProfile?.sha_nhif_no || '',
        allergies: medProfile?.allergies || '',
        chronic_conditions: medProfile?.chronic_conditions || '',
        emergency_medication: medProfile?.emergency_medication || '',
        dietary_restrictions: medProfile?.dietary_restrictions || '',
        preferred_hospital: medProfile?.preferred_hospital || '',
        doctor_name: medProfile?.doctor_name || '',
        doctor_phone: medProfile?.doctor_phone || '',
        special_instructions: medProfile?.special_instructions || student.medical_info || '',
    });

    const selectedClass = classes.find((c) => String(c.id) === String(progressionForm.data.class_id));
    const availableSections = selectedClass?.sections || [];

    const handleProgressionSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        progressionForm.post(`/school/students/${student.id}/progression`, {
            onSuccess: () => {
                setShowProgressionModal(false);
                progressionForm.reset();
            },
        });
    };

    const handleGuardianSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        guardianForm.post(`/school/students/${student.id}/guardians`, {
            onSuccess: () => {
                setShowGuardianModal(false);
                guardianForm.reset();
            },
        });
    };

    const handleMedicalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        medicalForm.post(`/school/students/${student.id}/medical`, {
            onSuccess: () => {
                setShowMedicalModal(false);
            },
        });
    };

    const statusBadgeVariant = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200';
            case 'promoted':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200';
            case 'repeated':
                return 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200';
            case 'transferred':
            case 'transferred_out':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200';
            case 'completed':
            case 'graduated':
                return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300 border-indigo-200';
            default:
                return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200';
        }
    };

    const fullName = student.full_name || [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ');
    const enrollments = student.enrollments || [];
    const studentGuardians = student.student_guardians || [];

    return (
        <AppLayout header="Student Profile">
            <Head title={`${fullName} - Student Profile`} />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href="/school/students"
                        className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                        Back to Student Directory
                    </Link>

                    <div className="flex items-center gap-2">
                        <Button
                            onClick={() => setShowProgressionModal(true)}
                            size="sm"
                            className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                        >
                            <ArrowUpRight className="w-3.5 h-3.5 mr-1.5" />
                            Record Progression
                        </Button>

                        <a
                            href={`/school/students/print?class_id=${student.class_id || ''}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button variant="outline" size="sm" className="h-9 text-xs">
                                <Printer className="w-3.5 h-3.5 mr-1.5" />
                                Print Roster
                            </Button>
                        </a>

                        <Link href={`/school/students/${student.id}/edit`}>
                            <Button variant="outline" size="sm" className="h-9 text-xs">
                                <Edit className="w-3.5 h-3.5 mr-1.5" />
                                Edit Student
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Profile Header */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center text-xl font-bold text-slate-700 dark:text-slate-300 overflow-hidden flex-shrink-0">
                                {student.photo ? (
                                    <img src={`/storage/${student.photo}`} alt={fullName} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{(student.first_name?.[0] || '') + (student.last_name?.[0] || '')}</span>
                                )}
                            </div>

                            <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">{fullName}</h1>
                                    <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold capitalize ${statusBadgeVariant(student.status)}`}>
                                        {student.status}
                                    </span>
                                    {student.admission_type && (
                                        <span className="text-xs px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium capitalize">
                                            {student.admission_type.replace('_', ' ')}
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-4 text-xs text-slate-500 dark:text-slate-400">
                                    <span>Adm No: <strong className="text-slate-900 dark:text-white font-mono">{student.admission_no}</strong></span>
                                    {student.nemis_upi && <span>UPI: <strong className="font-mono">{student.nemis_upi}</strong></span>}
                                    {student.birth_certificate_no && <span>Birth Cert: <strong className="font-mono">{student.birth_certificate_no}</strong></span>}
                                </div>

                                <div className="text-xs text-slate-600 dark:text-slate-300 pt-0.5">
                                    Active Placement: <strong className="text-slate-900 dark:text-white">{student.school_class?.name ?? student.class?.name ?? 'Unassigned'}</strong>
                                    {student.section && <span> &bull; Stream: <strong className="text-slate-900 dark:text-white">{student.section.name}</strong></span>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="border-b border-slate-200 dark:border-slate-800 flex gap-4 overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setTab('academic')}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            tab === 'academic'
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <GraduationCap className="w-4 h-4" />
                        Academic Progression ({enrollments.length})
                    </button>

                    <button
                        type="button"
                        onClick={() => setTab('guardian')}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            tab === 'guardian'
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <Users className="w-4 h-4" />
                        Guardian Network ({studentGuardians.length})
                    </button>

                    <button
                        type="button"
                        onClick={() => setTab('medical')}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            tab === 'medical'
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <HeartPulse className="w-4 h-4" />
                        Medical & Health (ODPC)
                    </button>

                    <button
                        type="button"
                        onClick={() => setTab('personal')}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            tab === 'personal'
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <User className="w-4 h-4" />
                        Civil Identity
                    </button>

                    <button
                        type="button"
                        onClick={() => setTab('documents')}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            tab === 'documents'
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        <FileText className="w-4 h-4" />
                        Documents ({student.documents?.length || 0})
                    </button>
                </div>

                {/* TAB 1: Academic Progression */}
                {tab === 'academic' && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                    Academic Progression & Term Ledger
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Historical ledger of academic years, terms, classes, streams, and administrative transitions.
                                </p>
                            </div>

                            <Button
                                onClick={() => setShowProgressionModal(true)}
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs font-semibold"
                            >
                                <Plus className="w-3.5 h-3.5 mr-1" />
                                Add Transition
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                                        <th className="py-2.5 px-3">#</th>
                                        <th className="py-2.5 px-3">Academic Year</th>
                                        <th className="py-2.5 px-3">Term</th>
                                        <th className="py-2.5 px-3">Class / Grade</th>
                                        <th className="py-2.5 px-3">Stream</th>
                                        <th className="py-2.5 px-3">Period</th>
                                        <th className="py-2.5 px-3">Status</th>
                                        <th className="py-2.5 px-3">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                                    {enrollments.length > 0 ? (
                                        enrollments.map((enr, idx) => {
                                            const yearName = typeof enr.academic_year === 'object' && enr.academic_year !== null
                                                ? (enr.academic_year as any)?.name ?? '2026'
                                                : (enr.academic_year || (enr as any).academic_year_relation?.name || '2026');

                                            return (
                                                <tr key={enr.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="py-3 px-3 font-semibold text-slate-400">{idx + 1}</td>
                                                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{yearName}</td>
                                                    <td className="py-3 px-3 font-medium">{enr.term || 'Term 1'}</td>
                                                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                                                        {enr.school_class?.name || 'Unassigned'}
                                                    </td>
                                                    <td className="py-3 px-3">{enr.section?.name || 'General'}</td>
                                                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                                                        {formatDate(enr.start_date)} {enr.end_date ? `to ${enr.end_date}` : ''}
                                                    </td>
                                                    <td className="py-3 px-3">
                                                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-semibold capitalize ${statusBadgeVariant(enr.status)}`}>
                                                            {enr.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                                                        {enr.remarks || '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={8} className="py-8 text-center text-slate-500">
                                                No progression history recorded for this student.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB 2: Guardian Network */}
                {tab === 'guardian' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                    Learner Guardian Network
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Normalized parent, guardian, and sponsor contacts with explicit custody and emergency priority levels.
                                </p>
                            </div>
                            <Button
                                onClick={() => setShowGuardianModal(true)}
                                size="sm"
                                className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                            >
                                <UserPlus className="w-3.5 h-3.5 mr-1" />
                                Attach Guardian
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {studentGuardians.length > 0 ? (
                                studentGuardians.map((sg) => {
                                    const g = sg.guardian;
                                    return (
                                        <div
                                            key={sg.id}
                                            className={`bg-white dark:bg-slate-900 rounded-xl border p-5 space-y-3 shadow-sm ${
                                                sg.is_primary ? 'border-indigo-300 dark:border-indigo-800' : 'border-slate-200 dark:border-slate-800'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                                                            {g?.name || 'Guardian'}
                                                        </h3>
                                                        {sg.is_primary && (
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800">
                                                                Primary
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-500 font-medium">
                                                        Relationship: <strong className="text-slate-700 dark:text-slate-300">{sg.relationship_type || g?.relation || 'Parent'}</strong>
                                                    </div>
                                                </div>

                                                <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-slate-600 dark:text-slate-400">
                                                    Priority #{sg.emergency_priority}
                                                </span>
                                            </div>

                                            <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-2">
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                                                    <span className="font-mono">{g?.phone || 'No phone'}</span>
                                                </div>
                                                {g?.email && (
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>{g.email}</span>
                                                    </div>
                                                )}
                                                {g?.address && (
                                                    <div className="flex items-center gap-2">
                                                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>{g.address}</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                                                {sg.has_legal_custody && (
                                                    <span className="inline-flex items-center text-emerald-700 dark:text-emerald-400 font-medium">
                                                        <Check className="w-3 h-3 mr-1" /> Legal Custody
                                                    </span>
                                                )}
                                                {sg.receives_sms_notifications && (
                                                    <span className="inline-flex items-center text-blue-700 dark:text-blue-400 font-medium">
                                                        <Check className="w-3 h-3 mr-1" /> SMS Alerts
                                                    </span>
                                                )}
                                                {sg.receives_report_cards && (
                                                    <span className="inline-flex items-center text-purple-700 dark:text-purple-400 font-medium">
                                                        <Check className="w-3 h-3 mr-1" /> Report Cards
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-2 py-8 text-center text-xs text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                                    No normalized guardians attached to this student record.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 3: ODPC Medical Profile */}
                {tab === 'medical' && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-5">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                        Sensitive Medical & Health Profile
                                    </h2>
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
                                        ODPC Protected
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Confidential health data isolated under Kenya Data Protection Act standards for emergency care.
                                </p>
                            </div>

                            <Button
                                onClick={() => setShowMedicalModal(true)}
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs font-semibold"
                            >
                                <Edit className="w-3.5 h-3.5 mr-1" />
                                Edit Medical Info
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                                <span className="text-xs text-slate-500 font-semibold uppercase">Blood Group</span>
                                <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                                    {medProfile?.blood_group || student.blood_group || 'Not Recorded'}
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                                <span className="text-xs text-slate-500 font-semibold uppercase">SHA / NHIF Number</span>
                                <div className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1">
                                    {medProfile?.sha_nhif_no || 'Not Linked'}
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                                <span className="text-xs text-slate-500 font-semibold uppercase">Preferred Hospital</span>
                                <div className="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate">
                                    {medProfile?.preferred_hospital || 'General Hospital'}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Known Allergies</Label>
                                    <div className="mt-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200">
                                        {medProfile?.allergies || 'No known allergies recorded.'}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Chronic Conditions</Label>
                                    <div className="mt-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200">
                                        {medProfile?.chronic_conditions || 'None reported.'}
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Emergency Medication</Label>
                                    <div className="mt-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200">
                                        {medProfile?.emergency_medication || 'None required.'}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Physician / Doctor Contact</Label>
                                    <div className="mt-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                                        <div className="font-semibold text-slate-900 dark:text-white">
                                            {medProfile?.doctor_name || 'No designated physician'}
                                        </div>
                                        <div className="text-slate-500 font-mono">
                                            {medProfile?.doctor_phone || 'No direct telephone'}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Special Nursing / Care Instructions</Label>
                                    <div className="mt-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200">
                                        {medProfile?.special_instructions || student.medical_info || 'Standard school healthcare protocol applies.'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: Civil Identity */}
                {tab === 'personal' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                                Identity & Civil Registry
                            </h2>
                            <dl className="grid grid-cols-2 gap-y-3 text-xs">
                                <dt className="text-slate-500">First Name</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white">{student.first_name || '-'}</dd>

                                <dt className="text-slate-500">Middle Name</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white">{student.middle_name || '-'}</dd>

                                <dt className="text-slate-500">Last Name</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white">{student.last_name || '-'}</dd>

                                <dt className="text-slate-500">Gender</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white capitalize">{student.gender || '-'}</dd>

                                <dt className="text-slate-500">Date of Birth</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white">{formatDate(student.date_of_birth || student.dob)}</dd>

                                <dt className="text-slate-500">Birth Certificate No</dt>
                                <dd className="font-semibold font-mono text-slate-900 dark:text-white">{student.birth_certificate_no || '-'}</dd>

                                <dt className="text-slate-500">Nationality</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white">{student.nationality || 'Kenyan'}</dd>
                            </dl>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                                Official Identifiers & Metadata
                            </h2>
                            <dl className="grid grid-cols-2 gap-y-3 text-xs">
                                <dt className="text-slate-500">Admission Number</dt>
                                <dd className="font-semibold font-mono text-slate-900 dark:text-white">{student.admission_no}</dd>

                                <dt className="text-slate-500">NEMIS UPI</dt>
                                <dd className="font-semibold font-mono text-slate-900 dark:text-white">{student.nemis_upi || '-'}</dd>

                                <dt className="text-slate-500">KNEC Assessment No</dt>
                                <dd className="font-semibold font-mono text-slate-900 dark:text-white">{student.assessment_no || '-'}</dd>

                                <dt className="text-slate-500">Admission Date</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white">{formatDate(student.admission_date)}</dd>

                                <dt className="text-slate-500">Admission Type</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white capitalize">{student.admission_type || 'New'}</dd>

                                <dt className="text-slate-500">Previous School</dt>
                                <dd className="font-semibold text-slate-900 dark:text-white">{student.previous_school || '-'}</dd>
                            </dl>
                        </div>
                    </div>
                )}

                {/* TAB 5: Documents */}
                {tab === 'documents' && (
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                        <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                            Attached Student Documents
                        </h2>
                        {student.documents && student.documents.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {student.documents.map((doc: any) => (
                                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs">
                                        <div className="flex items-center gap-3">
                                            <FileText className="w-5 h-5 text-indigo-600" />
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white">{doc.title}</div>
                                                <div className="text-slate-500">{doc.file_type || 'Document'}</div>
                                            </div>
                                        </div>
                                        <a href={`/storage/${doc.file_path}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-semibold">
                                            View
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-xs text-slate-500">
                                No official documents attached to this student record.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal 1: Progression & Transition */}
            {showProgressionModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Learner Progression</h3>
                                <p className="text-xs text-slate-500">Update academic placement, term transition, or promotion status.</p>
                            </div>
                            <button type="button" onClick={() => setShowProgressionModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleProgressionSubmit} className="space-y-4 text-xs">
                            <div>
                                <Label className="text-xs">Progression Action *</Label>
                                <Select value={progressionForm.data.action} onValueChange={(val) => progressionForm.setData('action', val)}>
                                    <SelectTrigger className="h-9 mt-1 text-xs"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="promote">Promote to Next Grade</SelectItem>
                                        <SelectItem value="repeat">Repeat Current Grade / Term</SelectItem>
                                        <SelectItem value="stream_transfer">Stream / Section Transfer</SelectItem>
                                        <SelectItem value="transfer_out">Transfer Out of School</SelectItem>
                                        <SelectItem value="graduated">Graduated / Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">Academic Year *</Label>
                                    <Select
                                        value={String(progressionForm.data.academic_year_id || '')}
                                        onValueChange={(val) => {
                                            const sel = academicYears.find((y) => String(y.id) === val);
                                            progressionForm.setData((prev) => ({
                                                ...prev,
                                                academic_year_id: Number(val),
                                                academic_year: sel?.name || prev.academic_year,
                                            }));
                                        }}
                                    >
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
                                    <Select value={progressionForm.data.term} onValueChange={(val) => progressionForm.setData('term', val)}>
                                        <SelectTrigger className="h-9 mt-1 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Term 1">Term 1</SelectItem>
                                            <SelectItem value="Term 2">Term 2</SelectItem>
                                            <SelectItem value="Term 3">Term 3</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">Target Class / Grade *</Label>
                                    <Select
                                        value={progressionForm.data.class_id}
                                        onValueChange={(val) => progressionForm.setData((prev) => ({ ...prev, class_id: val, section_id: '' }))}
                                    >
                                        <SelectTrigger className="h-9 mt-1 text-xs"><SelectValue placeholder="Select Class" /></SelectTrigger>
                                        <SelectContent>
                                            {classes.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs">Target Stream</Label>
                                    <Select
                                        value={progressionForm.data.section_id}
                                        onValueChange={(val) => progressionForm.setData('section_id', val)}
                                        disabled={!progressionForm.data.class_id || availableSections.length === 0}
                                    >
                                        <SelectTrigger className="h-9 mt-1 text-xs">
                                            <SelectValue placeholder={availableSections.length === 0 ? 'No streams' : 'Select Stream'} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableSections.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">Effective Date *</Label>
                                    <Input
                                        type="date"
                                        value={progressionForm.data.effective_date}
                                        onChange={(e) => progressionForm.setData('effective_date', e.target.value)}
                                        className="h-9 mt-1 text-xs"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs">Roll / Order Number</Label>
                                    <Input
                                        value={progressionForm.data.roll_no}
                                        onChange={(e) => progressionForm.setData('roll_no', e.target.value)}
                                        placeholder="Optional"
                                        className="h-9 mt-1 text-xs"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs">Administrative Remarks</Label>
                                <Input
                                    value={progressionForm.data.remarks}
                                    onChange={(e) => progressionForm.setData('remarks', e.target.value)}
                                    placeholder="e.g. Promoted based on end-of-year assessment"
                                    className="h-9 mt-1 text-xs"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <Button type="button" variant="outline" onClick={() => setShowProgressionModal(false)} className="h-9 text-xs">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={progressionForm.processing} className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                                    {progressionForm.processing ? 'Recording...' : 'Commit Progression Record'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 2: Attach Guardian */}
            {showGuardianModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">Attach Guardian Contact</h3>
                                <p className="text-xs text-slate-500">Add an authorized parent, guardian, or emergency contact.</p>
                            </div>
                            <button type="button" onClick={() => setShowGuardianModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleGuardianSubmit} className="space-y-4 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">Full Name *</Label>
                                    <Input
                                        value={guardianForm.data.name}
                                        onChange={(e) => guardianForm.setData('name', e.target.value)}
                                        placeholder="e.g. Grace Wanjiku"
                                        className="h-9 mt-1 text-xs"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs">Relationship Type *</Label>
                                    <Select value={guardianForm.data.relation} onValueChange={(val) => guardianForm.setData('relation', val)}>
                                        <SelectTrigger className="h-9 mt-1 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Father">Father</SelectItem>
                                            <SelectItem value="Mother">Mother</SelectItem>
                                            <SelectItem value="Legal Guardian">Legal Guardian</SelectItem>
                                            <SelectItem value="Sponsor">Sponsor</SelectItem>
                                            <SelectItem value="Relative">Relative</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">Phone Number *</Label>
                                    <Input
                                        value={guardianForm.data.phone}
                                        onChange={(e) => guardianForm.setData('phone', e.target.value)}
                                        placeholder="+254 7XX XXX XXX"
                                        className="h-9 mt-1 text-xs"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs">Email Address</Label>
                                    <Input
                                        type="email"
                                        value={guardianForm.data.email}
                                        onChange={(e) => guardianForm.setData('email', e.target.value)}
                                        placeholder="guardian@example.com"
                                        className="h-9 mt-1 text-xs"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs">Residential Address</Label>
                                <Input
                                    value={guardianForm.data.address}
                                    onChange={(e) => guardianForm.setData('address', e.target.value)}
                                    placeholder="e.g. Westlands, Nairobi"
                                    className="h-9 mt-1 text-xs"
                                />
                            </div>

                            <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={guardianForm.data.is_primary}
                                        onChange={(e) => guardianForm.setData('is_primary', e.target.checked)}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">Set as Primary Guardian</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={guardianForm.data.receives_sms_notifications}
                                        onChange={(e) => guardianForm.setData('receives_sms_notifications', e.target.checked)}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-xs text-slate-700 dark:text-slate-300">Receives SMS attendance and academic alerts</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={guardianForm.data.receives_report_cards}
                                        onChange={(e) => guardianForm.setData('receives_report_cards', e.target.checked)}
                                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className="text-xs text-slate-700 dark:text-slate-300">Receives Term Report Cards</span>
                                </label>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <Button type="button" variant="outline" onClick={() => setShowGuardianModal(false)} className="h-9 text-xs">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={guardianForm.processing} className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                                    {guardianForm.processing ? 'Attaching...' : 'Attach Guardian Contact'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 3: Update Medical Profile (ODPC) */}
            {showMedicalModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-white">Update Medical Profile</h3>
                                <p className="text-xs text-slate-500">ODPC-compliant learner health information for emergency care.</p>
                            </div>
                            <button type="button" onClick={() => setShowMedicalModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleMedicalSubmit} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">Blood Group</Label>
                                    <Input
                                        value={medicalForm.data.blood_group}
                                        onChange={(e) => medicalForm.setData('blood_group', e.target.value)}
                                        placeholder="e.g. O+, A+, B-"
                                        className="h-9 mt-1 text-xs"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs">SHA / NHIF Number</Label>
                                    <Input
                                        value={medicalForm.data.sha_nhif_no}
                                        onChange={(e) => medicalForm.setData('sha_nhif_no', e.target.value)}
                                        placeholder="e.g. 10492819"
                                        className="h-9 mt-1 text-xs"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs">Known Allergies (Food, Meds, Environmental)</Label>
                                <Input
                                    value={medicalForm.data.allergies}
                                    onChange={(e) => medicalForm.setData('allergies', e.target.value)}
                                    placeholder="e.g. Peanuts, Penicillin, Dust"
                                    className="h-9 mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <Label className="text-xs">Chronic Medical Conditions</Label>
                                <Input
                                    value={medicalForm.data.chronic_conditions}
                                    onChange={(e) => medicalForm.setData('chronic_conditions', e.target.value)}
                                    placeholder="e.g. Asthma, Type 1 Diabetes, Epilepsy"
                                    className="h-9 mt-1 text-xs"
                                />
                            </div>

                            <div>
                                <Label className="text-xs">Emergency Medication</Label>
                                <Input
                                    value={medicalForm.data.emergency_medication}
                                    onChange={(e) => medicalForm.setData('emergency_medication', e.target.value)}
                                    placeholder="e.g. Inhaler (Ventolin) in school bag, EpiPen"
                                    className="h-9 mt-1 text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">Preferred Hospital / Clinic</Label>
                                    <Input
                                        value={medicalForm.data.preferred_hospital}
                                        onChange={(e) => medicalForm.setData('preferred_hospital', e.target.value)}
                                        placeholder="e.g. Nairobi Hospital"
                                        className="h-9 mt-1 text-xs"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs">Physician Name & Phone</Label>
                                    <Input
                                        value={medicalForm.data.doctor_name}
                                        onChange={(e) => medicalForm.setData('doctor_name', e.target.value)}
                                        placeholder="e.g. Dr. Omondi (+254 7XX...)"
                                        className="h-9 mt-1 text-xs"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs">Special Instructions for Nurse / Teachers</Label>
                                <Input
                                    value={medicalForm.data.special_instructions}
                                    onChange={(e) => medicalForm.setData('special_instructions', e.target.value)}
                                    placeholder="e.g. Avoid vigorous sports without inhaler prior"
                                    className="h-9 mt-1 text-xs"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <Button type="button" variant="outline" onClick={() => setShowMedicalModal(false)} className="h-9 text-xs">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={medicalForm.processing} className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                                    {medicalForm.processing ? 'Saving...' : 'Save Medical Record'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}