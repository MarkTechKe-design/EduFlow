import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    Users,
    CreditCard,
    FileText,
    Settings,
    Calendar,
    BookOpen,
    Trophy,
    User,
    Award,
    School as SchoolIcon,
    Activity,
} from 'lucide-react';

export default function MobileBottomNav() {
    const { url } = usePage();

    let tabs = [
        { label: 'Home', href: '/dashboard', icon: LayoutDashboard, pattern: /^\/(dashboard|school)$/ },
        { label: 'Students', href: '/school/students', icon: Users, pattern: /\/students/ },
        { label: 'Finance', href: '/school/fees', icon: CreditCard, pattern: /\/fees/ },
        { label: 'Reports', href: '/school/reports/dashboard', icon: FileText, pattern: /\/reports/ },
        { label: 'Settings', href: '/school/settings', icon: Settings, pattern: /\/settings/ },
    ];

    if (url.startsWith('/student')) {
        tabs = [
            { label: 'Home', href: '/student', icon: LayoutDashboard, pattern: /^\/student$/ },
            { label: 'Timetable', href: '/student/timetable', icon: Calendar, pattern: /\/timetable/ },
            { label: 'Homework', href: '/student/homework', icon: BookOpen, pattern: /\/homework/ },
            { label: 'Activities', href: '/student/cocurricular', icon: Trophy, pattern: /\/cocurricular/ },
            { label: 'Profile', href: '/student/profile', icon: User, pattern: /\/profile/ },
        ];
    } else if (url.startsWith('/parent')) {
        tabs = [
            { label: 'Home', href: '/parent', icon: LayoutDashboard, pattern: /^\/parent$/ },
            { label: 'Fees', href: '/parent/fees', icon: CreditCard, pattern: /\/fees/ },
            { label: 'Results', href: '/parent/results', icon: Award, pattern: /\/results/ },
            { label: 'Activities', href: '/parent/cocurricular', icon: Trophy, pattern: /\/cocurricular/ },
            { label: 'Profile', href: '/parent/profile', icon: User, pattern: /\/profile/ },
        ];
    } else if (url.startsWith('/super-admin')) {
        tabs = [
            { label: 'Overview', href: '/super-admin/dashboard', icon: LayoutDashboard, pattern: /\/dashboard/ },
            { label: 'Schools', href: '/super-admin/schools', icon: SchoolIcon, pattern: /\/schools/ },
            { label: 'Billing', href: '/super-admin/subscriptions', icon: CreditCard, pattern: /\/subscriptions/ },
            { label: 'Health', href: '/super-admin/system-health', icon: Activity, pattern: /\/system-health/ },
            { label: 'Settings', href: '/super-admin/settings', icon: Settings, pattern: /\/settings/ },
        ];
    }

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/80 px-2 pb-safe shadow-lg">
            <div className="grid grid-cols-5 h-16">
                {tabs.map((tab, idx) => {
                    const Icon = tab.icon;
                    const isActive = tab.pattern.test(url) || url === tab.href;

                    return (
                        <Link
                            key={idx}
                            href={tab.href}
                            className={`flex flex-col items-center justify-center gap-1 transition-all min-h-[48px] tactile-press ${
                                isActive
                                    ? 'text-teal-600 dark:text-teal-400 font-bold'
                                    : 'text-muted-foreground hover:text-foreground font-medium'
                            }`}
                        >
                            <div
                                className={`relative p-1.5 rounded-xl transition-all duration-200 ${
                                    isActive
                                        ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 scale-105'
                                        : 'text-muted-foreground'
                                }`}
                            >
                                <Icon className="w-5 h-5" aria-hidden="true" />
                            </div>
                            <span className="text-[10px] tracking-tight truncate max-w-[64px]">
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}