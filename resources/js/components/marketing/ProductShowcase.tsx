import { useState } from 'react';
import { Award, CreditCard, Users, MessageSquare, FileCheck2, CheckCircle2, ChevronRight, Clock, Building2 } from 'lucide-react';

export default function ProductShowcase() {
    const [activeTab, setActiveTab] = useState<'cbc' | 'finance' | 'attendance' | 'nemis'>('cbc');

    const tabData = {
        cbc: {
            title: 'CBC Continuous Assessment & Report Cards',
            tag: 'Academics Workspace',
            description: 'Evaluate learning areas with standardized Ministry rubrics (Exceeding, Meeting, Approaching, Below Expectation). Compile termly performance without spreadsheet errors.',
            chips: ['Formative Assessment Tracking', 'Strand & Sub-strand Rubrics', 'One-Click PDF Report Cards', 'Weighted Summative Exams'],
            preview: {
                header: 'Grade 8 — Integrated Science Assessment Register',
                status: 'Term 2 Assessment Active',
                rows: [
                    { name: 'Kiprono Ethan', upi: 'NEMIS-774921', score: 'Exceeding Expectation (EE)', remark: 'Demonstrates deep scientific inquiry and task completion.' },
                    { name: 'Achieng Zawadi', upi: 'NEMIS-882310', score: 'Meeting Expectation (ME)', remark: 'Mastered core concepts across all biological strands.' },
                    { name: 'Mwangi Brian', upi: 'NEMIS-651209', score: 'Meeting Expectation (ME)', remark: 'Shows consistent practical inquiry and group participation.' },
                ]
            }
        },
        finance: {
            title: 'Automated M-Pesa Fee Balancing & Receipts',
            tag: 'Bursar & Finance Desk',
            description: 'Link your school Paybill or Till number. Student ledgers balance in real-time as transactions occur, instantly dispatching official SMS receipts to guardians.',
            chips: ['Direct Daraja API Gateway', 'Admission Number Matching', 'Automated Vote Head Allocation', 'Real-Time Balance Inquiries'],
            preview: {
                header: 'Live Fee Collection Ledger — St. Augustine Academy',
                status: 'Daraja Webhook Active',
                rows: [
                    { name: 'SHK9928192', upi: 'Adm: #2024-082 (Omondi Bradley)', score: 'KES 24,500 Paid', remark: 'Auto-balanced against Tuition & Transport vote heads.' },
                    { name: 'SHL1029381', upi: 'Adm: #2023-114 (Njeri Faith)', score: 'KES 15,000 Paid', remark: 'Term 2 Tuition cleared. SMS receipt sent to 0712***456.' },
                    { name: 'SHM4492019', upi: 'Adm: #2025-009 (Kipchumba David)', score: 'KES 32,000 Paid', remark: 'Boarding & Activity fees credited to student ledger.' },
                ]
            }
        },
        attendance: {
            title: 'Student Registers & Automated Parent SMS',
            tag: 'Attendance & Safety',
            description: 'Mark attendance via mobile register or school gates. Parents receive instant notification if a student misses morning roll-call.',
            chips: ['Real-Time Morning Roll-Call', 'Unexcused Absence SMS Alerts', 'Staff Duty Rosters', 'Termly Attendance Summaries'],
            preview: {
                header: 'Morning Roll-Call — Class 7 East (Total: 42 Learners)',
                status: 'Register Submitted 08:15 AM',
                rows: [
                    { name: 'Wanjiku Grace', upi: 'Present (07:42 AM)', score: 'Verified', remark: 'Checked in at Main Gate turnstile.' },
                    { name: 'Kamau Dennis', upi: 'Absent (Unexcused)', score: 'SMS Dispatched', remark: 'Alert sent to parent (0722***890) at 08:20 AM.' },
                    { name: 'Mutua Victor', upi: 'Present (07:50 AM)', score: 'Verified', remark: 'Present in class roll-call.' },
                ]
            }
        },
        nemis: {
            title: 'NEMIS & Ministry Compliance Exports',
            tag: 'Institutional Compliance',
            description: 'Generate standardized class registers, student bio-data records, and KNEC assessment center formats ready for direct official submission.',
            chips: ['Validated NEMIS UPI Tracking', 'KNEC Assessment Center Sync', 'Birth Certificate Archiving', 'MoE Inspection Registers'],
            preview: {
                header: 'National Assessment Compliance Export Engine',
                status: 'Validation Passed (100% UPI Match)',
                rows: [
                    { name: 'KNEC CBA Export Format', upi: 'Format: CBA-Grade-6-Final', score: 'Ready', remark: 'Complete strand rubric averages compiled for 84 candidates.' },
                    { name: 'NEMIS Bio-Data Register', upi: 'Format: MoE-UPI-Validated', score: 'Synchronized', remark: 'Institutional student numbers match national records.' },
                    { name: 'Staff TSC Allocation List', upi: 'Format: MoE-Curriculum-Staff', score: 'Generated', remark: 'Teacher allocations mapped to active learning areas.' },
                ]
            }
        },
    };

    const current = tabData[activeTab];

    return (
        <section id="platform" className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        Interactive Workspace Preview
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        Built for Daily School Workflows
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600">
                        Explore how EduFlow manages academics, balances financial ledgers, and keeps guardians informed.
                    </p>
                </div>

                {/* Workspace Category Switcher */}
                <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl max-w-2xl mx-auto border border-slate-200 mb-10">
                    <button
                        type="button"
                        onClick={() => setActiveTab('cbc')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'cbc' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <Award className="w-4 h-4" />
                        <span>CBC Academics</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('finance')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'finance' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <CreditCard className="w-4 h-4" />
                        <span>M-Pesa Finance</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('attendance')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'attendance' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <MessageSquare className="w-4 h-4" />
                        <span>Attendance & SMS</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('nemis')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                            activeTab === 'nemis' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        <FileCheck2 className="w-4 h-4" />
                        <span>NEMIS & Compliance</span>
                    </button>
                </div>

                {/* Interactive Workspace Container */}
                <div className="bg-slate-900 rounded-3xl p-6 sm:p-10 text-white shadow-2xl border border-slate-800">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        
                        {/* Left Details */}
                        <div className="lg:col-span-5 space-y-5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-3 py-1 rounded-md border border-emerald-800">
                                {current.tag}
                            </span>
                            <h3 className="text-2xl sm:text-3xl font-bold text-white leading-snug">
                                {current.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                {current.description}
                            </p>

                            <div className="space-y-2.5 pt-2">
                                {current.chips.map((chip, cIdx) => (
                                    <div key={cIdx} className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                        <span>{chip}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Simulated Interface Table */}
                        <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-800 pb-3 text-xs">
                                <span className="font-bold text-slate-200">{current.preview.header}</span>
                                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-800">
                                    {current.preview.status}
                                </span>
                            </div>

                            <div className="space-y-2.5">
                                {current.preview.rows.map((row, rIdx) => (
                                    <div key={rIdx} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 space-y-1">
                                        <div className="flex items-center justify-between text-xs font-semibold">
                                            <span className="text-white">{row.name}</span>
                                            <span className="text-emerald-400 font-bold">{row.score}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                                            <span className="font-mono">{row.upi}</span>
                                            <span className="text-slate-400">{row.remark}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </section>
    );
}