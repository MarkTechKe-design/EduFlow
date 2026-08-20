import AppLayout from '@/Layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEvent, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Package as PackageIcon, Plus, Edit3, Trash2, Check, Save, X } from 'lucide-react';

interface PackageRecord {
    id: number;
    name: string;
    badge?: string | null;
    slug: string;
    description: string | null;
    price_monthly: string | number;
    price_yearly: string | number;
    trial_days: number;
    max_students: number;
    max_staff: number;
    storage_gb: number;
    sort_order: number;
    is_active: boolean;
    is_popular: boolean;
    is_public: boolean;
    features: string[] | null;
    modules?: { id: number; module_slug: string }[];
}

interface AvailableModule {
    slug: string;
    name: string;
}

interface Props {
    packages: PackageRecord[];
    availableModules: AvailableModule[];
}

const emptyPackage = {
    name: '',
    badge: 'AVAILABLE PLAN',
    slug: '',
    description: '',
    price_monthly: 4500,
    price_yearly: 45000,
    trial_days: 14,
    max_students: 300,
    max_staff: 25,
    storage_gb: 10,
    sort_order: 1,
    is_active: true,
    is_popular: false,
    is_public: true,
    features: '',
    modules: ['academics', 'attendance', 'communication'] as string[],
};

export default function PackagesIndex({ packages = [], availableModules = [] }: Props) {
    const [editing, setEditing] = useState<PackageRecord | null>(null);

    const form = useForm({ ...emptyPackage });

    function startCreate() {
        setEditing(null);
        form.setData({ ...emptyPackage });
        form.clearErrors();
    }

    function startEdit(pkg: PackageRecord) {
        setEditing(pkg);
        form.setData({
            name: pkg.name,
            badge: pkg.badge ?? '',
            slug: pkg.slug,
            description: pkg.description ?? '',
            price_monthly: Number(pkg.price_monthly),
            price_yearly: Number(pkg.price_yearly),
            trial_days: pkg.trial_days || 14,
            max_students: pkg.max_students,
            max_staff: pkg.max_staff,
            storage_gb: pkg.storage_gb,
            sort_order: pkg.sort_order || 1,
            is_active: pkg.is_active,
            is_popular: pkg.is_popular,
            is_public: pkg.is_public,
            features: Array.isArray(pkg.features) ? pkg.features.join("\n") : '',
            modules: pkg.modules?.map(m => m.module_slug) || [],
        });
        form.clearErrors();
    }

    function toggleModule(slug: string) {
        const current = [...form.data.modules];
        const idx = current.indexOf(slug);
        if (idx > -1) {
            current.splice(idx, 1);
        } else {
            current.push(slug);
        }
        form.setData('modules', current);
    }

    function submit(e: FormEvent) {
        e.preventDefault();
        if (editing) {
            form.put(`/super-admin/packages/${editing.id}`, {
                preserveScroll: true,
                onSuccess: () => setEditing(null),
            });
        } else {
            form.post('/super-admin/packages', {
                preserveScroll: true,
                onSuccess: () => form.reset(),
            });
        }
    }

    return (
        <AppLayout title="SaaS Packages">
            <div className="space-y-6 max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">SaaS Packages & Pricing</h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            Manage subscription tiers, presentation badges, monthly/annual fees, and capability feature lines.
                        </p>
                    </div>
                    <Button
                        onClick={startCreate}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 shadow-xs"
                    >
                        <Plus className="h-4 w-4" />
                        <span>New Package</span>
                    </Button>
                </div>

                {/* Main Content Grid */}
                <div className="grid gap-6 lg:grid-cols-12 items-start">

                    {/* Left: Packages List */}
                    <div className="lg:col-span-7 space-y-4">
                        <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <PackageIcon className="h-5 w-5 text-indigo-600" />
                                    <span>Active Tiers ({packages.length})</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {packages.map((pkg) => {
                                        const isSelected = editing?.id === pkg.id;
                                        return (
                                            <div
                                                key={pkg.id}
                                                className={`p-5 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                                                    isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : 'hover:bg-slate-50/80'
                                                }`}
                                            >
                                                <div onClick={() => startEdit(pkg)} className="cursor-pointer space-y-1.5 flex-1">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-bold text-sm text-slate-950 dark:text-white">{pkg.name}</span>
                                                        {pkg.badge && (
                                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-extrabold uppercase">
                                                                {pkg.badge}
                                                            </span>
                                                        )}
                                                        {pkg.is_popular && (
                                                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                                                Popular
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-600 leading-snug line-clamp-2">{pkg.description}</p>
                                                    <div className="flex items-center gap-3 text-xs text-slate-500 pt-1 font-mono">
                                                        <span className="font-bold text-slate-900">KES {Number(pkg.price_monthly).toLocaleString()}/mo</span>
                                                        <span>•</span>
                                                        <span>KES {Number(pkg.price_yearly).toLocaleString()}/yr</span>
                                                        <span>•</span>
                                                        <span>{pkg.max_students} Students</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Button size="sm" variant="outline" onClick={() => startEdit(pkg)} className="h-8 text-xs">
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => confirm(`Archive package "${pkg.name}"?`) && router.delete(`/super-admin/packages/${pkg.id}`)}
                                                        className="h-8 w-8 p-0 text-slate-400 hover:text-rose-600"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Package Form Editor */}
                    <div className="lg:col-span-5 space-y-4">
                        <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Edit3 className="h-4 w-4 text-indigo-600" />
                                        <CardTitle className="text-sm font-bold">
                                            {editing ? `Edit: ${editing.name}` : 'Create New Package'}
                                        </CardTitle>
                                    </div>
                                    {editing && (
                                        <button onClick={startCreate} className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1">
                                            <X className="h-3.5 w-3.5" />
                                            <span>Cancel</span>
                                        </button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-5">
                                <form onSubmit={submit} className="space-y-4 text-xs">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold">Plan Name *</Label>
                                            <Input
                                                value={form.data.name}
                                                onChange={e => form.setData('name', e.target.value)}
                                                placeholder="e.g. Standard CBC School"
                                                className="h-9 text-xs rounded-xl"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold">Badge Pill</Label>
                                            <Input
                                                value={form.data.badge}
                                                onChange={e => form.setData('badge', e.target.value)}
                                                placeholder="e.g. POPULAR CHOICE"
                                                className="h-9 text-xs uppercase rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs font-semibold">Target Scope (Description) *</Label>
                                        <textarea
                                            rows={2}
                                            value={form.data.description}
                                            onChange={e => form.setData('description', e.target.value)}
                                            placeholder="Target audience and operational scope..."
                                            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold">Monthly (KES) *</Label>
                                            <Input
                                                type="number"
                                                value={form.data.price_monthly}
                                                onChange={e => form.setData('price_monthly', Number(e.target.value))}
                                                className="h-9 text-xs rounded-xl"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold">Yearly (KES) *</Label>
                                            <Input
                                                type="number"
                                                value={form.data.price_yearly}
                                                onChange={e => form.setData('price_yearly', Number(e.target.value))}
                                                className="h-9 text-xs rounded-xl"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold">Trial Days</Label>
                                            <Input
                                                type="number"
                                                value={form.data.trial_days}
                                                onChange={e => form.setData('trial_days', Number(e.target.value))}
                                                className="h-9 text-xs rounded-xl"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold">Max Students</Label>
                                            <Input
                                                type="number"
                                                value={form.data.max_students}
                                                onChange={e => form.setData('max_students', Number(e.target.value))}
                                                className="h-9 text-xs rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold">Max Staff</Label>
                                            <Input
                                                type="number"
                                                value={form.data.max_staff}
                                                onChange={e => form.setData('max_staff', Number(e.target.value))}
                                                className="h-9 text-xs rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-semibold">Storage (GB)</Label>
                                            <Input
                                                type="number"
                                                value={form.data.storage_gb}
                                                onChange={e => form.setData('storage_gb', Number(e.target.value))}
                                                className="h-9 text-xs rounded-xl"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 pt-1">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={form.data.is_popular}
                                                onChange={e => form.setData('is_popular', e.target.checked)}
                                                className="rounded text-emerald-600 focus:ring-emerald-500"
                                            />
                                            <span className="font-semibold">Most Popular Choice</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={form.data.is_active}
                                                onChange={e => form.setData('is_active', e.target.checked)}
                                                className="rounded text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="font-semibold">Active</span>
                                        </label>
                                    </div>

                                    <div className="space-y-1 border-t border-slate-100 pt-3">
                                        <Label className="text-xs font-semibold">Core Capabilities Included (1 per line)</Label>
                                        <textarea
                                            rows={5}
                                            value={form.data.features}
                                            onChange={e => form.setData('features', e.target.value)}
                                            placeholder="Up to 1,000 Enrolled Students&#10;Automated M-Pesa Daraja Paybill / Till Reconciliation&#10;Full CBC Junior School Assessment Suite"
                                            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono leading-relaxed focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                                        />
                                    </div>

                                    <div className="space-y-2 border-t border-slate-100 pt-3">
                                        <Label className="text-xs font-semibold">Allowed System Modules</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {availableModules.map(mod => {
                                                const checked = form.data.modules.includes(mod.slug);
                                                return (
                                                    <div
                                                        key={mod.slug}
                                                        onClick={() => toggleModule(mod.slug)}
                                                        className={`p-2 rounded-xl border text-[11px] font-semibold cursor-pointer transition-all flex items-center gap-2 ${
                                                            checked
                                                                ? 'bg-indigo-50 border-indigo-300 text-indigo-900'
                                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                        }`}
                                                    >
                                                        <div className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 border ${
                                                            checked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'
                                                        }`}>
                                                            {checked && <Check className="w-2.5 h-2.5" />}
                                                        </div>
                                                        <span className="truncate">{mod.name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="pt-3 flex justify-end">
                                        <Button
                                            type="submit"
                                            disabled={form.processing}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5"
                                        >
                                            <Save className="h-3.5 w-3.5" />
                                            <span>{editing ? 'Save Changes' : 'Create Package'}</span>
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                </div>

            </div>
        </AppLayout>
    );
}