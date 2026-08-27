import { router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, CalendarDays, Coffee, Utensils } from 'lucide-react';
import type { Staff, Timetable, PageProps } from '@/types';

interface TimeSlotItem {
    id: number;
    label: string;
    start_time: string;
    end_time: string;
    type: 'lesson' | 'break';
    sort_order: number;
}

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface Props extends PageProps {
    teachers: Staff[];
    periods: Timetable[];
    grid: Record<string, Record<string, Timetable>>;
    slots: TimeSlotItem[];
    days: DayOfWeek[];
    isTeacherOnly: boolean;
    selectedStaff: Staff | null;
    filters: { teacher_id?: string };
}

const DAY_LABELS: Record<string, string> = {
    monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
    thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday',
};

const DAY_SHORT: Record<string, string> = {
    monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
    thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

function fmt12(time: string) {
    if (!time) return '';
    const parts = time.split(':');
    const h = Number(parts[0]);
    const m = Number(parts[1] || 0);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const COLORS = [
    'bg-indigo-50 text-indigo-900 border-indigo-200',
    'bg-emerald-50 text-emerald-900 border-emerald-200',
    'bg-sky-50 text-sky-900 border-sky-200',
    'bg-purple-50 text-purple-900 border-purple-200',
    'bg-amber-50 text-amber-900 border-amber-200',
    'bg-rose-50 text-rose-900 border-rose-200',
];

export default function TeacherSchedule({ teachers, periods, grid, slots = [], days = [], isTeacherOnly, selectedStaff, filters }: Props) {
    function applyFilter(key: string, value: string) {
        router.get('/school/timetable/teacher', { ...filters, [key]: value || undefined }, { preserveScroll: true });
    }

    const currentTeacher = selectedStaff || teachers.find(t => String(t.id) === filters.teacher_id);

    const dayCount: Record<string, number> = {};
    (periods || []).forEach(p => { dayCount[p.day_of_week] = (dayCount[p.day_of_week] ?? 0) + 1; });

    function getPeriod(day: DayOfWeek, slot: TimeSlotItem): Timetable | undefined {
        const dayGrid = grid[day] ?? {};
        return dayGrid[slot.start_time] ?? dayGrid[slot.start_time + ':00'];
    }

    return (
        <AppLayout title="Teacher Workload Schedule">
            <div className="space-y-6 max-w-7xl mx-auto pb-16">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/school/timetable">
                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <User className="w-5 h-5 text-indigo-600" />
                                <span>Teacher Workload & Weekly Schedule</span>
                            </h1>
                            <p className="text-xs text-slate-500 mt-1">
                                Individual educator timetable matrix and period distribution across classes.
                            </p>
                        </div>
                    </div>
                </div>

                {!isTeacherOnly && (
                    <Card className="border-slate-200 shadow-2xs">
                        <CardContent className="p-4">
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Select Teacher</label>
                                <Select value={filters.teacher_id ?? ''} onValueChange={v => applyFilter('teacher_id', v)}>
                                    <SelectTrigger className="w-72 h-9 text-xs"><SelectValue placeholder="Select faculty member..." /></SelectTrigger>
                                    <SelectContent>
                                        {teachers.map(t => (
                                            <SelectItem key={t.id} value={String(t.id)}>
                                                {t.first_name} {t.last_name} ({t.emp_id})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {!filters.teacher_id && !currentTeacher ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-2xs">
                        <User className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <h3 className="text-sm font-bold text-slate-800">No Teacher Selected</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            Choose a faculty member from the dropdown above to view their weekly teaching load.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {currentTeacher && (
                            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-base font-black text-slate-900">
                                        {currentTeacher.first_name} {currentTeacher.last_name}
                                    </h2>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        Staff ID: <span className="font-mono">{currentTeacher.emp_id}</span> • Total Teaching Load: <strong className="text-indigo-600">{periods?.length ?? 0} periods/week</strong>
                                    </p>
                                </div>

                                <div className="flex gap-1.5 flex-wrap">
                                    {(days || []).map(day => dayCount[day] ? (
                                        <Badge key={day} variant="outline" className="text-xs font-semibold bg-slate-50">
                                            {DAY_SHORT[day]}: {dayCount[day]} periods
                                        </Badge>
                                    ) : null)}
                                </div>
                            </div>
                        )}

                        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                                        <th className="py-3 px-3 text-xs font-bold uppercase tracking-wider w-28 text-center border-r border-slate-200">
                                            Time (EAT)
                                        </th>
                                        {(days || []).map(day => (
                                            <th key={day} className="py-3 px-3 text-center text-xs font-bold uppercase tracking-wider border-r border-slate-200 last:border-0">
                                                {DAY_SHORT[day]}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium">
                                    {(slots || []).map((slot, idx) => {
                                        if (slot.type === 'break') {
                                            const isTea = slot.label.toLowerCase().includes('tea') || slot.label.toLowerCase().includes('morning');
                                            return (
                                                <tr key={slot.id} className={isTea ? 'bg-amber-50/70 text-amber-950 font-bold border-y border-amber-200' : 'bg-emerald-50/70 text-emerald-950 font-bold border-y border-emerald-200'}>
                                                    <td className="py-2.5 px-3 text-[11px] text-center font-mono whitespace-nowrap border-r border-current/20">
                                                        {fmt12(slot.start_time)} - {fmt12(slot.end_time)}
                                                    </td>
                                                    <td colSpan={(days || []).length} className="py-2 px-4 text-center text-xs uppercase tracking-wider">
                                                        <div className="inline-flex items-center gap-2">
                                                            {isTea ? <Coffee className="w-3.5 h-3.5 text-amber-700" /> : <Utensils className="w-3.5 h-3.5 text-emerald-700" />}
                                                            <span>{slot.label}</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        return (
                                            <tr key={slot.id} className="hover:bg-slate-50/40 transition-colors">
                                                <td className="py-2 px-3 text-center border-r border-slate-200 bg-slate-50/30 whitespace-nowrap">
                                                    <div className="text-xs font-bold text-slate-800 font-mono">{fmt12(slot.start_time)}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">{fmt12(slot.end_time)}</div>
                                                    <div className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">{slot.label}</div>
                                                </td>

                                                {(days || []).map(day => {
                                                    const period = getPeriod(day, slot);
                                                    const color = period ? COLORS[idx % COLORS.length] : '';

                                                    return (
                                                        <td key={day} className="p-1.5 border-r border-slate-100 last:border-0 align-top w-[18%]">
                                                            {period ? (
                                                                <div className={`p-2.5 rounded-xl border ${color} shadow-2xs`}>
                                                                    <div className="font-black text-xs leading-tight truncate">
                                                                        {period.subject?.name ?? '—'}
                                                                    </div>
                                                                    <div className="text-[10px] font-semibold text-slate-700 mt-1 truncate">
                                                                        {period.school_class?.name ?? ''} {period.section?.name ? `(${period.section.name})` : ''}
                                                                    </div>
                                                                    {period.room && (
                                                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                                            Rm: {period.room}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="h-16 rounded-xl bg-slate-50/50 border border-slate-100" />
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}