import { Head, usePage } from '@inertiajs/react';
import React, { useState, PropsWithChildren } from 'react';
import Topbar from '@/components/layout/Topbar';
import Sidebar from '@/components/layout/Sidebar';
import MobileAppHeader from '@/components/layout/MobileAppHeader';
import MobileBottomNav from '@/components/layout/MobileBottomNav';

interface Props {
    title?: string;
}

export default function AppLayout({ title = 'EduFlow Portal', children }: PropsWithChildren<Props>) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { auth } = usePage().props as any;

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">
            <Head title={`${title} | EduFlow`} />

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