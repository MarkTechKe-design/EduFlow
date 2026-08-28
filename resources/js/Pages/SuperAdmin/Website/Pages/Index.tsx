import AppLayout from '@/Layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEvent, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Globe, Plus, Edit3, Trash2, ExternalLink, Shield, FileText,
    ShieldCheck, Save, Layers, X, Sparkles, Search, ChevronRight, ArrowLeft
} from 'lucide-react';
import { SectionVisualEditor } from '@/components/cms/SectionVisualEditor';

interface SectionRecord {
    id: number;
    website_page_id?: number;
    section_key?: string;
    identifier?: string;
    block_type: string;
    content: Record<string, any> | null;
    settings?: Record<string, any> | null;
    sort_order: number;
    is_enabled: boolean;
}

interface PageRecord {
    id: number;
    path: string;
    title: string;
    meta_title: string | null;
    meta_description: string | null;
    template: string;
    status: 'draft' | 'published';
    sections_count?: number;
    sections?: SectionRecord[];
}

interface Props {
    pages: PageRecord[] | { data: PageRecord[] };
}

export default function WebsitePagesIndex({ pages }: Props) {
    const rawPages: PageRecord[] = useMemo(() => {
        return Array.isArray(pages)
            ? pages
            : ((pages as any)?.data && Array.isArray((pages as any).data)
                ? (pages as any).data
                : []);
    }, [pages]);

    const [selectedCategory, setSelectedCategory] = useState<'all' | 'landing' | 'legal' | 'info'>('all');
    const [pageSearch, setPageSearch] = useState('');
    const [sectionSearch, setSectionSearch] = useState('');
    const [selectedPageId, setSelectedPageId] = useState<number | null>(rawPages[0]?.id || null);
    const [mobileTab, setMobileTab] = useState<'pages' | 'sections'>('pages');
    const [editingPage, setEditingPage] = useState<PageRecord | null>(null);
    const [editingSection, setEditingSection] = useState<SectionRecord | null>(null);
    const [jsonMode, setJsonMode] = useState(false);

    // Active page context
    const activeSectionPage = useMemo(() => {
        if (!selectedPageId && rawPages.length > 0) return rawPages[0];
        return rawPages.find((p) => p.id === selectedPageId) || rawPages[0] || null;
    }, [rawPages, selectedPageId]);

    const [blockContent, setBlockContent] = useState<Record<string, any>>({});
    const [blockMeta, setBlockMeta] = useState<{ identifier: string; block_type: string; sort_order: number; is_enabled: boolean }>({
        identifier: '',
        block_type: 'content',
        sort_order: 1,
        is_enabled: true,
    });

    const pageForm = useForm({
        title: '',
        path: '',
        template: 'standard',
        status: 'published' as 'draft' | 'published',
        meta_title: '',
        meta_description: '',
    });

    const filteredPages = useMemo(() => {
        return rawPages.filter((p) => {
            const matchesSearch = p.title.toLowerCase().includes(pageSearch.toLowerCase()) || p.path.toLowerCase().includes(pageSearch.toLowerCase());
            if (!matchesSearch) return false;
            if (selectedCategory === 'all') return true;
            if (selectedCategory === 'landing') return ['/', '/features', '/pricing'].includes(p.path);
            if (selectedCategory === 'legal') return ['/privacy', '/cookies', '/terms', '/saas-terms', '/security', '/disclaimer', '/governance'].includes(p.path);
            if (selectedCategory === 'info') return ['/about', '/contact', '/faq'].includes(p.path);
            return true;
        });
    }, [rawPages, pageSearch, selectedCategory]);

    const activeSections = useMemo(() => {
        const sections = activeSectionPage?.sections || [];
        if (!sectionSearch.trim()) return sections;
        const q = sectionSearch.toLowerCase();
        return sections.filter((s) => {
            const ident = (s.identifier || '').toLowerCase();
            const btype = (s.block_type || '').toLowerCase();
            const title = String(s.content?.title || s.content?.heading || s.content?.badge || '').toLowerCase();
            return ident.includes(q) || btype.includes(q) || title.includes(q);
        });
    }, [activeSectionPage, sectionSearch]);

    function selectPage(page: PageRecord) {
        setSelectedPageId(page.id);
        setEditingPage(null);
        setMobileTab('sections');
    }

    function startCreatePage() {
        setEditingPage({
            id: 0,
            path: '/',
            title: '',
            template: 'standard',
            status: 'published',
            meta_title: '',
            meta_description: '',
        });
        pageForm.setData({
            title: '',
            path: '/',
            template: 'standard',
            status: 'published',
            meta_title: '',
            meta_description: '',
        });
        pageForm.clearErrors();
    }

    function startEditPage(page: PageRecord) {
        setEditingPage(page);
        setSelectedPageId(page.id);
        pageForm.setData({
            title: page.title,
            path: page.path,
            template: page.template || 'standard',
            status: page.status || 'published',
            meta_title: page.meta_title || '',
            meta_description: page.meta_description || '',
        });
        pageForm.clearErrors();
    }

    function openSectionModal(sec: SectionRecord) {
        setEditingSection(sec);
        setJsonMode(false);
        setBlockMeta({
            identifier: sec.identifier || sec.section_key || '',
            block_type: sec.block_type || 'content',
            sort_order: sec.sort_order || 1,
            is_enabled: Boolean(sec.is_enabled),
        });
        setBlockContent(sec.content ? JSON.parse(JSON.stringify(sec.content)) : {});
    }

    function startNewSection(page: PageRecord) {
        const count = page.sections?.length || 0;
        setEditingSection({
            id: 0,
            website_page_id: page.id,
            block_type: 'content',
            identifier: `section_${count + 1}`,
            sort_order: count + 1,
            is_enabled: true,
            content: {
                badge: 'Platform Section',
                title: 'New Section Title',
                subtitle: 'A brief summary of this operational capability.',
                body: "### Key Highlights\n- **Highlight 1**: Detailed explanation.\n- **Highlight 2**: Additional workflows.",
            },
        });
        setJsonMode(false);
        setBlockMeta({
            identifier: `section_${count + 1}`,
            block_type: 'content',
            sort_order: count + 1,
            is_enabled: true,
        });
        setBlockContent({
            badge: 'Platform Section',
            title: 'New Section Title',
            subtitle: 'A brief summary of this operational capability.',
            body: "### Key Highlights\n- **Highlight 1**: Detailed explanation.\n- **Highlight 2**: Additional workflows.",
        });
    }

    function updateNestedField(pathStr: string, value: any) {
        setBlockContent((prev) => {
            const copy = JSON.parse(JSON.stringify(prev || {}));
            const parts = pathStr.split('.');
            let current = copy;
            for (let i = 0; i < parts.length - 1; i++) {
                const part = parts[i];
                if (current[part] === undefined) {
                    const nextPart = parts[i + 1];
                    current[part] = !isNaN(Number(nextPart)) ? [] : {};
                }
                current = current[part];
            }
            current[parts[parts.length - 1]] = value;
            return copy;
        });
    }

    function applyFormat(textareaId: string, pathStr: string, formatType: 'bold' | 'heading' | 'bullet') {
        const textarea = document.getElementById(textareaId) as HTMLTextAreaElement | null;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = textarea.value || '';
        const selected = currentText.substring(start, end) || 'Sample Text';

        let replacement = selected;
        if (formatType === 'bold') replacement = `**${selected}**`;
        if (formatType === 'heading') replacement = `\n### ${selected}\n`;
        if (formatType === 'bullet') replacement = `\n- **${selected}**: Detailed description.`;

        const updated = currentText.substring(0, start) + replacement + currentText.substring(end);
        updateNestedField(pathStr, updated);

        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + replacement.length, start + replacement.length);
        }, 10);
    }

    function submitPage(e: FormEvent) {
        e.preventDefault();
        if (editingPage && editingPage.id > 0) {
            pageForm.put(`/super-admin/website/pages/${editingPage.id}`, {
                preserveScroll: true,
                onSuccess: () => setEditingPage(null),
            });
        } else {
            pageForm.post('/super-admin/website/pages', {
                preserveScroll: true,
                onSuccess: () => setEditingPage(null),
            });
        }
    }

    function saveSectionBlock(e: FormEvent) {
        e.preventDefault();
        if (!activeSectionPage || !editingSection) return;

        router.post(`/super-admin/website/pages/${activeSectionPage.id}/sections`, {
            id: editingSection.id > 0 ? editingSection.id : null,
            identifier: blockMeta.identifier,
            block_type: blockMeta.block_type,
            sort_order: blockMeta.sort_order,
            is_enabled: blockMeta.is_enabled,
            content: blockContent,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setEditingSection(null);
            },
        });
    }

    function deleteSection(pageId: number, secId: number) {
        if (window.confirm('Remove this section block permanently?')) {
            router.delete(`/super-admin/website/pages/${pageId}/sections/${secId}`, {
                preserveScroll: true,
            });
        }
    }

    return (
        <AppLayout title="Public Website Pages">
            <Head title="Website Pages & CMS Studio | EduFlow SuperAdmin" />

            <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-16 px-2 sm:px-4 lg:px-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pt-2">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                            <span>Visual Website CMS Studio</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            Visually format text, organize sections, and update media without raw code.
                        </p>
                    </div>
                    <Button onClick={startCreatePage} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm h-9 sm:h-10 gap-2 shadow-xs self-start sm:self-auto">
                        <Plus className="h-4 w-4" />
                        <span>New Page</span>
                    </Button>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                            selectedCategory === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        All Pages ({rawPages.length})
                    </button>
                    <button
                        onClick={() => setSelectedCategory('landing')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                            selectedCategory === 'landing' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                        <span>Landing & Commercial</span>
                    </button>
                    <button
                        onClick={() => setSelectedCategory('legal')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                            selectedCategory === 'legal' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <Shield className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Legal & Governance</span>
                    </button>
                    <button
                        onClick={() => setSelectedCategory('info')}
                        className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                            selectedCategory === 'info' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <FileText className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Institutional Info</span>
                    </button>
                </div>

                {/* Mobile View Toggle Switch (Visible only on < lg screens) */}
                <div className="flex lg:hidden bg-slate-100 p-1 rounded-2xl gap-1 text-xs font-bold">
                    <button
                        onClick={() => setMobileTab('pages')}
                        className={`flex-1 py-2 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 ${
                            mobileTab === 'pages' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600'
                        }`}
                    >
                        <Globe className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Pages ({filteredPages.length})</span>
                    </button>
                    <button
                        onClick={() => setMobileTab('sections')}
                        className={`flex-1 py-2 rounded-xl text-center transition-all flex items-center justify-center gap-1.5 ${
                            mobileTab === 'sections' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600'
                        }`}
                    >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Sections ({activeSectionPage?.sections?.length || 0})</span>
                    </button>
                </div>

                {/* 2-Column Split Studio */}
                <div className="grid gap-4 sm:gap-6 lg:grid-cols-12 items-start">

                    {/* Column 1: Page Navigation List */}
                    <div className={`lg:col-span-5 space-y-4 ${mobileTab === 'sections' ? 'hidden lg:block' : 'block'}`}>
                        <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                            <CardHeader className="p-3.5 sm:p-4 border-b border-slate-100 space-y-2.5">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-emerald-600" />
                                    <span>Select Page to Manage</span>
                                </CardTitle>
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                                    <Input
                                        value={pageSearch}
                                        onChange={(e) => setPageSearch(e.target.value)}
                                        placeholder="Search pages by title or slug..."
                                        className="h-8 text-xs pl-8 bg-slate-50"
                                    />
                                </div>
                            </CardHeader>
                            <CardContent className="p-0 divide-y divide-slate-100 max-h-[65vh] lg:max-h-[70vh] overflow-y-auto">
                                {filteredPages.map((page) => {
                                    const isSelected = activeSectionPage?.id === page.id;
                                    return (
                                        <div
                                            key={page.id}
                                            onClick={() => selectPage(page)}
                                            className={`p-3.5 sm:p-4 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                                isSelected ? 'bg-emerald-50/80 border-l-4 border-emerald-600' : 'hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="space-y-1 flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">{page.title}</span>
                                                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">
                                                        {page.path}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                                    <span className="flex items-center gap-1 font-semibold text-emerald-700">
                                                        <Layers className="w-3 h-3" />
                                                        {page.sections?.length || page.sections_count || 0} Sections
                                                    </span>
                                                    <span className="capitalize">{page.status}</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                <a
                                                    href={page.path}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
                                                    title="View Live Page"
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5" />
                                                </a>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => startEditPage(page)}
                                                    className="h-7 text-xs px-2"
                                                >
                                                    SEO
                                                </Button>
                                                <div className="lg:hidden p-1 text-slate-400">
                                                    <ChevronRight className="w-4 h-4" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Column 2: Independent Section Blocks */}
                    <div className={`lg:col-span-7 space-y-4 ${mobileTab === 'pages' ? 'hidden lg:block' : 'block'}`}>
                        {activeSectionPage && (
                            <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                                <CardHeader className="p-3.5 sm:p-4 border-b border-slate-100 space-y-2.5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setMobileTab('pages')}
                                                className="lg:hidden p-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 shrink-0"
                                                title="Back to pages"
                                            >
                                                <ArrowLeft className="w-4 h-4" />
                                            </button>
                                            <div className="min-w-0">
                                                <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-1.5 truncate">
                                                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                                                    <span className="truncate">{activeSectionPage.title}</span>
                                                </CardTitle>
                                                <p className="text-[10px] sm:text-[11px] font-mono text-slate-500 truncate">{activeSectionPage.path}</p>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => startNewSection(activeSectionPage)}
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 gap-1 shadow-xs self-start sm:self-auto shrink-0"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                            <span>Add Block</span>
                                        </Button>
                                    </div>
                                    <div className="relative">
                                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                                        <Input
                                            value={sectionSearch}
                                            onChange={(e) => setSectionSearch(e.target.value)}
                                            placeholder={`Filter ${activeSectionPage.sections?.length || 0} sections on this page...`}
                                            className="h-8 text-xs pl-8 bg-slate-50"
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-3 sm:p-4 space-y-2.5 sm:space-y-3 max-h-[65vh] lg:max-h-[70vh] overflow-y-auto">
                                    {activeSections && activeSections.length > 0 ? (
                                        activeSections.map((sec, idx) => {
                                            const c = sec.content || {};
                                            return (
                                                <div
                                                    key={sec.id}
                                                    className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                                                >
                                                    <div className="space-y-1 flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                            <span className="font-bold text-xs sm:text-sm text-slate-900 capitalize truncate">
                                                                {sec.identifier || `Block #${idx + 1}`}
                                                            </span>
                                                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[9px] sm:text-[10px] font-mono font-semibold">
                                                                {sec.block_type}
                                                            </span>
                                                            <span className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase ${
                                                                sec.is_enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                                                            }`}>
                                                                {sec.is_enabled ? 'Active' : 'Draft'}
                                                            </span>
                                                        </div>

                                                        <p className="text-xs text-slate-700 font-semibold line-clamp-1">
                                                            {c.title || c.heading || c.badge || 'Section Content'}
                                                        </p>

                                                        <p className="text-[11px] text-slate-500 line-clamp-1">
                                                            {c.body ? c.body.replace(/[#*\-]/g, '').slice(0, 100) + '...' : c.subtitle || c.subheading || 'No description'}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => openSectionModal(sec)}
                                                            className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8 px-3 font-semibold gap-1.5 rounded-xl shadow-xs"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5" />
                                                            <span>Edit</span>
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => deleteSection(activeSectionPage.id, sec.id)}
                                                            className="h-8 text-xs px-2 text-rose-600 hover:bg-rose-50 rounded-xl"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="p-8 text-center text-slate-400 space-y-2">
                                            <Layers className="w-8 h-8 mx-auto text-slate-300" />
                                            <p className="text-xs">No section blocks found matching your query.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                </div>

            </div>

            {/* MODAL: SEO & PAGE PROPERTIES */}
            {editingPage && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setEditingPage(null)}
                >
                    <div
                        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[92dvh] overflow-y-auto border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4 text-slate-900"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-sm sm:text-base font-bold text-slate-950 flex items-center gap-2">
                                <Globe className="w-4 h-4 text-emerald-600" />
                                <span>{editingPage.id > 0 ? 'Edit Page SEO & Settings' : 'Create New Page'}</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setEditingPage(null)}
                                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitPage} className="space-y-3.5 text-xs">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Page Title *</Label>
                                <Input
                                    value={pageForm.data.title}
                                    onChange={(e) => pageForm.setData('title', e.target.value)}
                                    placeholder="e.g. About Us"
                                    className="h-8 text-xs"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">URL Path *</Label>
                                <Input
                                    value={pageForm.data.path}
                                    onChange={(e) => pageForm.setData('path', e.target.value)}
                                    placeholder="e.g. /about"
                                    className="h-8 text-xs font-mono"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Template</Label>
                                    <select
                                        value={pageForm.data.template}
                                        onChange={(e) => pageForm.setData('template', e.target.value)}
                                        className="w-full h-8 text-xs rounded-lg border border-slate-200 bg-white px-2 focus:outline-none"
                                    >
                                        <option value="standard">Standard CMS</option>
                                        <option value="home">Homepage</option>
                                        <option value="features">Features</option>
                                        <option value="pricing">Pricing</option>
                                        <option value="about">About Us</option>
                                        <option value="contact">Contact</option>
                                        <option value="legal">Legal Suite</option>
                                        <option value="faq">FAQ</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Status</Label>
                                    <select
                                        value={pageForm.data.status}
                                        onChange={(e) => pageForm.setData('status', e.target.value as any)}
                                        className="w-full h-8 text-xs rounded-lg border border-slate-200 bg-white px-2 focus:outline-none"
                                    >
                                        <option value="published">Published</option>
                                        <option value="draft">Draft</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">SEO Meta Description</Label>
                                <textarea
                                    rows={3}
                                    value={pageForm.data.meta_description}
                                    onChange={(e) => pageForm.setData('meta_description', e.target.value)}
                                    placeholder="Search engine summary snippet..."
                                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingPage(null)}
                                    className="h-8 text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={pageForm.processing}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-4"
                                >
                                    {editingPage.id > 0 ? 'Update Page' : 'Create Page'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: SECTION CONTENT & MEDIA EDITOR (RESPONSIVE BOTTOM SHEET / MODAL) */}
            {editingSection && (
                <div
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setEditingSection(null)}
                >
                    <div
                        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-4xl w-full max-h-[92dvh] sm:max-h-[92vh] overflow-y-auto border border-slate-200 shadow-2xl p-4 sm:p-7 space-y-5 text-slate-900 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                            <div className="min-w-0">
                                <h3 className="text-base sm:text-lg font-bold text-slate-950 flex items-center gap-1.5 truncate">
                                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
                                    <span className="truncate">Edit: {blockMeta.identifier || 'Block'}</span>
                                </h3>
                                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                    Page: <strong className="text-slate-800">{activeSectionPage?.title}</strong> · Type: <code className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">{blockMeta.block_type}</code>
                                </p>
                            </div>
                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setJsonMode(!jsonMode)}
                                    className="h-8 text-[11px] sm:text-xs font-mono px-2 sm:px-3"
                                >
                                    {jsonMode ? 'Visual' : 'JSON'}
                                </Button>
                                <button
                                    type="button"
                                    onClick={() => setEditingSection(null)}
                                    className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body Form */}
                        <form onSubmit={saveSectionBlock} className="space-y-5 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Identifier / Key</Label>
                                    <Input
                                        value={blockMeta.identifier}
                                        onChange={(e) => setBlockMeta({ ...blockMeta, identifier: e.target.value })}
                                        className="h-8 text-xs font-mono"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Display Order</Label>
                                    <Input
                                        type="number"
                                        value={blockMeta.sort_order}
                                        onChange={(e) => setBlockMeta({ ...blockMeta, sort_order: parseInt(e.target.value, 10) || 1 })}
                                        className="h-8 text-xs"
                                    />
                                </div>
                                <div className="flex items-center gap-2 sm:pt-5 pt-1">
                                    <input
                                        type="checkbox"
                                        id="sec_is_enabled"
                                        checked={blockMeta.is_enabled}
                                        onChange={(e) => setBlockMeta({ ...blockMeta, is_enabled: e.target.checked })}
                                        className="h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                    />
                                    <Label htmlFor="sec_is_enabled" className="text-xs font-semibold cursor-pointer">Live on Website</Label>
                                </div>
                            </div>

                            {!jsonMode ? (
                                <SectionVisualEditor
                                    identifier={blockMeta.identifier}
                                    blockType={blockMeta.block_type}
                                    content={blockContent}
                                    updateField={updateNestedField}
                                    applyFormat={applyFormat}
                                />
                            ) : (
                                <div className="space-y-2">
                                    <Label className="text-xs font-mono font-bold">Raw JSON Schema Payload</Label>
                                    <textarea
                                        rows={12}
                                        value={JSON.stringify(blockContent, null, 2)}
                                        onChange={(e) => {
                                            try {
                                                const parsed = JSON.parse(e.target.value);
                                                setBlockContent(parsed);
                                            } catch (err) {}
                                        }}
                                        className="w-full p-3.5 rounded-2xl border border-slate-300 font-mono text-xs bg-slate-950 text-emerald-400 focus:outline-none"
                                    />
                                </div>
                            )}

                            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-4 border-t border-slate-100">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setEditingSection(null)}
                                    className="h-9 text-xs"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9 px-5 gap-1.5 shadow-md"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Save Section Content</span>
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}