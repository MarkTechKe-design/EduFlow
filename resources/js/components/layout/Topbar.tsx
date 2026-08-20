import { Link } from '@inertiajs/react';
import { Menu, GraduationCap, LogOut, ChevronDown } from 'lucide-react';
import React, { useState } from 'react';

interface Props {
    onToggleMobileMenu: () => void;
    user?: any;
    school?: any;
}

export default function Topbar({ onToggleMobileMenu, user, school }: Props) {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Derive active academic period dynamically from tenant context
    const academicPeriod = school?.active_term 
        ? `Academic Year ${school.active_term.year} · Term ${school.active_term.term_number}`
        : 'Academic Session Active';

    return (
        <header className="h-16 shrink-0 bg-white border-b border-slate-200/90 z-20 px-4 sm:px-6 flex items-center justify-between shadow-xs">
            
            {/* Left: Mobile Toggle & Brand Logo */}
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={onToggleMobileMenu}
                    className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden focus:outline-none"
                    aria-label="Toggle navigation menu"
                >
                    <Menu className="w-5 h-5" />
                </button>

                <Link href="/" className="flex items-center gap-2.5 focus:outline-none">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white shadow-xs">
                        <GraduationCap className="w-5 h-5" />
                    </div>
                    <div className="hidden sm:flex flex-col">
                        <span className="text-lg font-extrabold tracking-tight text-slate-950 leading-none">
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
                <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{academicPeriod}</span>
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
                    >
                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="hidden sm:flex flex-col text-left">
                            <span className="text-xs font-bold text-slate-900 leading-tight">{user?.name || 'User Account'}</span>
                            <span className="text-[10px] text-slate-500 leading-tight">{user?.email}</span>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                    </button>

                    {dropdownOpen && (
                        <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95">
                            <div className="px-4 py-2 border-b border-slate-100">
                                <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                            </div>

                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Sign out</span>
                            </Link>
                        </div>
                    )}
                </div>

            </div>

        </header>
    );
}