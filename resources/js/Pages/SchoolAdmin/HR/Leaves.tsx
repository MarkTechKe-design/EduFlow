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
import { Calendar, Plus } from 'lucide-react';

interface StaffItem {
    id: number;
    first_name: string;
    last_name: string;
    emp_id: string;
    department?: { id: number; name: string };
}

interface LeaveTypeItem {
    id: number;
    name: string;
    code: string;
    policy_category: string;
    max_days_per_year: number;
    requires_attachment: boolean;
}

interface LeaveRequestItem {
    id: number;
    staff_id: number;
    relief_staff_id?: number | null;
    start_date: string;
    end_date: string;
    days: number;
    is_half_day: boolean;
    reason: string;
    contact_while_away?: string | null;
    handover_notes?: string | null;
    attachment_path?: string | null;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    approved_by?: number | null;
    approval_note?: string | null;
    staff: StaffItem;
    reliefStaff?: StaffItem | null;
    leaveType: LeaveTypeItem;
    approvedBy?: { id: number; name: string } | null;
}

interface Props extends PageProps {
    requests?: PaginatedData<LeaveRequestItem>;
    leaveTypes?: LeaveTypeItem[];
    staffList?: StaffItem[];
    filters?: {
        status?: string;
        staff_id?: string;
        leave_type_id?: string;
    };
    metrics?: {
        pending?: number;
        currently_away?: number;
        returning_today?: number;
        upcoming?: number;
    };
}

export default function Leaves({
    requests = { data: [], links: [], current_page: 1, last_page: 1, total: 0, from: 0, to: 0 } as any,
    leaveTypes = [],
    staffList = [],
    filters = { status: 'all', staff_id: 'all', leave_type_id: 'all' },
    metrics = { pending: 0, currently_away: 0, returning_today: 0, upcoming: 0 },
}: Props) {
    const [applyOpen, setApplyOpen] = useState(false);
    const [actionOpen, setActionOpen] = useState(false);
    const [activeRequest, setActiveRequest] = useState<LeaveRequestItem | null>(null);

    const safeMetrics = {
        pending: metrics?.pending ?? 0,
        currently_away: metrics?.currently_away ?? 0,
        returning_today: metrics?.returning_today ?? 0,
        upcoming: metrics?.upcoming ?? 0,
    };

    const applyForm = useForm({
        staff_id: '',
        leave_type_id: '',
        relief_staff_id: '',
        start_date: '',
        end_date: '',
        is_half_day: false,
        reason: '',
        contact_while_away: '',
        handover_notes: '',
        attachment: null as File | null,
    });

    const actionForm = useForm({
        action: 'approved',
        approval_note: '',
    });

    function submitApplication(e: React.FormEvent) {
        e.preventDefault();
        applyForm.post('/school/hr/leaves', {
            forceFormData: true,
            onSuccess: () => {
                applyForm.reset();
                setApplyOpen(false);
            },
        });
    }

    function submitAction(e: React.FormEvent) {
        e.preventDefault();
        if (!activeRequest) return;
        actionForm.put(`/school/hr/leaves/${activeRequest.id}/approve`, {
            onSuccess: () => {
                actionForm.reset();
                setActionOpen(false);
                setActiveRequest(null);
            },
        });
    }

    const statusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return 'bg-emerald-50 text-emerald-800 border-emerald-200';
            case 'rejected':
                return 'bg-red-50 text-red-800 border-red-200';
            case 'pending':
                return 'bg-amber-50 text-amber-800 border-amber-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <AppLayout title="HR Leave Management Operations">
            <div className="max-w-7xl space-y-6 pb-16">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-emerald-600" />
                            <span>Staff Leave Applications & Coverage</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Process staff leave requests, relief teacher assignments, and institutional attendance compliance.
                        </p>
                    </div>

                    <Button
                        type="button"
                        onClick={() => setApplyOpen(true)}
                        className="h-10 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Record Leave Application</span>
                    </Button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Review</span>
                        <p className="text-2xl font-black text-amber-600 mt-1">{safeMetrics.pending}</p>
                        <span className="text-[10px] text-slate-500">Awaiting supervisor action</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Currently Away Today</span>
                        <p className="text-2xl font-black text-slate-900 mt-1">{safeMetrics.currently_away}</p>
                        <span className="text-[10px] text-slate-500">On approved active leave</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Returning Today</span>
                        <p className="text-2xl font-black text-blue-600 mt-1">{safeMetrics.returning_today}</p>
                        <span className="text-[10px] text-slate-500">Final day of leave window</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Upcoming (14 Days)</span>
                        <p className="text-2xl font-black text-emerald-600 mt-1">{safeMetrics.upcoming}</p>
                        <span className="text-[10px] text-slate-500">Scheduled relief periods</span>
                    </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Select
                            value={filters?.status ?? 'all'}
                            onValueChange={(v) => router.get('/school/hr/leaves', { ...filters, status: v }, { preserveState: true })}
                        >
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Filter Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Request Statuses</SelectItem>
                                <SelectItem value="pending">Pending Review</SelectItem>
                                <SelectItem value="approved">Approved</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters?.leave_type_id ?? 'all'}
                            onValueChange={(v) => router.get('/school/hr/leaves', { ...filters, leave_type_id: v }, { preserveState: true })}
                        >
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Filter Policy Type" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Policy Types</SelectItem>
                                {leaveTypes.map((lt) => (
                                    <SelectItem key={lt.id} value={String(lt.id)}>{lt.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={filters?.staff_id ?? 'all'}
                            onValueChange={(v) => router.get('/school/hr/leaves', { ...filters, staff_id: v }, { preserveState: true })}
                        >
                            <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Filter Staff Member" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Staff Members</SelectItem>
                                {staffList.map((st) => (
                                    <SelectItem key={st.id} value={String(st.id)}>{st.first_name} {st.last_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="py-3.5 px-4">Staff Member</th>
                                    <th className="py-3.5 px-4">Policy Type</th>
                                    <th className="py-3.5 px-4">Leave Window</th>
                                    <th className="py-3.5 px-4">Duration</th>
                                    <th className="py-3.5 px-4">Relief / Handover</th>
                                    <th className="py-3.5 px-4">Status</th>
                                    <th className="py-3.5 px-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {(requests.data ?? []).map((r) => (
                                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-slate-900">
                                                {r.staff?.first_name} {r.staff?.last_name}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-mono">
                                                ID: {r.staff?.emp_id} | {r.staff?.department?.name || 'General'}
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <span className="font-bold text-slate-800 block">{r.leaveType?.name}</span>
                                            <span className="text-[10px] font-mono text-slate-400">{r.leaveType?.code}</span>
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                                            <div>{r.start_date} - {r.end_date}</div>
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-900">
                                            {r.days} {r.days === 1 ? 'Day' : 'Days'}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {r.reliefStaff ? (
                                                <div className="text-emerald-700 font-semibold">
                                                    Relief: {r.reliefStaff.first_name} {r.reliefStaff.last_name}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">No relief assigned</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase ${statusBadge(r.status)}`}>
                                                {r.status}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            {r.status === 'pending' ? (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => {
                                                        setActiveRequest(r);
                                                        setActionOpen(true);
                                                    }}
                                                    className="h-7 text-[11px] font-bold px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                                                >
                                                    Review
                                                </Button>
                                            ) : (
                                                <span className="text-[11px] text-slate-400">
                                                    Actioned by {r.approvedBy?.name || 'Admin'}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
                    <DialogContent className="sm:max-w-2xl rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900">
                                Record Employee Leave Application
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={submitApplication} className="space-y-4 pt-2">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs font-bold">Staff Member *</Label>
                                    <Select value={applyForm.data.staff_id} onValueChange={(v) => applyForm.setData('staff_id', v)}>
                                        <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select employee..." /></SelectTrigger>
                                        <SelectContent>
                                            {staffList.map((st) => (
                                                <SelectItem key={st.id} value={String(st.id)}>
                                                    {st.first_name} {st.last_name} ({st.emp_id})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Leave Policy Type *</Label>
                                    <Select value={applyForm.data.leave_type_id} onValueChange={(v) => applyForm.setData('leave_type_id', v)}>
                                        <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select policy..." /></SelectTrigger>
                                        <SelectContent>
                                            {leaveTypes.map((lt) => (
                                                <SelectItem key={lt.id} value={String(lt.id)}>
                                                    {lt.name} (Max {lt.max_days_per_year}d)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Start Date *</Label>
                                    <Input
                                        type="date"
                                        value={applyForm.data.start_date}
                                        onChange={(e) => applyForm.setData('start_date', e.target.value)}
                                        className="h-9 text-xs mt-1"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">End Date *</Label>
                                    <Input
                                        type="date"
                                        value={applyForm.data.end_date}
                                        onChange={(e) => applyForm.setData('end_date', e.target.value)}
                                        className="h-9 text-xs mt-1"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Temporary Relief / Covering Teacher</Label>
                                    <Select value={applyForm.data.relief_staff_id} onValueChange={(v) => applyForm.setData('relief_staff_id', v)}>
                                        <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Assign relief staff..." /></SelectTrigger>
                                        <SelectContent>
                                            {staffList.map((st) => (
                                                <SelectItem key={st.id} value={String(st.id)}>
                                                    {st.first_name} {st.last_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Emergency Contact Phone</Label>
                                    <Input
                                        value={applyForm.data.contact_while_away}
                                        onChange={(e) => applyForm.setData('contact_while_away', e.target.value)}
                                        placeholder="e.g. 0718178521"
                                        className="h-9 text-xs mt-1"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Reason for Absence *</Label>
                                <Textarea
                                    rows={2}
                                    value={applyForm.data.reason}
                                    onChange={(e) => applyForm.setData('reason', e.target.value)}
                                    placeholder="Provide detailed context..."
                                    className="text-xs resize-none mt-1"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Handover Instructions & Class Notes</Label>
                                <Textarea
                                    rows={2}
                                    value={applyForm.data.handover_notes}
                                    onChange={(e) => applyForm.setData('handover_notes', e.target.value)}
                                    placeholder="Specific syllabus coverage, homework checking duties..."
                                    className="text-xs resize-none mt-1"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Supporting Document (Medical Cert / Letter)</Label>
                                <Input
                                    type="file"
                                    onChange={(e) => applyForm.setData('attachment', e.target.files ? e.target.files[0] : null)}
                                    className="h-9 text-xs mt-1"
                                />
                            </div>

                            <DialogFooter className="gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setApplyOpen(false)} className="h-9 text-xs rounded-xl">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={applyForm.processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                                    Submit Application
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                <Dialog open={actionOpen} onOpenChange={setActionOpen}>
                    <DialogContent className="sm:max-w-md rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900">
                                Review Leave Request #{activeRequest?.id}
                            </DialogTitle>
                        </DialogHeader>

                        {activeRequest && (
                            <form onSubmit={submitAction} className="space-y-4 pt-2">
                                <div className="p-3 rounded-xl bg-slate-50 text-xs space-y-1">
                                    <div className="font-bold text-slate-900">
                                        {activeRequest.staff?.first_name} {activeRequest.staff?.last_name}
                                    </div>
                                    <div className="text-slate-500">
                                        {activeRequest.leaveType?.name} ({activeRequest.days} days: {activeRequest.start_date} - {activeRequest.end_date})
                                    </div>
                                    <div className="text-slate-600 italic pt-1">
                                        "{activeRequest.reason}"
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Decision *</Label>
                                    <Select value={actionForm.data.action} onValueChange={(v) => actionForm.setData('action', v)}>
                                        <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="approved">Approve Leave Request</SelectItem>
                                            <SelectItem value="rejected">Reject Request</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Reviewer Remarks</Label>
                                    <Textarea
                                        rows={3}
                                        value={actionForm.data.approval_note}
                                        onChange={(e) => actionForm.setData('approval_note', e.target.value)}
                                        placeholder="Add approval remarks or reasons for rejection..."
                                        className="text-xs resize-none mt-1"
                                    />
                                </div>

                                <DialogFooter className="gap-2 pt-2">
                                    <Button type="button" variant="outline" onClick={() => setActionOpen(false)} className="h-9 text-xs rounded-xl">
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={actionForm.processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                                        Record Decision
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