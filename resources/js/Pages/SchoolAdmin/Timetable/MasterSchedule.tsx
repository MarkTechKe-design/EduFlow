import { router, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, ArrowLeft, Printer, Coffee, Utensils, User, Building } from 'lucide-react';
import type { SchoolClass, Timetable, PageProps } from '@/types';

interface TimeSlotItem {
    id: number;
    label: string;
    start_time: string;
    end_time: string;
    type: 'lesson' | 'break';
    sort_order: number;
}

interface Props extends PageProps {
    classes: SchoolClass[];
    slots: TimeSlotItem[];
    masterGrid: Record<number, Record<string, Timetable>>;
    selectedDay: string;
    days: string[];
}

function fmt12(time: string) {
    if (!time) return '';
    const parts = time.split(':');
    const h = Number(parts[0]);
    const m = Number(parts[1] || 0);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function MasterSchedule({ classes, slots, masterGrid, selectedDay, days }: Props) {
    function changeDay(day: string) {
        router.get('/school/timetable/master', { day }, { preserveState: true });
    }

    return (
        <AppLayout title="Master School Timetable">
            <div className="space-y-6 max-w-7xl mx-auto pb-16 print:p-0 print:max-w-none">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
                    <div className="flex items-center gap-3">
                        <Link href="/school/timetable">
                            <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-xl">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Building className="w-5 h-5 text-indigo-600" />
                                <span>Master Institutional Timetable Matrix</span>
                            </h1>
                            <p className="text-xs text-slate-500 mt-1">
                                Whole-school class schedule across all grades and learning areas simultaneously.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => window.print()}
                            className="h-9 px-3 text-xs font-bold rounded-xl flex items-center gap-1.5 border-slate-200"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Daily Master</span>
                        </Button>
                    </div>
                </div>

                {/* Day Switcher */}
                <div className="flex flex-wrap gap-2 print:hidden">
                    {days.map(d => (
                        <button
                            key={d}
                            onClick={() => changeDay(d)}
                            className={`py-2 px-4 rounded-xl text-xs font-bold capitalize transition-all ${
                                selectedDay === d
                                    ? 'bg-slate-900 text-white shadow-2xs'
                                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                            }`}
                        >
                            {d} Master
                        </button>
                    ))}
                </div>

                {/* Master Grid Table */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-x-auto print:border-slate-400">
                    <table className="w-full min-w-[800px] text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
                                <th className="py-3 px-3 w-32 border-r border-slate-200 text-center">Class / Form</th>
                                {slots.map(s => (
                                    <th key={s.id} className="py-3 px-2 border-r border-slate-200 last:border-0 text-center">
                                        <div>{s.label}</div>
                                        <div className="text-[9px] text-slate-400 font-mono mt-0.5">{fmt12(s.start_time)} - {fmt12(s.end_time)}</div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                            {classes.map(c => (
                                <tr key={c.id} className="hover:bg-slate-50/50">
                                    <td className="py-3 px-3 font-black text-slate-900 border-r border-slate-200 bg-slate-50/50 text-center whitespace-nowrap">
                                        {c.name}
                                    </td>
                                    {slots.map(s => {
                                        if (s.type === 'break') {
                                            return (
                                                <td key={s.id} className="p-1 border-r border-slate-100 last:border-0 bg-slate-50 text-center text-[10px] font-bold text-slate-400">
                                                    BREAK
                                                </td>
                                            );
                                        }

                                        const period = masterGrid[c.id]?.[s.start_time];

                                        return (
                                            <td key={s.id} className="p-1.5 border-r border-slate-100 last:border-0 align-top">
                                                {period ? (
                                                    <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200">
                                                        <div className="font-bold text-indigo-950 text-[11px] truncate">{period.subject?.name}</div>
                                                        {period.teacher && (
                                                            <div className="text-[10px] text-slate-600 truncate mt-0.5">{period.teacher.first_name} {period.teacher.last_name}</div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="h-10 rounded-lg border border-dashed border-slate-100 flex items-center justify-center text-slate-300 text-[10px]">
                                                        —
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AppLayout>
    );
}