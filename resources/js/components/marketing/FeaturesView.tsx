import { Link } from '@inertiajs/react';
import { Award, CreditCard, MessageSquare, FileCheck2, Users, BookOpen, ArrowRight, CheckCircle2, ShieldCheck, Building2, Layers, Compass, Bus, BedDouble } from 'lucide-react';

export default function FeaturesView() {
    const pillars = [
        {
            icon: Award,
            badge: 'CBC Academics',
            title: 'Competency-Based Assessment & Termly Grading',
            desc: 'Built from the ground up for Kenya’s CBC framework across Pre-Primary, Primary, and Junior Secondary (JSS).',
            points: [
                'Official MoE 4-tier rubric evaluation (EE - Exceeding, ME - Meeting, AE - Approaching, BE - Below Expectation).',
                'Strand and Sub-strand continuous assessment tracking across all learning areas.',
                'One-click automated generation of print-ready student termly report cards with custom teacher remarks.',
                'Formative and summative exam management with weighted average computations.',
            ],
        },
        {
            icon: CreditCard,
            badge: 'Finance & Payments',
            title: 'Automated M-Pesa Fee Ledger & Reconciliation',
            desc: 'Eliminate manual bank slip reconciliation and unallocated cash tracking.',
            points: [
                'Direct Daraja API integration for automated Paybill and Buy Goods Till transaction verification.',
                'Instant student fee ledger balancing using Admission Numbers as payment account references.',
                'Automated SMS payment receipts and real-time fee balance updates dispatched to parents.',
                'Termly fee structure configuration with itemized vote heads (Tuition, Boarding, Transport, Activity).',
            ],
        },
        {
            icon: FileCheck2,
            badge: 'National Sync',
            title: 'NEMIS & KNEC Assessment Compliance',
            desc: 'Maintain seamless alignment with Ministry of Education data requirements.',
            points: [
                'Capture and maintain validated student NEMIS Unique Personal Identifiers (UPI).',
                'One-click standardized data exports formatted for direct upload to the KNEC CBA portal.',
                'Digital student bio-data registers and birth certificate record archiving.',
                'Ministry-compliant attendance registers ready for quality assurance inspections.',
            ],
        },
        {
            icon: MessageSquare,
            badge: 'Communication',
            title: 'Guardian Hub & Attendance Alerts',
            desc: 'Direct, instant engagement between administration, teachers, and parents.',
            points: [
                'Class attendance logging with automated SMS notifications for unexcused student absences.',
                'Targeted bulk SMS broadcasting for fee reminders, general announcements, and meeting notices.',
                'Individual parent portal access for real-time grade checking and fee statement downloads.',
                'Automated WhatsApp notifications for urgent institutional alerts.',
            ],
        },
        {
            icon: Users,
            badge: 'Staff & HR',
            title: 'Teacher Workspaces & Payroll Administration',
            desc: 'Streamline institutional staff operations, allocations, and statutory deductions.',
            points: [
                'Subject and class teacher allocations with role-based dashboard permissions.',
                'Digital staff leave authorization workflows with principal approval gates.',
                'Payroll computation with automated deductions (NHIF / SHA, NSSF, and KRA PAYE).',
                'Visitor management logging at school entrance gates.',
            ],
        },
        {
            icon: Building2,
            badge: 'Campus Operations',
            title: 'Boarding, Fleet Transport & Library',
            desc: 'Comprehensive operational oversight for boarding campuses and day-school transport networks.',
            points: [
                'Hostel room and bed allocation management with boarder inventory check-in/out.',
                'Fleet route tracking, transport zone fee allocation, and daily driver manifests.',
                'Library book barcode cataloging, lending issue tracking, and lost book ledger logs.',
                'School inventory and store requisitions management.',
            ],
        },
    ];

    return (
        <div className="py-12 sm:py-20 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header Banner */}
                <div className="text-center max-w-3xl mx-auto space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
                        Platform Architecture
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight">
                        Comprehensive Capabilities for Modern Kenyan Institutions
                    </h1>
                    <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                        EduFlow replaces fragmented record books, disconnected spreadsheets, and manual ledgers with a single, synchronized school management database.
                    </p>
                </div>

                {/* Pillar Deep Dive Grid */}
                <div className="mt-16 space-y-8">
                    {pillars.map((pillar, idx) => {
                        const Icon = pillar.icon;
                        return (
                            <div
                                key={idx}
                                className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all"
                            >
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                    <div className="lg:col-span-5 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/60 px-2.5 py-0.5 rounded-md">
                                                {pillar.badge}
                                            </span>
                                        </div>

                                        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                                            {pillar.title}
                                        </h2>

                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            {pillar.desc}
                                        </p>
                                    </div>

                                    <div className="lg:col-span-7 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                                            Engineered Functional Specs
                                        </h3>
                                        <div className="space-y-3">
                                            {pillar.points.map((pt, pIdx) => (
                                                <div key={pIdx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                                    <span className="leading-relaxed">{pt}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Bottom CTA Card */}
                <div className="mt-16 bg-[#0B132B] rounded-3xl p-8 sm:p-12 text-white text-center border border-slate-800 relative overflow-hidden">
                    <div className="max-w-2xl mx-auto space-y-6 relative z-10">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                            Ready to modernize your school operations?
                        </h2>
                        <p className="text-sm text-slate-300">
                            Launch your dedicated school instance in minutes with our 30-day evaluation setup.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                            <Link
                                href="/register"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md"
                            >
                                <span>Setup My School</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/contact"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold text-sm hover:bg-slate-800"
                            >
                                <span>Request Guided Demo</span>
                            </Link>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}