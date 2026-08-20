import { Link, usePage } from '@inertiajs/react';
import { LayoutDashboard, School, Users, CreditCard, BookOpen, Calendar, Settings, Package, FileText, X, GraduationCap, ShieldCheck, Award, Bus, Building2, Video, HelpCircle, Newspaper, Layers, Clock, DollarSign, CheckSquare, Radio, ShieldAlert } from 'lucide-react';
import React from 'react';

interface NavigationItem {
    label: string;
    href: string;
    icon: string;
    badge?: string | number;
}

interface NavigationGroup {
    groupTitle: string;
    items: NavigationItem[];
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    user?: any;
    school?: any;
    navigation?: NavigationGroup[];
}

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
    dashboard: LayoutDashboard,
    school: School,
    users: Users,
    'credit-card': CreditCard,
    'book-open': BookOpen,
    calendar: Calendar,
    settings: Settings,
    package: Package,
    'file-text': FileText,
    award: Award,
    bus: Bus,
    building: Building2,
    video: Video,
    'help-circle': HelpCircle,
    newspaper: Newspaper,
    layers: Layers,
    clock: Clock,
    dollar: DollarSign,
    tasks: CheckSquare,
    graduation: GraduationCap,
    shield: ShieldCheck,
    'shield-alert': ShieldAlert,
    live: Radio,
};

export default function Sidebar({ isOpen, onClose, user, school, navigation }: Props) {
    const { url, props } = usePage<any>();
    
    const authRoles: string[] = props?.auth?.roles || user?.roles || [];
    const isSuperAdmin = authRoles.includes('super-admin');

    // Automatically resolve navigation array from props if not explicitly provided
    const navGroups: NavigationGroup[] = (navigation && navigation.length > 0)
        ? navigation
        : (props?.navigation || []);

    const portalName = isSuperAdmin
        ? 'Super Administrator'
        : (school?.name || props?.school?.name || 'School Operations');

    return (
        <>
            {isOpen && (
                <div
                    onClick={onClose}
                    className="fixed inset-0 bg-slate-900/60 z-30 lg:hidden backdrop-blur-xs transition-opacity"
                />
            )}

            <aside
                className={'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-950 text-white flex flex-col justify-between border-r border-slate-800/80 transform transition-transform duration-200 ease-in-out lg:translate-x-0 ' + (isOpen ? 'translate-x-0' : '-translate-x-full')}
            >
                <div className="p-4 border-b border-slate-800/80 flex items-center justify-between lg:hidden">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/30">
                            <GraduationCap className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-extrabold text-lg text-white tracking-tight">EduFlow</span>
                    </div>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1" aria-label="Close menu">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Portal Context Header */}
                    <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2.5 shadow-xs">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                        <div className="space-y-0.5 truncate">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {isSuperAdmin ? 'Global SaaS Platform' : 'Portal Context'}
                            </p>
                            <p className="text-xs font-bold text-white truncate">
                                {portalName}
                            </p>
                        </div>
                    </div>

                    {/* Navigation Groups */}
                    <div className="space-y-5">
                        {navGroups.map((group) => (
                            <div key={group.groupTitle} className="space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 px-3 pb-1">
                                    {group.groupTitle}
                                </p>
                                {group.items.map((item) => {
                                    const Icon = icons[item.icon] || FileText;
                                    const isActive = url === item.href || (item.href !== '/dashboard' && item.href !== '/super-admin/dashboard' && url.startsWith(item.href));
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => onClose()}
                                            className={'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ' + (isActive
                                                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                                                : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200')}
                                        >
                                            <div className="flex items-center gap-3 truncate">
                                                <Icon className="w-4 h-4 shrink-0" />
                                                <span className="truncate">{item.label}</span>
                                            </div>
                                            {item.badge && (
                                                <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30">
                                                    {item.badge}
                                                </span>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-800/80 bg-slate-950/80 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span className="text-[11px] font-medium text-slate-400">EduFlow Platform</span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500">v2.4 LTS</span>
                </div>
            </aside>
        </>
    );
}