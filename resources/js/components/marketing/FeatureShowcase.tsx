import { Award, CreditCard, MessageSquare, FileCheck2, Users, BookOpen } from 'lucide-react';

export default function FeatureShowcase() {
    const modules = [
        {
            icon: Award,
            title: 'CBC Rubric Grading & Assessment',
            description: 'Evaluate competencies with standard rubrics (Exceeding, Meeting, Approaching, Below Expectation). Auto-generate Ministry-compliant report forms in one click.',
            tag: 'Academics',
        },
        {
            icon: CreditCard,
            title: 'Automated M-Pesa Fee Reconciliation',
            description: 'Connect your school Paybill or Till number. Student ledgers balance instantly on payment, and digital receipts are dispatched via SMS to guardians.',
            tag: 'Finance',
        },
        {
            icon: MessageSquare,
            title: 'Attendance Triggers & SMS Alerts',
            description: 'Mark class attendance via mobile or biometric logs. Send automatic notifications to parents when learners arrive or miss scheduled periods.',
            tag: 'Communication',
        },
        {
            icon: FileCheck2,
            title: 'NEMIS & Ministry Compliance Export',
            description: 'Generate standardized class registers, student bio-data records, and KNEC assessment center data ready for direct official submission.',
            tag: 'Compliance',
        },
        {
            icon: Users,
            title: 'Staff Payroll, Deductions & Leaves',
            description: 'Manage teaching staff contracts, track leave allowances, calculate NHIF/NSSF/KRA statutory deductions, and generate digital payslips.',
            tag: 'Administration',
        },
        {
            icon: BookOpen,
            title: 'Library Barcodes & Textbook Tracking',
            description: 'Scan and index curriculum coursebooks, manage lending durations, track unreturned inventory, and minimize institutional book losses.',
            tag: 'Operations',
        },
    ];

    return (
        <section className="py-20 bg-white border-b border-slate-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        Operational Capabilities
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        Engineered for the Realities of Kenyan Schools
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                        Every module connects directly to your live database, eliminating redundant spreadsheets and disconnected administrative tools.
                    </p>
                </div>

                <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((mod, idx) => {
                        const Icon = mod.icon;
                        return (
                            <div
                                key={idx}
                                className="p-7 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-500/60 hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                        {mod.tag}
                                    </span>
                                </div>
                                <h3 className="text-base font-bold text-slate-900 mb-2">
                                    {mod.title}
                                </h3>
                                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                                    {mod.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}