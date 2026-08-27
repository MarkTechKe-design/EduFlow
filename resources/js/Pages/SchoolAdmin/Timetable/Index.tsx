import { useState } from 'react';
import { router, usePage, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import {
    Plus,
    Trash2,
    CalendarDays,
    User,
    Printer,
    Coffee,
    Utensils,
    BookOpen,
    CheckCircle2,
    Clock,
    Sparkles,
    AlertCircle,
    Settings,
    Building
} from 'lucide-react';
import type { SchoolClass, Section, Subject, Staff, Timetable, PageProps } from '@/types';

interface TimeSlotItem {
    id: number;
    label: string;
    start_time: string;
    end_time: string;
    type: 'lesson' | 'break';
    sort_order: number;
}

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface Props {
    classes: SchoolClass[];
    sections: Section[];
    subjects: Subject[];
    teachers: Staff[];
    periods: Timetable[];
    grid: Record<string, Record<string, Timetable>>;
    subjectCounts: Record<number, number>;
    days: DayOfWeek[];
    slots: TimeSlotItem[];
    filters: { class_id?: string; section_id?: string };
}

const DAY_LABELS: Record<string, string> = {
    monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed',
    thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};

const SUBJECT_COLORS = [
    'bg-indigo-50 text-indigo-900 border-indigo-200 hover:border-indigo-300',
    'bg-emerald-50 text-emerald-900 border-emerald-200 hover:border-emerald-300',
    'bg-sky-50 text-sky-900 border-sky-200 hover:border-sky-300',
    'bg-purple-50 text-purple-900 border-purple-200 hover:border-purple-300',
    'bg-amber-50 text-amber-900 border-amber-200 hover:border-amber-300',
    'bg-rose-50 text-rose-900 border-rose-200 hover:border-rose-300',
    'bg-teal-50 text-teal-900 border-teal-200 hover:border-teal-300',
    'bg-cyan-50 text-cyan-900 border-cyan-200 hover:border-cyan-300',
];

function fmt12(time: string) {
    if (!time) return '';
    const parts = time.split(':');
    const h = Number(parts[0]);
    const m = Number(parts[1] || 0);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function TimetableIndex({ classes, sections, subjects, teachers, periods, grid, subjectCounts, days, slots, filters }: Props) {
    const { flash } = usePage<PageProps>().props;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [slotsModalOpen, setSlotsModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{ day: DayOfWeek; slot: TimeSlotItem } | null>(null);
    const [existingPeriod, setExistingPeriod] = useState<Timetable | null>(null);

    // Custom Slots Editor State
    const [customSlots, setCustomSlots] = useState<TimeSlotItem[]>(slots);

    const { data, setData, post, processing, errors, reset } = useForm({
        class_id:    filters.class_id ?? '',
        section_id:  filters.section_id ?? '',
        subject_id:  '',
        teacher_id:  '',
        day_of_week: '' as DayOfWeek | '',
        start_time:  '',
        end_time:    '',
        room:        '',
        notes:       '',
    });

    function applyFilter(key: string, value: string) {
        router.get('/school/timetable', { ...filters, [key]: value || undefined }, { preserveScroll: true });
    }

    function openSlot(day: DayOfWeek, slot: TimeSlotItem) {
        const existing = grid[day]?.[slot.start_time] ?? grid[day]?.[slot.start_time + ':00'];
        setExistingPeriod(existing ?? null);
        setSelectedSlot({ day, slot });
        setData({
            class_id:    filters.class_id ?? '',
            section_id:  filters.section_id ?? '',
            subject_id:  existing ? String(existing.subject_id) : '',
            teacher_id:  existing?.teacher_id ? String(existing.teacher_id) : '',
            day_of_week: day,
            start_time:  slot.start_time,
            end_time:    slot.end_time,
            room:        existing?.room ?? '',
            notes:       existing?.notes ?? '',
        });
        setDialogOpen(true);
    }

    function handleSave(e: React.FormEvent) {
        e.preventDefault();
        post('/school/timetable', {
            onSuccess: () => { setDialogOpen(false); reset(); },
        });
    }

    function handleDelete(period: Timetable) {
        if (!confirm('Remove this period from schedule?')) return;
        router.delete(`/school/timetable/${period.id}`, { preserveScroll: true });
    }

    function handleSaveCustomSlots() {
        router.post('/school/timetable/slots/save', { slots: customSlots }, {
            onSuccess: () => setSlotsModalOpen(false),
        });
    }

    function addSlotRow(type: 'lesson' | 'break') {
        const newRow: TimeSlotItem = {
            id: Date.now(),
            label: type === 'break' ? 'Short Break' : `Period ${customSlots.filter(s => s.type === 'lesson').length + 1}`,
            start_time: '15:30',
            end_time: '16:15',
            type: type,
            sort_order: customSlots.length + 1,
        };
        setCustomSlots([...customSlots, newRow]);
    }

    function removeSlotRow(idx: number) {
        setCustomSlots(customSlots.filter((_, i) => i !== idx));
    }

    const filteredSections = filters.class_id
        ? sections.filter(s => s.class_id === Number(filters.class_id))
        : [];

    const currentClass = classes.find(c => String(c.id) === filters.class_id);
    const currentSection = sections.find(s => String(s.id) === filters.section_id);

    const subjectColorMap: Record<number, string> = {};
    subjects.forEach((s, i) => { subjectColorMap[s.id] = SUBJECT_COLORS[i % SUBJECT_COLORS.length]; });

    function getPeriod(day: DayOfWeek, slot: TimeSlotItem): Timetable | undefined {
        const dayGrid = grid[day] ?? {};
        return dayGrid[slot.start_time] ?? dayGrid[slot.start_time + ':00'];
    }

    const totalScheduled = periods?.length ?? 0;

    return (
        <AppLayout title="Timetable & Lesson Allocation">
            <div className="space-y-6 max-w-7xl mx-auto pb-16 print:p-0 print:max-w-none">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <CalendarDays className="w-5 h-5 text-indigo-600" />
                            <span>Institutional Timetable & Bell Schedule</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            KICD curriculum allocation, customizable break/period bell schedules, and conflict prevention.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => { setCustomSlots(slots); setSlotsModalOpen(true); }}
                            className="h-9 px-3 text-xs font-bold rounded-xl flex items-center gap-1.5 border-slate-200"
                        >
                            <Settings className="w-3.5 h-3.5 text-slate-600" />
                            <span>Customize Bell / Breaks</span>
                        </Button>

                        <Button asChild variant="outline" className="h-9 px-3 text-xs font-bold rounded-xl flex items-center gap-1.5 border-slate-200"><Link href="/school/timetable/master">
                                <Building className="w-3.5 h-3.5" />
                                <span>Master School Matrix</span>
                            </Link></Button>

                        <Button asChild className="h-9 px-3 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-1.5 shadow-2xs"><Link href="/school/timetable/teacher">
                                <User className="w-3.5 h-3.5" />
                                <span>Teacher Workload View</span>
                            </Link></Button>
                    </div>
                </div>

                {flash?.success && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-800 font-medium flex items-center gap-2 print:hidden">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* Filter Selector Bar */}
                <Card className="border-slate-200 shadow-2xs print:hidden">
                    <CardContent className="p-3.5">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="space-y-1">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Target Class</label>
                                <Select value={filters.class_id ?? ''} onValueChange={v => applyFilter('class_id', v)}>
                                    <SelectTrigger className="w-44 h-9 text-xs"><SelectValue placeholder="Select Class..." /></SelectTrigger>
                                    <SelectContent>
                                        {classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            {filteredSections.length > 0 && (
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Stream / Section</label>
                                    <Select value={filters.section_id ?? ''} onValueChange={v => applyFilter('section_id', v)}>
                                        <SelectTrigger className="w-40 h-9 text-xs"><SelectValue placeholder="All Streams" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All Streams</SelectItem>
                                            {filteredSections.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {filters.class_id && (
                                <div className="ml-auto flex items-center gap-3 self-end pb-1">
                                    <span className="text-xs text-slate-500">
                                        Total Scheduled: <strong className="text-slate-900 font-bold">{totalScheduled}</strong> lessons
                                    </span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* KICD Lesson Allocation Pills */}
                {subjects.length > 0 && filters.class_id && (
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5 print:hidden">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                <BookOpen className="w-4 h-4 text-indigo-600" />
                                <span>KICD Curriculum Allocation Tracker</span>
                            </span>
                            <span className="text-[11px] text-slate-500">Click any empty slot below to place subject periods</span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {subjects.map((s, i) => {
                                const count = subjectCounts[s.id] ?? 0;
                                const colorClass = SUBJECT_COLORS[i % SUBJECT_COLORS.length];

                                return (
                                    <div
                                        key={s.id}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-2 shadow-2xs ${colorClass}`}
                                    >
                                        <span>{s.name}</span>
                                        <span className="bg-white/80 px-1.5 py-0.2 rounded text-[10px] font-mono border border-current/20">
                                            {count} lessons
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Schedule Grid */}
                {!filters.class_id ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center shadow-2xs">
                        <CalendarDays className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                        <h3 className="text-sm font-bold text-slate-800">No Class Selected</h3>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            Choose a class from the selector above to manage its weekly timetable and pedagogical lesson slots.
                        </p>
                    </div>
                ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-x-auto print:border-slate-400">
                        <table className="w-full min-w-[760px] text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 print:bg-slate-100">
                                    <th className="py-3 px-3 text-xs font-bold uppercase tracking-wider w-28 text-center border-r border-slate-200">
                                        Time (EAT)
                                    </th>
                                    {days.map(day => (
                                        <th key={day} className="py-3 px-3 text-center text-xs font-bold uppercase tracking-wider border-r border-slate-200 last:border-0">
                                            {DAY_LABELS[day]}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-medium">
                                {slots.map((slot) => {
                                    if (slot.type === 'break') {
                                        const isTea = slot.label.toLowerCase().includes('tea') || slot.label.toLowerCase().includes('morning');

                                        return (
                                            <tr key={slot.id} className={isTea ? 'bg-amber-50/70 text-amber-950 font-bold border-y border-amber-200' : 'bg-emerald-50/70 text-emerald-950 font-bold border-y border-emerald-200'}>
                                                <td className="py-2.5 px-3 text-[11px] text-center font-mono whitespace-nowrap border-r border-current/20">
                                                    {fmt12(slot.start_time)} - {fmt12(slot.end_time)}
                                                </td>
                                                <td colSpan={days.length} className="py-2 px-4 text-center text-xs uppercase tracking-wider">
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

                                            {days.map(day => {
                                                const period = getPeriod(day, slot);
                                                const colorClass = period ? (subjectColorMap[period.subject_id] ?? SUBJECT_COLORS[0]) : '';

                                                return (
                                                    <td key={day} className="p-1.5 border-r border-slate-100 last:border-0 align-top w-[18%]">
                                                        {period ? (
                                                            <div
                                                                onClick={() => openSlot(day, slot)}
                                                                className={`p-2.5 rounded-xl border cursor-pointer hover:shadow-xs transition-all group relative ${colorClass}`}
                                                            >
                                                                <div className="font-black text-xs leading-tight truncate">
                                                                    {period.subject?.name ?? '—'}
                                                                </div>

                                                                {period.teacher && (
                                                                    <div className="text-[10px] text-slate-600 font-medium truncate mt-1 flex items-center gap-1">
                                                                        <User className="w-2.5 h-2.5 opacity-60" />
                                                                        <span>{period.teacher.first_name} {period.teacher.last_name}</span>
                                                                    </div>
                                                                )}

                                                                {period.room && (
                                                                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                                                                        Rm: {period.room}
                                                                    </div>
                                                                )}

                                                                <button
                                                                    type="button"
                                                                    onClick={e => { e.stopPropagation(); handleDelete(period); }}
                                                                    className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-white rounded transition-all print:hidden"
                                                                    title="Delete period"
                                                                >
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => openSlot(day, slot)}
                                                                className="w-full h-16 rounded-xl border border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/20 text-slate-300 hover:text-indigo-600 flex items-center justify-center transition-all print:hidden"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                            </button>
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
                )}
            </div>

            {/* Modal: Customize Institutional Bell Schedule & Breaks */}
            <Dialog open={slotsModalOpen} onOpenChange={setSlotsModalOpen}>
                <DialogContent className="sm:max-w-2xl rounded-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Settings className="w-4 h-4 text-indigo-600" />
                            <span>Institutional Bell Schedule & Breaks Configurator</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3 pt-2">
                        <p className="text-xs text-slate-500">
                            Add, adjust, or reorder lesson periods and break times (Tea Break, Lunch Break, Assembly, Prep) according to your school's daily routine.
                        </p>

                        <div className="space-y-2">
                            {customSlots.map((s, idx) => (
                                <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-12 gap-2 items-center text-xs">
                                    <div className="col-span-4">
                                        <Input
                                            value={s.label}
                                            onChange={e => {
                                                const copy = [...customSlots];
                                                copy[idx].label = e.target.value;
                                                setCustomSlots(copy);
                                            }}
                                            placeholder="Label (e.g. Tea Break)"
                                            className="h-8 text-xs bg-white"
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <Input
                                            type="time"
                                            value={s.start_time}
                                            onChange={e => {
                                                const copy = [...customSlots];
                                                copy[idx].start_time = e.target.value;
                                                setCustomSlots(copy);
                                            }}
                                            className="h-8 text-xs bg-white font-mono"
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <Input
                                            type="time"
                                            value={s.end_time}
                                            onChange={e => {
                                                const copy = [...customSlots];
                                                copy[idx].end_time = e.target.value;
                                                setCustomSlots(copy);
                                            }}
                                            className="h-8 text-xs bg-white font-mono"
                                        />
                                    </div>

                                    <div className="col-span-3">
                                        <Select
                                            value={s.type}
                                            onValueChange={(v: any) => {
                                                const copy = [...customSlots];
                                                copy[idx].type = v;
                                                setCustomSlots(copy);
                                            }}
                                        >
                                            <SelectTrigger className="h-8 text-xs bg-white"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="lesson">Lesson Period</SelectItem>
                                                <SelectItem value="break">Break / Lunch</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="col-span-1 text-right">
                                        <button
                                            type="button"
                                            onClick={() => removeSlotRow(idx)}
                                            className="p-1 text-red-500 hover:text-red-700"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => addSlotRow('lesson')} className="h-8 text-xs">
                                <Plus className="w-3 h-3 mr-1" /> Add Lesson Period
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => addSlotRow('break')} className="h-8 text-xs">
                                <Plus className="w-3 h-3 mr-1" /> Add Break / Lunch
                            </Button>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setSlotsModalOpen(false)} className="h-9 text-xs rounded-xl">
                            Cancel
                        </Button>
                        <Button type="button" onClick={handleSaveCustomSlots} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                            Save Institutional Schedule
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Slot Assignment */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                            <span>{existingPeriod ? 'Edit Lesson Slot' : 'Assign Lesson Slot'}</span>
                        </DialogTitle>
                    </DialogHeader>

                    {selectedSlot && (
                        <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between text-slate-700 font-semibold">
                            <span className="capitalize">{selectedSlot.day}</span>
                            <span className="font-mono">{fmt12(selectedSlot.slot.start_time)} – {fmt12(selectedSlot.slot.end_time)} ({selectedSlot.slot.label})</span>
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-4 pt-1">
                        <div>
                            <Label className="text-xs font-bold">Subject / Learning Area *</Label>
                            <Select value={data.subject_id} onValueChange={v => setData('subject_id', v)}>
                                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select subject..." /></SelectTrigger>
                                <SelectContent>
                                    {subjects.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {s.name} ({s.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.subject_id && <p className="text-xs text-red-500 mt-1">{errors.subject_id}</p>}
                        </div>

                        <div>
                            <Label className="text-xs font-bold">Assigned Subject Teacher</Label>
                            <Select value={data.teacher_id} onValueChange={v => setData('teacher_id', v)}>
                                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Assign teacher..." /></SelectTrigger>
                                <SelectContent>
                                    {teachers.map(t => (
                                        <SelectItem key={t.id} value={String(t.id)}>
                                            {t.first_name} {t.last_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.teacher_id && (
                                <div className="mt-1.5 p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                                    <span>{errors.teacher_id}</span>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Room / Lab / Studio</Label>
                                <Input
                                    value={data.room}
                                    onChange={e => setData('room', e.target.value)}
                                    placeholder="e.g. Science Lab 1 / Rm 6"
                                    className="h-9 text-xs mt-1"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-bold">Lesson Notes</Label>
                                <Input
                                    value={data.notes}
                                    onChange={e => setData('notes', e.target.value)}
                                    placeholder="e.g. Double period / Practical"
                                    className="h-9 text-xs mt-1"
                                />
                            </div>
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="h-9 text-xs rounded-xl">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                                {processing ? 'Saving...' : existingPeriod ? 'Update Period' : 'Save Lesson'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}