import AppLayout from '@/Layouts/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { Users, UserCog, CalendarCheck, DollarSign, Clock, AlertCircle, BarChart3, Activity } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Legend,
} from 'recharts';

interface ActivityRecord { id: number; description: string; causer?: { name: string }; created_at: string; }
interface Props {
    role: string;
    totalStudents: number;
    totalStaff: number;
    attendancePct: number;
    monthFees: number;
    pendingFees: number;
    pendingHomework: number;
    todayCollection?: number;
    feeChart: { month: string; amount: number }[];
    attChart: { day: string; present: number; absent: number }[];
    recentActivity: ActivityRecord[];
    schools?: number;
}

function formatNumber(value: number) {
    return new Intl.NumberFormat().format(value);
}

function formatCurrency(value: number) {
    return '$' + formatNumber(value);
}

export default function Dashboard({
    role, totalStudents, totalStaff, attendancePct, monthFees, pendingFees,
    pendingHomework, todayCollection, feeChart, attChart, recentActivity, schools,
}: Props) {
    const roleLabel = role.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
    const isPlatform = role === 'super-admin';
    const isTeaching = ['school-admin', 'principal', 'teacher'].includes(role);
    const canViewStaff = ['school-admin', 'principal'].includes(role);
    const canViewAttendanceReport = ['school-admin', 'principal'].includes(role);
    const canViewFinanceReport = ['school-admin', 'principal', 'accountant'].includes(role);
    const canViewOutstandingFees = ['school-admin', 'principal', 'accountant'].includes(role);

    return (
        <AppLayout title="Reports Dashboard">
            <div className="space-y-7">
                <PageHeader
                    eyebrow={roleLabel + ' workspace'}
                    title="A clearer view of school performance"
                    description="Keep the signals that matter most close at hand, then move directly into the work that needs attention."
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {isPlatform ? (
                        <>
                            <StatCard label="Total schools" value={schools ?? 0} hint="Across the platform" icon={Users} tone="violet" />
                            <StatCard label="Total students" value={formatNumber(totalStudents)} hint="Across all schools" icon={Users} tone="teal" />
                            <StatCard label="Revenue" value={formatCurrency(monthFees)} hint="Recorded to date" icon={DollarSign} tone="emerald" />
                        </>
                    ) : (
                        <>
                            <StatCard label="Students" value={formatNumber(totalStudents)} hint="Active enrolment" icon={Users} tone="violet" href="/school/students" />
                            <StatCard label="Active staff" value={formatNumber(totalStaff)} hint="Teaching and support" icon={UserCog} tone="sky" href={canViewStaff ? "/school/staff" : undefined} />
                            <StatCard label="Attendance" value={String(attendancePct) + '%'} hint="Current school average" icon={CalendarCheck} tone="emerald" href={canViewAttendanceReport ? "/school/reports/attendance" : undefined} />
                            <StatCard label="Monthly fees" value={formatCurrency(monthFees)} hint="Collected this month" icon={DollarSign} tone="teal" href={canViewFinanceReport ? "/school/reports/finance" : undefined} />
                        </>
                    )}
                    <StatCard label="Outstanding fees" value={formatCurrency(pendingFees)} hint="Requires follow-up" icon={AlertCircle} tone="amber" href={canViewOutstandingFees ? "/school/fees/outstanding" : undefined} />
                    {role === 'accountant' && todayCollection !== undefined && (
                        <StatCard label="Today’s collection" value={formatCurrency(todayCollection)} hint="Collected today" icon={DollarSign} tone="emerald" />
                    )}
                    {isTeaching && (
                        <StatCard label="Homework pending" value={pendingHomework} hint="Submissions awaiting review" icon={Clock} tone="amber" href="/school/homework" />
                    )}
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Fee collection</CardTitle>
                            <p className="text-xs text-muted-foreground">Last six months</p>
                        </CardHeader>
                        <CardContent>
                            {feeChart.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <BarChart data={feeChart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', fontSize: 12 }} formatter={(value: number) => [formatCurrency(value), 'Collected']} />
                                        <Bar dataKey="amount" fill="var(--brand-primary)" radius={[6, 6, 0, 0]} isAnimationActive={false} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : <EmptyState title="No fee activity yet" description="Collection data will appear here as payments are recorded." />}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-emerald-600" /> Attendance rhythm</CardTitle>
                            <p className="text-xs text-muted-foreground">Last seven days</p>
                        </CardHeader>
                        <CardContent>
                            {attChart.length > 0 ? (
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={attChart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid var(--border)', background: 'var(--card)', fontSize: 12 }} />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                        <Line type="monotone" dataKey="present" name="Present" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
                                        <Line type="monotone" dataKey="absent" name="Absent" stroke="#e11d48" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : <EmptyState title="No attendance activity yet" description="Daily attendance trends will appear after records are marked." />}
                        </CardContent>
                    </Card>
                </div>

                {recentActivity.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Recent activity</CardTitle>
                            <p className="text-xs text-muted-foreground">The latest changes across your workspace</p>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/60">
                                {recentActivity.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3 px-5 py-4">
                                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                                            {(item.causer?.name ?? '?')[0].toUpperCase()}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium text-foreground">{item.description}</p>
                                            <p className="mt-1 text-xs text-muted-foreground">{item.causer?.name ?? 'System'} · {new Date(item.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}