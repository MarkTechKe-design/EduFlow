import AppLayout from '@/Layouts/AppLayout';
import { useForm, router, Link } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    CalendarDays,
    Download,
    Printer,
    Plus,
    UserCheck,
    Copy,
    ArrowLeft,
    Clock,
    MapPin,
    Search,
    Trash2
} from 'lucide-react';

interface StaffItem {
    id: number;
    first_name: string;
    last_name: string;
    emp_id: string;
    phone?: string;
}

interface DutyAssignment {
    id: number;
    duty_station: string;
    day_of_week: string;
    shift: 'morning' | 'afternoon' | 'full_day';
    instructions?: string;
    assigned_staff?: StaffItem;
    replacement_staff?: StaffItem;
    replacement_reason?: string;
    replacement_scope?: 'full_week' | 'single_day' | 'custom_hours';
    replacement_time_window?: string;
    replacement_at?: string;
    replacement_changed_by?: { id: number; name: string };
}

interface DutyRosterItem {
    id: number;
    title: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
    assignments: DutyAssignment[];
}

interface Props {
    weekStart: string;
    weekEnd: string;
    academicPeriod: {
        academic_year: string;
        academic_year_id: number | null;
        term: string;
        week_number: number;
    };
    availableTerms: string[];
    rosters: DutyRosterItem[];
    staffList: StaffItem[];
    dutyStations: string[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function DutyRoster({ weekStart, weekEnd, academicPeriod, availableTerms, rosters, staffList, dutyStations }: Props) {
    const [filterWeek, setFilterWeek] = useState(weekStart);
    const [filterTerm, setFilterTerm] = useState(academicPeriod.term);
    const [filterWeekNum, setFilterWeekNum] = useState(String(academicPeriod.week_number));
    const [searchQuery, setSearchQuery] = useState('');

    // Create Roster Modal State
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const {
        data: rosterData,
        setData: setRosterData,
        post: postRoster,
        processing: rosterProcessing,
        reset: resetRoster
    } = useForm({
        title: `Teacher Duty Roster (${weekStart})`,
        start_date: weekStart,
        end_date: weekEnd,
        academic_year_id: academicPeriod.academic_year_id,
        term: academicPeriod.term,
        week_number: academicPeriod.week_number,
        assignments: [
            { staff_id: staffList[0]?.id || 0, duty_station: dutyStations[0] || 'Main Gate & Assembly', day_of_week: 'Monday', shift: 'full_day', instructions: '' }
        ],
    });

    // Copy Previous Week Confirmation State
    const [copyModalOpen, setCopyModalOpen] = useState(false);
    const {
        data: copyData,
        post: postCopy,
        processing: copyProcessing
    } = useForm({
        target_week_start: weekStart,
    });

    // Stand-In Modal State
    const [standInModalOpen, setStandInModalOpen] = useState(false);
    const [activeAssignment, setActiveAssignment] = useState<DutyAssignment | null>(null);
    const {
        data: standInData,
        setData: setStandInData,
        post: postStandIn,
        processing: standInProcessing,
        reset: resetStandIn
    } = useForm({
        assignment_id: 0,
        replacement_staff_id: '',
        replacement_reason: '',
        replacement_scope: 'single_day',
        replacement_time_window: '',
    });

    function handleWeekFilter(e: React.FormEvent) {
        e.preventDefault();
        router.get('/school/attendance/duty-roster', {
            week_start: filterWeek,
            term: filterTerm,
            week_number: filterWeekNum,
        }, { preserveState: true });
    }

    function addAssignmentRow() {
        setRosterData('assignments', [
            ...rosterData.assignments,
            { staff_id: staffList[0]?.id || 0, duty_station: dutyStations[0] || 'Main Gate & Assembly', day_of_week: 'Monday', shift: 'full_day', instructions: '' }
        ]);
    }

    function removeAssignmentRow(index: number) {
        setRosterData('assignments', rosterData.assignments.filter((_, i) => i !== index));
    }

    function updateAssignmentRow(index: number, field: string, value: any) {
        const copy = [...rosterData.assignments];
        copy[index] = { ...copy[index], [field]: value };
        setRosterData('assignments', copy);
    }

    function submitRoster(e: React.FormEvent) {
        e.preventDefault();
        postRoster('/school/attendance/duty-roster', {
            onSuccess: () => {
                setCreateModalOpen(false);
                resetRoster();
            },
        });
    }

    function handleCopyPreviousWeek(e: React.FormEvent) {
        e.preventDefault();
        postCopy('/school/attendance/duty-roster/duplicate-previous', {
            onSuccess: () => {
                setCopyModalOpen(false);
            },
        });
    }

    function openStandIn(assignment: DutyAssignment) {
        setActiveAssignment(assignment);
        setStandInData({
            assignment_id: assignment.id,
            replacement_staff_id: assignment.replacement_staff?.id ? String(assignment.replacement_staff.id) : '',
            replacement_reason: assignment.replacement_reason || '',
            replacement_scope: assignment.replacement_scope || 'single_day',
            replacement_time_window: assignment.replacement_time_window || '',
        });
        setStandInModalOpen(true);
    }

    function submitStandIn(e: React.FormEvent) {
        e.preventDefault();
        postStandIn('/school/attendance/duty-roster/stand-in', {
            onSuccess: () => {
                setStandInModalOpen(false);
                resetStandIn();
            },
        });
    }

    const allAssignments = useMemo(() => rosters.flatMap(r => r.assignments), [rosters]);

    // Search filter for duty matrix
    const filteredAssignments = useMemo(() => {
        if (!searchQuery.trim()) return allAssignments;
        const q = searchQuery.toLowerCase();
        return allAssignments.filter(a =>
            (a.assigned_staff?.first_name && a.assigned_staff.first_name.toLowerCase().includes(q)) ||
            (a.assigned_staff?.last_name && a.assigned_staff.last_name.toLowerCase().includes(q)) ||
            (a.assigned_staff?.emp_id && a.assigned_staff.emp_id.toLowerCase().includes(q)) ||
            (a.replacement_staff?.first_name && a.replacement_staff.first_name.toLowerCase().includes(q)) ||
            (a.replacement_staff?.last_name && a.replacement_staff.last_name.toLowerCase().includes(q)) ||
            (a.duty_station && a.duty_station.toLowerCase().includes(q)) ||
            (a.instructions && a.instructions.toLowerCase().includes(q))
        );
    }, [allAssignments, searchQuery]);

    const hasActiveAssignmentsForWeek = allAssignments.length > 0;

    return (
        <AppLayout title="Weekly Teacher on Duty (TOD) Roster">
            <div className="max-w-7xl mx-auto space-y-6 pb-16">
                {/* Screen Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/school/attendance/staff"
                            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <CalendarDays className="w-5 h-5 text-indigo-600" />
                                <span>Weekly Teacher on Duty (TOD) Roster</span>
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Weekly staff duty schedule across school stations with transparent stand-in tracking and recurring duplication.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => window.print()}
                            className="h-9 text-xs font-semibold rounded-xl flex items-center gap-2 bg-white"
                        >
                            <Printer className="w-4 h-4 text-slate-600" />
                            <span>Print Roster</span>
                        </Button>

                        <a
                            href={`/school/attendance/duty-roster/export-csv?week_start=${weekStart}`}
                            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            <Download className="w-4 h-4 text-slate-600" />
                            <span>Export CSV</span>
                        </a>

                        {!hasActiveAssignmentsForWeek && (
                            <Button
                                variant="outline"
                                onClick={() => setCopyModalOpen(true)}
                                className="h-9 text-xs font-semibold rounded-xl bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 flex items-center gap-2"
                            >
                                <Copy className="w-4 h-4 text-emerald-600" />
                                <span>Copy Previous Week</span>
                            </Button>
                        )}

                        <Button
                            onClick={() => setCreateModalOpen(true)}
                            className="h-9 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-sm"
                        >
                            <Plus className="w-4 h-4" />
                            <span>New Duty Schedule</span>
                        </Button>
                    </div>
                </div>

                {/* Print Title (Visible Only in Print Mode) */}
                <div className="hidden print:block text-center border-b pb-4 mb-4">
                    <h2 className="text-2xl font-bold uppercase tracking-wide">EDUFLOW — TEACHER ON DUTY ROSTER</h2>
                    <div className="flex items-center justify-center gap-6 mt-2 text-sm font-bold text-slate-700">
                        <span>Academic Year: {academicPeriod.academic_year}</span>
                        <span>•</span>
                        <span>Term: {academicPeriod.term}</span>
                        <span>•</span>
                        <span>Week: {academicPeriod.week_number}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 mt-1">Period: {weekStart} to {weekEnd}</p>
                </div>

                {/* Filter & Search Toolbar */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs print:hidden space-y-3">
                    <form onSubmit={handleWeekFilter} className="flex flex-col sm:flex-row gap-3 items-end">
                        <div className="flex gap-3">
                                <div>
                                    <Label className="text-xs font-bold text-slate-700">Term</Label>
                                    <Select value={filterTerm} onValueChange={setFilterTerm}>
                                        <SelectTrigger className="h-9 w-32 mt-1 text-xs">
                                            <SelectValue placeholder="Select Term" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableTerms.map(t => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs font-bold text-slate-700">Week No.</Label>
                                    <Input type="number" min="1" max="52" value={filterWeekNum} onChange={(e) => setFilterWeekNum(e.target.value)} className="h-9 w-20 mt-1 text-xs" />
                                </div>
                            </div>
                            <div className="w-full sm:w-48">
                                <Label className="text-xs font-bold text-slate-700">Week Starting (Mon)</Label>
                            <Input
                                type="date"
                                value={filterWeek}
                                onChange={(e) => setFilterWeek(e.target.value)}
                                className="h-9 text-xs mt-1"
                            />
                        </div>
                        <Button type="submit" className="h-9 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                            Filter Week
                        </Button>
                    </form>

                    {/* Duty Search */}
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            <Input
                                type="text"
                                placeholder="Search duty assignments by teacher, station, or stand-in..."
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

                {/* Schedule Matrix */}
                <div className="space-y-4">
                    {DAYS.map((day) => {
                        const dayAssignments = filteredAssignments.filter(a => a.day_of_week === day || a.day_of_week === 'All Week');

                        return (
                            <div key={day} className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden print:border-slate-400 print:shadow-none">
                                <div className="bg-slate-50/80 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>{day}</span>
                                    </h3>
                                    <span className="text-[11px] font-semibold text-slate-400">
                                        {dayAssignments.length} Station{dayAssignments.length === 1 ? '' : 's'} Covered
                                    </span>
                                </div>

                                {dayAssignments.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-slate-400 font-medium italic">
                                        {searchQuery ? `No assignments found for ${day} matching "${searchQuery}".` : `No teachers rostered for ${day}.`}
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-slate-50/40 text-slate-400 text-[10px] uppercase font-bold tracking-wider border-b border-slate-100">
                                                <tr>
                                                    <th className="py-2.5 px-4">Duty Station</th>
                                                    <th className="py-2.5 px-4">Assigned Teacher</th>
                                                    <th className="py-2.5 px-4">Shift</th>
                                                    <th className="py-2.5 px-4">Stand-in / Replacement</th>
                                                    <th className="py-2.5 px-4">Instructions</th>
                                                    <th className="py-2.5 px-4 text-right print:hidden">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 font-medium">
                                                {dayAssignments.map((asgn) => {
                                                    const hasStandIn = Boolean(asgn.replacement_staff);

                                                    return (
                                                        <tr key={asgn.id} className={hasStandIn ? "bg-amber-50/30" : "hover:bg-slate-50/50"}>
                                                            <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                                                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                                <span>{asgn.duty_station}</span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <div className={hasStandIn ? "line-through text-slate-400 font-normal" : "font-bold text-slate-800"}>
                                                                    {asgn.assigned_staff?.first_name} {asgn.assigned_staff?.last_name}
                                                                </div>
                                                                <div className="text-[10px] text-slate-400 font-mono">
                                                                    ID: {asgn.assigned_staff?.emp_id}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                                                                    {asgn.shift.replace('_', ' ')}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                {hasStandIn ? (
                                                                    <div>
                                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[11px] font-bold">
                                                                            <UserCheck className="w-3 h-3 text-amber-700" />
                                                                            {asgn.replacement_staff?.first_name} {asgn.replacement_staff?.last_name}
                                                                        </span>
                                                                        {asgn.replacement_scope && (
                                                                                <div className="text-[10px] text-amber-800 font-semibold mt-1 flex gap-1">
                                                                                    Scope: <span className="capitalize">{asgn.replacement_scope.replace('_', ' ')}</span>
                                                                                    {asgn.replacement_time_window && <span>({asgn.replacement_time_window})</span>}
                                                                                </div>
                                                                            )}
                                                                            {asgn.replacement_reason && (
                                                                                <div className="text-[10px] text-amber-800/80 mt-0.5">
                                                                                    Reason: {asgn.replacement_reason}
                                                                                </div>
                                                                            )}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-slate-400 italic text-[11px]">Primary Teacher on Duty</span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-4 text-slate-500 text-[11px]">
                                                                {asgn.instructions || '—'}
                                                            </td>
                                                            <td className="py-3 px-4 text-right print:hidden">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => openStandIn(asgn)}
                                                                    className="h-7 text-[11px] font-semibold rounded-lg text-slate-700"
                                                                >
                                                                    {hasStandIn ? 'Change Stand-In' : 'Assign Stand-In'}
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Modal: Copy Previous Week Confirmation */}
            <Dialog open={copyModalOpen} onOpenChange={setCopyModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <Copy className="w-5 h-5 text-emerald-600" />
                            <span>Copy Previous Week's Schedule</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Duplicate the station and teacher assignments from the most recent roster into week starting <strong>{weekStart}</strong>. All temporary stand-in replacements will be reset to their primary teachers.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleCopyPreviousWeek} className="space-y-4 py-2">
                        <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-900 space-y-1">
                            <p className="font-semibold">Clean Recurring Baseline:</p>
                            <p className="text-[11px]">Teachers assigned across all stations will carry over directly, saving repetitive manual setup.</p>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCopyModalOpen(false)}
                                className="h-9 text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={copyProcessing}
                                className="h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                Confirm & Duplicate
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Create Weekly Roster Modal */}
            <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <CalendarDays className="w-5 h-5 text-indigo-600" />
                            <span>Create Weekly Duty Roster</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Configure duty assignments across school stations for the selected week.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitRoster} className="space-y-4 py-2">
                        <div>
                            <Label className="text-xs font-bold text-slate-700">Roster Title</Label>
                            <Input
                                value={rosterData.title}
                                onChange={(e) => setRosterData('title', e.target.value)}
                                className="h-9 text-xs mt-1"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold text-slate-700">Start Date (Monday)</Label>
                                <Input
                                    type="date"
                                    value={rosterData.start_date}
                                    onChange={(e) => setRosterData('start_date', e.target.value)}
                                    className="h-9 text-xs mt-1"
                                    required
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-bold text-slate-700">End Date (Friday)</Label>
                                <Input
                                    type="date"
                                    value={rosterData.end_date}
                                    onChange={(e) => setRosterData('end_date', e.target.value)}
                                    className="h-9 text-xs mt-1"
                                    required
                                />
                            </div>
                        </div>

                        {/* Assignments List */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold text-slate-700">Duty Assignments</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addAssignmentRow}
                                    className="h-7 text-xs font-semibold flex items-center gap-1 text-indigo-600"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Station</span>
                                </Button>
                            </div>

                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {rosterData.assignments.map((asgn, idx) => (
                                    <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                            <div>
                                                <Label className="text-[10px] font-bold text-slate-600">Day</Label>
                                                <Select
                                                    value={asgn.day_of_week}
                                                    onValueChange={(v) => updateAssignmentRow(idx, 'day_of_week', v)}
                                                >
                                                    <SelectTrigger className="h-8 text-xs mt-1">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {DAYS.map(d => (
                                                            <SelectItem key={d} value={d}>{d}</SelectItem>
                                                        ))}
                                                        <SelectItem value="All Week">All Week</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label className="text-[10px] font-bold text-slate-600">Station</Label>
                                                <Select
                                                    value={asgn.duty_station}
                                                    onValueChange={(v) => updateAssignmentRow(idx, 'duty_station', v)}
                                                >
                                                    <SelectTrigger className="h-8 text-xs mt-1">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {dutyStations.map(st => (
                                                            <SelectItem key={st} value={st}>{st}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label className="text-[10px] font-bold text-slate-600">Teacher</Label>
                                                <Select
                                                    value={String(asgn.staff_id)}
                                                    onValueChange={(v) => updateAssignmentRow(idx, 'staff_id', Number(v))}
                                                >
                                                    <SelectTrigger className="h-8 text-xs mt-1">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {staffList.map(s => (
                                                            <SelectItem key={s.id} value={String(s.id)}>
                                                                {s.first_name} {s.last_name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label className="text-[10px] font-bold text-slate-600">Shift</Label>
                                                <Select
                                                    value={asgn.shift}
                                                    onValueChange={(v) => updateAssignmentRow(idx, 'shift', v)}
                                                >
                                                    <SelectTrigger className="h-8 text-xs mt-1">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="full_day">Full Day</SelectItem>
                                                        <SelectItem value="morning">Morning</SelectItem>
                                                        <SelectItem value="afternoon">Afternoon</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Input
                                                value={asgn.instructions}
                                                onChange={(e) => updateAssignmentRow(idx, 'instructions', e.target.value)}
                                                placeholder="Instructions (e.g. Ensure order during lunch transition)..."
                                                className="h-8 text-xs flex-1"
                                            />
                                            {rosterData.assignments.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeAssignmentRow(idx)}
                                                    className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setCreateModalOpen(false)}
                                className="h-9 text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={rosterProcessing}
                                className="h-9 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                Save Roster Schedule
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Assign Stand-In Modal */}
            <Dialog open={standInModalOpen} onOpenChange={setStandInModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-slate-900">
                            <UserCheck className="w-5 h-5 text-indigo-600" />
                            <span>Assign Stand-in Teacher</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Designate a replacement teacher for {activeAssignment?.duty_station} on {activeAssignment?.day_of_week}. The original teacher assignment remains intact for audit history.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitStandIn} className="space-y-4 py-2">
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                            <p className="text-slate-500">Original Assigned Teacher:</p>
                            <p className="font-bold text-slate-800">
                                {activeAssignment?.assigned_staff?.first_name} {activeAssignment?.assigned_staff?.last_name} ({activeAssignment?.assigned_staff?.emp_id})
                            </p>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-700">Stand-in / Replacement Teacher</Label>
                            <Select
                                value={standInData.replacement_staff_id}
                                onValueChange={(v) => setStandInData('replacement_staff_id', v === 'none' ? '' : v)}
                            >
                                <SelectTrigger className="h-9 text-xs mt-1">
                                    <SelectValue placeholder="Select replacement teacher" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">-- Remove Stand-in (Revert to Primary) --</SelectItem>
                                    {staffList
                                        .filter(s => s.id !== activeAssignment?.assigned_staff?.id)
                                        .map(s => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.first_name} {s.last_name} ({s.emp_id})
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold text-slate-700">Coverage Scope</Label>
                                <Select
                                    value={standInData.replacement_scope}
                                    onValueChange={(v: 'single_day' | 'full_week' | 'custom_hours') => setStandInData('replacement_scope', v)}
                                >
                                    <SelectTrigger className="h-9 text-xs mt-1">
                                        <SelectValue placeholder="Select Scope" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="single_day" className="text-xs">Single Day Only</SelectItem>
                                        <SelectItem value="full_week" className="text-xs">Entire Week / Shift</SelectItem>
                                        <SelectItem value="custom_hours" className="text-xs">Custom Hours Window</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {standInData.replacement_scope === 'custom_hours' && (
                                <div>
                                    <Label className="text-xs font-bold text-slate-700">Time Window / Hours</Label>
                                    <Input
                                        value={standInData.replacement_time_window}
                                        onChange={(e) => setStandInData('replacement_time_window', e.target.value)}
                                        placeholder="e.g. 08:00 AM - 12:30 PM"
                                        className="h-9 text-xs mt-1"
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-700">Reason for Stand-in</Label>
                            <Input
                                value={standInData.replacement_reason}
                                onChange={(e) => setStandInData('replacement_reason', e.target.value)}
                                placeholder="e.g. Teacher on official workshop, unwell, emergency..."
                                className="h-9 text-xs mt-1"
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStandInModalOpen(false)}
                                className="h-9 text-xs"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={standInProcessing}
                                className="h-9 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                Confirm Stand-In
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}