import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps, PaginatedData } from '@/Types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { formatDate } from '@/lib/utils';
import {
    ArrowLeft,
    Download,
    FileSpreadsheet,
    FileText,
    Filter,
    Lock,
    Search,
    Shield,
    ShieldAlert,
    UserCheck,
    Tag
} from 'lucide-react';

interface DataAccessLogItem {
    id: number;
    school_id: number;
    user_id: number;
    student_id?: number | null;
    action: string;
    resource_type: string;
    resource_id?: string | null;
    details?: any;
    ip_address?: string | null;
    created_at: string;
    user?: {
        id: number;
        name: string;
        email: string;
    };
    student?: {
        id: number;
        first_name: string;
        last_name: string;
        admission_no: string;
    };
}

interface Props extends PageProps {
    logs: PaginatedData<DataAccessLogItem>;
    filters: {
        action: string;
        resource_type: string;
        search: string;
        date_from: string;
        date_to: string;
    };
    metrics: {
        total_events: number;
        downloads: number;
        medical_audits: number;
        vault_uploads: number;
    };
}

function RenderContextDetails({ details }: { details: any }) {
    if (!details) return <span className="text-slate-400">—</span>;

    let parsed = details;
    if (typeof details === 'string') {
        try {
            parsed = JSON.parse(details);
        } catch {
            return <span className="text-slate-700 dark:text-slate-300">{details}</span>;
        }
    }

    if (typeof parsed === 'object' && parsed !== null) {
        const title = parsed.title || parsed.name || parsed.reason || parsed.description;
        const category = parsed.category || parsed.type || parsed.document_type;
        const extraFields = Object.entries(parsed).filter(
            ([k]) => !['title', 'name', 'reason', 'description', 'category', 'type', 'document_type'].includes(k)
        );

        return (
            <div className="space-y-1 max-w-sm">
                {title && (
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5 line-clamp-1">
                        <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{title}</span>
                    </div>
                )}
                {category && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                        <Tag className="w-2.5 h-2.5" />
                        <span>{category}</span>
                    </div>
                )}
                {extraFields.length > 0 && !title && !category && (
                    <span className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                        {JSON.stringify(parsed)}
                    </span>
                )}
            </div>
        );
    }

    return <span className="text-slate-700 dark:text-slate-300">{String(details)}</span>;
}

export default function OdpcAuditLog({ auth, logs, filters, metrics }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [action, setAction] = useState(filters.action || '');
    const [resourceType, setResourceType] = useState(filters.resource_type || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        router.get(
            '/school/compliance/odpc-audit',
            {
                search,
                action,
                resource_type: resourceType,
                date_from: dateFrom,
                date_to: dateTo,
            },
            { preserveState: true, replace: true }
        );
    };

    const actionBadge = (act: string) => {
        switch (act.toUpperCase()) {
            case 'DOWNLOAD':
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300';
            case 'VIEW':
                return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300';
            case 'DELETE':
                return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300';
            case 'UPLOAD':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300';
        }
    };

    return (
        <AppLayout header="ODPC Data Access Audit Trail">
            <Head title="ODPC Compliance Audit Logs - EduFlow" />

            <div className="space-y-6 max-w-7xl mx-auto pb-12">
                {/* Header Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Shield className="w-6 h-6 text-emerald-600" />
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Kenya Data Protection Act (ODPC) Audit Trail
                            </h1>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Immutable logging of sensitive student and employee personal data access, profile exports, and records modifications.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <a
                            href="/school/compliance/odpc-audit/export"
                            download="ODPC_Data_Access_Audit_Trail.csv"
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs transition-all hover:scale-[1.02]"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                            <span>Export Audit Trail (CSV)</span>
                        </a>
                    </div>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Audit Events</span>
                        <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{metrics.total_events.toLocaleString()}</p>
                        <span className="text-[10px] text-slate-500">Recorded data requests</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Medical Data Access</span>
                        <p className="text-2xl font-black text-rose-600 mt-1">{metrics.medical_audits.toLocaleString()}</p>
                        <span className="text-[10px] text-slate-500">Sensitive health profile views</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Data Exports</span>
                        <p className="text-2xl font-black text-amber-600 mt-1">{metrics.downloads.toLocaleString()}</p>
                        <span className="text-[10px] text-slate-500">CSV & PDF records exported</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Vault Uploads</span>
                        <p className="text-2xl font-black text-emerald-600 mt-1">{metrics.vault_uploads.toLocaleString()}</p>
                        <span className="text-[10px] text-slate-500">Encrypted student doc files</span>
                    </div>
                </div>

                {/* Filter Toolbar */}
                <form onSubmit={handleFilter} className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                            <Input
                                placeholder="Search by staff name, student..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9 h-9 text-xs"
                            />
                        </div>

                        <div>
                            <Select value={action} onValueChange={setAction}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Actions" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Actions</SelectItem>
                                    <SelectItem value="VIEW">View Record</SelectItem>
                                    <SelectItem value="DOWNLOAD">Export / Download</SelectItem>
                                    <SelectItem value="UPLOAD">Upload Document</SelectItem>
                                    <SelectItem value="DELETE">Delete Record</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Select value={resourceType} onValueChange={setResourceType}>
                                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="All Resource Types" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Resource Types</SelectItem>
                                    <SelectItem value="student_profile">Student Profile</SelectItem>
                                    <SelectItem value="medical_profile">Medical Profile</SelectItem>
                                    <SelectItem value="academic_report">CBC Assessment Report</SelectItem>
                                    <SelectItem value="fee_statement">Fee Statement</SelectItem>
                                    <SelectItem value="student_document">Vault Document</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="h-9 text-xs"
                                placeholder="From Date"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="h-9 text-xs flex-1"
                                placeholder="To Date"
                            />
                            <Button type="submit" className="h-9 text-xs px-4 font-bold bg-slate-900 hover:bg-slate-800 text-white">
                                Filter
                            </Button>
                        </div>
                    </div>
                </form>

                {/* Audit Log Table */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
                                <tr>
                                    <th className="py-3 px-4">Timestamp (EAT)</th>
                                    <th className="py-3 px-4">Staff Member</th>
                                    <th className="py-3 px-4">Action</th>
                                    <th className="py-3 px-4">Resource Target</th>
                                    <th className="py-3 px-4">Student Subject</th>
                                    <th className="py-3 px-4">Context Details</th>
                                    <th className="py-3 px-4">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                                {logs.data && logs.data.length > 0 ? (
                                    logs.data.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="py-3 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                                                {formatDate(item.created_at)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-slate-900 dark:text-white">
                                                    {item.user?.name || 'System / Batch'}
                                                </div>
                                                <div className="text-[10px] text-slate-400">{item.user?.email || '-'}</div>
                                            </td>
                                            <td className="py-3 px-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center text-[10px] px-2.5 py-0.5 rounded-full border font-bold ${actionBadge(item.action)}`}>
                                                    {item.action}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                                                {item.resource_type}
                                            </td>
                                            <td className="py-3 px-4">
                                                {item.student ? (
                                                    <div>
                                                        <div className="font-bold text-slate-900 dark:text-white">
                                                            {item.student.first_name} {item.student.last_name}
                                                        </div>
                                                        <div className="text-[10px] text-slate-400 font-mono">
                                                            ADM: {item.student.admission_no}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400">—</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <RenderContextDetails details={item.details} />
                                            </td>
                                            <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                                {item.ip_address || '127.0.0.1'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-500">
                                            <ShieldAlert className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                                            <p className="font-bold">No ODPC audit log events found.</p>
                                            <p className="text-[11px] text-slate-400">Events are recorded in real-time when student records or health profiles are accessed.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}