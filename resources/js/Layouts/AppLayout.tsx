import { Head, router, usePage } from '@inertiajs/react';
import React, { useState, PropsWithChildren } from 'react';
import Topbar from '@/components/layout/Topbar';
import Sidebar from '@/components/layout/Sidebar';
import MobileAppHeader from '@/components/layout/MobileAppHeader';
import MobileBottomNav from '@/components/layout/MobileBottomNav';

interface Props {
    title?: string;
    header?: React.ReactNode;
    breadcrumbs?: Array<{ label: string; href?: string }>;
}

export default function AppLayout({ title = 'EduFlow Portal', header, breadcrumbs, children }: PropsWithChildren<Props>) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { auth } = usePage().props as any;

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
            <Head title={`${title} | EduFlow`} />

            {/* SUPER ADMIN IMPERSONATION ACTIVE BANNER */}
            {auth?.is_impersonating && (
                <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between shadow-md z-50">
                    <div className="flex items-center gap-2">
                        <span className="bg-slate-950 text-amber-300 px-2 py-0.5 rounded-full text-[10px] uppercase font-extrabold tracking-wider">
                            Masquerade Mode
                        </span>
                        <span>
                            You are currently managing <strong>{auth?.impersonated_school_name || auth?.school?.name}</strong> as an Administrator.
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.post('/super-admin/leave-impersonation')}
                        className="rounded-lg bg-slate-950 text-white px-3 py-1 text-xs font-bold hover:bg-slate-800 transition-colors"
                    >
                        Exit to Super Admin Console &rarr;
                    </button>
                </div>
            )}

            {/* DESKTOP TOPBAR */}
            <div className="hidden lg:block">
                <Topbar
                    onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
                    user={auth?.user}
                    school={auth?.school}
                />
            </div>

            {/* MOBILE APP HEADER */}
            <MobileAppHeader
                onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
                school={auth?.school}
                user={auth?.user}
            />

            {/* APPLICATION BODY */}
            <div className="flex-1 flex overflow-hidden relative">
                <Sidebar
                    isOpen={mobileMenuOpen}
                    onClose={() => setMobileMenuOpen(false)}
                    user={auth?.user}
                    school={auth?.school}
                    navigation={(usePage().props as any)?.navigation ?? []}
                />

                <main className="flex-1 min-w-0 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 focus:outline-none pb-24 lg:pb-8">
                    <div className="max-w-7xl mx-auto space-y-6 pb-12 app-page-enter">
                        {children}
                    </div>
                </main>
            </div>

            {/* MOBILE BOTTOM NAVIGATION */}
            <MobileBottomNav />
        </div>
    );
}