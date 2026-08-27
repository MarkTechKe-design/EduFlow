import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import {
    Menu, X, ChevronRight, Phone, Mail, MessageSquare,
    GraduationCap
} from 'lucide-react';

interface NavItem { label: string;
    href: string;
}

interface FooterColumn {
    category: string;
    links: NavItem[];
}

interface BrandingProps {
    name?: string;
    logo_url?: string | null;
    tagline?: string;
    support_phone?: string;
    support_email?: string;
    whatsapp_number?: string;
}

interface Props {
    children: React.ReactNode;
    title?: string;
    description?: string;
    currentPath?: string;
    navigation?: any;
    footerNavigation?: any;
    branding?: BrandingProps;
}

const DEFAULT_NAV: NavItem[] = [
    { label: 'Features', href: '/features'  },
    { label: 'Pricing', href: '/pricing'  },
    { label: 'About', href: '/about'  },
    { label: 'Blog', href: '/blog'  },
    { label: 'FAQs', href: '/faq'  },
];

const DEFAULT_FOOTER_COLUMNS: FooterColumn[] = [
    {
        category: '',
        links: [
            { label: 'Features Overview', href: '/features'  },
            { label: 'Pricing Plans', href: '/pricing'  },
            { label: 'About Us', href: '/about'  },
            { label: '', href: '/blog' },
            { label: 'FAQs', href: '/faq'  },
            { label: 'Contact Us', href: '/contact'  },
        ]
    },
    {
        category: '',
        links: [
            { label: 'CBC Rubric Grading', href: '/blog/mastering-formative-rubric-evaluation-cbc-report-cards'  },
            { label: 'M-Pesa Automation', href: '/blog/eliminating-fee-reconciliation-chaos-safariom-daraja-api'  },
            { label: 'Parent SMS Alerts', href: '/blog/parent-engagement-digital-age-sms-gateways-fee-recovery'  },
            { label: 'Senior School (Grade 10)', href: '/blog/senior-school-transition-grade-10-pathways-kenya'  },
            { label: 'Product Roadmap', href: '/blog/eduflow-roadmap-future-features-offline-sync-ai-attendance'  },
        ]
    },
    {
        category: '',
        links: [
            { label: 'School Admin Portal', href: '/login'  },
            { label: 'Teacher Workspace', href: '/login'  },
            { label: '', href: '/login' },
            { label: 'Setup My School', href: '/register-school'  },
        ]
    },
    {
        category: '',
        links: [
            { label: 'Privacy Policy', href: '/privacy'  },
            { label: 'Cookie Policy', href: '/cookies'  },
            { label: 'Terms of Service', href: '/terms'  },
            { label: 'SaaS Agreement', href: '/saas-terms'  },
            { label: 'Security Controls', href: '/security'  },
            { label: 'Legal Disclaimer', href: '/disclaimer'  },
        ]
    }
];

export default function MarketingLayout({
    children,
    title,
    description,
    currentPath = '/',
    navigation,
    footerNavigation,
    branding,
}: Props) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const page = usePage();

    const appBranding: BrandingProps = branding || (page.props as any).branding || (page.props as any).platform_settings || {};
    const platformName = appBranding.name || 'EduFlow';
    const logoUrl = appBranding.logo_url || null;
    const supportPhone = appBranding.support_phone || '0718178521';
    const supportEmail = appBranding.support_email || 'markochieng5577@gmail.com';
    const rawWhatsapp = appBranding.whatsapp_number || supportPhone;

    const cleanDigits = rawWhatsapp.replace(/[^0-9]/g, '');
    const formattedWhatsapp = cleanDigits.startsWith('0')
        ? '254' + cleanDigits.slice(1)
        : (cleanDigits.startsWith('254') ? cleanDigits : '254' + cleanDigits);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 15);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [currentPath]);

        const navItems: NavItem[] = useMemo(() => {
        let items = DEFAULT_NAV;
        if (Array.isArray(navigation) && navigation.length > 0) {
            const mapped = navigation
                .filter((item: any) => {
                    if (!item || (!item.label && !item.title)) return false;
                    const label = (item.label || item.title || '').toLowerCase();
                    const href = item.href || item.url || '';
                    return !label.includes('sign in') && !label.includes('login') && !href.includes('/login');
                })
                .map((item: any) => ({
                    label: item.label || item.title,
                    href: item.href || item.url || '/'
                }));
            if (mapped.length > 0) {
                items = mapped;
            }
        }

        // Guarantee Blog and FAQs are always present in the header across all public pages
        const hasBlog = items.some(i => i.href.includes('/blog') || i.label.toLowerCase() === 'blog');
        const hasFaq = items.some(i => i.href.includes('/faq') || i.label.toLowerCase() === 'faqs');

        const finalItems = [...items];
        if (!hasBlog) {
            finalItems.push({ label: 'Blog', href: '/blog' });
        }
        if (!hasFaq) {
            finalItems.push({ label: 'FAQs', href: '/faq' });
        }

        return finalItems;
    }, [navigation]);

    const footerColumns: FooterColumn[] = useMemo(() => {
        if (Array.isArray(footerNavigation) && footerNavigation.length > 0) {
            const cols = footerNavigation
                .map((col: any) => ({
                    category: col.title || col.category || 'LINKS',
                    links: Array.isArray(col.links)
                        ? col.links.map((l: any) => ({ label: l.label || l.title, href: l.href || l.url || '/'  }))
                        : []
                }))
                .filter((col: FooterColumn) => col.links.length > 0);
            if (cols.length > 0) return cols;
        }
        return DEFAULT_FOOTER_COLUMNS;
    }, [footerNavigation]);

    return (
        <div className="min-h-screen flex flex-col bg-white text-slate-900 antialiased selection:bg-emerald-600 selection:text-white">
            
            {/* Header Navigation */}
            <header
                className={`sticky top-0 z-50 transition-all duration-200 ${
                    scrolled
                        ? 'bg-white/95 backdrop-blur-md shadow-xs border-b border-slate-200/80 py-3'
                        : 'bg-white border-b border-slate-100 py-3.5'
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between gap-4">
                        
                        {/* Brand Logo */}
                        <Link href="/" className="flex items-center gap-3 group shrink-0">
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt={platformName}
                                    className="h-10 sm:h-11 w-auto max-w-[200px] object-contain transition-transform group-hover:scale-105"
                                />
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:bg-emerald-700 transition-colors">
                                        <GraduationCap className="w-5 h-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-xl font-extrabold tracking-tight text-slate-950 leading-none">
                                            Edu<span className="text-emerald-600">Flow</span>
                                        </span>
                                        <span className="text-[9px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">
                                            Educate . Empower . Excel
                                        </span>
                                    </div>
                                </div>
                            )}
                        </Link>

                        {/* Desktop Navigation Links */}
                        <nav className="hidden lg:flex items-center bg-slate-50 border border-slate-200/80 rounded-full px-6 py-2 shadow-xs">
                            <div className="flex items-center space-x-7 text-xs font-bold text-slate-700">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className={`transition-colors hover:text-emerald-600 ${
                                            currentPath === item.href ? 'text-emerald-600 font-extrabold' : ''
                                        }`}
                                    >
                                        {item.label}
                                    </Link>
                                ))}
                            </div>
                        </nav>

                        {/* Desktop Action Buttons */}
                        <div className="hidden lg:flex items-center gap-3 shrink-0">
                            <a href="/login" className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors px-3 py-2 cursor-pointer">Sign In</a>
                            <a href="/register-school" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer">Setup My School &rsaquo;</a>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="flex lg:hidden items-center gap-2">
                            <Link
                                href="/register-school"
                                className="px-3 py-1.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold shadow-xs hover:bg-emerald-700"
                            >
                                Setup
                            </Link>
                            <button
                                type="button"
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="p-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
                                aria-label="Toggle navigation menu"
                            >
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>

                    </div>
                </div>

                {/* Mobile Drawer */}
                {mobileMenuOpen && (
                    <div className="lg:hidden fixed inset-x-0 top-[61px] bg-white border-b border-slate-200 shadow-2xl z-40 max-h-[calc(100vh-65px)] overflow-y-auto">
                        <div className="px-6 py-6 space-y-6">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Navigation</span>
                                <div className="grid gap-1 pt-1">
                                    {navItems.map((item) => (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="flex items-center justify-between py-2.5 px-3 rounded-xl text-sm font-bold text-slate-800 hover:bg-slate-50 hover:text-emerald-700 transition-colors"
                                        >
                                            <span>{item.label}</span>
                                            <ChevronRight className="w-4 h-4 text-slate-400" />
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 space-y-3">
                                <Link
                                    href="/register-school"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-600/20 hover:bg-emerald-700"
                                >
                                    <span>Setup My School</span>
                                    <ChevronRight className="w-4 h-4" />
                                </Link>
                                
                                <Link
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="w-full flex items-center justify-center py-2.5 rounded-2xl border border-slate-200 text-slate-800 text-xs font-bold hover:bg-slate-50"
                                >
                                    Sign In to Portal
                                </Link>
                            </div>

                            {supportPhone && (
                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                                    <span>Helpdesk:</span>
                                    <a href={`tel:${supportPhone}`} className="font-bold text-emerald-700">{supportPhone}</a>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* Page Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* Global Enterprise Footer */}
                        {/* Modern Enterprise Footer */}
            <footer className="bg-[#060b16] text-slate-400 pt-16 pb-12 border-t border-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
                        
                        {/* Brand Contacts & Stay Updated */}
                        <div className="lg:col-span-4 space-y-6">
                            <Link href="/" className="inline-flex items-center gap-3">
                                {logoUrl ? (
                                    <img
                                        src={logoUrl}
                                        alt={platformName}
                                        className="h-10 sm:h-11 w-auto max-w-[180px] object-contain brightness-0 invert"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                                            <GraduationCap className="w-4 h-4" />
                                        </div>
                                        <span className="text-xl font-extrabold text-white">
                                            Edu<span className="text-emerald-500">Flow</span>
                                        </span>
                                    </div>
                                )}
                            </Link>

                            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                                The integrated school operations and CBC assessment platform engineered specifically for Kenyan educational institutions.
                            </p>

                            <div>
                                <a
                                    href="https://wa.me/254718178521"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-xs font-bold hover:bg-emerald-900/60 transition-colors"
                                >
                                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                                    <span>Admissions Desk on WhatsApp</span>
                                </a>
                            </div>

                            <div className="space-y-1.5 text-xs text-slate-400 pt-1">
                                <div className="flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                                    <a href="mailto:markochieng5577@gmail.com" className="hover:text-emerald-400 transition-colors">
                                        markochieng5577@gmail.com
                                    </a>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                                    <a href="tel:0718178521" className="hover:text-emerald-400 transition-colors">
                                        0718178521
                                    </a>
                                </div>
                            </div>

                            {/* Stay Updated Newsletter */}
                            <div className="pt-2 space-y-2 max-w-xs">
                                <span className="text-[11px] font-extrabold tracking-wider uppercase text-white block">
                                    STAY UPDATED
                                </span>
                                <p className="text-[11px] text-slate-400 leading-relaxed">
                                    Receive quarterly briefs on Kenyan Ministry of Education digital policies and EduFlow updates.
                                </p>
                                <form onSubmit={(e) => e.preventDefault()} className="pt-1">
                                    <input
                                        type="email"
                                        placeholder="school@example.com"
                                        className="w-full h-9 px-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-600"
                                    />
                                </form>
                            </div>
                        </div>

                        {/* Directory */}
                        <div className="lg:col-span-2 space-y-4">
                            <h4 className="text-[11px] font-extrabold tracking-wider uppercase text-white">DIRECTORY</h4>
                            <ul className="space-y-2.5 text-xs">
                                <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                                <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
                            </ul>
                        </div>

                        {/* Product */}
                        <div className="lg:col-span-2 space-y-4">
                            <h4 className="text-[11px] font-extrabold tracking-wider uppercase text-white">PRODUCT</h4>
                            <ul className="space-y-2.5 text-xs">
                                <li>
                                    <Link href="/blog/mastering-formative-rubric-evaluation-cbc-report-cards" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                                        CBC Rubric Grading
                                    </Link>
                                </li>
                                <li><Link href="/blog/eliminating-fee-reconciliation-chaos-safariom-daraja-api" className="hover:text-white transition-colors">M-Pesa Fee Automation</Link></li>
                                <li><Link href="/blog/mastering-formative-rubric-evaluation-cbc-report-cards" className="hover:text-white transition-colors">NEMIS & KNEC Sync</Link></li>
                                <li><Link href="/blog/parent-engagement-digital-age-sms-gateways-fee-recovery" className="hover:text-white transition-colors">Parent SMS Gateway</Link></li>
                                <li><Link href="/features" className="hover:text-white transition-colors">Staff & Payroll HR</Link></li>
                                <li><Link href="/blog/eduflow-roadmap-future-features-offline-sync-ai-attendance" className="hover:text-white transition-colors">Hostels & Transport</Link></li>
                            </ul>
                        </div>

                        {/* Ecosystem */}
                        <div className="lg:col-span-2 space-y-4">
                            <h4 className="text-[11px] font-extrabold tracking-wider uppercase text-white">ECOSYSTEM</h4>
                            <ul className="space-y-2.5 text-xs">
                                <li><Link href="/login" className="hover:text-white transition-colors">School Admin Portal</Link></li>
                                <li><Link href="/login" className="hover:text-white transition-colors">Teacher Workspace</Link></li>
                                <li><Link href="/login" className="hover:text-white transition-colors">Parent & Student Hub</Link></li>
                                <li><Link href="/pricing" className="hover:text-white transition-colors">Plans & Pricing</Link></li>
                                <li><Link href="/contact" className="hover:text-white transition-colors">Book a Live Demo</Link></li>
                                <li><a href="/register-school" className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-all cursor-pointer">Setup My School &rsaquo;</a></li>
                            </ul>
                        </div>

                        {/* Governance */}
                        <div className="lg:col-span-2 space-y-4">
                            <h4 className="text-[11px] font-extrabold tracking-wider uppercase text-white">GOVERNANCE</h4>
                            <ul className="space-y-2.5 text-xs">
                                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                                <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                                <li><Link href="/saas-terms" className="hover:text-white transition-colors">SaaS Agreement</Link></li>
                                <li><Link href="/security" className="hover:text-white transition-colors">Security Controls</Link></li>
                                <li><Link href="/disclaimer" className="hover:text-white transition-colors">Legal Disclaimer</Link></li>
                            </ul>
                        </div>

                    </div>

                    {/* Bottom Status Bar */}
                    <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                        <p>&copy; 2026 EduFlow Kenya. All rights reserved.</p>
                        <div className="flex items-center gap-3 text-[11px]">
                            <span className="flex items-center gap-1.5 text-slate-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                                <span className="text-slate-300">Core Systems Operational</span>
                            </span>
                            <span className="text-slate-700">.</span>
                            <span className="text-slate-400">Kenya DPA (2019) Compliant</span>
                        </div>
                    </div>

                </div>
            </footer>

        </div>
    );
}
