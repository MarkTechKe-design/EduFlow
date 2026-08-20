import { Head, Link, useForm } from '@inertiajs/react';
import { useState } from 'react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import {
    GraduationCap, Building2, MapPin, UserCheck, ShieldCheck,
    ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Loader2
} from 'lucide-react';

interface Props {
    plans?: any[];
    curriculums?: string[];
    counties?: string[];
    branding?: any;
    navigation?: any[];
    footerNavigation?: any;
}

export default function RegisterSchool({
    plans = [],
    curriculums = ['CBC (Competency-Based Curriculum)', '8-4-4 System', 'Dual Track (CBC & 8-4-4)', 'International (IGCSE/IB)'],
    counties = [
        'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Uasin Gishu', 'Kiambu', 'Machakos', 'Kajiado',
        'Siaya', 'Kilifi', 'Meru', 'Nyeri', 'Kakamega', 'Bungoma', 'Kisii', 'Kericho', 'Other'
    ],
    branding,
    navigation,
    footerNavigation
}: Props) {
    const [stage, setStage] = useState<number>(1);

    const form = useForm({
        // Stage 1: Academic Structure
        curriculum: 'CBC (Competency-Based Curriculum)',
        levels: ['Primary', 'Junior Secondary (JSS)'],
        term_system: '3-Term National System',
        
        // Stage 2: Institution Profile
        school_name: '',
        school_type: 'Private',
        gender_type: 'Mixed / Co-Educational',
        school_motto: '',
        registration_number: '',

        // Stage 3: Location & NEMIS
        county: 'Nairobi',
        sub_county: '',
        nemis_code: '',
        physical_address: '',

        // Stage 4: Primary Administrator
        admin_name: '',
        admin_email: '',
        admin_phone: '',
        password: '',
        password_confirmation: '',
        terms_accepted: true,
    });

    const handleLevelToggle = (level: string) => {
        const current = [...form.data.levels];
        if (current.includes(level)) {
            if (current.length > 1) {
                form.setData('levels', current.filter((l) => l !== level));
            }
        } else {
            form.setData('levels', [...current, level]);
        }
    };

    const validateCurrentStage = (): boolean => {
        if (stage === 1) {
            if (!form.data.curriculum || form.data.levels.length === 0) {
                alert('Please select at least one educational level.');
                return false;
            }
        } else if (stage === 2) {
            if (!form.data.school_name.trim()) {
                alert('Please enter your school name.');
                return false;
            }
        } else if (stage === 3) {
            if (!form.data.county || !form.data.physical_address.trim()) {
                alert('Please provide your county and physical address.');
                return false;
            }
        } else if (stage === 4) {
            if (!form.data.admin_name.trim() || !form.data.admin_email.trim() || !form.data.admin_phone.trim()) {
                alert('Please fill in the administrator details.');
                return false;
            }
            if (form.data.password.length < 8) {
                alert('Password must be at least 8 characters.');
                return false;
            }
            if (form.data.password !== form.data.password_confirmation) {
                alert('Password confirmation does not match.');
                return false;
            }
        }
        return true;
    };

    const nextStage = () => {
        if (validateCurrentStage()) {
            setStage((prev) => Math.min(prev + 1, 5));
            window.scrollTo({ top: 100, behavior: 'smooth' });
        }
    };

    const prevStage = () => {
        setStage((prev) => Math.max(prev - 1, 1));
        window.scrollTo({ top: 100, behavior: 'smooth' });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post('/register-school', {
            preserveScroll: true,
        });
    };

    const stagesList = [
        { num: 1, title: 'Academic Structure', icon: GraduationCap },
        { num: 2, title: 'Institution Profile', icon: Building2 },
        { num: 3, title: 'Location & NEMIS', icon: MapPin },
        { num: 4, title: 'Primary Admin', icon: UserCheck },
        { num: 5, title: 'Review & Provision', icon: ShieldCheck },
    ];

    const progressPercentage = stage * 20;

    return (
        <MarketingLayout
            title="Deploy Your School Instance"
            navigation={navigation}
            footerNavigation={footerNavigation}
            branding={branding}
            currentPath="/register-school"
        >
            <Head title="Setup My School | EduFlow Institution Provisioning" />

            <div className="py-12 sm:py-16 bg-slate-900 min-h-screen text-white">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                    
                    {/* Main Dark Card Header with Backdrop */}
                    <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl p-6 sm:p-10 space-y-6">
                        
                        {/* Background Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-900/60 pointer-events-none" />

                        <div className="relative z-10 space-y-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Institutional Workspace Setup</span>
                            </div>
                            
                            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                                Deploy Your School Instance
                            </h1>
                            
                            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
                                Configure your institution profile, CBC assessment settings, and root administrative credentials to initialize your dedicated EduFlow workspace.
                            </p>
                        </div>

                        {/* 30-Day Evaluation Callout */}
                        <div className="relative z-10 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-start gap-3">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <p className="leading-relaxed">
                                <span className="font-bold text-emerald-200">Complimentary Evaluation:</span> Every new school instance is provisioned with a 30-day trial. You can apply partner promotion codes during plan confirmation below.
                            </p>
                        </div>

                        {/* Progress Indicator */}
                        <div className="relative z-10 space-y-2 pt-2 border-t border-slate-800/80">
                            <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-slate-400 uppercase tracking-wider">Stage {stage} of 5</span>
                                <span className="text-emerald-400">{progressPercentage}% Complete</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                                <div
                                    className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                        </div>

                        {/* Stage Tabs Navigation */}
                        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                            {stagesList.map((s) => {
                                const Icon = s.icon;
                                const isActive = stage === s.num;
                                const isPassed = stage > s.num;
                                return (
                                    <div
                                        key={s.num}
                                        className={`p-3 rounded-2xl border text-left transition-all ${
                                            isActive
                                                ? 'bg-emerald-950/60 border-emerald-500 text-white shadow-sm'
                                                : isPassed
                                                ? 'bg-slate-900/80 border-emerald-900/50 text-slate-300'
                                                : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
                                        }`}
                                    >
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : isPassed ? 'text-emerald-500' : 'text-slate-600'}`} />
                                            <span className="text-[10px] font-extrabold uppercase tracking-wider">
                                                STAGE {s.num}
                                            </span>
                                        </div>
                                        <p className="text-xs font-bold truncate">{s.title}</p>
                                    </div>
                                );
                            })}
                        </div>

                    </div>

                    {/* Step Form Body Container */}
                    <div className="rounded-3xl bg-slate-950 border border-slate-800 p-6 sm:p-10 shadow-2xl space-y-8">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            {/* STAGE 1: Academic Structure */}
                            {stage === 1 && (
                                <div className="space-y-6">
                                    <div className="border-b border-slate-800 pb-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <GraduationCap className="w-5 h-5 text-emerald-400" />
                                            <span>Academic Structure & Curriculum</span>
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-1">Select the curriculum framework and operating levels in your institution.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-300">National Curriculum Framework *</label>
                                            <select
                                                value={form.data.curriculum}
                                                onChange={(e) => form.setData('curriculum', e.target.value)}
                                                className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                            >
                                                {curriculums.map((c) => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-slate-300">School Operational Levels (Select all that apply) *</label>
                                            <div className="grid sm:grid-cols-2 gap-3">
                                                {[
                                                    { id: 'Pre-Primary', desc: 'PP1 & PP2 Early Years' },
                                                    { id: 'Primary', desc: 'Grade 1 to Grade 6' },
                                                    { id: 'Junior Secondary (JSS)', desc: 'Grade 7, 8 & 9' },
                                                    { id: 'Senior School', desc: 'Grade 10, 11 & 12 Pathways' },
                                                    { id: 'Secondary (8-4-4)', desc: 'Form 1 to Form 4' },
                                                ].map((lvl) => {
                                                    const checked = form.data.levels.includes(lvl.id);
                                                    return (
                                                        <div
                                                            key={lvl.id}
                                                            onClick={() => handleLevelToggle(lvl.id)}
                                                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                                                                checked
                                                                    ? 'bg-emerald-950/60 border-emerald-500 text-white'
                                                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                                            }`}
                                                        >
                                                            <div>
                                                                <p className="text-xs font-bold text-white">{lvl.id}</p>
                                                                <p className="text-[11px] text-slate-400">{lvl.desc}</p>
                                                            </div>
                                                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${checked ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-700'}`}>
                                                                {checked && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STAGE 2: Institution Profile */}
                            {stage === 2 && (
                                <div className="space-y-6">
                                    <div className="border-b border-slate-800 pb-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <Building2 className="w-5 h-5 text-emerald-400" />
                                            <span>Institution Profile</span>
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-1">Provide the registered institutional identity.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-300">Official School Name *</label>
                                            <input
                                                type="text"
                                                value={form.data.school_name}
                                                onChange={(e) => form.setData('school_name', e.target.value)}
                                                placeholder="e.g. St. Augustine Senior Academy"
                                                className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                                required
                                            />
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-300">Category / Type *</label>
                                                <select
                                                    value={form.data.school_type}
                                                    onChange={(e) => form.setData('school_type', e.target.value)}
                                                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                                >
                                                    <option value="Private">Private / Independent</option>
                                                    <option value="Public">Public / Government-Aided</option>
                                                    <option value="Faith-Based">Faith-Based / Mission</option>
                                                    <option value="International">International</option>
                                                </select>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-300">Gender Intake *</label>
                                                <select
                                                    value={form.data.gender_type}
                                                    onChange={(e) => form.setData('gender_type', e.target.value)}
                                                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                                >
                                                    <option value="Mixed / Co-Educational">Mixed / Co-Educational</option>
                                                    <option value="Boys Only">Boys Only</option>
                                                    <option value="Girls Only">Girls Only</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-300">Ministry Reg. Number (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={form.data.registration_number}
                                                    onChange={(e) => form.setData('registration_number', e.target.value)}
                                                    placeholder="e.g. MOE/PRI/2024/091"
                                                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-300">School Motto (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={form.data.school_motto}
                                                    onChange={(e) => form.setData('school_motto', e.target.value)}
                                                    placeholder="e.g. Strive for Excellence"
                                                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STAGE 3: Location & NEMIS */}
                            {stage === 3 && (
                                <div className="space-y-6">
                                    <div className="border-b border-slate-800 pb-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <MapPin className="w-5 h-5 text-emerald-400" />
                                            <span>Location & Ministry NEMIS Reference</span>
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-1">Geographic jurisdiction and reporting identifiers.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-300">County *</label>
                                                <select
                                                    value={form.data.county}
                                                    onChange={(e) => form.setData('county', e.target.value)}
                                                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                                >
                                                    {counties.map((c) => (
                                                        <option key={c} value={c}>{c}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-300">Sub-County / Zone</label>
                                                <input
                                                    type="text"
                                                    value={form.data.sub_county}
                                                    onChange={(e) => form.setData('sub_county', e.target.value)}
                                                    placeholder="e.g. Westlands / Dagoretti"
                                                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-300">NEMIS Institution Code (Optional)</label>
                                                <input
                                                    type="text"
                                                    value={form.data.nemis_code}
                                                    onChange={(e) => form.setData('nemis_code', e.target.value)}
                                                    placeholder="e.g. NEM-98214"
                                                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-300">Physical Address / Landmark *</label>
                                                <input
                                                    type="text"
                                                    value={form.data.physical_address}
                                                    onChange={(e) => form.setData('physical_address', e.target.value)}
                                                    placeholder="e.g. Off Waiyaki Way, Next to St. Paul"
                                                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STAGE 4: Primary Administrator */}
                            {stage === 4 && (
                                <div className="space-y-6">
                                    <div className="border-b border-slate-800 pb-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <UserCheck className="w-5 h-5 text-emerald-400" />
                                            <span>Root Administrator Account</span>
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-1">This account will have primary SuperAdmin authorization over your school instance.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-semibold text-slate-300">Headteacher / Administrator Full Name *</label>
                                            <input
                                                type="text"
                                                value={form.data.admin_name}
                                                onChange={(e) => form.setData('admin_name', e.target.value)}
                                                placeholder="e.g. Dr. Mark Ochieng"
                                                className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                                required
                                            />
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-300">Official School Email Address *</label>
                                                <input
                                                    type="email"
                                                    value={form.data.admin_email}
                                                    onChange={(e) => form.setData('admin_email', e.target.value)}
                                                    placeholder="principal@school.co.ke"
                                                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-300">Telephone / M-Pesa Number *</label>
                                                <input
                                                    type="tel"
                                                    value={form.data.admin_phone}
                                                    onChange={(e) => form.setData('admin_phone', e.target.value)}
                                                    placeholder="0712345678"
                                                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-300">Master Password (Min 8 characters) *</label>
                                                <input
                                                    type="password"
                                                    value={form.data.password}
                                                    onChange={(e) => form.setData('password', e.target.value)}
                                                    placeholder="••••••••"
                                                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-semibold text-slate-300">Confirm Master Password *</label>
                                                <input
                                                    type="password"
                                                    value={form.data.password_confirmation}
                                                    onChange={(e) => form.setData('password_confirmation', e.target.value)}
                                                    placeholder="••••••••"
                                                    className="w-full h-11 px-3.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STAGE 5: Review & Provision */}
                            {stage === 5 && (
                                <div className="space-y-6">
                                    <div className="border-b border-slate-800 pb-4">
                                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                            <span>Review & Confirm Provisioning</span>
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-1">Verify your configuration details before deploying the database instance.</p>
                                    </div>

                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Institutional Identity</p>
                                            <p className="text-sm font-bold text-white">{form.data.school_name || 'Not provided'}</p>
                                            <p className="text-xs text-slate-300">{form.data.school_type} • {form.data.gender_type}</p>
                                            <p className="text-xs text-slate-400">{form.data.physical_address}, {form.data.county}</p>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Academic Structure</p>
                                            <p className="text-sm font-bold text-emerald-400">{form.data.curriculum}</p>
                                            <p className="text-xs text-slate-300">{form.data.levels.join(', ')}</p>
                                            <p className="text-xs text-slate-400">Admin: {form.data.admin_name} ({form.data.admin_email})</p>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 text-xs text-emerald-200 space-y-2">
                                        <div className="flex items-center gap-2 font-bold text-emerald-300">
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span>30-Day Free Onboarding & Sandbox Access Included</span>
                                        </div>
                                        <p className="text-[11px] text-emerald-400/90 leading-relaxed">
                                            By deploying this workspace, you agree to EduFlow's Terms of Service and Kenya Data Protection Act (2019) compliance guidelines.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Action Navigation Buttons */}
                            <div className="pt-6 border-t border-slate-800 flex items-center justify-between gap-4">
                                {stage > 1 ? (
                                    <button
                                        type="button"
                                        onClick={prevStage}
                                        className="h-11 px-5 text-xs font-bold border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-2xl flex items-center gap-2 transition-colors"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        <span>Back</span>
                                    </button>
                                ) : (
                                    <Link
                                        href="/"
                                        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        <span>Return to Home</span>
                                    </Link>
                                )}

                                {stage < 5 ? (
                                    <button
                                        type="button"
                                        onClick={nextStage}
                                        className="h-11 px-6 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
                                    >
                                        <span>Continue to Stage {stage + 1}</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="h-11 px-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                                    >
                                        {form.processing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>Initializing Workspace...</span>
                                            </>
                                        ) : (
                                            <>
                                                <ShieldCheck className="w-4 h-4" />
                                                <span>Deploy School Workspace</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                        </form>
                    </div>

                </div>
            </div>
        </MarketingLayout>
    );
}