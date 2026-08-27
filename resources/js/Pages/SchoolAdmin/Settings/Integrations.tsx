import AppLayout from '@/Layouts/AppLayout';
import { useForm } from '@inertiajs/react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import {
    Mail,
    MessageSquare,
    CheckCircle,
    Send,
    Radio,
    ShieldCheck,
    Smartphone,
    Server,
    Layers
} from 'lucide-react';

interface SmtpSettings {
    host: string;
    port: string;
    username: string;
    password: string;
    encryption: string;
    from_name: string;
    from_email: string;
}

interface SmsSettings {
    provider: string;
    username?: string;
    api_key?: string;
    partner_id?: string;
    sender_id?: string;
    service_id?: string;
}

interface Props {
    smtp: SmtpSettings;
    sms: SmsSettings;
}

const KENYA_PROVIDERS = [
    {
        id: 'africas_talking',
        name: "Africa's Talking (Kenya)",
        badge: 'Recommended',
        desc: 'Direct SMPP connections to Safaricom, Airtel & Telkom with custom alphanumeric sender IDs.',
    },
    {
        id: 'advanta',
        name: 'Advanta Africa',
        badge: 'Fast Delivery',
        desc: 'High-throughput QuickSMS API with Partner ID & registered shortcode support.',
    },
    {
        id: 'mobitech',
        name: 'Mobitech Technologies',
        badge: 'Local Gateway',
        desc: 'Kenyan bulk SMS aggregator with instant DLR webhook tracking.',
    },
];

export default function Integrations({ smtp, sms }: Props) {
    const [activeTab, setActiveTab] = useState<'smtp' | 'sms'>('sms');

    const smtpForm = useForm({
        host: smtp.host || 'smtp.gmail.com',
        port: smtp.port || '587',
        username: smtp.username || '',
        password: '',
        encryption: smtp.encryption || 'tls',
        from_name: smtp.from_name || 'EduFlow School Notifications',
        from_email: smtp.from_email || '',
    });

    const smsForm = useForm({
        provider: sms.provider || 'africas_talking',
        username: sms.username || '',
        api_key: '',
        partner_id: sms.partner_id || '',
        sender_id: sms.sender_id || '',
        service_id: sms.service_id || '',
    });

    const testSmtp = useForm({ test_email: '' });
    const testSms = useForm({ test_phone: '' });

    function submitSmtp(e: React.FormEvent) {
        e.preventDefault();
        smtpForm.post('/school/settings/integrations/smtp');
    }

    function submitSms(e: React.FormEvent) {
        e.preventDefault();
        smsForm.post('/school/settings/integrations/sms');
    }

    function sendTestEmail(e: React.FormEvent) {
        e.preventDefault();
        testSmtp.post('/school/settings/integrations/smtp/test', {
            onSuccess: () => testSmtp.reset(),
        });
    }

    function sendTestSms(e: React.FormEvent) {
        e.preventDefault();
        testSms.post('/school/settings/integrations/sms/test', {
            onSuccess: () => testSms.reset(),
        });
    }

    return (
        <AppLayout header="Communications & Gateway Integrations">
            <div className="max-w-4xl space-y-6 pb-16">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Radio className="w-5 h-5 text-emerald-600" />
                        <span>Communications & Gateway Integrations</span>
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Configure institutional Kenyan bulk SMS aggregators (Africa's Talking, Advanta, Mobitech) and transactional SMTP for parent notices, fee alerts, and CBC grade releases.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('sms')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'sms'
                                ? 'bg-slate-900 text-white shadow-xs dark:bg-emerald-600'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800'
                        }`}
                    >
                        <Smartphone className="w-4 h-4" />
                        <span>Kenyan Bulk SMS Gateways</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('smtp')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'smtp'
                                ? 'bg-slate-900 text-white shadow-xs dark:bg-emerald-600'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800'
                        }`}
                    >
                        <Mail className="w-4 h-4" />
                        <span>Email SMTP Relay</span>
                    </button>
                </div>

                {/* SMS Gateway Section */}
                {activeTab === 'sms' && (
                    <div className="space-y-6">
                        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xs">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                            <Smartphone className="w-4 h-4 text-emerald-600" />
                                            <span>Kenyan Telco Aggregator Selection</span>
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Select your local licensed bulk SMS vendor and set your CA-approved Alphanumeric Sender ID.
                                        </CardDescription>
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full">
                                        Kenya Only (254)
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={submitSms} className="space-y-6">
                                    {/* Provider Radio Cards */}
                                    <div className="grid sm:grid-cols-3 gap-3">
                                        {KENYA_PROVIDERS.map((p) => {
                                            const isSelected = smsForm.data.provider === p.id;
                                            return (
                                                <div
                                                    key={p.id}
                                                    onClick={() => smsForm.setData('provider', p.id)}
                                                    className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                                                        isSelected
                                                            ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 ring-2 ring-emerald-500/20'
                                                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-bold text-xs text-slate-900 dark:text-white">{p.name}</span>
                                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600">
                                                            {p.badge}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 leading-snug">{p.desc}</p>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Dynamic Fields */}
                                    {smsForm.data.provider === 'africas_talking' && (
                                        <div className="grid sm:grid-cols-2 gap-4 pt-2">
                                            <div>
                                                <Label className="text-xs">AT Username / App Name *</Label>
                                                <Input
                                                    value={smsForm.data.username}
                                                    onChange={(e) => smsForm.setData('username', e.target.value)}
                                                    placeholder="e.g., eduflow_school or sandbox"
                                                    className="h-10 text-xs mt-1"
                                                />
                                                <p className="text-[10px] text-slate-400 mt-1">Use "sandbox" during development or your live app username.</p>
                                            </div>

                                            <div>
                                                <Label className="text-xs">Alphanumeric Sender ID</Label>
                                                <Input
                                                    value={smsForm.data.sender_id}
                                                    onChange={(e) => smsForm.setData('sender_id', e.target.value)}
                                                    placeholder="e.g. ALLIANCE_HS or EDUFLOW"
                                                    className="h-10 text-xs mt-1 font-mono uppercase"
                                                />
                                                <p className="text-[10px] text-slate-400 mt-1">Leave blank on sandbox to use the default test sender.</p>
                                            </div>

                                            <div className="sm:col-span-2">
                                                <Label className="text-xs">Africa's Talking API Key *</Label>
                                                <Input
                                                    type="password"
                                                    value={smsForm.data.api_key}
                                                    onChange={(e) => smsForm.setData('api_key', e.target.value)}
                                                    placeholder="atsk_..."
                                                    className="h-10 text-xs mt-1 font-mono"
                                                />
                                                <p className="text-[10px] text-slate-400 mt-1">Stored securely using Laravel encrypted keystore.</p>
                                            </div>
                                        </div>
                                    )}

                                    {smsForm.data.provider === 'advanta' && (
                                        <div className="grid sm:grid-cols-2 gap-4 pt-2">
                                            <div>
                                                <Label className="text-xs">Advanta Partner ID *</Label>
                                                <Input
                                                    value={smsForm.data.partner_id}
                                                    onChange={(e) => smsForm.setData('partner_id', e.target.value)}
                                                    placeholder="e.g. 1042"
                                                    className="h-10 text-xs mt-1"
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs">Shortcode / Sender ID *</Label>
                                                <Input
                                                    value={smsForm.data.sender_id}
                                                    onChange={(e) => smsForm.setData('sender_id', e.target.value)}
                                                    placeholder="e.g. ADVANTA or SCHOOL_NAME"
                                                    className="h-10 text-xs mt-1 font-mono uppercase"
                                                />
                                            </div>

                                            <div className="sm:col-span-2">
                                                <Label className="text-xs">Advanta API Key *</Label>
                                                <Input
                                                    type="password"
                                                    value={smsForm.data.api_key}
                                                    onChange={(e) => smsForm.setData('api_key', e.target.value)}
                                                    placeholder="adv_key_..."
                                                    className="h-10 text-xs mt-1 font-mono"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {smsForm.data.provider === 'mobitech' && (
                                        <div className="grid sm:grid-cols-3 gap-4 pt-2">
                                            <div>
                                                <Label className="text-xs">Service ID *</Label>
                                                <Input
                                                    value={smsForm.data.service_id}
                                                    onChange={(e) => smsForm.setData('service_id', e.target.value)}
                                                    placeholder="e.g. 0"
                                                    className="h-10 text-xs mt-1"
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs">Sender ID *</Label>
                                                <Input
                                                    value={smsForm.data.sender_id}
                                                    onChange={(e) => smsForm.setData('sender_id', e.target.value)}
                                                    placeholder="e.g. 23107"
                                                    className="h-10 text-xs mt-1 font-mono"
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs">Mobitech API Key *</Label>
                                                <Input
                                                    type="password"
                                                    value={smsForm.data.api_key}
                                                    onChange={(e) => smsForm.setData('api_key', e.target.value)}
                                                    placeholder="mob_api_..."
                                                    className="h-10 text-xs mt-1 font-mono"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        type="submit"
                                        disabled={smsForm.processing}
                                        className="h-10 text-xs font-bold px-6 bg-slate-950 hover:bg-slate-800 text-white rounded-xl"
                                    >
                                        Save SMS Settings
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Test SMS Dispatcher */}
                        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xs">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Send className="w-4 h-4 text-emerald-600" />
                                    <span>Send Live Test SMS</span>
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Validate your registered Sender ID and API connectivity by sending a real-time message to any Kenyan phone number.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={sendTestSms} className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <Smartphone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                        <Input
                                            value={testSms.data.test_phone}
                                            onChange={(e) => testSms.setData('test_phone', e.target.value)}
                                            placeholder="e.g. 0718178521, 0110123456 or 254718178521"
                                            className="pl-9 h-10 text-xs rounded-xl"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={testSms.processing || !testSms.data.test_phone}
                                        className="h-10 px-5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl flex items-center gap-1.5"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        <span>Dispatch Test SMS</span>
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* SMTP Section */}
                {activeTab === 'smtp' && (
                    <div className="space-y-6">
                        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xs">
                            <CardHeader>
                                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                    <Mail className="w-4 h-4 text-indigo-600" />
                                    <span>Institutional SMTP Relay</span>
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Configured for parent email statements, payment receipts, and automated staff broadcasts.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={submitSmtp} className="space-y-4">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-xs">SMTP Host *</Label>
                                            <Input
                                                value={smtpForm.data.host}
                                                onChange={(e) => smtpForm.setData('host', e.target.value)}
                                                placeholder="smtp.gmail.com or mail.school.ac.ke"
                                                className="h-10 text-xs mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">SMTP Port *</Label>
                                            <Input
                                                value={smtpForm.data.port}
                                                onChange={(e) => smtpForm.setData('port', e.target.value)}
                                                placeholder="587"
                                                className="h-10 text-xs mt-1 font-mono"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Username / Account Email *</Label>
                                            <Input
                                                value={smtpForm.data.username}
                                                onChange={(e) => smtpForm.setData('username', e.target.value)}
                                                placeholder="admissions@school.ac.ke"
                                                className="h-10 text-xs mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Password / App Password</Label>
                                            <Input
                                                type="password"
                                                value={smtpForm.data.password}
                                                onChange={(e) => smtpForm.setData('password', e.target.value)}
                                                placeholder="••••••••••••"
                                                className="h-10 text-xs mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">From Display Name *</Label>
                                            <Input
                                                value={smtpForm.data.from_name}
                                                onChange={(e) => smtpForm.setData('from_name', e.target.value)}
                                                placeholder="Alliance High School Administration"
                                                className="h-10 text-xs mt-1"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">From Sender Email *</Label>
                                            <Input
                                                type="email"
                                                value={smtpForm.data.from_email}
                                                onChange={(e) => smtpForm.setData('from_email', e.target.value)}
                                                placeholder="noreply@school.ac.ke"
                                                className="h-10 text-xs mt-1"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={smtpForm.processing}
                                        className="h-10 text-xs font-bold px-6 bg-slate-950 hover:bg-slate-800 text-white rounded-xl"
                                    >
                                        Save SMTP Settings
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Test Email Card */}
                        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-2xs">
                            <CardHeader>
                                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Send className="w-4 h-4 text-indigo-600" />
                                    <span>Send Live Test Email</span>
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Send an instant test payload to confirm TLS handshake and port delivery.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={sendTestEmail} className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                                        <Input
                                            type="email"
                                            value={testSmtp.data.test_email}
                                            onChange={(e) => testSmtp.setData('test_email', e.target.value)}
                                            placeholder="principal@school.ac.ke"
                                            className="pl-9 h-10 text-xs rounded-xl"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={testSmtp.processing || !testSmtp.data.test_email}
                                        className="h-10 px-5 text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl flex items-center gap-1.5"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        <span>Dispatch Test Email</span>
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}