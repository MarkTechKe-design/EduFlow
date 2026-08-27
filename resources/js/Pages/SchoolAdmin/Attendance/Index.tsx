import AppLayout from '@/Layouts/AppLayout';
import { useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, UserCheck, Save, Send } from 'lucide-react';

interface StudentItem {
    id: number;
    first_name: string;
    last_name: string;
    admission_no?: string; admission_number?: string;
    roll_no?: string;
    gender: string;
    section?: { id: number; name: string };
    guardian_phone?: string;
}

interface ExistingRecord {
    attendable_id: number;
    status: 'present' | 'absent' | 'late' | 'excused' | 'official_activity';
    remarks?: string;
    time_in?: string;
    notification_sent?: boolean;
}

interface Props {
    classes: { id: number; name: string }[];
    sections: { id: number; class_id: number; name: string }[];
    students: StudentItem[];
    existing: Record<number, ExistingRecord>;
    stats: {
        total: number;
        present: number;
        absent: number;
        late: number;
        excused: number;
    };
    filters: {
        date: string;
        session: 'morning' | 'afternoon' | 'evening_dorm';
        class_id: number | null;
        section_id: number | null;
    };
}

export default function AttendanceIndex({ classes, sections, students, existing, stats, filters }: Props) {
    const [date, setDate] = useState(filters.date || '');
    const [session, setSession] = useState(filters.session || 'morning');
    const [classId, setClassId] = useState<string>(filters.class_id ? String(filters.class_id) : '');
    const [sectionId, setSectionId] = useState<string>(filters.section_id ? String(filters.section_id) : '');

    const filteredSections = sections.filter((s) => !classId || s.class_id === Number(classId));

    const { data, setData, post, processing } = useForm<{
        date: string;
        session: string;
        class_id: number;
        send_absence_sms: boolean;
        records: {
            student_id: number;
            status: 'present' | 'absent' | 'late' | 'excused' | 'official_activity';
            remarks: string;
            time_in: string;
        }[];
    }>({
        date: filters.date,
        session: filters.session,
        class_id: filters.class_id || 0,
        send_absence_sms: true,
        records: [],
    });

    useEffect(() => {
        if (students.length > 0) {
            const initialRecords = students.map((s) => {
                const ex = existing[s.id];
                return {
                    student_id: s.id,
                    status: ex ? ex.status : 'present',
                    remarks: ex ? ex.remarks || '' : '',
                    time_in: ex ? ex.time_in || '' : '',
                };
            });
            setData('records', initialRecords);
        }
    }, [students, existing]);

    function handleFilterSubmit(e: React.FormEvent) {
        e.preventDefault();
        router.get('/school/attendance', {
            date,
            session,
            class_id: classId || undefined,
            section_id: sectionId || undefined,
        }, { preserveState: true });
    }

    function setAllStatus(status: 'present' | 'absent') {
        const updated = data.records.map((r) => ({ ...r, status }));
        setData('records', updated);
    }

    function updateStudentRow(studentId: number, field: string, value: any) {
        const updated = data.records.map((r) => {
            if (r.student_id === studentId) {
                return { ...r, [field]: value };
            }
            return r;
        });
        setData('records', updated);
    }

    function submitAttendance(e: React.FormEvent) {
        e.preventDefault();
        setData('date', date);
        setData('session', session);
        setData('class_id', Number(classId));
        post('/school/attendance');
    }

    return (
        <AppLayout title="Student Attendance Register">
            <div className="max-w-7xl space-y-6 pb-16">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-emerald-600" />
                        <span>Student Roll-Call Register</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Conduct period-based roll-calls adhering to Kenyan MoE school custody rules and automated unnotified absence SMS dispatch.
                    </p>
                </div>

                {/* Filter Selector Bar */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                    <form onSubmit={handleFilterSubmit} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                        <div>
                            <Label className="text-xs font-bold">Roll-Call Date</Label>
                            <Input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="h-9 text-xs mt-1"
                            />
                        </div>

                        <div>
                            <Label className="text-xs font-bold">Session Period</Label>
                            <Select value={session} onValueChange={(v: any) => setSession(v)}>
                                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="morning">Morning Roll-Call (8:00 AM)</SelectItem>
                                    <SelectItem value="afternoon">Afternoon Roll-Call (2:00 PM)</SelectItem>
                                    <SelectItem value="evening_dorm">Evening Dormitory Check (9:00 PM)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs font-bold">Class / Grade *</Label>
                            <Select value={classId} onValueChange={(v) => { setClassId(v); setSectionId(''); }}>
                                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select Class" /></SelectTrigger>
                                <SelectContent>
                                    {classes.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-xs font-bold">Stream (Optional)</Label>
                            <Select value={sectionId} onValueChange={setSectionId}>
                                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="All Streams" /></SelectTrigger>
                                <SelectContent>
                                    {filteredSections.map((s) => (
                                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button type="submit" className="h-9 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
                            Load Register
                        </Button>
                    </form>
                </div>

                {/* Class Metric Overview */}
                {students.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Enrolled In Class</span>
                            <p className="text-xl font-bold text-slate-900 mt-0.5">{stats.total}</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Present</span>
                            <p className="text-xl font-bold text-emerald-700 mt-0.5">{stats.present}</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-200 text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-red-800">Absent</span>
                            <p className="text-xl font-bold text-red-700 mt-0.5">{stats.absent}</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Late Arrival</span>
                            <p className="text-xl font-bold text-amber-700 mt-0.5">{stats.late}</p>
                        </div>
                        <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">Excused / Activity</span>
                            <p className="text-xl font-bold text-blue-700 mt-0.5">{stats.excused}</p>
                        </div>
                    </div>
                )}

                {/* Students Register Table */}
                {students.length > 0 ? (
                    <form onSubmit={submitAttendance} className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-700">Quick Mark All:</span>
                                <button
                                    type="button"
                                    onClick={() => setAllStatus('present')}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold hover:bg-emerald-200"
                                >
                                    All Present
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setAllStatus('absent')}
                                    className="px-2.5 py-1 rounded-lg bg-red-100 text-red-800 font-bold hover:bg-red-200"
                                >
                                    All Absent
                                </button>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={data.send_absence_sms}
                                    onChange={(e) => setData('send_absence_sms', e.target.checked)}
                                    className="rounded border-slate-300 text-emerald-600"
                                />
                                <span>Send instant SMS to parent on unexcused absence</span>
                            </label>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                                        <tr>
                                            <th className="py-3 px-4">Adm No.</th>
                                            <th className="py-3 px-4">Learner Full Name</th>
                                            <th className="py-3 px-4">Stream</th>
                                            <th className="py-3 px-4 text-center">Status Selection</th>
                                            <th className="py-3 px-4">Arrival Time</th>
                                            <th className="py-3 px-4">Remarks / Note</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 font-medium">
                                        {students.map((s, idx) => {
                                            const rec = data.records.find((r) => r.student_id === s.id) || {
                                                student_id: s.id,
                                                status: 'present',
                                                remarks: '',
                                                time_in: '',
                                            };

                                            return (
                                                <tr key={s.id} className="hover:bg-slate-50/50">
                                                    <td className="py-3 px-4 font-mono font-bold text-slate-700">
                                                        {s.admission_no || s.admission_number || s.roll_no || '-'}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="font-bold text-slate-900">{s.first_name} {s.last_name}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono">Guardian: {s.guardian_phone || 'N/A'}</div>
                                                    </td>
                                                    <td className="py-3 px-4 text-slate-600">
                                                        {s.section?.name || 'Main Stream'}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            {[
                                                                { id: 'present', label: 'P', color: 'peer-checked:bg-emerald-600 peer-checked:text-white', title: 'Present' },
                                                                { id: 'absent', label: 'A', color: 'peer-checked:bg-red-600 peer-checked:text-white', title: 'Absent' },
                                                                { id: 'late', label: 'L', color: 'peer-checked:bg-amber-500 peer-checked:text-white', title: 'Late' },
                                                                { id: 'excused', label: 'E', color: 'peer-checked:bg-blue-600 peer-checked:text-white', title: 'Excused / Medical' },
                                                                { id: 'official_activity', label: 'OA', color: 'peer-checked:bg-purple-600 peer-checked:text-white', title: 'Official Activity' },
                                                            ].map((opt) => (
                                                                <label key={opt.id} className="cursor-pointer" title={opt.title}>
                                                                    <input
                                                                        type="radio"
                                                                        name={`status_${s.id}`}
                                                                        value={opt.id}
                                                                        checked={rec.status === opt.id}
                                                                        onChange={() => updateStudentRow(s.id, 'status', opt.id)}
                                                                        className="sr-only peer"
                                                                    />
                                                                    <span className={`w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all ${opt.color}`}>
                                                                        {opt.label}
                                                                    </span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Input
                                                            type="time"
                                                            value={rec.time_in}
                                                            onChange={(e) => updateStudentRow(s.id, 'time_in', e.target.value)}
                                                            className="h-8 text-xs font-mono w-28"
                                                        />
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Input
                                                            value={rec.remarks}
                                                            onChange={(e) => updateStudentRow(s.id, 'remarks', e.target.value)}
                                                            placeholder="Add observation..."
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
                                <span>Save & Commit Roll-Call</span>
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="p-12 text-center rounded-2xl border border-slate-200 bg-white text-slate-400 text-xs">
                        Select a Class and click "Load Register" to commence roll-call.
                    </div>
                )}
            </div>
        </AppLayout>
    );
}