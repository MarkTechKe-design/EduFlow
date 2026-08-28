import { Building2, Award, CreditCard, Users, CheckCircle2 } from 'lucide-react';

export default function RoleExperienceSection() {
    const roles = [
        {
            icon: Building2,
            role: 'School Principals & Directors',
            headline: 'Complete Institutional Visibility & Governance',
            benefits: [
                'Real-time enrollment, fee collection, and attendance dashboards.',
                'Multi-department audit trails and staff leave authorization workflows.',
                'Accurate termly academic progress analytics across classes and streams.',
            ],
        },
        {
            icon: CreditCard,
            role: 'Bursars & Finance Teams',
            headline: 'Zero-Leakage Automated M-Pesa Accounting',
            benefits: [
                'Direct Paybill / Till transaction balancing mapped to student accounts.',
                'Automated vote head allocations (Tuition, Transport, Boarding, Activity).',
                'Itemized fee statements and digital receipt dispatch via SMS.',
            ],
        },
        {
            icon: Award,
            role: 'Teachers & Academic Deans',
            headline: 'Streamlined Continuous CBC Rubric Entry',
            benefits: [
                'Strand-based continuous grading without maintaining manual spreadsheets.',
                'One-click automated compilation of official printable report cards.',
                'Subject teacher allocations and standardized exam score sheets.',
            ],
        },
        {
            icon: Users,
            role: 'Parents & Guardians',
            headline: 'Direct Academic & Financial Transparency',
            benefits: [
                'Instant SMS notifications when fee payments are received.',
                'Immediate absence alerts if a learner is not marked in morning roll-call.',
                'Digital report cards accessible without waiting for physical mail.',
            ],
        },
    ];

    return (
        <section className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        Tailored for Every Stakeholder
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        Designed for the Entire School Community
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600">
                        EduFlow delivers purpose-built control surfaces for leadership, bursars, teaching staff, and guardians.
                    </p>
                </div>

                {/* 4-Role Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {roles.map((r, idx) => {
                        const Icon = r.icon;
                        return (
                            <div
                                key={idx}
                                className="bg-slate-50 rounded-3xl p-8 border border-slate-200/80 space-y-4 hover:border-slate-300 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-emerald-600 shadow-xs">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 block">
                                            {r.role}
                                        </span>
                                        <h3 className="text-lg font-bold text-slate-950">
                                            {r.headline}
                                        </h3>
                                    </div>
                                </div>

                                <div className="space-y-2.5 pt-2">
                                    {r.benefits.map((b, bIdx) => (
                                        <div key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                            <span>{b}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
}