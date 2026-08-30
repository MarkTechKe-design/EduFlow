import { Head, Link, router, usePage } from '@inertiajs/react';
import { ArrowLeft, Pencil, Ban, CheckCircle, Globe, Phone, Mail, MapPin, Users, Calendar, ShieldCheck, ShieldAlert, AlertTriangle, FileText, X, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PageProps, School, AcademicYear } from '@/Types';

interface ShowPageProps extends PageProps {
    school: School & { academic_years: AcademicYear[]; users_count: number; verified_by_user?: { name: string } };
}

const statusMap = {
    active:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
    inactive:  'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    suspended: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
};

export default function ShowSchool() {
    const { school } = usePage<ShowPageProps>().props;
    const statusClass = statusMap[school.status] ?? statusMap.inactive;

    const [rejectOpen, setRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [notesOpen, setNotesOpen] = useState(false);
    const [additionalNotes, setAdditionalNotes] = useState('');
    const [verifyOpen, setVerifyOpen] = useState(false);
    const [verifyNotes, setVerifyNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleVerify = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post(`/super-admin/schools/${school.id}/verify`, { notes: verifyNotes }, {
            onSuccess: () => { setVerifyOpen(false); setVerifyNotes(''); },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleReject = (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectReason.trim()) return;
        setIsSubmitting(true);
        router.post(`/super-admin/schools/${school.id}/reject`, { reason: rejectReason }, {
            onSuccess: () => { setRejectOpen(false); setRejectReason(''); },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleSaveNotes = (e: React.FormEvent) => {
        e.preventDefault();
        if (!additionalNotes.trim()) return;
        setIsSubmitting(true);
        router.post(`/super-admin/schools/${school.id}/verification-notes`, { notes: additionalNotes }, {
            onSuccess: () => { setNotesOpen(false); setAdditionalNotes(''); },
            onFinish: () => setIsSubmitting(false),
        });
    };

    return (
        <AppLayout breadcrumbs={[
            { label: 'Schools', href: '/super-admin/schools' },
            { label: school.name },
        ]}>
            <Head title={school.name} />

            {/* Header */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/super-admin/schools"><ArrowLeft className="w-4 h-4" /></Link>
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center font-bold text-xl text-indigo-600">
                            {school.name[0]}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">{school.name}</h1>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass}`}>
                                    Account: {school.status}
                                </span>
                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                                    (school as any).verification_status === 'verified'
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                                        : (school as any).verification_status === 'rejected'
                                        ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800'
                                        : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
                                }`}>
                                    Verification: {((school as any).verification_status || 'pending').toUpperCase()}
                                </span>
                            </div>
                            <p className="text-sm text-slate-400 font-mono">{school.slug}</p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    {school.status === 'suspended' ? (
                        <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-300 hover:bg-emerald-50" onClick={() => router.patch(`/super-admin/schools/${school.id}/activate`)}>
                            <CheckCircle className="w-4 h-4 mr-1.5" /> Activate
                        </Button>
                    ) : (
                        <Button size="sm" variant="outline" className="text-amber-600 border-amber-300 hover:bg-amber-50" onClick={() => router.patch(`/super-admin/schools/${school.id}/suspend`)}>
                            <Ban className="w-4 h-4 mr-1.5" /> Suspend
                        </Button>
                    )}
                    <Button size="sm" asChild className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Link href={`/super-admin/schools/${school.id}/edit`}>
                            <Pencil className="w-4 h-4 mr-1.5" /> Edit
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {/* Stats */}
                {[
                    { icon: Users, label: 'Total Users', value: school.users_count },
                    { icon: Calendar, label: 'Academic Years', value: school.academic_years?.length ?? 0 },
                    { icon: Globe, label: 'Timezone', value: school.timezone },
                ].map((s) => (
                    <Card key={s.label} className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
                                <s.icon className="w-4 h-4 text-indigo-500" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">{s.label}</p>
                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {/* Details */}
                <Card className="col-span-3 lg:col-span-2 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Contact & Location</CardTitle></CardHeader>
                    <CardContent className="grid grid-cols-2 gap-3 text-sm">
                        {[
                            { icon: Mail, label: 'Email', value: school.email },
                            { icon: Phone, label: 'Phone', value: school.phone },
                            { icon: MapPin, label: 'City / County', value: [school.city, (school as any).county].filter(Boolean).join(', ') || '—' },
                            { icon: Globe, label: 'Country & Curriculum', value: `${school.country || 'KE'} · ${((school as any).curriculum || 'cbc').toUpperCase()}` },
                        ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex items-start gap-2">
                                <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-400">{label}</p>
                                    <p className="text-slate-700 dark:text-slate-300">{value ?? '—'}</p>
                                </div>
                            </div>
                        ))}
                        {school.address && (
                            <div className="col-span-2 flex items-start gap-2 border-t border-slate-100 dark:border-slate-800 pt-2">
                                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-400">Physical Address</p>
                                    <p className="text-slate-700 dark:text-slate-300">{school.address}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Academic Years */}
                <Card className="col-span-3 lg:col-span-1 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Academic Calendar</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        {school.academic_years?.length === 0 ? (
                            <p className="text-xs text-slate-400">No academic years configured</p>
                        ) : school.academic_years?.map((y) => (
                            <div key={y.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{y.name}</span>
                                {y.is_current && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 font-semibold">
                                        Current Active
                                    </span>
                                )}
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Institutional Verification Audit Card */}
                <Card className="col-span-3 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                                Institutional Verification & Government Identity Audit
                            </CardTitle>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Official Ministry and National Exam Centre registration validation
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {(school as any).verification_status !== 'verified' && (
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer" onClick={() => setVerifyOpen(true)}>
                                    <ShieldCheck className="w-4 h-4 mr-1" /> Verify Institution
                                </Button>
                            )}
                            {(school as any).verification_status !== 'rejected' && (
                                <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer" onClick={() => setRejectOpen(true)}>
                                    <ShieldAlert className="w-4 h-4 mr-1" /> Reject Verification
                                </Button>
                            )}
                            <Button size="sm" variant="secondary" className="cursor-pointer" onClick={() => setNotesOpen(true)}>
                                <FileText className="w-4 h-4 mr-1" /> Add Note
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
                            <span className="text-slate-500 block mb-1">MOE Registration No</span>
                            <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {(school as any).registration_number || <span className="text-slate-400 font-normal">Not provided (Private/Unregistered)</span>}
                            </span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
                            <span className="text-slate-500 block mb-1">KNEC Centre Code</span>
                            <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {(school as any).knec_code || <span className="text-slate-400 font-normal">Not provided</span>}
                            </span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
                            <span className="text-slate-500 block mb-1">NEMIS / UIC Code</span>
                            <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {(school as any).nemis_code || <span className="text-slate-400 font-normal">Not provided</span>}
                            </span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
                            <span className="text-slate-500 block mb-1">Audited By & Timestamp</span>
                            <span className="text-slate-800 dark:text-slate-200 font-medium block">
                                {(school as any).verified_by_user?.name || ((school as any).verified_by ? `Auditor #${(school as any).verified_by}` : 'Pending Review')}
                            </span>
                            <span className="text-[10px] text-slate-400">
                                {(school as any).verified_at ? new Date((school as any).verified_at).toLocaleString() : 'No timestamp recorded'}
                            </span>
                        </div>

                        {(school as any).verification_notes && (
                            <div className="col-span-1 sm:col-span-4 bg-slate-950 text-slate-200 p-4 rounded-xl border border-slate-800 font-mono text-xs whitespace-pre-wrap leading-relaxed">
                                <div className="text-amber-400 font-bold mb-2 flex items-center gap-1.5">
                                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                                    Verification Audit Log & Regulatory History
                                </div>
                                {(school as any).verification_notes}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Verification Modal Dialog */}
            {verifyOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-emerald-600" /> Verify Institution
                            </h3>
                            <button onClick={() => setVerifyOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Confirm institutional verification for <strong>{school.name}</strong>. This endorses the school as a validated institution.
                        </p>
                        <form onSubmit={handleVerify} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                    Auditor Notes (Optional)
                                </label>
                                <textarea
                                    value={verifyNotes}
                                    onChange={(e) => setVerifyNotes(e.target.value)}
                                    placeholder="e.g. MOE certificate checked against national register..."
                                    className="w-full h-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setVerifyOpen(false)}>Cancel</Button>
                                <Button type="submit" size="sm" disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Verification'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Rejection Modal Dialog */}
            {rejectOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h3 className="font-bold text-base text-red-600 flex items-center gap-2">
                                <ShieldAlert className="w-5 h-5 text-red-600" /> Reject Institution Verification
                            </h3>
                            <button onClick={() => setRejectOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Please state the regulatory compliance or documentation defect for rejecting <strong>{school.name}</strong>.
                        </p>
                        <form onSubmit={handleReject} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                    Reason for Rejection <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="e.g. MOE registration number mismatch, invalid certificate..."
                                    className="w-full h-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-red-500"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setRejectOpen(false)}>Cancel</Button>
                                <Button type="submit" size="sm" disabled={isSubmitting || !rejectReason.trim()} className="bg-red-600 hover:bg-red-700 text-white">
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Rejection'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Note Modal Dialog */}
            {notesOpen && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-indigo-600" /> Append Auditor Note
                            </h3>
                            <button onClick={() => setNotesOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleSaveNotes} className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                                    Audit Entry <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    required
                                    value={additionalNotes}
                                    onChange={(e) => setAdditionalNotes(e.target.value)}
                                    placeholder="Enter administrative memo or verification update..."
                                    className="w-full h-28 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setNotesOpen(false)}>Cancel</Button>
                                <Button type="submit" size="sm" disabled={isSubmitting || !additionalNotes.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Append to Audit Trail'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}