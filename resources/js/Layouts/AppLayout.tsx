import { Head, usePage } from '@inertiajs/react';
import React, { useState, PropsWithChildren } from 'react';
import Topbar from '@/components/layout/Topbar';
import Sidebar from '@/components/layout/Sidebar';

interface Props {
    title?: string;
}

export default function AppLayout({ title = 'EduFlow Portal', children }: PropsWithChildren<Props>) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { auth } = usePage().props as any;

    return (
        <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-100 text-slate-900 font-sans antialiased">
            <Head title={`${title} | EduFlow`} />

            {/* FIXED TOPBAR (h-16 shrink-0) */}
            <Topbar 
                onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} 
                user={auth?.user}
                school={auth?.school}
            />

            {/* APPLICATION BODY (Sidebar + Independent Scroll Container) */}
            <div className="flex-1 flex overflow-hidden relative">
                
                {/* FIXED DESKTOP SIDEBAR + MOBILE DRAWER */}
                <Sidebar 
                    isOpen={mobileMenuOpen} 
                    onClose={() => setMobileMenuOpen(false)} 
                    user={auth?.user}
                    school={auth?.school}
                    navigation={auth?.navigation ?? []}
                />

                {/* DEDICATED INDEPENDENT CONTENT SCROLL VIEWPORT */}
                <main className="flex-1 min-w-0 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 focus:outline-none">
                    <div className="max-w-7xl mx-auto space-y-6 pb-12">
                        {children}
                    </div>
                </main>

            </div>
        </div>
    );
}