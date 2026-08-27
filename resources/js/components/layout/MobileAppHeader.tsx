import React, { useState, useEffect } from 'react';
import { Menu, Bell, ChevronDown, Palette, Moon, Sun, Monitor, LogOut } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface Props {
    onToggleMobileMenu: () => void;
    school?: any;
    user?: any;
}

export default function MobileAppHeader({ onToggleMobileMenu, school, user }: Props) {
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

    return (
        <header className="lg:hidden h-16 bg-card border-b border-border/80 px-4 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
                <button
                    type="button"
                    onClick={onToggleMobileMenu}
                    className="w-11 h-11 rounded-xl bg-muted/60 hover:bg-muted text-foreground flex items-center justify-center transition-colors min-h-[44px] min-w-[44px] shrink-0"
                    aria-label="Open Navigation Menu"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-teal-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                        E
                    </div>
                    <div className="min-w-0">
                        <span className="font-bold text-xs text-foreground truncate block">
                            {school?.name || 'EduFlow Portal'}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate block">
                            {user?.name ? `Active: ${user.name}` : 'Mobile Operations'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Right: Account & Preferences Top-Right Dropdown */}
            <div className="flex items-center gap-2 shrink-0 relative">
                <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-1.5 p-1.5 rounded-xl bg-muted/60 hover:bg-muted transition-colors focus:outline-none min-h-[40px]"
                    aria-label="Account Menu"
                >
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                        {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>

                {dropdownOpen && (
                    <div className="absolute right-0 top-12 w-64 bg-card text-card-foreground rounded-2xl border border-border shadow-2xl py-3 z-50 animate-in fade-in zoom-in-95 space-y-2">
                        <div className="px-4 py-2 border-b border-border">
                            <p className="text-xs font-bold truncate">{user?.name || 'User Account'}</p>
                            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                        </div>

                        <div className="px-2 space-y-0.5">
                            <Link
                                href="/school/communication/notifications"
                                onClick={() => setDropdownOpen(false)}
                                className="w-full px-3 py-2 rounded-xl text-left text-xs font-medium text-foreground hover:bg-muted flex items-center gap-2.5 transition-colors"
                            >
                                <Bell className="w-4 h-4 text-muted-foreground" />
                                <span>Notifications</span>
                            </Link>
                        </div>

                        {/* Appearance Toggle */}
                        <div className="px-3 py-1 space-y-1.5 border-t border-border">
                            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground pt-1">
                                <Palette className="w-3.5 h-3.5" />
                                <span>Appearance</span>
                            </div>
                            <div className="grid grid-cols-3 gap-1 bg-muted p-1 rounded-xl border border-border">
                                <button
                                    type="button"
                                    onClick={() => applyTheme('system')}
                                    className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                                        theme === 'system' ? 'bg-teal-600 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <Monitor className="w-3 h-3" />
                                    <span>System</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyTheme('light')}
                                    className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                                        theme === 'light' ? 'bg-teal-600 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <Sun className="w-3 h-3" />
                                    <span>Light</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => applyTheme('dark')}
                                    className={`flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                                        theme === 'dark' ? 'bg-teal-600 text-white shadow-xs' : 'text-muted-foreground hover:text-foreground'
                                    }`}
                                >
                                    <Moon className="w-3 h-3" />
                                    <span>Dark</span>
                                </button>
                            </div>
                        </div>

                        <div className="pt-1 border-t border-border px-2">
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
        </header>
    );
}