import { Link } from '@inertiajs/react';
import { Menu, GraduationCap, LogOut, ChevronDown, Bell, Palette, Moon, Sun, Monitor, User } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface Props {
    onToggleMobileMenu: () => void;
    user?: any;
    school?: any;
}

export default function Topbar({ onToggleMobileMenu, user, school }: Props) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [theme, setTheme] = useState<'system' | 'light' | 'dark'>('system');

    useEffect(() => {
        const stored = localStorage.getItem('eduflow_theme') as 'system' | 'light' | 'dark' | null;
        if (stored) {
            setTheme(stored);
            applyTheme(stored);
        }
    }, []);

    const applyTheme = (mode: 'system' | 'light' | 'dark') => {
        setTheme(mode);
        localStorage.setItem('eduflow_theme', mode);
        const root = document.documentElement;
        if (mode === 'dark') {
            root.classList.add('dark');
        } else if (mode === 'light') {
            root.classList.remove('dark');
        } else {
            const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (systemDark) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        }
    };

    // Derive active academic period dynamically from tenant context
    const academicPeriod = school?.active_term
        ? `Academic Year ${school.active_term.year} · Term ${school.active_term.term_number}`
        : 'Academic Session Active';

    return (
        <header className="h-16 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 z-20 px-4 sm:px-6 flex items-center justify-between shadow-xs">

            {/* Left: Mobile Toggle & Brand Logo */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onToggleMobileMenu}
                    className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus:outline-none"
                    aria-label="Toggle navigation menu"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <Link href="/" className="flex items-center gap-2.5 focus:outline-none">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-xs">
                        <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="hidden sm:flex flex-col">
                        <span className="text-lg font-extrabold tracking-tight text-slate-950 dark:text-white leading-none">
                            Edu<span className="text-emerald-600">Flow</span>
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {school?.name || 'School Operations Platform'}
                        </span>
                    </div>
                </Link>
            </div>

            {/* Right: Dynamic Academic Session Context & User Profile */}
            <div className="flex items-center gap-3 sm:gap-4">

                {/* Dynamic Academic Term Indicator */}
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{academicPeriod}</span>
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
                    >
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="hidden sm:flex flex-col text-left">
                            <span className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user?.name || 'User Account'}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{user?.email}</span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl py-3 z-50 animate-in fade-in zoom-in-95 space-y-2">
                            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                            </div>

                            <div className="px-2 space-y-0.5">
                                <Link
                                    href="/school/communication/notifications"
                                    onClick={() => setDropdownOpen(false)}
                                    className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors"
                                >
                                    <Bell className="w-4 h-4 text-slate-400" />
                                    <span>Notifications</span>
                                </Link>
                            </div>

                            {/* Appearance Toggle inside Dropdown */}
                            <div className="px-3 py-1 space-y-1.5 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 pt-1">
                                    <Palette className="w-3.5 h-3.5" />
                                    <span>Appearance</span>
                                </div>
                                <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                                    <button
                                        type="button"
                                        onClick={() => applyTheme('system')}
                                        className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                            theme === 'system' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <Monitor className="w-3 h-3" />
                                        <span>System</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyTheme('light')}
                                        className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                            theme === 'light' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <Sun className="w-3 h-3" />
                                        <span>Light</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => applyTheme('dark')}
                                        className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                            theme === 'dark' ? 'bg-teal-600 text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                    >
                                        <Moon className="w-3 h-3" />
                                        <span>Dark</span>
                                    </button>
                                </div>
                            </div>

                            <div className="pt-1 border-t border-slate-100 dark:border-slate-800 px-2">
                                <Link
                                    href="/logout"
                                    method="post"
                                    as="button"
                                    onClick={() => setDropdownOpen(false)}
                                    className="w-full px-3 py-2.5 text-left text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex items-center gap-2.5 transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Sign out</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>

            </div>

        </header>
    );
}