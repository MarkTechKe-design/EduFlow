import { Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, ShieldCheck, PlayCircle, School, CreditCard, Award, FileText } from 'lucide-react';

interface Props {
    body?: string;
}

export default function HeroSection({ body }: Props) {
    return (
        <section className="relative overflow-hidden pt-12 pb-16 lg:pt-18 lg:pb-24 bg-gradient-to-b from-white via-slate-50/60 to-slate-100/70 border-b border-slate-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Institutional Eyebrow */}
                <div className="flex justify-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold shadow-xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Engineered for Kenyan Primary, Junior & Secondary Institutions</span>
                    </div>
                </div>

                {/* Primary Headline & Value Proposition */}
                <div className="mt-6 text-center max-w-4xl mx-auto space-y-6">
                    <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-950 leading-[1.12]">
                        Complete School Operations. <br />
                        <span className="bg-gradient-to-r from-blue-600 via-emerald-600 to-emerald-500 bg-clip-text text-transparent">
                            CBC Academics & Automated Finance.
                        </span>
                    </h1>

                    <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        {body || 'Eliminate paperwork with real-time CBC continuous assessment rubrics, automated M-Pesa fee balancing, instant guardian SMS notifications, and Ministry NEMIS data exports in one synchronized platform.'}
                    </p>

                    {/* High-Contrast Conversion Triggers */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                        <a href="/register-school" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer">Setup My School &rsaquo;</a>

                        <Link
                            href="/contact"
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-sm font-semibold shadow-xs hover:bg-slate-50 transition-all"
                        >
                            <PlayCircle className="w-4 h-4 text-slate-600" />
                            <span>Request Guided Demo</span>
                        </Link>
                    </div>

                    {/* Operational Proof Points */}
                    <div className="pt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-semibold text-slate-500">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>30-Day Evaluation Workspace</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Automated M-Pesa STK & Paybill Sync</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                            <span>Tenant-Isolated Cloud Architecture</span>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}