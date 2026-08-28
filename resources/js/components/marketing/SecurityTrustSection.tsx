import { Link } from '@inertiajs/react';
import { ShieldCheck, Lock, Database, FileCheck2, ArrowRight } from 'lucide-react';

export default function SecurityTrustSection() {
    const pillars = [
        {
            icon: Database,
            title: 'Tenant-Scoped Database Isolation',
            desc: 'Every query is cryptographically bound to the verified school_id. Zero risk of cross-institutional data exposure.',
        },
        {
            icon: Lock,
            title: 'End-to-End Transit Encryption',
            desc: 'TLS 1.3 encryption across all client requests, with sensitive credentials and passwords salted using bcrypt.',
        },
        {
            icon: FileCheck2,
            title: 'Kenya Data Protection Act Alignment',
            desc: 'Structured around lawful processing, minor bio-data protection, and Data Controller governance under ODPC guidelines.',
        },
        {
            icon: ShieldCheck,
            title: 'Automated Encrypted Snapshots',
            desc: 'Daily institutional backups with zero downtime recovery, ensuring your school records remain permanently protected.',
        },
    ];

    return (
        <section className="py-16 sm:py-24 bg-[#0B132B] text-white border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800">
                        Security & Infrastructure Architecture
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        Engineered for High Institutional Trust
                    </h2>
                    <p className="text-sm sm:text-base text-slate-400">
                        Student bio-data, academic transcripts, and financial ledgers are protected by strict multi-tenant boundaries.
                    </p>
                </div>

                {/* 4-Pillar Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {pillars.map((p, idx) => {
                        const Icon = p.icon;
                        return (
                            <div
                                key={idx}
                                className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800 space-y-3 flex flex-col justify-between"
                            >
                                <div className="space-y-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-base font-bold text-white leading-snug">
                                        {p.title}
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    {p.desc}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-10 text-center">
                    <Link
                        href="/security"
                        className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                        <span>Review our complete security architecture & data protection policies</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

            </div>
        </section>
    );
}