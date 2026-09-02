import React, { useState } from 'react';
import { 
    X, User, Calendar, Clock, BookOpen, ShieldCheck, 
    FileText, CheckCircle2, AlertCircle, ExternalLink, Printer 
} from 'lucide-react';

export interface TeacherProfileData {
    staff: {
        id: number;
        name: string;
        emp_id: string;
        department: string;
        designation: string;
        phone?: string;
        email?: string;
        status: string;
        roles: string[];
    };
    academic_context: {
        academic_year_name: string;
        term: string;
        week_number: number;
        week_start: string;
        week_end: string;
    };
    attendance_stats: {
        total: number;
        present: number;
        absent: number;
        half_day: number;
        approved_leave: number;
        official_duty: number;
    };
    attendance_log: Array<{
        id: number;
        date: string;
        term: string;
        week_number: number;
        status: string;
        time_in?: string;
        time_out?: string;
        remarks?: string;
    }>;
    leaves: Array<{
        id: number;
        leave_type: string;
        policy_category: string;
        start_date: string;
        end_date: string;
        days: number;
        status: string;
        reason?: string;
        approval_note?: string;
        actioned_at?: string;
    }>;
    duty_history: Array<{
        assignment_id: number;
        term: string;
        week_number: number;
        week_start: string;
        week_end: string;
        duty_station?: string;
        day_of_week?: string;
        shift?: string;
        effective_date?: string;
        is_stand_in: boolean;
        replacement_teacher_name?: string;
        replacement_reason?: string;
        changed_by?: string;
        changed_at?: string;
    }>;
    timetables: Array<{
        id: number;
        day_of_week: string;
        start_time: string;
        end_time: string;
        class_name: string;
        section?: string;
        subject: string;
        room?: string;
    }>;
    classes_taught: string[];
    subjects_taught: string[];
    class_teacher_of: string[];
    official_duties: Array<{ date: string; remarks: string }>;
}

interface Props {
    profile: TeacherProfileData | null;
    isOpen: boolean;
    onClose: () => void;
    isFullPage?: boolean;
}

export default function TeacherProfileDrawer({ profile, isOpen, onClose, isFullPage = false }: Props) {
    const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'duties' | 'leaves' | 'timetable'>('overview');

    if (!isOpen || !profile) return null;

    const { staff, attendance_stats, attendance_log, leaves, duty_history, timetables, classes_taught, subjects_taught, class_teacher_of } = profile;

    const content = (
        <div className="flex flex-col h-full bg-slate-50 text-slate-900 text-sm">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-base sm:text-lg shadow-sm shrink-0">
                        {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">{staff.name}</h2>
                            <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-semibold uppercase ${
                                staff.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                            }`}>
                                {staff.status}
                            </span>
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                            Emp ID: <span className="font-medium text-slate-700 font-mono">{staff.emp_id || 'N/A'}</span> • {staff.designation}
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-end space-x-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    {!isFullPage && (
                        <a 
                            href={`/school/attendance/staff/${staff.id}/profile`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded transition"
                            title="Open in new window"
                        >
                            <ExternalLink className="w-3.5 h-3.5 mr-1" />
                            Full Page
                        </a>
                    )}
                    {isFullPage && (
                        <button 
                            onClick={() => window.print()}
                            className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded transition"
                        >
                            <Printer className="w-3.5 h-3.5 mr-1" />
                            Print
                        </button>
                    )}
                    {!isFullPage && (
                        <button 
                            onClick={onClose} 
                            className="text-slate-400 hover:text-slate-600 p-1.5 rounded hover:bg-slate-100"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Quick KPI Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-white border-b border-slate-200 text-center">
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Present</span>
                    <p className="text-lg font-bold text-emerald-600">{attendance_stats.present}</p>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Absent</span>
                    <p className="text-lg font-bold text-rose-600">{attendance_stats.absent}</p>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Approved Leave</span>
                    <p className="text-lg font-bold text-amber-600">{attendance_stats.approved_leave}</p>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-100">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Official Duty</span>
                    <p className="text-lg font-bold text-indigo-600">{attendance_stats.official_duty}</p>
                </div>
                <div className="p-2 rounded bg-slate-50 border border-slate-100 col-span-2 md:col-span-1">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Lessons/Wk</span>
                    <p className="text-lg font-bold text-slate-700">{timetables.length}</p>
                </div>
            </div>

            {/* Tabs Header */}
            <div className="flex overflow-x-auto no-scrollbar border-b border-slate-200 bg-white px-3 sm:px-6">
                {[
                    { key: 'overview', label: 'Overview & Roles', icon: User },
                    { key: 'attendance', label: 'Attendance Log', icon: Calendar },
                    { key: 'duties', label: 'Duty & Stand-ins', icon: ShieldCheck },
                    { key: 'leaves', label: 'Leave History', icon: FileText },
                    { key: 'timetable', label: 'Timetable', icon: Clock },
                ].map(t => {
                    const Icon = t.icon;
                    const active = activeTab === t.key;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key as any)}
                            className={`flex items-center py-2.5 sm:py-3 px-3 sm:px-3.5 border-b-2 font-medium text-xs whitespace-nowrap shrink-0 transition ${
                                active 
                                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50' 
                                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5 mr-1.5" />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4">
                {/* 1. Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3">Institutional Roles & Responsibilities</h3>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {staff.roles.map((r, idx) => (
                                    <span key={idx} className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-1 rounded-full font-medium">
                                        {r}
                                    </span>
                                ))}
                            </div>
                            {class_teacher_of.length > 0 && (
                                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900">
                                    <span className="font-bold">Class Teacher Headship: </span>
                                    {class_teacher_of.join(', ')}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Assigned Classes</h3>
                                {classes_taught.length > 0 ? (
                                    <ul className="divide-y divide-slate-100 text-xs text-slate-700">
                                        {classes_taught.map((c, i) => (
                                            <li key={i} className="py-1.5 flex items-center">
                                                <BookOpen className="w-3.5 h-3.5 text-slate-400 mr-2" />
                                                {c}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No classes currently assigned in timetable.</p>
                                )}
                            </div>

                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Teaching Subjects</h3>
                                {subjects_taught.length > 0 ? (
                                    <ul className="divide-y divide-slate-100 text-xs text-slate-700">
                                        {subjects_taught.map((s, i) => (
                                            <li key={i} className="py-1.5 flex items-center">
                                                <ShieldCheck className="w-3.5 h-3.5 text-slate-400 mr-2" />
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No subject allocations found.</p>
                                )}
                            </div>
                        </div>

                        <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">Contact & Credentials</h3>
                            <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                                <div><span className="font-semibold text-slate-700">Email:</span> {staff.email || 'N/A'}</div>
                                <div><span className="font-semibold text-slate-700">Phone:</span> {staff.phone || 'N/A'}</div>
                                <div><span className="font-semibold text-slate-700">Department:</span> {staff.department}</div>
                                <div><span className="font-semibold text-slate-700">Designation:</span> {staff.designation}</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. Attendance Tab */}
                {activeTab === 'attendance' && (
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Period</th>
                                    <th className="p-3">Status</th>
                                    <th className="p-3">In / Out</th>
                                    <th className="p-3">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {attendance_log.length > 0 ? (
                                    attendance_log.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50/70">
                                            <td className="p-3 font-mono text-slate-800 font-medium">{row.date}</td>
                                            <td className="p-3 text-slate-500">{row.term} • Wk {row.week_number}</td>
                                            <td className="p-3">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                                                    row.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                                                    row.status === 'absent' ? 'bg-rose-100 text-rose-800' :
                                                    row.status === 'on_leave' ? 'bg-amber-100 text-amber-800' :
                                                    row.status === 'official_duty' ? 'bg-indigo-100 text-indigo-800' :
                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {row.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="p-3 font-mono text-slate-600">
                                                {row.time_in || '--:--'} - {row.time_out || '--:--'}
                                            </td>
                                            <td className="p-3 text-slate-500">{row.remarks || '—'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center text-slate-400">No attendance records logged for this period.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 3. Duty & Stand-in Tab */}
                {activeTab === 'duties' && (
                    <div className="space-y-3">
                        {duty_history.length > 0 ? (
                            duty_history.map((d, i) => (
                                <div key={i} className={`p-4 rounded-lg border shadow-sm ${
                                    d.is_stand_in ? 'bg-purple-50/40 border-purple-200' : 'bg-white border-slate-200'
                                }`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-bold text-slate-800">{d.term || 'Current Term'} • Week {d.week_number || '1'}</span>
                                            {d.is_stand_in ? (
                                                <span className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                                                    Stand-In Relief Duty
                                                </span>
                                            ) : (
                                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-semibold">
                                                    Primary Assignment
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-xs text-slate-500 font-mono">{d.week_start} to {d.week_end}</span>
                                    </div>
                                    <div className="text-xs text-slate-600 mt-2 space-y-1">
                                        <div><span className="font-semibold">Station:</span> {d.duty_station || 'General Campus'}</div>
                                        {d.replacement_teacher_name && (
                                            <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-900 mt-2">
                                                <span className="font-semibold">Replaced by:</span> {d.replacement_teacher_name}
                                                {d.replacement_reason && <span> — <em>"{d.replacement_reason}"</em></span>}
                                                {d.changed_by && <span className="block text-[11px] text-amber-700 mt-0.5">Authorised by: {d.changed_by}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white p-6 rounded-lg border border-slate-200 text-center text-slate-400 text-xs">
                                No Teacher on Duty (TOD) records logged.
                            </div>
                        )}
                    </div>
                )}

                {/* 4. Leave History Tab */}
                {activeTab === 'leaves' && (
                    <div className="space-y-3">
                        {leaves.length > 0 ? (
                            leaves.map((l) => (
                                <div key={l.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center space-x-2">
                                            <span className="font-bold text-slate-800 text-xs">{l.leave_type}</span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase ${
                                                l.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                                l.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                                'bg-rose-100 text-rose-800'
                                            }`}>
                                                {l.status}
                                            </span>
                                            <span className="text-slate-400 text-xs">({l.days} days)</span>
                                        </div>
                                        <span className="text-xs text-slate-500 font-mono">{l.start_date} to {l.end_date}</span>
                                    </div>
                                    <div className="text-xs text-slate-600">
                                        {l.reason && <p><span className="font-semibold">Reason:</span> {l.reason}</p>}
                                        {l.approval_note && (
                                            <p className="mt-1 text-slate-500 italic"><span className="font-semibold not-italic">Admin Note:</span> {l.approval_note}</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-white p-6 rounded-lg border border-slate-200 text-center text-slate-400 text-xs">
                                No leave applications on record.
                            </div>
                        )}
                    </div>
                )}

                {/* 5. Timetable Tab */}
                {activeTab === 'timetable' && (
                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold">
                                    <th className="p-3">Day</th>
                                    <th className="p-3">Time</th>
                                    <th className="p-3">Class</th>
                                    <th className="p-3">Subject</th>
                                    <th className="p-3">Room</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {timetables.length > 0 ? (
                                    timetables.map((t) => (
                                        <tr key={t.id} className="hover:bg-slate-50/70">
                                            <td className="p-3 font-semibold text-slate-800">{t.day_of_week}</td>
                                            <td className="p-3 font-mono text-slate-600">{t.start_time} - {t.end_time}</td>
                                            <td className="p-3 text-slate-700">{t.class_name} {t.section ? `(${t.section})` : ''}</td>
                                            <td className="p-3 font-medium text-emerald-700">{t.subject}</td>
                                            <td className="p-3 text-slate-500">{t.room || '—'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="p-4 text-center text-slate-400">No teaching timetable lessons scheduled.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

    if (isFullPage) {
        return content;
    }

    return (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end">
            <div className="w-full max-w-2xl h-full shadow-2xl animate-in slide-in-from-right duration-200">
                {content}
            </div>
        </div>
    );
}