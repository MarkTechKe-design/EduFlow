import { Head, Link, router, usePage } from '@inertiajs/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, ShieldCheck, Building2, MapPin, Settings2, FileText, Loader2 } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PageProps, School } from '@/Types';

const schema = z.object({
    name:                z.string().min(2, 'School name is required'),
    slug:                z.string().optional(),
    email:               z.string().email('Invalid email').optional().or(z.literal('')),
    phone:               z.string().optional(),
    address:             z.string().optional(),
    city:                z.string().optional(),
    county:              z.string().optional(),
    sub_county:          z.string().optional(),
    country:             z.string().default('KE'),
    curriculum:          z.string().default('cbc'),
    registration_number: z.string().optional(),
    knec_code:           z.string().optional(),
    nemis_code:          z.string().optional(),
    timezone:            z.string().default('Africa/Nairobi'),
    currency:            z.string().default('KES'),
    language:            z.string().default('en'),
    status:              z.enum(['active', 'inactive', 'suspended']).default('active'),
    verification_status: z.enum(['pending', 'verified', 'rejected']).default('pending'),
    verification_notes:  z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface EditPageProps extends PageProps { school: School }

export default function EditSchool() {
    const { school } = usePage<EditPageProps>().props;

    const { register, handleSubmit, setValue, setError, formState: { errors, isSubmitting } } =
        useForm<FormData>({
            resolver: zodResolver(schema) as any,
            defaultValues: {
                name: school.name,
                slug: school.slug,
                email: school.email ?? '',
                phone: school.phone ?? '',
                address: school.address ?? '',
                city: school.city ?? '',
                county: (school as any).county ?? '',
                sub_county: (school as any).sub_county ?? '',
                country: school.country ?? 'KE',
                curriculum: (school as any).curriculum ?? 'cbc',
                registration_number: (school as any).registration_number ?? '',
                knec_code: (school as any).knec_code ?? '',
                nemis_code: (school as any).nemis_code ?? '',
                timezone: school.timezone ?? 'Africa/Nairobi',
                currency: school.currency ?? 'KES',
                language: school.language ?? 'en',
                status: school.status,
                verification_status: (school as any).verification_status ?? 'pending',
                verification_notes: (school as any).verification_notes ?? '',
            },
        });

    const onSubmit = (data: FormData) => {
        router.put(`/super-admin/schools/${school.id}`, data, {
            onError: (errs) => Object.entries(errs).forEach(([f, m]) =>
                setError(f as keyof FormData, { message: m })
            ),
        });
    };

    const Field = ({ name, label, placeholder, type = 'text', required = false }: {
        name: keyof FormData; label: string; placeholder?: string; type?: string; required?: boolean;
    }) => (
        <div className="space-y-1.5">
            <Label htmlFor={name} className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {label}{required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            <Input id={name} type={type} placeholder={placeholder} className="h-10 text-sm" {...register(name)} />
            {errors[name] && <p className="text-xs text-red-500">{errors[name]?.message as string}</p>}
        </div>
    );

    return (
        <AppLayout breadcrumbs={[
            { label: 'Schools', href: '/super-admin/schools' },
            { label: school.name, href: `/super-admin/schools/${school.id}` },
            { label: 'Edit' },
        ]}>
            <Head title={`Edit ${school.name}`} />

            <div className="max-w-4xl pb-12">
                <div className="flex items-center gap-3 mb-6">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={`/super-admin/schools/${school.id}`}><ArrowLeft className="w-4 h-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Edit School</h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{school.name} &middot; ID #{school.id}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
                    {/* 1. Basic Information */}
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                <Building2 className="w-4 h-4 text-indigo-600" /> Basic Institution Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <Field name="name" label="School Name" required placeholder="e.g. Greenfield Academy" />
                            </div>
                            <Field name="slug" label="URL Slug" placeholder="greenfield-academy" />
                            <Field name="email" label="Institutional Email" type="email" placeholder="info@greenfield.edu" />
                            <Field name="phone" label="Official Phone" placeholder="+254 700 000000" />
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Account Status</Label>
                                <Select defaultValue={school.status} onValueChange={(v) => setValue('status', v as FormData['status'])}>
                                    <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="suspended">Suspended</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 2. Government & Regulatory Identity */}
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                <ShieldCheck className="w-4 h-4 text-indigo-600" /> Government & Regulatory Identity Audit
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field name="registration_number" label="Ministry of Education (MOE) Reg No" placeholder="e.g. MOE/P/2024/091" />
                            <Field name="knec_code" label="KNEC Centre Code" placeholder="e.g. 20401102" />
                            <Field name="nemis_code" label="NEMIS / UIC National Code" placeholder="e.g. UIC-881290" />
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Curriculum System</Label>
                                <Select defaultValue={(school as any).curriculum || 'cbc'} onValueChange={(v) => setValue('curriculum', v)}>
                                    <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cbc">CBC (Competency Based Curriculum)</SelectItem>
                                        <SelectItem value="844">8-4-4 System</SelectItem>
                                        <SelectItem value="dual">Dual Curriculum (CBC & 8-4-4)</SelectItem>
                                        <SelectItem value="international">International / IGCSE</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 3. Location & Administrative Boundaries */}
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                <MapPin className="w-4 h-4 text-indigo-600" /> Geographic & Administrative Location
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Physical Campus Address</Label>
                                    <Textarea className="resize-none text-sm" rows={2} placeholder="Street, Building, Plot No..." {...register('address')} />
                                </div>
                            </div>
                            <Field name="city" label="City / Town" placeholder="e.g. Nairobi" />
                            <Field name="county" label="County" placeholder="e.g. Nairobi County" />
                            <Field name="sub_county" label="Sub-County" placeholder="e.g. Dagoretti North" />
                            <Field name="country" label="Country (ISO-2)" placeholder="KE" />
                        </CardContent>
                    </Card>

                    {/* 4. Locale Settings */}
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                <Settings2 className="w-4 h-4 text-indigo-600" /> Locale & System Preferences
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Timezone</Label>
                                <Select defaultValue={school.timezone || 'Africa/Nairobi'} onValueChange={(v) => setValue('timezone', v)}>
                                    <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT, UTC+3)</SelectItem>
                                        <SelectItem value="Africa/Kampala">Africa/Kampala (EAT, UTC+3)</SelectItem>
                                        <SelectItem value="Africa/Dar_es_Salaam">Africa/Dar es Salaam (EAT, UTC+3)</SelectItem>
                                        <SelectItem value="UTC">UTC</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Default Currency</Label>
                                <Select defaultValue={school.currency || 'KES'} onValueChange={(v) => setValue('currency', v)}>
                                    <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                                        <SelectItem value="UGX">UGX - Ugandan Shilling</SelectItem>
                                        <SelectItem value="TZS">TZS - Tanzanian Shilling</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">System Language</Label>
                                <Select defaultValue={school.language || 'en'} onValueChange={(v) => setValue('language', v)}>
                                    <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="en">English</SelectItem>
                                        <SelectItem value="sw">Kiswahili</SelectItem>
                                        <SelectItem value="fr">French</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* 5. Verification Status & Audit Trail */}
                    <Card className="dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                <FileText className="w-4 h-4 text-indigo-600" /> Platform Verification & Auditor Notes
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4 space-y-4">
                            <div className="max-w-xs space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Verification Status</Label>
                                <Select defaultValue={(school as any).verification_status || 'pending'} onValueChange={(v) => setValue('verification_status', v as FormData['verification_status'])}>
                                    <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pending">Pending Review</SelectItem>
                                        <SelectItem value="verified">Verified Institution</SelectItem>
                                        <SelectItem value="rejected">Rejected Registration</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Auditor Notes & Verification Trail</Label>
                                <Textarea className="font-mono text-xs" rows={4} placeholder="Internal compliance logs and notes..." {...register('verification_notes')} />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-3 justify-end pt-2">
                        <Button type="button" variant="outline" asChild>
                            <Link href={`/super-admin/schools/${school.id}`}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-32 cursor-pointer">
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save School Details'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}