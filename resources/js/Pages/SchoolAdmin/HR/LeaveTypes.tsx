import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ShieldCheck, Plus, Pencil } from 'lucide-react';

interface LeaveType {
    id: number;
    name: string;
    code: string;
    policy_category: 'statutory' | 'contractual' | 'school_policy' | 'cba';
    max_days_per_year: number;
    accrual_method: 'annual_entitlement' | 'monthly_accrual' | 'event_based';
    is_paid: boolean;
    requires_approval: boolean;
    requires_attachment: boolean;
    allows_half_day: boolean;
    affects_payroll: boolean;
    min_notice_days: number;
    allow_carry_forward: boolean;
    max_carry_forward_days: number;
    description: string | null;
    is_active: boolean;
    leave_requests_count?: number;
}

interface Props {
    types: LeaveType[];
}

const emptyForm = {
    name: '',
    code: '',
    policy_category: 'school_policy',
    max_days_per_year: 21,
    accrual_method: 'annual_entitlement',
    is_paid: true,
    requires_approval: true,
    requires_attachment: false,
    allows_half_day: true,
    affects_payroll: false,
    min_notice_days: 7,
    allow_carry_forward: false,
    max_carry_forward_days: 0,
    description: '',
    is_active: true,
};

export default function LeaveTypes({ types }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<LeaveType | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({ ...emptyForm });

    function openCreate() {
        reset();
        setEditing(null);
        setOpen(true);
    }

    function openEdit(t: LeaveType) {
        setEditing(t);
        setData({
            name: t.name,
            code: t.code,
            policy_category: t.policy_category,
            max_days_per_year: t.max_days_per_year,
            accrual_method: t.accrual_method,
            is_paid: t.is_paid,
            requires_approval: t.requires_approval,
            requires_attachment: t.requires_attachment,
            allows_half_day: t.allows_half_day,
            affects_payroll: t.affects_payroll,
            min_notice_days: t.min_notice_days,
            allow_carry_forward: t.allow_carry_forward,
            max_carry_forward_days: t.max_carry_forward_days,
            description: t.description || '',
            is_active: t.is_active,
        });
        setOpen(true);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        if (editing) {
            put(`/school/hr/leave-types/${editing.id}`, {
                onSuccess: () => {
                    reset();
                    setOpen(false);
                },
            });
        } else {
            post('/school/hr/leave-types', {
                onSuccess: () => {
                    reset();
                    setOpen(false);
                },
            });
        }
    }

    const categoryBadge = (cat: string) => {
        switch (cat) {
            case 'statutory':
                return 'bg-emerald-50 text-emerald-800 border-emerald-200';
            case 'contractual':
                return 'bg-blue-50 text-blue-800 border-blue-200';
            case 'cba':
                return 'bg-purple-50 text-purple-800 border-purple-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <AppLayout title="HR Leave Policies & Regulations">
            <div className="max-w-6xl space-y-6 pb-16">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-emerald-600" />
                            <span>HR Leave Policies & Entitlements</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Configuration baseline for Kenyan statutory entitlements (Employment Act Sec. 28/29), contractual allocations, and school policies.
                        </p>
                    </div>

                    <Button
                        type="button"
                        onClick={openCreate}
                        className="h-10 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Define New Policy</span>
                    </Button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                                <tr>
                                    <th className="py-3.5 px-4">Leave Policy Name</th>
                                    <th className="py-3.5 px-4">Category</th>
                                    <th className="py-3.5 px-4">Entitlement</th>
                                    <th className="py-3.5 px-4">Remuneration</th>
                                    <th className="py-3.5 px-4">Notice Required</th>
                                    <th className="py-3.5 px-4">Evidence Doc</th>
                                    <th className="py-3.5 px-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {types.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3.5 px-4">
                                            <div className="font-bold text-slate-900">{t.name}</div>
                                            <div className="text-[10px] text-slate-400 font-mono">{t.code}</div>
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center text-[10px] px-2.5 py-0.5 rounded-full border font-bold uppercase ${categoryBadge(t.policy_category)}`}>
                                                {t.policy_category.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-800">
                                            {t.max_days_per_year} Days
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            {t.is_paid ? (
                                                <span className="text-emerald-600 font-bold">Fully Paid</span>
                                            ) : (
                                                <span className="text-amber-600 font-bold">Unpaid / Salary Deduction</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                                            {t.min_notice_days > 0 ? `${t.min_notice_days} Days Prior` : 'Immediate / Emergency'}
                                        </td>
                                        <td className="py-3.5 px-4 whitespace-nowrap">
                                            {t.requires_attachment ? (
                                                <span className="text-slate-800 font-bold">Mandatory</span>
                                            ) : (
                                                <span className="text-slate-400">Optional</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 text-right">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEdit(t)}
                                                className="h-8 text-xs font-bold rounded-xl border-slate-200"
                                            >
                                                <Pencil className="w-3.5 h-3.5 mr-1" />
                                                <span>Configure</span>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent className="sm:max-w-2xl rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-base font-bold text-slate-900">
                                {editing ? 'Configure Leave Policy' : 'Define New Leave Policy'}
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={submit} className="space-y-4 pt-2">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs font-bold">Policy Title *</Label>
                                    <Input
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g. Annual Leave"
                                        className="h-9 text-xs mt-1"
                                    />
                                    {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Policy Code *</Label>
                                    <Input
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                        placeholder="e.g. ANNUAL"
                                        className="h-9 text-xs mt-1 font-mono uppercase"
                                    />
                                    {errors.code && <p className="text-xs text-red-500 mt-1">{errors.code}</p>}
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Category Origin *</Label>
                                    <Select value={data.policy_category} onValueChange={(v: any) => setData('policy_category', v)}>
                                        <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="statutory">Statutory (Kenya Employment Act)</SelectItem>
                                            <SelectItem value="contractual">Contractual Entitlement</SelectItem>
                                            <SelectItem value="school_policy">School Operational Policy</SelectItem>
                                            <SelectItem value="cba">Collective Bargaining Agreement (CBA)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Entitlement Days *</Label>
                                    <Input
                                        type="number"
                                        value={data.max_days_per_year}
                                        onChange={(e) => setData('max_days_per_year', parseInt(e.target.value) || 0)}
                                        className="h-9 text-xs mt-1 font-mono"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Minimum Notice (Days)</Label>
                                    <Input
                                        type="number"
                                        value={data.min_notice_days}
                                        onChange={(e) => setData('min_notice_days', parseInt(e.target.value) || 0)}
                                        className="h-9 text-xs mt-1 font-mono"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs font-bold">Remuneration Type *</Label>
                                    <Select value={data.is_paid ? 'paid' : 'unpaid'} onValueChange={(v) => setData('is_paid', v === 'paid')}>
                                        <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="paid">Fully Paid</SelectItem>
                                            <SelectItem value="unpaid">Unpaid (Salary Deduction)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.requires_attachment}
                                        onChange={(e) => setData('requires_attachment', e.target.checked)}
                                        className="rounded border-slate-300 text-emerald-600"
                                    />
                                    <span>Require Medical Document</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.allows_half_day}
                                        onChange={(e) => setData('allows_half_day', e.target.checked)}
                                        className="rounded border-slate-300 text-emerald-600"
                                    />
                                    <span>Allow Half-Days</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={data.allow_carry_forward}
                                        onChange={(e) => setData('allow_carry_forward', e.target.checked)}
                                        className="rounded border-slate-300 text-emerald-600"
                                    />
                                    <span>Allow Carry-Forward</span>
                                </label>
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Policy Description</Label>
                                <Textarea
                                    rows={3}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Add statutory references or institutional requirements..."
                                    className="text-xs resize-none mt-1"
                                />
                            </div>

                            <DialogFooter className="gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-9 text-xs rounded-xl">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                                    {editing ? 'Save Policy Changes' : 'Create Policy'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}