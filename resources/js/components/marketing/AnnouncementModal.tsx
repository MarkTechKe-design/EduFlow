import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { X, Calendar, ArrowRight, ShieldCheck } from 'lucide-react';

interface Props {
    title?: string;
    description?: string;
    ctaLabel?: string;
    ctaUrl?: string;
}

export default function AnnouncementModal({
    title = 'Want to see how EduFlow simplifies school operations?',
    description = 'Schedule a 20-minute live demonstration with an EduFlow deployment engineer to explore automated CBC report cards and M-Pesa fee reconciliation.',
    ctaLabel = 'Book a Live Demo',
    ctaUrl = '/contact',
}: Props) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const isDismissed = sessionStorage.getItem('eduflow_promo_dismissed');
        if (!isDismissed) {
            const timer = setTimeout(() => setVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const dismiss = () => {
        setVisible(false);
        sessionStorage.setItem('eduflow_promo_dismissed', 'true');
    };

    if (!visible) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed bottom-5 right-5 z-50 max-w-md w-full p-4 animate-in slide-in-from-bottom-5 duration-300"
        >
            <div className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200/90 relative text-slate-900 ring-1 ring-slate-900/5">
                <button
                    type="button"
                    onClick={dismiss}
                    aria-label="Dismiss banner"
                    className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                        <Calendar className="w-6 h-6" />
                    </div>

                    <div className="space-y-2 pr-4">
                        <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Institutional Demo</span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-950 leading-snug">
                            {title}
                        </h3>

                        <p className="text-xs text-slate-600 leading-relaxed">
                            {description}
                        </p>

                        <div className="pt-2 flex items-center gap-3">
                            <Link
                                href={ctaUrl}
                                onClick={dismiss}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
                            >
                                <span>{ctaLabel}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                            </Link>

                            <button
                                type="button"
                                onClick={dismiss}
                                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}