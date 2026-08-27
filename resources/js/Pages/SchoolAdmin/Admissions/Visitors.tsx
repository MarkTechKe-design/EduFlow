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
import { formatKenyanTime, formatKenyanDate } from '@/lib/formatDate';
import {
    Users,
    Plus,
    CheckCircle2,
    Clock,
    Shield,
    Building2,
    Car,
    CreditCard,
    LogOut,
    Trash2,
    Search,
    GraduationCap,
    HeartHandshake
} from 'lucide-react';

interface StaffItem {
    id: number;
    first_name: string;
    last_name: string;
    emp_id: string;
}

interface StudentItem {
    id: number;
    first_name: string;
    last_name: string;
    admission_no?: string; admission_number?: string;
    school_class?: { id: number; name: string };
}

interface DepartmentItem {
    id: number;
    name: string;
    code?: string | null;
}

interface VisitorItem {
    id: number;
    name: string;
    phone: string;
    id_number?: string | null;
    vehicle_reg?: string | null;
    badge_number?: string | null;
    purpose: string;
    category: 'parent_visiting' | 'admission_inquiry' | 'moe_qaso' | 'supplier' | 'official_meeting' | 'maintenance' | 'guest';
    target_type: 'student' | 'staff' | 'department' | 'admission_inquiry';
    relationship_to_student?: string | null;
    person_to_meet: string;
    student_id?: number | null;
    staff_id?: number | null;
    department_id?: number | null;
    time_in: string;
    time_out?: string | null;
    remarks?: string | null;
    staff?: StaffItem | null;
    student?: StudentItem | null;
    department?: DepartmentItem | null;
}

interface Props extends PageProps {
    visitors: PaginatedData<VisitorItem>;
    staff: StaffItem[];
    students: StudentItem[];
    departments: DepartmentItem[];
    stats: {
        total_today: number;
        active_now: number;
        parent_visits: number;
        official_guests: number;
    };
    filters: {
        search: string;
        category: string;
        target_type: string;
        status: string;
        date: string;
    };
}

const emptyForm = {
    name: '',
    phone: '',
    id_number: '',
    vehicle_reg: '',
    badge_number: '',
    category: 'parent_visiting' as 'parent_visiting' | 'admission_inquiry' | 'moe_qaso' | 'supplier' | 'official_meeting' | 'maintenance' | 'guest',
    target_type: 'student' as 'student' | 'staff' | 'department' | 'admission_inquiry',
    student_id: '' as string,
    relationship_to_student: 'Parent',
    purpose: 'Visiting student / Parent Consultation',
    person_to_meet: '',
    staff_id: '' as string,
    department_id: '' as string,
    remarks: '',
};

export default function Visitors({ visitors, staff, students, departments, stats, filters }: Props) {
    const [open, setOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        ...emptyForm,
    });

    function handleTargetTypeChange(type: 'student' | 'staff' | 'department' | 'admission_inquiry') {
        let defaultCategory = data.category;
        let defaultPurpose = data.purpose;
        let defaultPerson = data.person_to_meet;

        if (type === 'student') {
            defaultCategory = 'parent_visiting';
            defaultPurpose = 'Parent visiting day / Student welfare check';
        } else if (type === 'admission_inquiry') {
            defaultCategory = 'admission_inquiry';
            defaultPurpose = 'Inquiring about Grade/Form admissions and fees';
            defaultPerson = 'Admissions Registrar / Front Desk';
        } else if (type === 'department') {
            defaultCategory = 'official_meeting';
            defaultPurpose = 'Official departmental consultation';
        } else {
            defaultCategory = 'official_meeting';
            defaultPurpose = 'Meeting with faculty / staff member';
        }

        setData({
            ...data,
            target_type: type,
            category: defaultCategory,
            purpose: defaultPurpose,
            person_to_meet: defaultPerson,
        });
    }

    function handleStudentSelect(studentIdStr: string) {
        const sel = students.find(s => String(s.id) === studentIdStr);
        setData({
            ...data,
            student_id: studentIdStr,
            person_to_meet: sel ? `${sel.first_name} ${sel.last_name} (${sel.admission_number} - ${sel.school_class?.name || 'Class'})` : data.person_to_meet,
        });
    }

    function handleCheckInSubmit(e: React.FormEvent) {
        e.preventDefault();
        post('/school/admissions/visitors', {
            onSuccess: () => {
                reset();
                setOpen(false);
            },
        });
    }

    function handleCheckout(id: number) {
        router.patch(`/school/admissions/visitors/${id}/checkout`);
    }

    function handleDelete(id: number) {
        if (confirm('Are you sure you want to delete this visitor record?')) {
            router.delete(`/school/admissions/visitors/${id}`);
        }
    }

    const categoryBadge = (cat: string) => {
        switch (cat) {
            case 'parent_visiting':
                return 'bg-emerald-50 text-emerald-800 border-emerald-200';
            case 'admission_inquiry':
                return 'bg-blue-50 text-blue-800 border-blue-200';
            case 'moe_qaso':
                return 'bg-purple-50 text-purple-800 border-purple-200';
            case 'supplier':
                return 'bg-cyan-50 text-cyan-800 border-cyan-200';
            case 'maintenance':
                return 'bg-amber-50 text-amber-800 border-amber-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <AppLayout title="Visitor Log & Gate Clearance">
            <div className="max-w-7xl space-y-6 pb-16">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-emerald-600" />
                            <span>Visitor Gate Log & Front Desk Registry</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Campus security clearance, parent visiting logs, admission inquiries, and official staff appointments.
                        </p>
                    </div>

                    <Button
                        type="button"
                        onClick={() => { reset(); setOpen(true); }}
                        className="h-10 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-2 shadow-2xs"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Check In Visitor</span>
                    </Button>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Today's Total Entries</span>
                        <p className="text-2xl font-black text-slate-900 mt-1">{stats?.total_today ?? 0}</p>
                        <span className="text-[10px] text-slate-500">Logged at the gate today</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Currently On Campus</span>
                        <p className="text-2xl font-black text-amber-600 mt-1">{stats?.active_now ?? 0}</p>
                        <span className="text-[10px] text-slate-500">Active passes inside campus</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Parents & Inquiries</span>
                        <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.parent_visits ?? 0}</p>
                        <span className="text-[10px] text-slate-500">Student visits & admissions</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Official & Regulatory</span>
                        <p className="text-2xl font-black text-purple-700 mt-1">{stats?.official_guests ?? 0}</p>
                        <span className="text-[10px] text-slate-500">MoE, vendors & executives</span>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <Input
                            placeholder="Search visitor, phone, ID, student, car reg..."
                            value={filters?.search || ''}
                            onChange={(e) => router.get('/school/admissions/visitors', { ...filters, search: e.target.value }, { preserveState: true })}
                            className="h-9 text-xs"
                        />

                        <Select
                            value={filters?.category ?? 'all'}
                            onValueChange={(v) => router.get('/school/admissions/visitors', { ...filters, category: v }, { preserveState: true })}
                        >
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Categories" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Visit Categories</SelectItem>
                                <SelectItem value="parent_visiting">Parent Visiting Student</SelectItem>
                                <SelectItem value="admission_inquiry">Admission Inquiry</SelectItem>
                                <SelectItem value="moe_qaso">MoE / TSC Audit</SelectItem>
                                <SelectItem value="supplier">Vendor / Delivery</SelectItem>
                                <SelectItem value="official_meeting">Official Meeting</SelectItem>
                                <SelectItem value="maintenance">Maintenance / Tech</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters?.status ?? 'all'}
                            onValueChange={(v) => router.get('/school/admissions/visitors', { ...filters, status: v }, { preserveState: true })}
                        >
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Gate Statuses</SelectItem>
                                <SelectItem value="active">Active On Campus</SelectItem>
                                <SelectItem value="checked_out">Checked Out</SelectItem>
                            </SelectContent>
                        </Select>

                        <Input
                            type="date"
                            value={filters?.date || ''}
                            onChange={(e) => router.get('/school/admissions/visitors', { ...filters, date: e.target.value }, { preserveState: true })}
                            className="h-9 text-xs"
                        />
                    </div>
                </div>

                {/* Visitors Table */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="py-3.5 px-4">Visitor & Identification</th>
                                    <th className="py-3.5 px-4">Pass & Transport</th>
                                    <th className="py-3.5 px-4">Purpose & Category</th>
                                    <th className="py-3.5 px-4">Target (Student / Staff / Dept)</th>
                                    <th className="py-3.5 px-4">Time In / Out (EAT)</th>
                                    <th className="py-3.5 px-4">Gate Status</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {visitors.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-slate-400">
                                            No visitor records found.
                                        </td>
                                    </tr>
                                ) : (
                                    visitors.data.map((v) => {
                                        const isInCampus = !v.time_out;

                                        return (
                                            <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-slate-900">{v.name}</div>
                                                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                                        <span>{v.phone}</span>
                                                        {v.id_number && (
                                                            <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded text-[10px]">
                                                                ID: {v.id_number}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    {v.badge_number && (
                                                        <span className="inline-flex items-center text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                                                            {v.badge_number}
                                                        </span>
                                                    )}
                                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                                        {v.vehicle_reg || 'Pedestrian'}
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <span className={`inline-flex items-center text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase ${categoryBadge(v.category)}`}>
                                                        {v.category.replace(/_/g, ' ')}
                                                    </span>
                                                    <div className="text-slate-800 text-xs font-semibold mt-1 max-w-xs truncate">
                                                        {v.purpose}
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    {v.student ? (
                                                        <div>
                                                            <div className="font-bold text-emerald-800 flex items-center gap-1">
                                                                <span>{v.student.first_name} {v.student.last_name}</span>
                                                                <span className="text-[10px] font-normal text-slate-500">({v.relationship_to_student || 'Parent'})</span>
                                                            </div>
                                                            <div className="text-[10px] text-slate-400 font-mono">
                                                                {(v.student.admission_no || v.student.admission_number || "")} • {v.student.school_class?.name || 'Class'}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="font-bold text-slate-900">{v.person_to_meet}</div>
                                                            <div className="text-[10px] text-slate-500">
                                                                {v.department?.name || (v.category === 'admission_inquiry' ? 'Admissions Desk' : 'General Campus')}
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 font-mono text-[11px]">
                                                    <div>In: {formatKenyanTime(v.time_in)}</div>
                                                    {v.time_out && (
                                                        <div className="text-slate-400">
                                                            Out: {formatKenyanTime(v.time_out)}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    {isInCampus ? (
                                                        <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                                            In Campus
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                            Checked Out
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {isInCampus && (
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                onClick={() => handleCheckout(v.id)}
                                                                className="h-7 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                                                            >
                                                                <LogOut className="w-3.5 h-3.5 mr-1" /> Check Out
                                                            </Button>
                                                        )}

                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(v.id)}
                                                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 rounded-lg"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Check-In Modal Dialog */}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="sm:max-w-xl rounded-2xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900">
                                Visitor Gate Check-In & Clearance
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleCheckInSubmit} className="space-y-4 pt-2">
                            {/* Target Type Selector */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-bold">Nature of Visit *</Label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {[
                                        { id: 'student', label: 'Visiting Student' },
                                        { id: 'admission_inquiry', label: 'Admission Inquiry' },
                                        { id: 'staff', label: 'Staff Meeting' },
                                        { id: 'department', label: 'Vendor / Dept' },
                                    ].map((t) => (
                                        <button
                                            type="button"
                                            key={t.id}
                                            onClick={() => handleTargetTypeChange(t.id as any)}
                                            className={`py-2 px-2.5 rounded-xl border text-xs font-bold text-center transition-all ${
                                                data.target_type === t.id
                                                    ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                                            }`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Visitor Full Name *</Label>
                                    <Input
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g. Mary Wanjiku"
                                        className="h-9 text-xs mt-1"
                                    />
                                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Phone Number *</Label>
                                    <Input
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="07XXXXXXXX"
                                        className="h-9 text-xs mt-1"
                                    />
                                    {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-3 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">National ID / Passport</Label>
                                    <Input
                                        value={data.id_number}
                                        onChange={(e) => setData('id_number', e.target.value)}
                                        placeholder="e.g. 29481023"
                                        className="h-9 text-xs mt-1 font-mono"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Vehicle Reg / Plate</Label>
                                    <Input
                                        value={data.vehicle_reg}
                                        onChange={(e) => setData('vehicle_reg', e.target.value.toUpperCase())}
                                        placeholder="e.g. KDA 789B / Pedestrian"
                                        className="h-9 text-xs mt-1 uppercase font-mono"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Badge / Pass No</Label>
                                    <Input
                                        value={data.badge_number}
                                        onChange={(e) => setData('badge_number', e.target.value.toUpperCase())}
                                        placeholder="e.g. PASS-01"
                                        className="h-9 text-xs mt-1 font-mono uppercase"
                                    />
                                </div>
                            </div>

                            {/* Dynamic Section: Visiting a Student */}
                            {data.target_type === 'student' && (
                                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
                                    <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                                        <GraduationCap className="w-4 h-4 text-emerald-700" />
                                        <span>Student & Guardian Clearance</span>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-3">
                                        <div>
                                            <Label className="text-xs font-bold text-emerald-950">Select Student *</Label>
                                            <Select value={data.student_id} onValueChange={handleStudentSelect}>
                                                <SelectTrigger className="h-9 text-xs mt-1 bg-white"><SelectValue placeholder="Search by name / adm no..." /></SelectTrigger>
                                                <SelectContent>
                                                    {students.map((s) => (
                                                        <SelectItem key={s.id} value={String(s.id)}>
                                                            {s.first_name} {s.last_name} ({(s.admission_no || s.admission_number || "")} - {s.school_class?.name || 'Class'})
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label className="text-xs font-bold text-emerald-950">Relationship to Student *</Label>
                                            <Select value={data.relationship_to_student} onValueChange={(v) => setData('relationship_to_student', v)}>
                                                <SelectTrigger className="h-9 text-xs mt-1 bg-white"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Parent / Mother">Parent / Mother</SelectItem>
                                                    <SelectItem value="Parent / Father">Parent / Father</SelectItem>
                                                    <SelectItem value="Legal Guardian">Legal Guardian</SelectItem>
                                                    <SelectItem value="Sibling">Sibling / Brother / Sister</SelectItem>
                                                    <SelectItem value="Relative / Sponsor">Relative / Sponsor</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Dynamic Section: Staff / Department / Admission */}
                            {data.target_type !== 'student' && (
                                <div className="grid sm:grid-cols-2 gap-3">
                                    <div>
                                        <Label className="text-xs font-bold">Person to Meet *</Label>
                                        <Input
                                            value={data.person_to_meet}
                                            onChange={(e) => setData('person_to_meet', e.target.value)}
                                            placeholder="e.g. Principal / Admissions Desk"
                                            className="h-9 text-xs mt-1"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-xs font-bold">Host Department</Label>
                                        <Select value={data.department_id} onValueChange={(v) => setData('department_id', v)}>
                                            <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select Department" /></SelectTrigger>
                                            <SelectContent>
                                                {departments.map((d) => (
                                                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            <div>
                                <Label className="text-xs font-bold">Official Purpose *</Label>
                                <Input
                                    value={data.purpose}
                                    onChange={(e) => setData('purpose', e.target.value)}
                                    placeholder="Purpose of campus visit..."
                                    className="h-9 text-xs mt-1"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Security Remarks / Luggage Description</Label>
                                <Textarea
                                    rows={2}
                                    value={data.remarks}
                                    onChange={(e) => setData('remarks', e.target.value)}
                                    placeholder="e.g. Authorized guardian, carrying student provisions..."
                                    className="text-xs resize-none mt-1"
                                />
                            </div>

                            <DialogFooter className="gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-9 text-xs rounded-xl">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                                    Log Gate Clearance
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}