import AppLayout from '@/Layouts/AppLayout';
import { useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Save, CheckCircle2 } from 'lucide-react';

interface StaffItem {
    id: number;
    first_name: string;
    last_name: string;
    emp_id: string;
    department_id?: number;
    department?: { id: number; name: string };
    designation?: { id: number; name: string };
}

interface ExistingRecord {
    attendable_id: number;
    status: 'present' | 'absent' | 'late' | 'on_leave' | 'official_duty' | 'half_day';
    time_in?: string;
    time_out?: string;
    remarks?: string;
}

interface ActiveLeaveItem {
    id: number;
    staff_id: number;
    leaveType?: { id: number; name: string; code: string };
}

interface Props {
    staffList: StaffItem[];
    existing: Record<number, ExistingRecord>;
    activeLeaves: Record<number, ActiveLeaveItem>;
    departments: { id: number; name: string }[];
    stats: {
        total: number;
        present: number;
        absent: number;
        late: number;
        on_leave: number;
    };
    filters: {
        date: string;
        department_id: number | null;
    };
}

export default function StaffIndex({ staffList, existing, activeLeaves, departments, stats, filters }: Props) {
    const [date, setDate] = useState(filters.date || '');
    const [departmentId, setDepartmentId] = useState<string>(filters.department_id ? String(filters.department_id) : '');

    const { data, setData, post, processing } = useForm<{
        date: string;
        records: {
            staff_id: number;
            status: 'present' | 'absent' | 'late' | 'on_leave' | 'official_duty' | 'half_day';
            time_in: string;
            time_out: string;
            remarks: string;
        }[];
    }>({
        date: filters.date,
        records: [],
    });

    useEffect(() => {
        if (staffList.length > 0) {
            const initial = staffList.map((st) => {
                const ex = existing[st.id];
                const isOnLeave = Boolean(activeLeaves[st.id]);
                return {
                    staff_id: st.id,
                    status: ex ? ex.status : (isOnLeave ? 'on_leave' : 'present'),
                    time_in: ex ? ex.time_in || '07:30' : '07:30',
                    time_out: ex ? ex.time_out || '17:00' : '17:00',
                    remarks: ex ? ex.remarks || '' : (isOnLeave ? `Approved ${activeLeaves[st.id].leaveType?.name || 'Leave'}` : ''),
                };
            });
            setData('records', initial);
        }
    }, [staffList, existing, activeLeaves]);

    function handleFilter(e: React.FormEvent) {
        e.preventDefault();
        router.get('/school/attendance/staff', {
            date,
            department_id: departmentId || undefined,
        }, { preserveState: true });
    }

    function updateStaffRow(staffId: number, field: string, value: any) {
        const updated = data.records.map((r) => {
            if (r.staff_id === staffId) {
                return { ...r, [field]: value };
            }
            return r;
        });
        setData('records', updated);
    }

    function submitStaffAttendance(e: React.FormEvent) {
        e.preventDefault();
        setData('date', date);
        post('/school/attendance/staff');
    }

    return (
        <AppLayout title="Staff Daily Attendance & Duty Clock-in">
            <div className="max-w-7xl space-y-6 pb-16">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-emerald-600" />
                        <span>Staff Daily Attendance & Duty Clock-in</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Track teacher clock-in hours, official duty assignments (ODS), and cross-referenced leave records.
                    </p>
                </div>

                {/* Filter Toolbar */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                        <div>
                            <Label className="text-xs font-bold">Duty Date</Label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="h-9 text-xs mt-1"
                            />
                        </div>

                        <div>
                            <Label className="text-xs font-bold">Department Filter</Label>
                            <Select value={departmentId} onValueChange={setDepartmentId}>
                                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="All Departments" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departments.map((d) => (
                                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button type="submit" className="h-9 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                            Load Staff List
                        </Button>
                    </form>
                </div>

                {/* Staff KPI Header */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Staff</span>
                        <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.total}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Present (On Duty)</span>
                        <p className="text-xl font-bold text-emerald-700 mt-0.5">{stats.present}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-200 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-800">Absent (AWOP)</span>
                        <p className="text-xl font-bold text-red-700 mt-0.5">{stats.absent}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Late Reporting</span>
                        <p className="text-xl font-bold text-amber-700 mt-0.5">{stats.late}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Approved Leave</span>
                        <p className="text-xl font-bold text-blue-700 mt-0.5">{stats.on_leave}</p>
                    </div>
                </div>

                {/* Staff Roster Table */}
                <form onSubmit={submitStaffAttendance} className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="py-3 px-4">Staff Member</th>
                                        <th className="py-3 px-4">Role / Department</th>
                                        <th className="py-3 px-4">Attendance Status</th>
                                        <th className="py-3 px-4">Clock In</th>
                                        <th className="py-3 px-4">Clock Out</th>
                                        <th className="py-3 px-4">Remarks / Duty Station</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {staffList.map((st) => {
                                        const rec = data.records.find((r) => r.staff_id === st.id) || {
                                            staff_id: st.id,
                                            status: 'present',
                                            time_in: '07:30',
                                            time_out: '17:00',
                                            remarks: '',
                                        };
                                        const isOnLeave = Boolean(activeLeaves[st.id]);

                                        return (
                                            <tr key={st.id} className="hover:bg-slate-50/50">
                                                <td className="py-3 px-4">
                                                    <div className="font-bold text-slate-900">{st.first_name} {st.last_name}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">EMP: {st.emp_id}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="text-slate-700 font-medium">{st.designation?.name || 'Staff'}</div>
                                                    <div className="text-[10px] text-slate-400">{st.department?.name || 'General'}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Select
                                                        value={rec.status}
                                                        onValueChange={(v: any) => updateStaffRow(st.id, 'status', v)}
                                                    >
                                                        <SelectTrigger className="h-8 text-xs w-44">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="present">Present (On Duty)</SelectItem>
                                                            <SelectItem value="late">Late Arrival</SelectItem>
                                                            <SelectItem value="absent">Absent Without Leave</SelectItem>
                                                            <SelectItem value="on_leave">On Approved Leave</SelectItem>
                                                            <SelectItem value="official_duty">Official Duty (ODS)</SelectItem>
                                                            <SelectItem value="half_day">Half Day Duty</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Input
                                                        type="time"
                                                        value={rec.time_in}
                                                        onChange={(e) => updateStaffRow(st.id, 'time_in', e.target.value)}
                                                        className="h-8 text-xs font-mono w-28"
                                                    />
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Input
                                                        type="time"
                                                        value={rec.time_out}
                                                        onChange={(e) => updateStaffRow(st.id, 'time_out', e.target.value)}
                                                        className="h-8 text-xs font-mono w-28"
                                                    />
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Input
                                                        value={rec.remarks}
                                                        onChange={(e) => updateStaffRow(st.id, 'remarks', e.target.value)}
                                                        placeholder="Notes, workshop name..."
                                                        className="h-8 text-xs"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="h-10 px-6 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            <span>Save Staff Attendance</span>
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}