import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/Types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import {
    ArrowLeft,
    Building2,
    Check,
    Copy,
    Eye,
    EyeOff,
    Globe,
    Lock,
    Save,
    Shield,
    Smartphone
} from 'lucide-react';

interface Props extends PageProps {mpesaConfig?: {
        shortcode?: string | null;
        shortcode_type?: 'paybill' | 'till';
        consumer_key?: string | null;
        consumer_secret?: string | null;
        passkey?: string | null;
        account_reference_format?: string;
        is_active?: boolean;
        is_sandbox?: boolean;
    } | null;
    bankConfig?: {
        bank_details?: {
            bank_name?: string;
            branch?: string;
            account_no?: string;
            account_name?: string;
            payment_instructions?: string;
        } | null;
        is_active?: boolean;
    } | null;
    webhookUrl: string;
}

export default function PaymentIntegrations({ auth, school, mpesaConfig, bankConfig, webhookUrl }: Props) {
    const [copied, setCopied] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [showSecret, setShowSecret] = useState(false);
    const [showPasskey, setShowPasskey] = useState(false);

    const isLocalhost = webhookUrl.includes('127.0.0.1') || webhookUrl.includes('localhost');

    const mpesaForm = useForm({
        shortcode: mpesaConfig?.shortcode || '',
        shortcode_type: mpesaConfig?.shortcode_type || 'paybill',
        consumer_key: mpesaConfig?.consumer_key || '',
        consumer_secret: mpesaConfig?.consumer_secret || '',
        passkey: mpesaConfig?.passkey || '',
        account_reference_format: mpesaConfig?.account_reference_format || 'admission_no',
        is_sandbox: mpesaConfig?.is_sandbox ?? false,
        is_active: mpesaConfig?.is_active ?? true,
    });

    const bankForm = useForm({
        bank_name: bankConfig?.bank_details?.bank_name || '',
        branch: bankConfig?.bank_details?.branch || '',
        account_no: bankConfig?.bank_details?.account_no || '',
        account_name: bankConfig?.bank_details?.account_name || '',
        payment_instructions: bankConfig?.bank_details?.payment_instructions || 'Please include the student admission number as the deposit reference.',
        is_active: bankConfig?.is_active ?? true,
    });

    const handleCopy = () => {
        navigator.clipboard.writeText(webhookUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const submitMpesa = (e: React.FormEvent) => {
        e.preventDefault();
        mpesaForm.post('/school/fees/integrations/mpesa');
    };

    const submitBank = (e: React.FormEvent) => {
        e.preventDefault();
        bankForm.post('/school/fees/integrations/bank');
    };

    return (
        <AppLayout header="Payment Gateway Integrations">
            <Head title="Payment Gateways - EduFlow" />

            <div className="max-w-5xl mx-auto space-y-8 pb-16">
                {/* Header */}
                <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
                    <Link
                        href="/school/fees/payments"
                        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 mb-2 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                        Back to Payments Ledger
                    </Link>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                Payment Gateways & Automated Reconciliation
                            </h1>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Manage direct M-Pesa C2B/STK Push ingestion endpoints and bank settlement accounts for {school?.name}.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Webhook Endpoint Card */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                                Inbound Webhook Endpoint (Confirmation URL)
                            </h2>
                        </div>

                        <div className="flex items-center gap-2">
                            {isLocalhost ? (
                                <span className="inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-semibold">
                                    Local Sandbox Host
                                </span>
                            ) : (
                                <span className="inline-flex items-center text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold">
                                    Live Production Host
                                </span>
                            )}
                            <span className="text-[10px] text-slate-500 font-mono">Idempotent</span>
                        </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                        Register this endpoint in the Safaricom Daraja Portal as your C2B Confirmation URL. Incoming transactions are matched against student admission numbers and credited to student ledgers in real time.
                    </p>

                    <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-1.5 focus-within:border-slate-400 dark:focus-within:border-slate-600 transition-colors">
                        <span className="px-3 text-xs font-mono text-slate-700 dark:text-slate-300 flex-1 truncate select-all">
                            {webhookUrl}
                        </span>
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={handleCopy}
                            className="h-7 text-xs font-medium px-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-none text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                                    Copied
                                </>
                            ) : (
                                <>
                                    <Copy className="w-3.5 h-3.5 mr-1 text-slate-500" />
                                    Copy URL
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Safaricom Daraja Integration */}
                <form onSubmit={submitMpesa} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 flex items-center justify-center text-emerald-600">
                                <Smartphone className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Safaricom Daraja API (C2B & STK Push)</h2>
                                <p className="text-xs text-slate-500">Configure Paybill / Buy Goods credentials for automated settlement.</p>
                            </div>
                        </div>

                        {/* Environment Toggle */}
                        <div className="flex items-center gap-2">
                            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-900 text-xs">
                                <button
                                    type="button"
                                    onClick={() => mpesaForm.setData('is_sandbox', false)}
                                    className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                                        !mpesaForm.data.is_sandbox
                                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                                    }`}
                                >
                                    Live Mode
                                </button>
                                <button
                                    type="button"
                                    onClick={() => mpesaForm.setData('is_sandbox', true)}
                                    className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                                        mpesaForm.data.is_sandbox
                                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                                            : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                                    }`}
                                >
                                    Sandbox (Test)
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">Shortcode Type</label>
                            <Select
                                value={mpesaForm.data.shortcode_type}
                                onValueChange={(v: 'paybill' | 'till') => mpesaForm.setData('shortcode_type', v)}
                            >
                                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="paybill">Paybill Number</SelectItem>
                                    <SelectItem value="till">Buy Goods (Till Number)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">Business Shortcode</label>
                            <Input
                                required
                                placeholder="e.g. 522522"
                                value={mpesaForm.data.shortcode}
                                onChange={(e) => mpesaForm.setData('shortcode', e.target.value)}
                                className="h-9 text-xs font-mono"
                            />
                        </div>

                        <div>
                            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">Account Reference Matching</label>
                            <Select
                                value={mpesaForm.data.account_reference_format}
                                onValueChange={(v) => mpesaForm.setData('account_reference_format', v)}
                            >
                                <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admission_no">Student Admission Number</SelectItem>
                                    <SelectItem value="assessment_no">Assessment / Index Number</SelectItem>
                                    <SelectItem value="nemis_upi">NEMIS UPI</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                            API Authentication Keys (Optional for manual C2B, required for STK Push)
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                            <div>
                                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">Consumer Key</label>
                                <div className="relative">
                                    <Input
                                        type={showKey ? 'text' : 'password'}
                                        placeholder="Paste Consumer Key..."
                                        value={mpesaForm.data.consumer_key}
                                        onChange={(e) => mpesaForm.setData('consumer_key', e.target.value)}
                                        className="h-9 text-xs font-mono pr-8"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowKey(!showKey)}
                                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">Consumer Secret</label>
                                <div className="relative">
                                    <Input
                                        type={showSecret ? 'text' : 'password'}
                                        placeholder="Paste Consumer Secret..."
                                        value={mpesaForm.data.consumer_secret}
                                        onChange={(e) => mpesaForm.setData('consumer_secret', e.target.value)}
                                        className="h-9 text-xs font-mono pr-8"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSecret(!showSecret)}
                                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">Online Passkey</label>
                                <div className="relative">
                                    <Input
                                        type={showPasskey ? 'text' : 'password'}
                                        placeholder="Paste Passkey..."
                                        value={mpesaForm.data.passkey}
                                        onChange={(e) => mpesaForm.setData('passkey', e.target.value)}
                                        className="h-9 text-xs font-mono pr-8"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasskey(!showPasskey)}
                                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        {showPasskey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={mpesaForm.data.is_active}
                                    onChange={(e) => mpesaForm.setData('is_active', e.target.checked)}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                Enable M-Pesa automated reconciliation
                            </label>
                        </div>

                        <Button
                            type="submit"
                            disabled={mpesaForm.processing}
                            size="sm"
                            className="h-8 px-4 text-xs bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-semibold"
                        >
                            <Save className="w-3.5 h-3.5 mr-1.5" />
                            {mpesaForm.processing ? 'Saving...' : 'Save M-Pesa Config'}
                        </Button>
                    </div>
                </form>

                {/* Institutional Bank Accounts */}
                <form onSubmit={submitBank} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-600">
                            <Building2 className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Institutional Bank Deposit Accounts</h2>
                            <p className="text-xs text-slate-500">Rendered on official fee invoices and the parent statement portal.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">Bank Name</label>
                            <Input
                                required
                                placeholder="e.g. Kenya Commercial Bank (KCB)"
                                value={bankForm.data.bank_name}
                                onChange={(e) => bankForm.setData('bank_name', e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>

                        <div>
                            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">Branch Name</label>
                            <Input
                                placeholder="e.g. Westlands Branch"
                                value={bankForm.data.branch}
                                onChange={(e) => bankForm.setData('branch', e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>

                        <div>
                            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">Account Number</label>
                            <Input
                                required
                                placeholder="e.g. 1100223344"
                                value={bankForm.data.account_no}
                                onChange={(e) => bankForm.setData('account_no', e.target.value)}
                                className="h-9 text-xs font-mono"
                            />
                        </div>

                        <div>
                            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">Account Title / Payee Name</label>
                            <Input
                                required
                                placeholder="e.g. Greenfield Academy Fee Collection"
                                value={bankForm.data.account_name}
                                onChange={(e) => bankForm.setData('account_name', e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1.5">Deposit Reference Instruction</label>
                            <Input
                                placeholder="e.g. Quote Student Admission Number as the bank deposit slip reference."
                                value={bankForm.data.payment_instructions}
                                onChange={(e) => bankForm.setData('payment_instructions', e.target.value)}
                                className="h-9 text-xs"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                        <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={bankForm.data.is_active}
                                onChange={(e) => bankForm.setData('is_active', e.target.checked)}
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            Display bank account details on invoices and parent portals
                        </label>

                        <Button
                            type="submit"
                            disabled={bankForm.processing}
                            size="sm"
                            className="h-8 px-4 text-xs bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white font-semibold"
                        >
                            <Save className="w-3.5 h-3.5 mr-1.5" />
                            {bankForm.processing ? 'Saving...' : 'Save Bank Details'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}