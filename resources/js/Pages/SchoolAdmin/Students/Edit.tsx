import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps, Student, SchoolClass, Section } from '@/Types';
import { Button } from '@/Components/ui/button';
import { toInputDate } from '@/lib/utils';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { ArrowLeft, User, GraduationCap, Users, ShieldCheck } from 'lucide-react';

interface Props extends PageProps {
    student: Student;
    classes: SchoolClass[];
    sections: Section[];
}

export default function EditStudent({ auth, student, classes = [], sections = [] }: Props) {
    const [step, setStep] = useState<1 | 2 | 3>(1);

    const { data, setData, put, processing, errors } = useForm({
        first_name: student.first_name || '',
        middle_name: student.middle_name || '',
        last_name: student.last_name || '',
        gender: student.gender || 'male',
        date_of_birth: toInputDate(student.date_of_birth || student.dob),
        birth_certificate_no: student.birth_certificate_no || '',
        nationality: student.nationality || 'Kenyan',
        religion: student.religion || '',
        blood_group: student.blood_group || '',
        
        admission_no: student.admission_no || '',
        nemis_upi: student.nemis_upi || '',
        assessment_no: student.assessment_no || '',
        admission_type: student.admission_type || 'new',
        admission_date: toInputDate(student.admission_date),
        class_id: student.class_id ? String(student.class_id) : '',
        section_id: student.section_id ? String(student.section_id) : '',
        previous_school: student.previous_school || '',
        status: student.status || 'active',
        
        guardian_name: student.guardian?.name || student.guardian_name || '',
        guardian_relation: student.guardian?.relation || student.guardian_relation || 'Father',
        guardian_phone: student.guardian?.phone || student.guardian_phone || '',
        email: student.email || '',
        phone: student.phone || '',
        emergency_contact: student.emergency_contact || '',
        address: student.address || '',
    });

    const filteredSections = sections.filter((s) => String(s.class_id) === String(data.class_id));
    const fullName = student.full_name || [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/school/students/${student.id}`);
    };

    return (
        <AppLayout header="Edit Learner Profile">
            <Head title={`Edit ${fullName} - EduFlow`} />

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href={`/school/students/${student.id}`}
                            className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 mb-1"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                            Back to Student Profile
                        </Link>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                            Edit Profile: {fullName}
                        </h1>
                        <p className="text-xs text-slate-500">
                            Admission No: <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">{student.admission_no}</span>
                        </p>
                    </div>

                    <Link href={`/school/students/${student.id}`}>
                        <Button variant="outline" size="sm" className="h-9 text-xs">
                            View Profile
                        </Button>
                    </Link>
                </div>

                {/* Step Indicator Tabs */}
                <div className="grid grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={() => setStep(1)}
                        className={`flex items-center gap-2.5 p-2 rounded-lg text-left transition-all ${
                            step === 1
                                ? 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                    >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}>1</div>
                        <div>
                            <div className="text-xs font-bold leading-tight">Identity & Civil Registry</div>
                            <div className="text-[10px] text-slate-400">Name, DOB, Birth Cert</div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setStep(2)}
                        className={`flex items-center gap-2.5 p-2 rounded-lg text-left transition-all ${
                            step === 2
                                ? 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                    >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}>2</div>
                        <div>
                            <div className="text-xs font-bold leading-tight">Academic & Identifiers</div>
                            <div className="text-[10px] text-slate-400">NEMIS UPI, Class, Stream</div>
                        </div>
                    </button>

                    <button
                        type="button"
                        onClick={() => setStep(3)}
                        className={`flex items-center gap-2.5 p-2 rounded-lg text-left transition-all ${
                            step === 3
                                ? 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300'
                                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                    >
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600'}`}>3</div>
                        <div>
                            <div className="text-xs font-bold leading-tight">Guardian & Emergency</div>
                            <div className="text-[10px] text-slate-400">Parent Contacts & Address</div>
                        </div>
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 shadow-sm">
                    {/* STEP 1: Personal Identity */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Learner Identity & Civil Data</h3>
                                <p className="text-xs text-slate-500">Official names as documented on the Kenyan Birth Certificate or National Entry document.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-xs">First Name *</Label>
                                    <Input
                                        value={data.first_name}
                                        onChange={(e) => setData('first_name', e.target.value)}
                                        placeholder="e.g. Faith"
                                        className="h-9 mt-1 text-xs"
                                        required
                                    />
                                    {errors.first_name && <p className="text-[11px] text-rose-500 mt-1">{errors.first_name}</p>}
                                </div>

                                <div>
                                    <Label className="text-xs">Middle Name</Label>
                                    <Input
                                        value={data.middle_name}
                                        onChange={(e) => setData('middle_name', e.target.value)}
                                        placeholder="e.g. Akinyi"
                                        className="h-9 mt-1 text-xs"
                                    />
                                    {errors.middle_name && <p className="text-[11px] text-rose-500 mt-1">{errors.middle_name}</p>}
                                </div>

                                <div>
                                    <Label className="text-xs">Last Name / Surname *</Label>
                                    <Input
                                        value={data.last_name}
                                        onChange={(e) => setData('last_name', e.target.value)}
                                        placeholder="e.g. Otieno"
                                        className="h-9 mt-1 text-xs"
                                        required
                                    />
                                    {errors.last_name && <p className="text-[11px] text-rose-500 mt-1">{errors.last_name}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                <div>
                                    <Label className="text-xs">Gender *</Label>
                                    <Select value={data.gender} onValueChange={(val) => setData('gender', val)}>
                                        <SelectTrigger className="h-9 mt-1 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs">Date of Birth</Label>
                                    <Input
                                        type="date"
                                        value={data.date_of_birth}
                                        onChange={(e) => setData('date_of_birth', e.target.value)}
                                        className="h-9 mt-1 text-xs"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs">Birth Certificate / Entry No</Label>
                                    <Input
                                        value={data.birth_certificate_no}
                                        onChange={(e) => setData('birth_certificate_no', e.target.value)}
                                        placeholder="e.g. BC-9812039"
                                        className="h-9 mt-1 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                <div>
                                    <Label className="text-xs">Nationality</Label>
                                    <Input
                                        value={data.nationality}
                                        onChange={(e) => setData('nationality', e.target.value)}
                                        placeholder="Kenyan"
                                        className="h-9 mt-1 text-xs"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs">Blood Group</Label>
                                    <Input
                                        value={data.blood_group}
                                        onChange={(e) => setData('blood_group', e.target.value)}
                                        placeholder="e.g. O+, A+"
                                        className="h-9 mt-1 text-xs"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs">Religious Affiliation</Label>
                                    <Input
                                        value={data.religion}
                                        onChange={(e) => setData('religion', e.target.value)}
                                        placeholder="e.g. Christian / Muslim"
                                        className="h-9 mt-1 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="button" onClick={() => setStep(2)} className="h-9 text-xs">
                                    Next: Academic & Identifiers
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Academic Placement & Official Identifiers */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Academic Placement & Official Numbers</h3>
                                <p className="text-xs text-slate-500">Official admission identifier, NEMIS UPI, KNEC CBA code, class, and active stream.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-xs">School Admission No *</Label>
                                    <Input
                                        value={data.admission_no}
                                        onChange={(e) => setData('admission_no', e.target.value)}
                                        placeholder="e.g. ADM-2026-0332"
                                        className="h-9 mt-1 text-xs font-mono"
                                        required
                                    />
                                    {errors.admission_no && <p className="text-[11px] text-rose-500 mt-1">{errors.admission_no}</p>}
                                </div>

                                <div>
                                    <Label className="text-xs">NEMIS UPI (Unique Personal Identifier)</Label>
                                    <Input
                                        value={data.nemis_upi}
                                        onChange={(e) => setData('nemis_upi', e.target.value)}
                                        placeholder="e.g. ABC123DEF"
                                        className="h-9 mt-1 text-xs font-mono"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs">KNEC Assessment Number</Label>
                                    <Input
                                        value={data.assessment_no}
                                        onChange={(e) => setData('assessment_no', e.target.value)}
                                        placeholder="e.g. 20401102001"
                                        className="h-9 mt-1 text-xs font-mono"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                <div>
                                    <Label className="text-xs">Class / Grade *</Label>
                                    <Select
                                        value={data.class_id ? String(data.class_id) : ''}
                                        onValueChange={(val) => {
                                            setData((prev) => ({ ...prev, class_id: val, section_id: '' }));
                                        }}
                                    >
                                        <SelectTrigger className="h-9 mt-1 text-xs"><SelectValue placeholder="Select Class" /></SelectTrigger>
                                        <SelectContent>
                                            {classes.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs">Stream / Section</Label>
                                    <Select
                                        value={data.section_id ? String(data.section_id) : ''}
                                        onValueChange={(val) => setData('section_id', val)}
                                        disabled={!data.class_id || filteredSections.length === 0}
                                    >
                                        <SelectTrigger className="h-9 mt-1 text-xs">
                                            <SelectValue placeholder={!data.class_id ? 'Select Class first' : (filteredSections.length === 0 ? 'No streams available' : 'Select Stream')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredSections.map((s) => (
                                                <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs">Admission Type</Label>
                                    <Select value={data.admission_type} onValueChange={(val) => setData('admission_type', val)}>
                                        <SelectTrigger className="h-9 mt-1 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="new">New Admission</SelectItem>
                                            <SelectItem value="transfer_in">Transfer In</SelectItem>
                                            <SelectItem value="returning">Returning Learner</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                                <div>
                                    <Label className="text-xs">Admission Date</Label>
                                    <Input
                                        type="date"
                                        value={data.admission_date}
                                        onChange={(e) => setData('admission_date', e.target.value)}
                                        className="h-9 mt-1 text-xs"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs">Enrollment Status</Label>
                                    <Select value={data.status} onValueChange={(val) => setData('status', val)}>
                                        <SelectTrigger className="h-9 mt-1 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                            <SelectItem value="transferred">Transferred Out</SelectItem>
                                            <SelectItem value="graduated">Graduated</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs">Previous School Attended</Label>
                                    <Input
                                        value={data.previous_school}
                                        onChange={(e) => setData('previous_school', e.target.value)}
                                        placeholder="e.g. St. Peter's Junior School"
                                        className="h-9 mt-1 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between pt-4">
                                <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-9 text-xs">
                                    Back
                                </Button>
                                <Button type="button" onClick={() => setStep(3)} className="h-9 text-xs">
                                    Next: Guardian & Emergency
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Guardian & Contact Details */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Guardian & Emergency Contacts</h3>
                                <p className="text-xs text-slate-500">Primary parent/guardian relationship details and residential location.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-xs">Guardian Full Name</Label>
                                    <Input
                                        value={data.guardian_name}
                                        onChange={(e) => setData('guardian_name', e.target.value)}
                                        placeholder="e.g. Dr. Jane Otieno"
                                        className="h-9 mt-1 text-xs"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs">Relationship</Label>
                                    <Select value={data.guardian_relation} onValueChange={(val) => setData('guardian_relation', val)}>
                                        <SelectTrigger className="h-9 mt-1 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Father">Father</SelectItem>
                                            <SelectItem value="Mother">Mother</SelectItem>
                                            <SelectItem value="Legal Guardian">Legal Guardian</SelectItem>
                                            <SelectItem value="Sponsor">Sponsor</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs">Guardian Phone Number</Label>
                                    <Input
                                        value={data.guardian_phone}
                                        onChange={(e) => setData('guardian_phone', e.target.value)}
                                        placeholder="+254 7XX XXX XXX"
                                        className="h-9 mt-1 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                <div>
                                    <Label className="text-xs">Emergency Phone Contact</Label>
                                    <Input
                                        value={data.emergency_contact}
                                        onChange={(e) => setData('emergency_contact', e.target.value)}
                                        placeholder="+254 7XX XXX XXX (Alternative Contact)"
                                        className="h-9 mt-1 text-xs"
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs">Physical / Residential Address</Label>
                                    <Input
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        placeholder="e.g. Kilimani, Nairobi"
                                        className="h-9 mt-1 text-xs"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                                <Button type="button" variant="outline" onClick={() => setStep(2)} className="h-9 text-xs">
                                    Back
                                </Button>
                                <Button type="submit" disabled={processing} className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6">
                                    {processing ? 'Saving Changes...' : 'Save & Update Learner Profile'}
                                </Button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </AppLayout>
    );
}