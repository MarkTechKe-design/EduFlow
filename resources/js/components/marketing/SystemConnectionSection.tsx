import { ArrowRight, UserPlus, Award, CreditCard, MessageSquare, FileCheck2, Building2 } from 'lucide-react';

export default function SystemConnectionSection() {
    const stages = [
        {
            icon: UserPlus,
            step: '01',
            title: 'Student Admission & Bio-Data',
            desc: 'Learner profile created with verified NEMIS UPI, birth certificate, and guardian contacts.',
        },
        {
            icon: Award,
            step: '02',
            title: 'CBC Rubric Assessment',
            desc: 'Teachers log continuous assessment per strand directly on mobile or web registers.',
        },
        {
            icon: CreditCard,
            step: '03',
            title: 'Automated M-Pesa Reconciliation',
            desc: 'Paybill fees balance student ledgers instantly with zero manual bank slip processing.',
        },
        {
            icon: MessageSquare,
            step: '04',
            title: 'Instant Parent Communication',
            desc: 'Automated SMS dispatched for fee receipts, morning attendance, and report cards.',
        },
        {
            icon: FileCheck2,
            step: '05',
            title: 'Ministry & KNEC Exports',
            desc: 'One-click generation of Ministry class registers and standardized examination files.',
        },
    ];

    return (
        <section className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        Integrated School Architecture
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        How EduFlow Synchronizes Your Entire Institution
                    </h2>
                    <p className="text-sm sm:text-base text-slate-600">
                        A single source of truth connecting admissions, classrooms, finance, and guardians without disconnected tools.
                    </p>
                </div>

                {/* 5-Step Pipeline Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {stages.map((st, idx) => {
                        const Icon = st.icon;
                        return (
                            <div
                                key={idx}
                                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-emerald-500/60 transition-all"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <span className="font-mono text-xs font-extrabold text-slate-400">
                                            {st.step}
                                        </span>
                                    </div>

                                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                        {st.title}
                                    </h3>
                                </div>

                                <p className="text-xs text-slate-600 leading-relaxed">
                                    {st.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>

            </div>
        </section>
    );
}