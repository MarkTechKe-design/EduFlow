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
import { formatKenyanDate } from '@/lib/formatDate';
import {
    UserPlus,
    Plus,
    Pencil,
    Trash2,
    Phone,
    MessageSquare,
    Mail,
    Calendar,
    Users,
    CheckCircle2,
    Clock,
    Share2,
    ExternalLink
} from 'lucide-react';

interface StaffItem {
    id: number;
    first_name: string;
    last_name: string;
    emp_id: string;
}

interface ClassItem {
    id: number;
    name: string;
}

interface InquiryItem {
    id: number;
    student_name: string;
    class_interested: string;
    guardian_name: string;
    guardian_phone: string;
    guardian_email?: string | null;
    preferred_contact_channel: 'phone_call' | 'whatsapp' | 'sms' | 'email' | 'physical_meeting';
    last_contact_channel?: 'phone_call' | 'whatsapp' | 'sms' | 'email' | 'physical_meeting' | null;
    status: 'new' | 'follow_up' | 'admitted' | 'dropped';
    source: string;
    next_followup_date?: string | null;
    notes?: string | null;
    assigned_staff_id?: number | null;
    assigned_staff?: StaffItem | null;
}

interface Props extends PageProps {
    inquiries: PaginatedData<InquiryItem>;
    classes: ClassItem[];
    staff: StaffItem[];
    stats: {
        total: number;
        new: number;
        follow_up: number;
        admitted: number;
    };
    filters: {
        search: string;
        status: string;
        channel: string;
    };
}

const emptyForm = {
    student_name: '',
    class_interested: 'Grade 7 (Junior School CBC)',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    preferred_contact_channel: 'phone_call' as 'phone_call' | 'whatsapp' | 'sms' | 'email' | 'physical_meeting',
    last_contact_channel: 'phone_call' as 'phone_call' | 'whatsapp' | 'sms' | 'email' | 'physical_meeting',
    status: 'new' as 'new' | 'follow_up' | 'admitted' | 'dropped',
    source: 'walk-in',
    next_followup_date: '',
    assigned_staff_id: '' as string,
    notes: '',
};

export default function InquiriesIndex({ inquiries, classes, staff, stats, filters }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<InquiryItem | null>(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        ...emptyForm,
    });

    function openCreate() {
        reset();
        setEditing(null);
        setOpen(true);
    }

    function openEdit(inq: InquiryItem) {
        setEditing(inq);
        setData({
            student_name: inq.student_name,
            class_interested: inq.class_interested,
            guardian_name: inq.guardian_name,
            guardian_phone: inq.guardian_phone,
            guardian_email: inq.guardian_email || '',
            preferred_contact_channel: inq.preferred_contact_channel || 'phone_call',
            last_contact_channel: inq.last_contact_channel || inq.preferred_contact_channel || 'phone_call',
            status: inq.status || 'new',
            source: inq.source || 'walk-in',
            next_followup_date: inq.next_followup_date || '',
            assigned_staff_id: inq.assigned_staff_id ? String(inq.assigned_staff_id) : '',
            notes: inq.notes || '',
        });
        setOpen(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            put(`/school/admissions/inquiries/${editing.id}`, {
                onSuccess: () => {
                    reset();
                    setOpen(false);
                },
            });
        } else {
            post('/school/admissions/inquiries', {
                onSuccess: () => {
                    reset();
                    setOpen(false);
                },
            });
        }
    }

    function handleDelete(id: number) {
        if (confirm('Are you sure you want to archive this inquiry?')) {
            destroy(`/school/admissions/inquiries/${id}`);
        }
    }

    const cleanPhone = (phone: string) => {
        let p = phone.replace(/\D/g, '');
        if (p.startsWith('0')) p = '254' + p.substring(1);
        if (p.startsWith('7') || p.startsWith('1')) p = '254' + p;
        return p;
    };

    const statusBadge = (s: string) => {
        switch (s) {
            case 'new':
                return 'bg-blue-50 text-blue-800 border-blue-200';
            case 'follow_up':
                return 'bg-amber-50 text-amber-800 border-amber-200';
            case 'admitted':
                return 'bg-emerald-50 text-emerald-800 border-emerald-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const channelIcon = (ch: string) => {
        switch (ch) {
            case 'whatsapp':
                return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"><MessageSquare className="w-3 h-3" /> WhatsApp</span>;
            case 'phone_call':
                return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200"><Phone className="w-3 h-3" /> Phone Call</span>;
            case 'sms':
                return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200"><MessageSquare className="w-3 h-3" /> Direct SMS</span>;
            case 'email':
                return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200"><Mail className="w-3 h-3" /> Email</span>;
            default:
                return <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200"><Users className="w-3 h-3" /> School Visit</span>;
        }
    };

    return (
        <AppLayout title="Admission Inquiries & Lead Pipeline">
            <div className="max-w-7xl space-y-6 pb-16">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-emerald-600" />
                            <span>Prospective Student Admission Inquiries</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Track applicant inquiries, channel follow-ups (WhatsApp, Phone, SMS, Email), and admission conversions.
                        </p>
                    </div>

                    <Button
                        type="button"
                        onClick={openCreate}
                        className="h-10 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-2 shadow-2xs"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Log Admission Inquiry</span>
                    </Button>
                </div>

                {/* KPI Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Inquiries</span>
                        <p className="text-2xl font-black text-slate-900 mt-1">{stats?.total ?? 0}</p>
                        <span className="text-[10px] text-slate-500">All registered inquiries</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fresh Leads</span>
                        <p className="text-2xl font-black text-blue-600 mt-1">{stats?.new ?? 0}</p>
                        <span className="text-[10px] text-slate-500">Awaiting initial outreach</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">In Active Follow-Up</span>
                        <p className="text-2xl font-black text-amber-600 mt-1">{stats?.follow_up ?? 0}</p>
                        <span className="text-[10px] text-slate-500">Assessment / interview stage</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Admitted & Enrolled</span>
                        <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.admitted ?? 0}</p>
                        <span className="text-[10px] text-slate-500">Converted students</span>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input
                            placeholder="Search student, guardian, phone, class..."
                            value={filters?.search || ''}
                            onChange={(e) => router.get('/school/admissions/inquiries', { ...filters, search: e.target.value }, { preserveState: true })}
                            className="h-9 text-xs"
                        />

                        <Select
                            value={filters?.status ?? 'all'}
                            onValueChange={(v) => router.get('/school/admissions/inquiries', { ...filters, status: v }, { preserveState: true })}
                        >
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Statuses" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Inquiry Statuses</SelectItem>
                                <SelectItem value="new">New Inquiry</SelectItem>
                                <SelectItem value="follow_up">In Follow-Up</SelectItem>
                                <SelectItem value="admitted">Admitted</SelectItem>
                                <SelectItem value="dropped">Dropped / Closed</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters?.channel ?? 'all'}
                            onValueChange={(v) => router.get('/school/admissions/inquiries', { ...filters, channel: v }, { preserveState: true })}
                        >
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Contact Channels" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Contact Channels</SelectItem>
                                <SelectItem value="phone_call">Phone Call</SelectItem>
                                <SelectItem value="whatsapp">WhatsApp Chat</SelectItem>
                                <SelectItem value="sms">SMS Text</SelectItem>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="physical_meeting">In-Person Meeting</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Inquiries Roster Table */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="py-3.5 px-4">Prospective Student</th>
                                    <th className="py-3.5 px-4">Target Class</th>
                                    <th className="py-3.5 px-4">Guardian Contact</th>
                                    <th className="py-3.5 px-4">Preferred Channel</th>
                                    <th className="py-3.5 px-4">Next Follow-Up</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4 text-right">Quick Contact & Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {inquiries.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-slate-400">
                                            No admission inquiries found.
                                        </td>
                                    </tr>
                                ) : (
                                    inquiries.data.map((inq) => {
                                        const phoneRaw = inq.guardian_phone;
                                        const phoneE164 = cleanPhone(phoneRaw);

                                        return (
                                            <tr key={inq.id} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-slate-900">{inq.student_name}</div>
                                                    <span className="text-[10px] text-slate-400 font-mono">Source: {inq.source}</span>
                                                </td>

                                                <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-800">
                                                    {inq.class_interested}
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-slate-900">{inq.guardian_name}</div>
                                                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                                                        <span>{inq.guardian_phone}</span>
                                                        {inq.guardian_email && <span className="text-slate-400">• {inq.guardian_email}</span>}
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    {channelIcon(inq.preferred_contact_channel)}
                                                </td>

                                                <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px]">
                                                    {inq.next_followup_date ? (
                                                        <span className="inline-flex items-center gap-1 text-slate-800">
                                                            <Calendar className="w-3 h-3 text-slate-400" />
                                                            {formatKenyanDate(inq.next_followup_date)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 italic">None scheduled</span>
                                                    )}
                                                </td>

                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase ${statusBadge(inq.status)}`}>
                                                        {inq.status.replace('_', ' ')}
                                                    </span>
                                                </td>

                                                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {/* WhatsApp Quick Launcher */}
                                                        <a
                                                            href={`https://wa.me/${phoneE164}?text=Hello%20${encodeURIComponent(inq.guardian_name)},%20thank%20you%20for%20inquiring%20about%20admission%20for%20${encodeURIComponent(inq.student_name)}%20at%20our%20school.`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title="Chat on WhatsApp"
                                                            className="inline-flex items-center justify-center h-7 px-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                                                        >
                                                            <MessageSquare className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                                            <span>WhatsApp</span>
                                                        </a>

                                                        {/* Phone Call Link */}
                                                        <a
                                                            href={`tel:${phoneRaw}`}
                                                            title="Call Guardian"
                                                            className="inline-flex items-center justify-center h-7 px-2 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors"
                                                        >
                                                            <Phone className="w-3.5 h-3.5 mr-1 text-blue-600" />
                                                            <span>Call</span>
                                                        </a>

                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openEdit(inq)}
                                                            className="h-7 text-xs font-bold rounded-lg border-slate-200"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                                                        </Button>

                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(inq.id)}
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

                {/* Create/Edit Modal Dialog */}
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="sm:max-w-xl rounded-2xl max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900">
                                {editing ? 'Edit Admission Inquiry & Follow-Up' : 'Log Prospective Student Inquiry'}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                            <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Candidate Student Name *</Label>
                                    <Input
                                        value={data.student_name}
                                        onChange={(e) => setData('student_name', e.target.value)}
                                        placeholder="e.g. Brian Kiprop"
                                        className="h-9 text-xs mt-1"
                                    />
                                    {errors.student_name && <p className="text-xs text-red-500 mt-1">{errors.student_name}</p>}
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Target Grade / Form *</Label>
                                    <Input
                                        value={data.class_interested}
                                        onChange={(e) => setData('class_interested', e.target.value)}
                                        placeholder="e.g. Grade 7 (Junior School CBC)"
                                        className="h-9 text-xs mt-1"
                                    />
                                    {errors.class_interested && <p className="text-xs text-red-500 mt-1">{errors.class_interested}</p>}
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Parent / Guardian Name *</Label>
                                    <Input
                                        value={data.guardian_name}
                                        onChange={(e) => setData('guardian_name', e.target.value)}
                                        placeholder="e.g. Dr. Jonathan Kiprop"
                                        className="h-9 text-xs mt-1"
                                    />
                                    {errors.guardian_name && <p className="text-xs text-red-500 mt-1">{errors.guardian_name}</p>}
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Guardian Phone Number *</Label>
                                    <Input
                                        value={data.guardian_phone}
                                        onChange={(e) => setData('guardian_phone', e.target.value)}
                                        placeholder="07XXXXXXXX"
                                        className="h-9 text-xs mt-1"
                                    />
                                    {errors.guardian_phone && <p className="text-xs text-red-500 mt-1">{errors.guardian_phone}</p>}
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Guardian Email</Label>
                                    <Input
                                        type="email"
                                        value={data.guardian_email}
                                        onChange={(e) => setData('guardian_email', e.target.value)}
                                        placeholder="guardian@example.com"
                                        className="h-9 text-xs mt-1"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Preferred Outreach Channel *</Label>
                                    <Select value={data.preferred_contact_channel} onValueChange={(v: any) => setData('preferred_contact_channel', v)}>
                                        <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="phone_call">Phone Call</SelectItem>
                                            <SelectItem value="whatsapp">WhatsApp Chat</SelectItem>
                                            <SelectItem value="sms">SMS Text Message</SelectItem>
                                            <SelectItem value="email">Email</SelectItem>
                                            <SelectItem value="physical_meeting">In-Person Campus Meeting</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-3 gap-3">
                                <div>
                                    <Label className="text-xs font-bold">Pipeline Status *</Label>
                                    <Select value={data.status} onValueChange={(v: any) => setData('status', v)}>
                                        <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="new">New Inquiry</SelectItem>
                                            <SelectItem value="follow_up">In Active Follow-Up</SelectItem>
                                            <SelectItem value="admitted">Admitted & Registered</SelectItem>
                                            <SelectItem value="dropped">Dropped / Ineligible</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Lead Source *</Label>
                                    <Select value={data.source} onValueChange={(v) => setData('source', v)}>
                                        <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="walk-in">Gate / Front Desk Walk-in</SelectItem>
                                            <SelectItem value="referral">Parent / Staff Referral</SelectItem>
                                            <SelectItem value="social-media">Social Media / Website</SelectItem>
                                            <SelectItem value="advertisement">Print / Billboard / Radio</SelectItem>
                                            <SelectItem value="phone-inquiry">Direct Phone Call</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Next Follow-Up Date</Label>
                                    <Input
                                        type="date"
                                        value={data.next_followup_date}
                                        onChange={(e) => setData('next_followup_date', e.target.value)}
                                        className="h-9 text-xs mt-1 font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Assign Staff Follow-Up Officer</Label>
                                <Select value={data.assigned_staff_id} onValueChange={(v) => setData('assigned_staff_id', v)}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Assign admissions staff..." /></SelectTrigger>
                                    <SelectContent>
                                        {staff.map((st) => (
                                            <SelectItem key={st.id} value={String(st.id)}>
                                                {st.first_name} {st.last_name} ({st.emp_id})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Admission Notes & Assessment Remarks</Label>
                                <Textarea
                                    rows={3}
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Enter KPSEA/KCPE assessment performance, previous school, fee agreement..."
                                    className="text-xs resize-none mt-1"
                                />
                            </div>

                            <DialogFooter className="gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-9 text-xs rounded-xl">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                                    {editing ? 'Update Inquiry' : 'Save Admission Inquiry'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}