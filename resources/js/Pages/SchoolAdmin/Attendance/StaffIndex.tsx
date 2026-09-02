import AppLayout from '@/Layouts/AppLayout';
import { useForm, router, Link } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import {  
    Users, 
    Save, 
    Calendar, 
    ShieldCheck, 
    Briefcase, 
    Search, 
    Maximize2, 
    Minimize2, 
    CalendarDays, 
    ExternalLink, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    UserCheck 
, Eye, Loader2 } from 'lucide-react';
import TeacherProfileDrawer, { TeacherProfileData } from '@/Components/TeacherProfileDrawer';

interface StaffItem {
    id: number;
    first_name: string;
    last_name: string;
    emp_id: string;
    phone?: string;
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

interface LeaveTypeItem {
    id: number;
    name: string;
    code: string;
    is_paid: boolean;
}

interface WeekDayItem {
    day: string;
    date: string;
}

interface AcademicPeriodInfo {
    academic_year: string;
    term: string;
    week_number: number;
    week_start: string;
    week_end: string;
}

interface Props {
    staffList: StaffItem[];
    existing: Record<number, ExistingRecord>;
    weeklyRecords?: Record<number, Record<string, ExistingRecord>>;
    weekDays?: WeekDayItem[];
    academicPeriod?: AcademicPeriodInfo;
    activeLeaves: Record<number, ActiveLeaveItem>;
    leaveTypes: LeaveTypeItem[];
    departments: { id: number; name: string }[];
    stats: {
        total: number;
        present: number;
        absent: number;
        on_leave: number;
        official_duty: number;
        half_day: number;
    };
    filters: {
        date: string;
        department_id: number | null;
        term?: string;
        week_number?: number;
    };
}

const OFFICIAL_DUTY_TYPES = [
    'Teacher on Duty',
    'Seminar / Workshop',
    'Official Meeting',
    'Examination Duty',
    'Sports Event',
    'Music / Drama Event',
    'School Club Activity',
    'Educational Trip',
    'County / Sub-county Assignment',
    'Other',
];

export default function StaffIndex({ staffList, existing, weeklyRecords = {}, weekDays = [], academicPeriod, activeLeaves, leaveTypes, departments, stats, filters }: Props) {
    const [date, setDate] = useState(filters.date || '');
    const [departmentId, setDepartmentId] = useState<string>(filters.department_id ? String(filters.department_id) : '');
    const [searchQuery, setSearchQuery] = useState('');
    const [isWideView, setIsWideView] = useState(false);
    function renderStatusBadge(status?: string) {
        switch (status) {
            case 'present':
                return <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs shadow-2xs" title="Present">P</span>;
            case 'absent':
                return <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-rose-100 text-rose-800 font-bold text-xs shadow-2xs" title="Absent">A</span>;
            case 'on_leave':
                return <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs shadow-2xs" title="Approved Leave">L</span>;
            case 'official_duty':
                return <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs shadow-2xs" title="Official Duty">D</span>;
            case 'half_day':
                return <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-purple-100 text-purple-800 font-bold text-xs shadow-2xs" title="Half Day">HD</span>;
            default:
                return <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-400 text-xs font-mono" title="Not Marked">—</span>;
        }
    }

    // Attendance batch form
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

    // Leave Modal State
    const [leaveModalOpen, setLeaveModalOpen] = useState(false);
    const [selectedStaffForLeave, setSelectedStaffForLeave] = useState<StaffItem | null>(null);
    const {
        data: leaveData,
        setData: setLeaveData,
        post: postLeave,
        processing: leaveProcessing,
        reset: resetLeave,
        errors: leaveErrors
    } = useForm({
        staff_id: 0,
        leave_type_id: leaveTypes[0]?.id ? String(leaveTypes[0].id) : '',
        start_date: filters.date,
        end_date: filters.date,
        reason: '',
        overwrite_conflicts: true,
    });

    // Official Duty Modal State
    const [dutyModalOpen, setDutyModalOpen] = useState(false);
    // 360° Teacher Profile Drawer State
    const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
    const [selectedProfileData, setSelectedProfileData] = useState<TeacherProfileData | null>(null);
    const [loadingProfileId, setLoadingProfileId] = useState<number | null>(null);

    const handleOpenProfile = async (staffId: number) => {
        try {
            setLoadingProfileId(staffId);
            const res = await fetch(`/school/attendance/staff/${staffId}/profile`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            if (res.ok) {
                const data = await res.json();
                setSelectedProfileData(data);
                setProfileDrawerOpen(true);
            }
        } catch (err) {
            console.error('Failed to load teacher profile', err);
        } finally {
            setLoadingProfileId(null);
        }
    };
    const [selectedStaffForDuty, setSelectedStaffForDuty] = useState<StaffItem | null>(null);
    const {
        data: dutyData,
        setData: setDutyData,
        post: postDuty,
        processing: dutyProcessing,
        reset: resetDuty,
        errors: dutyErrors
    } = useForm({
        staff_id: 0,
        start_date: filters.date,
        end_date: filters.date,
        duty_type: 'Teacher on Duty',
        custom_duty_notes: '',
        replacement_staff_id: '',
        notes: '',
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
        if (field === 'status') {
            if (value === 'on_leave') {
                const target = staffList.find(s => s.id === staffId);
                if (target) {
                    setSelectedStaffForLeave(target);
                    setLeaveData(prev => ({
                        ...prev,
                        staff_id: target.id,
                        start_date: date,
                        end_date: date,
                    }));
                    setLeaveModalOpen(true);
                    return;
                }
            } else if (value === 'official_duty') {
                const target = staffList.find(s => s.id === staffId);
                if (target) {
                    setSelectedStaffForDuty(target);
                    setDutyData(prev => ({
                        ...prev,
                        staff_id: target.id,
                        start_date: date,
                        end_date: date,
                    }));
                    setDutyModalOpen(true);
                    return;
                }
            }
        }

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

    function handleLeaveSubmit(e: React.FormEvent) {
        e.preventDefault();
        postLeave('/school/attendance/staff/apply-leave', {
            onSuccess: () => {
                setLeaveModalOpen(false);
                resetLeave();
            },
        });
    }

    function handleDutySubmit(e: React.FormEvent) {
        e.preventDefault();
        postDuty('/school/attendance/staff/assign-duty', {
            onSuccess: () => {
                setDutyModalOpen(false);
                resetDuty();
            },
        });
    }

    // Filtered staff list using search query
    const filteredStaff = useMemo(() => {
        if (!searchQuery.trim()) return staffList;
        const q = searchQuery.toLowerCase();
        return staffList.filter(st => 
            st.first_name.toLowerCase().includes(q) ||
            st.last_name.toLowerCase().includes(q) ||
            (st.emp_id && st.emp_id.toLowerCase().includes(q)) ||
            (st.department?.name && st.department.name.toLowerCase().includes(q)) ||
            (st.designation?.name && st.designation.name.toLowerCase().includes(q))
        );
    }, [staffList, searchQuery]);

    return (
        <AppLayout title="Teacher Attendance & Duty Management">
            <div className={`space-y-5 sm:space-y-6 pb-20 transition-all duration-200 px-3 sm:px-6 w-full ${isWideView ? 'max-w-none' : 'max-w-7xl mx-auto'}`}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-emerald-600" />
                            <span>Teacher Attendance & Duty Management</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Human-friendly daily attendance tracking with automated approved leave, official duty assignments, and stand-in tracking.
                        </p>
                        {academicPeriod && (
                            <div className="flex flex-wrap items-center gap-2 mt-2.5">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                    AY: {academicPeriod.academic_year}
                                </span>
                                <select 
                                    value={academicPeriod.term}
                                    onChange={(e) => {
                                        router.get('/school/attendance/staff', {
                                            term: e.target.value,
                                            week_number: academicPeriod.week_number,
                                            department_id: departmentId || undefined
                                        }, { preserveState: true });
                                    }}
                                    aria-label="Academic Term"
                                    className="h-6 text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2 py-0 cursor-pointer focus:ring-1 focus:ring-purple-400"
                                >
                                    <option value="Term 1">Term 1</option>
                                    <option value="Term 2">Term 2</option>
                                    <option value="Term 3">Term 3</option>
                                </select>
                                <select 
                                    value={academicPeriod.week_number}
                                    onChange={(e) => {
                                        router.get('/school/attendance/staff', {
                                            term: academicPeriod.term,
                                            week_number: e.target.value,
                                            department_id: departmentId || undefined
                                        }, { preserveState: true });
                                    }}
                                    aria-label="Term Week Number"
                                    className="h-6 text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-2 py-0 cursor-pointer focus:ring-1 focus:ring-amber-400"
                                >
                                    {Array.from({ length: 14 }, (_, i) => i + 1).map((w) => (
                                        <option key={w} value={w}>Week {w}</option>
                                    ))}
                                </select>
                                <span className="text-[11px] font-medium text-slate-400">
                                    ({academicPeriod.week_start} to {academicPeriod.week_end})
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsWideView(!isWideView)}
                            className="h-9 px-3 text-xs font-semibold rounded-xl border-slate-200 text-slate-700 hover:bg-slate-100 flex items-center gap-1.5"
                            title={isWideView ? "Switch to Standard View" : "Switch to Wide View"}
                        >
                            {isWideView ? <Minimize2 className="w-3.5 h-3.5 text-slate-600" /> : <Maximize2 className="w-3.5 h-3.5 text-slate-600" />}
                            <span>{isWideView ? 'Standard View' : 'Wide View'}</span>
                        </Button>

                        <Link
                            href="/school/attendance/duty-roster"
                            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                        >
                            <CalendarDays className="w-4 h-4" />
                            <span>Weekly Duty Roster (TOD)</span>
                            <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
                        </Link>
                    </div>
                </div>

                {/* Filter & Search Toolbar */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                    <form onSubmit={handleFilter} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                        <div>
                            <Label className="text-xs font-bold text-slate-700">Attendance Date</Label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="h-9 text-xs mt-1"
                            />
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-700">Department Filter</Label>
                            <Select value={departmentId} onValueChange={setDepartmentId}>
                                <SelectTrigger className="h-9 text-xs mt-1">
                                    <SelectValue placeholder="All Departments" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departments.map((d) => (
                                        <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="sm:col-span-2 flex items-end gap-2">
                            <Button type="submit" className="h-9 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                                Load Register
                            </Button>
                        </div>
                    </form>

                    {/* Search Bar */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            <Input
                                type="text"
                                placeholder="Search teacher by name, TSC/Emp ID, designation, or department..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 text-xs w-full bg-slate-50 border-slate-200 focus:bg-white"
                            />
                        </div>
                        {searchQuery && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setSearchQuery('')}
                                className="h-9 text-xs text-slate-500 hover:text-slate-700"
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                </div>

                {/* Daily Status KPI Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Staff</span>
                        <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.total}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Present</span>
                        <p className="text-xl font-bold text-emerald-700 mt-0.5">{stats.present}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Absent</span>
                        <p className="text-xl font-bold text-rose-700 mt-0.5">{stats.absent}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Approved Leave</span>
                        <p className="text-xl font-bold text-blue-700 mt-0.5">{stats.on_leave}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Official Duty</span>
                        <p className="text-xl font-bold text-amber-700 mt-0.5">{stats.official_duty}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-purple-50/60 border border-purple-200 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800">Half Day</span>
                        <p className="text-xl font-bold text-purple-700 mt-0.5">{stats.half_day}</p>
                    </div>
                </div>

                {/* Staff Attendance Register Table */}
                                {isWideView ? (
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden space-y-4">
                        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-indigo-600" />
                                    <span>Weekly Register View — Monday to Friday</span>
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Live multi-day roll call register with cumulative weekly totals.
                                </p>
                            </div>
                            <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600">
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Present (P)</span>
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Absent (A)</span>
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Leave (L)</span>
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Duty (D)</span>
                                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span> Half Day (HD)</span>
                            </div>
                        </div>

                        <div className="overflow-x-auto relative pb-2">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-slate-100/90 text-slate-600 text-[11px] uppercase font-bold tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="py-3 px-4 min-w-[200px] sticky left-0 bg-slate-100 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Teacher / Staff</th>
                                        <th className="py-3 px-4 min-w-[140px]">Department</th>
                                        {weekDays.map((d) => (
                                            <th key={d.date} className="py-3 px-3 text-center min-w-[70px]">
                                                <div>{d.day}</div>
                                                <div className="text-[9px] font-mono text-slate-400 font-normal">{d.date.slice(5)}</div>
                                            </th>
                                        ))}
                                        <th className="py-3 px-3 text-center min-w-[60px] bg-emerald-50/50 text-emerald-800">Pres</th>
                                        <th className="py-3 px-3 text-center min-w-[60px] bg-rose-50/50 text-rose-800">Abs</th>
                                        <th className="py-3 px-3 text-center min-w-[60px] bg-blue-50/50 text-blue-800">Leave</th>
                                        <th className="py-3 px-3 text-center min-w-[60px] bg-amber-50/50 text-amber-800">Duty</th>
                                        <th className="py-3 px-3 text-center min-w-[60px] bg-purple-50/50 text-purple-800">Half</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {filteredStaff.length === 0 ? (
                                        <tr>
                                            <td colSpan={6 + weekDays.length} className="py-8 text-center text-slate-400 italic">
                                                No staff members found matching "{searchQuery}".
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStaff.map((st) => {
                                            const staffWeek = weeklyRecords[st.id] || {};
                                            let presCount = 0, absCount = 0, leaveCount = 0, dutyCount = 0, halfCount = 0;

                                            weekDays.forEach((d) => {
                                                const dayRec = staffWeek[d.date];
                                                if (dayRec) {
                                                    if (dayRec.status === 'present' || dayRec.status === 'late') presCount++;
                                                    else if (dayRec.status === 'absent') absCount++;
                                                    else if (dayRec.status === 'on_leave') leaveCount++;
                                                    else if (dayRec.status === 'official_duty') dutyCount++;
                                                    else if (dayRec.status === 'half_day') halfCount++;
                                                }
                                            });

                                            return (
                                                <tr key={st.id} className="hover:bg-slate-50/60">
                                                    <td className="py-3 px-4 sticky left-0 bg-white z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div>
                                                                <div className="font-bold text-slate-900">{st.first_name} {st.last_name}</div>
                                                                <div className="text-[10px] text-slate-400 font-mono">TSC/EMP: {st.emp_id}</div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenProfile(st.id)}
                                                                disabled={loadingProfileId === st.id}
                                                                title="View 360° Teacher Profile"
                                                                className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 transition"
                                                            >
                                                                <Eye className="w-3 h-3" />
                                                                <span>360°</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-600">
                                                        <div>{st.department?.name || 'Academics'}</div>
                                                        <div className="text-[10px] text-slate-400">{st.designation?.name || 'Teacher'}</div>
                                                    </td>
                                                    {weekDays.map((d) => {
                                                        const dayRec = staffWeek[d.date];
                                                        return (
                                                            <td key={d.date} className="py-3 px-2 text-center">
                                                                {renderStatusBadge(dayRec?.status)}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="py-3 px-2 text-center font-bold text-emerald-700 bg-emerald-50/20">{presCount}</td>
                                                    <td className="py-3 px-2 text-center font-bold text-rose-700 bg-rose-50/20">{absCount}</td>
                                                    <td className="py-3 px-2 text-center font-bold text-blue-700 bg-blue-50/20">{leaveCount}</td>
                                                    <td className="py-3 px-2 text-center font-bold text-amber-700 bg-amber-50/20">{dutyCount}</td>
                                                    <td className="py-3 px-2 text-center font-bold text-purple-700 bg-purple-50/20">{halfCount}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                <form onSubmit={submitStaffAttendance} className="space-y-4">
                                            {/* Mobile Optimized Card View for Roll Call (Phones & Small Screens) */}
                        <div className="md:hidden space-y-3">
                            {filteredStaff.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 italic bg-white rounded-2xl border border-slate-200">
                                    No staff members found matching "{searchQuery}".
                                </div>
                            ) : (
                                filteredStaff.map((st) => {
                                    const rec = data.records.find((r) => r.staff_id === st.id) || {
                                        staff_id: st.id,
                                        status: 'present',
                                        time_in: '07:30',
                                        time_out: '17:00',
                                        remarks: '',
                                    };
                                    const activeLeave = activeLeaves[st.id];
                                    const isOnLeave = !!activeLeave;

                                    return (
                                        <div key={st.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                                            {/* Teacher Header */}
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0 flex-1">
                                                    <div className="font-bold text-slate-900 text-sm flex flex-wrap items-center gap-1.5">
                                                        <span>{st.first_name} {st.last_name}</span>
                                                        {isOnLeave && (
                                                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                                                Leave
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[11px] text-slate-500 mt-0.5">
                                                        {st.designation?.name || 'Teacher'} • <span className="text-slate-400">{st.department?.name || 'Academics'}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                        TSC/EMP: {st.emp_id || 'N/A'}
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenProfile(st.id)}
                                                    disabled={loadingProfileId === st.id}
                                                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 shrink-0 transition"
                                                >
                                                    {loadingProfileId === st.id ? (
                                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <Eye className="w-3.5 h-3.5" />
                                                    )}
                                                    <span>360°</span>
                                                </button>
                                            </div>

                                            {/* Status Selector */}
                                            <div>
                                                <Label className="text-[11px] font-bold text-slate-600 block mb-1">Attendance Status</Label>
                                                <Select
                                                    value={rec.status === 'late' ? 'present' : rec.status}
                                                    onValueChange={(v: any) => updateStaffRow(st.id, 'status', v)}
                                                >
                                                    <SelectTrigger className="h-9 text-xs w-full font-semibold">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="present">
                                                            <span className="flex items-center gap-2 text-emerald-700 font-bold">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Present
                                                            </span>
                                                        </SelectItem>
                                                        <SelectItem value="absent">
                                                            <span className="flex items-center gap-2 text-rose-700 font-bold">
                                                                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Absent
                                                            </span>
                                                        </SelectItem>
                                                        <SelectItem value="on_leave">
                                                            <span className="flex items-center gap-2 text-blue-700 font-bold">
                                                                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Approved Leave...
                                                            </span>
                                                        </SelectItem>
                                                        <SelectItem value="official_duty">
                                                            <span className="flex items-center gap-2 text-amber-700 font-bold">
                                                                <span className="w-2 h-2 rounded-full bg-amber-500"></span> Official Duty...
                                                            </span>
                                                        </SelectItem>
                                                        <SelectItem value="half_day">
                                                            <span className="flex items-center gap-2 text-purple-700 font-bold">
                                                                <span className="w-2 h-2 rounded-full bg-purple-500"></span> Half Day
                                                            </span>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Times: Time In & Time Out in 2 columns */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <Label className="text-[10px] font-bold text-slate-500 block mb-1">Time In</Label>
                                                    <Input
                                                        type="time"
                                                        value={rec.time_in}
                                                        onChange={(e) => updateStaffRow(st.id, 'time_in', e.target.value)}
                                                        className="h-8 text-xs font-mono w-full"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-[10px] font-bold text-slate-500 block mb-1">Time Out</Label>
                                                    <Input
                                                        type="time"
                                                        value={rec.time_out}
                                                        onChange={(e) => updateStaffRow(st.id, 'time_out', e.target.value)}
                                                        className="h-8 text-xs font-mono w-full"
                                                    />
                                                </div>
                                            </div>

                                            {/* Remarks */}
                                            <div>
                                                <Input
                                                    type="text"
                                                    value={rec.remarks}
                                                    onChange={(e) => updateStaffRow(st.id, 'remarks', e.target.value)}
                                                    placeholder="Notes, remarks or TOD assignment..."
                                                    className="h-8 text-xs w-full"
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Desktop Table (hidden on mobile, visible on md+) */}
                        <div className="hidden md:block rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                                    <tr>
                                        <th className="py-3 px-4 min-w-[180px]">Teacher / Staff Member</th>
                                        <th className="py-3 px-4 min-w-[140px]">Role & Department</th>
                                        <th className="py-3 px-4 min-w-[160px]">Attendance Status</th>
                                        <th className="py-3 px-4 min-w-[100px]">Time In</th>
                                        <th className="py-3 px-4 min-w-[100px]">Time Out</th>
                                        <th className="py-3 px-4 min-w-[200px]">Notes / Activity Details</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {filteredStaff.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                                                No staff members found matching "{searchQuery}".
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStaff.map((st) => {
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
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div>
                                                                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                                                    <span>{st.first_name} {st.last_name}</span>
                                                                    {isOnLeave && (
                                                                        <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                                                            From Leave Mgmt
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-[10px] text-slate-400 font-mono">TSC/EMP: {st.emp_id}</div>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenProfile(st.id)}
                                                                disabled={loadingProfileId === st.id}
                                                                title="View 360° Teacher Profile"
                                                                className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 transition shrink-0"
                                                            >
                                                                {loadingProfileId === st.id ? (
                                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                                ) : (
                                                                    <Eye className="w-3 h-3" />
                                                                )}
                                                                <span>360°</span>
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="text-slate-700 font-medium">{st.designation?.name || 'Teacher'}</div>
                                                        <div className="text-[10px] text-slate-400">{st.department?.name || 'Academics'}</div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Select
                                                            value={rec.status === 'late' ? 'present' : rec.status}
                                                            onValueChange={(v: any) => updateStaffRow(st.id, 'status', v)}
                                                        >
                                                            <SelectTrigger className="h-8 text-xs w-44 font-semibold">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="present">
                                                                    <span className="flex items-center gap-2 text-emerald-700 font-bold">
                                                                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                                                        Present
                                                                    </span>
                                                                </SelectItem>
                                                                <SelectItem value="absent">
                                                                    <span className="flex items-center gap-2 text-rose-700 font-bold">
                                                                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                                                        Absent
                                                                    </span>
                                                                </SelectItem>
                                                                <SelectItem value="on_leave">
                                                                    <span className="flex items-center gap-2 text-blue-700 font-bold">
                                                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                                        Approved Leave...
                                                                    </span>
                                                                </SelectItem>
                                                                <SelectItem value="official_duty">
                                                                    <span className="flex items-center gap-2 text-amber-700 font-bold">
                                                                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                                                        Official Duty...
                                                                    </span>
                                                                </SelectItem>
                                                                <SelectItem value="half_day">
                                                                    <span className="flex items-center gap-2 text-purple-700 font-bold">
                                                                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                                                        Half Day
                                                                    </span>
                                                                </SelectItem>
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
                                                            placeholder="Notes, TOD station, reason..."
                                                            className="h-8 text-xs"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="h-10 px-6 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-2 shadow-sm"
                        >
                            <Save className="w-4 h-4" />
                            <span>Save Daily Register</span>
                        </Button>
                    </div>
                </form>
                )}
            </div>

            {/* Modal 1: Approved Leave */}
            <Dialog open={leaveModalOpen} onOpenChange={setLeaveModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <Calendar className="w-5 h-5 text-blue-600" />
                            <span>Mark Approved Leave</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Apply an authorized leave period for {selectedStaffForLeave?.first_name} {selectedStaffForLeave?.last_name}. Weekends and holidays are automatically excluded.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleLeaveSubmit} className="space-y-4 py-2">
                        <div>
                            <Label className="text-xs font-bold text-slate-700">Leave Category</Label>
                            <Select
                                value={String(leaveData.leave_type_id)}
                                onValueChange={(v) => setLeaveData('leave_type_id', v)}
                            >
                                <SelectTrigger className="h-9 text-xs mt-1">
                                    <SelectValue placeholder="Select leave category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {leaveTypes.map((lt) => (
                                        <SelectItem key={lt.id} value={String(lt.id)}>
                                            {lt.name} {lt.is_paid ? '(Paid)' : '(Unpaid)'}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {leaveErrors.leave_type_id && (
                                <p className="text-[11px] text-rose-600 mt-1">{leaveErrors.leave_type_id}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold text-slate-700">Leave Start</Label>
                                <Input
                                    type="date"
                                    value={leaveData.start_date}
                                    onChange={(e) => setLeaveData('start_date', e.target.value)}
                                    className="h-9 text-xs mt-1"
                                    required
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-bold text-slate-700">Leave Until</Label>
                                <Input
                                    type="date"
                                    value={leaveData.end_date}
                                    onChange={(e) => setLeaveData('end_date', e.target.value)}
                                    className="h-9 text-xs mt-1"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-700">Reason / Reference Notes</Label>
                            <Textarea
                                value={leaveData.reason}
                                onChange={(e) => setLeaveData('reason', e.target.value)}
                                placeholder="e.g., Medical leave approved by principal..."
                                className="text-xs mt-1 min-h-[70px]"
                            />
                        </div>

                        <div className="rounded-xl bg-blue-50/70 p-3 border border-blue-200/80 text-[11px] text-blue-800 space-y-1">
                            <p className="font-semibold flex items-center gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                                Automatic Calendar Validation:
                            </p>
                            <p>EduFlow will verify the school academic calendar and mark school days as On Leave without counting official holidays or weekends.</p>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setLeaveModalOpen(false)}
                                className="h-9 text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={leaveProcessing}
                                className="h-9 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Confirm & Record Leave
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Modal 2: Official Duty */}
            <Dialog open={dutyModalOpen} onOpenChange={setDutyModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <Briefcase className="w-5 h-5 text-amber-600" />
                            <span>Assign Official Duty (ODS)</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Record institutional off-station assignments, workshops, or TOD schedules for {selectedStaffForDuty?.first_name} {selectedStaffForDuty?.last_name}.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleDutySubmit} className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold text-slate-700">Duty From</Label>
                                <Input
                                    type="date"
                                    value={dutyData.start_date}
                                    onChange={(e) => setDutyData('start_date', e.target.value)}
                                    className="h-9 text-xs mt-1"
                                    required
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-bold text-slate-700">Duty Until</Label>
                                <Input
                                    type="date"
                                    value={dutyData.end_date}
                                    onChange={(e) => setDutyData('end_date', e.target.value)}
                                    className="h-9 text-xs mt-1"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-700">Official Duty Type</Label>
                            <Select
                                value={dutyData.duty_type}
                                onValueChange={(v) => setDutyData('duty_type', v)}
                            >
                                <SelectTrigger className="h-9 text-xs mt-1">
                                    <SelectValue placeholder="Select official duty type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {OFFICIAL_DUTY_TYPES.map((dt) => (
                                        <SelectItem key={dt} value={dt}>{dt}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Conditional Other Field */}
                        {dutyData.duty_type === 'Other' && (
                            <div className="animate-in fade-in duration-200">
                                <Label className="text-xs font-bold text-amber-900">Specify Official Duty *</Label>
                                <Input
                                    value={dutyData.custom_duty_notes}
                                    onChange={(e) => setDutyData('custom_duty_notes', e.target.value)}
                                    placeholder="e.g. Attended County Education Stakeholder Meeting..."
                                    className="h-9 text-xs mt-1 border-amber-300 focus-visible:ring-amber-500"
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <Label className="text-xs font-bold text-slate-700">Stand-in / Replacement Teacher (Optional)</Label>
                            <Select
                                value={dutyData.replacement_staff_id}
                                onValueChange={(v) => setDutyData('replacement_staff_id', v === 'none' ? '' : v)}
                            >
                                <SelectTrigger className="h-9 text-xs mt-1">
                                    <SelectValue placeholder="Select replacement teacher if applicable" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-- No Stand-in Assigned --</SelectItem>
                                    {staffList
                                        .filter(s => s.id !== selectedStaffForDuty?.id)
                                        .map((st) => (
                                            <SelectItem key={st.id} value={String(st.id)}>
                                                {st.first_name} {st.last_name} ({st.designation?.name || 'Staff'})
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-700">Instructions / Handover Notes</Label>
                            <Textarea
                                value={dutyData.notes}
                                onChange={(e) => setDutyData('notes', e.target.value)}
                                placeholder="Location, organizer, or delegation handover instructions..."
                                className="text-xs mt-1 min-h-[60px]"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDutyModalOpen(false)}
                                className="h-9 text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={dutyProcessing}
                                className="h-9 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                Confirm Official Duty
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* 360° Teacher Profile Slide-over Drawer */}
            <TeacherProfileDrawer
                profile={selectedProfileData}
                isOpen={profileDrawerOpen}
                onClose={() => setProfileDrawerOpen(false)}
            />
        </AppLayout>
    );
}