import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useState, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Globe, Plus, Edit3, Trash2, ExternalLink, Shield, FileText,
    ShieldCheck, Check, Save, Layers, UploadCloud, X,
    Image as ImageIcon, Video as VideoIcon, Loader2, Bold, Heading2,
    List, User, Sparkles, AlignLeft
} from 'lucide-react';

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
    const [selectedPageId, setSelectedPageId] = useState<number | null>(rawPages[0]?.id || null);
    const [editingPage, setEditingPage] = useState<PageRecord | null>(null);
    const [editingSection, setEditingSection] = useState<SectionRecord | null>(null);
    const [jsonMode, setJsonMode] = useState(false);

    // Derive active page dynamically from props to prevent stale cache
    const activeSectionPage = useMemo(() => {
        if (!selectedPageId && rawPages.length > 0) return rawPages[0];
        return rawPages.find((p) => p.id === selectedPageId) || rawPages[0] || null;
    }, [rawPages, selectedPageId]);

    const [blockContent, setBlockContent] = useState<Record<string, any>>({});
    const [blockMeta, setBlockMeta] = useState<{ identifier: string; block_type: string; sort_order: number; is_enabled: boolean }>({
        identifier: '',
        block_type: 'legal_section',
        sort_order: 1,
        is_enabled: true,
    });

    const [uploadingField, setUploadingField] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [targetUploadKey, setTargetUploadKey] = useState<string>('');

    const pageForm = useForm({
        title: '',
        path: '',
        template: 'standard',
        status: 'published' as 'draft' | 'published',
        meta_title: '',
        meta_description: '',
    });

    const filteredPages = rawPages.filter((p) => {
        if (selectedCategory === 'all') return true;
        if (selectedCategory === 'landing') return ['/', '/features', '/pricing'].includes(p.path);
        if (selectedCategory === 'legal') return ['/privacy', '/cookies', '/terms', '/saas-terms', '/security', '/disclaimer', '/governance'].includes(p.path);
        if (selectedCategory === 'info') return ['/about', '/contact', '/faq'].includes(p.path);
        return true;
    });

    function startCreatePage() {
        setEditingPage(null);
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
            block_type: sec.block_type || 'legal_section',
            sort_order: sec.sort_order || 1,
            is_enabled: Boolean(sec.is_enabled),
        });
        setBlockContent(sec.content ? JSON.parse(JSON.stringify(sec.content)) : {});
    }

    function startNewSection(page: PageRecord) {
        setEditingSection({
            id: 0,
            website_page_id: page.id,
            block_type: 'legal_section',
            identifier: `section_${(page.sections?.length || 0) + 1}`,
            sort_order: (page.sections?.length || 0) + 1,
            is_enabled: true,
            content: {
                badge: 'Governance Standard',
                title: 'New Section Clause',
                subtitle: 'A brief summary of this operational or legal clause.',
                body: "### Key Provisions\n- **Provision 1**: Detailed explanation of rights or obligations.\n- **Provision 2**: Additional specific statutory rules or workflows.",
            },
        });
        setJsonMode(false);
        setBlockMeta({
            identifier: `section_${(page.sections?.length || 0) + 1}`,
            block_type: 'legal_section',
            sort_order: (page.sections?.length || 0) + 1,
            is_enabled: true,
        });
        setBlockContent({
            badge: 'Governance Standard',
            title: 'New Section Clause',
            subtitle: 'A brief summary of this operational or legal clause.',
            body: "### Key Provisions\n- **Provision 1**: Detailed explanation of rights or obligations.\n- **Provision 2**: Additional specific statutory rules or workflows.",
        });
    }

    function triggerFieldUpload(fieldPath: string) {
        setTargetUploadKey(fieldPath);
        fileInputRef.current?.click();
    }

    async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !targetUploadKey) return;

        setUploadingField(targetUploadKey);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', activeSectionPage?.path?.replace(/\//g, '') || 'website');
        formData.append('title', file.name);

        try {
            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
            const res = await fetch('/super-admin/website/media', {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                body: formData,
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || `Upload failed with HTTP ${res.status}`);
            }

            const result = await res.json();
            if (result.url) {
                updateNestedField(targetUploadKey, result.url);
            }
        } catch (err: any) {
            alert('Upload error: ' + (err.message || 'Failed to upload media.'));
        } finally {
            setUploadingField(null);
            setTargetUploadKey('');
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
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

    // Formatting Toolbar Helpers
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
        if (editingPage) {
            pageForm.put(`/super-admin/website/pages/${editingPage.id}`, {
                preserveScroll: true,
                onSuccess: () => setEditingPage(null),
            });
        } else {
            pageForm.post('/super-admin/website/pages', {
                preserveScroll: true,
                onSuccess: () => pageForm.reset(),
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

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelected}
                accept="image/*,video/mp4,video/webm"
                className="hidden"
            />

            <div className="space-y-6 max-w-7xl mx-auto pb-16">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Layers className="w-6 h-6 text-emerald-600" />
                            <span>Visual Website CMS Studio</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            Visually format text, organize sections, and update media without raw code.
                        </p>
                    </div>
                    <Button onClick={startCreatePage} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 shadow-xs">
                        <Plus className="h-4 w-4" />
                        <span>New Page</span>
                    </Button>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                            selectedCategory === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        All Pages ({rawPages.length})
                    </button>
                    <button
                        onClick={() => setSelectedCategory('landing')}
                        className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                            selectedCategory === 'landing' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                        <span>Landing & Commercial</span>
                    </button>
                    <button
                        onClick={() => setSelectedCategory('legal')}
                        className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                            selectedCategory === 'legal' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <Shield className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Legal & Governance</span>
                    </button>
                    <button
                        onClick={() => setSelectedCategory('info')}
                        className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 ${
                            selectedCategory === 'info' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <FileText className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Institutional Info</span>
                    </button>
                </div>

                {/* 2-Column Split Studio */}
                <div className="grid gap-6 lg:grid-cols-12 items-start">

                    {/* Column 1: Page List */}
                    <div className="lg:col-span-5 space-y-4">
                        <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                            <CardHeader className="pb-3 border-b border-slate-100">
                                <CardTitle className="text-sm font-bold flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-emerald-600" />
                                    <span>Select Page to Manage</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 divide-y divide-slate-100">
                                {filteredPages.map((page) => {
                                    const isSelected = activeSectionPage?.id === page.id;
                                    return (
                                        <div
                                            key={page.id}
                                            onClick={() => { setSelectedPageId(page.id); setEditingPage(null); }}
                                            className={`p-4 transition-all cursor-pointer flex items-start justify-between gap-3 ${
                                                isSelected ? 'bg-emerald-50/80 border-l-4 border-emerald-600' : 'hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="space-y-1 flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-bold text-sm text-slate-900 truncate">{page.title}</span>
                                                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono">
                                                        {page.path}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-slate-500 pt-0.5">
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
                                            </div>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Column 2: Sections on Active Page */}
                    <div className="lg:col-span-7 space-y-4">
                        {activeSectionPage && (
                            <Card className="rounded-2xl border-slate-200/80 shadow-xs">
                                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                                            <Sparkles className="w-4 h-4 text-emerald-600" />
                                            <span>Sections: {activeSectionPage.title}</span>
                                        </CardTitle>
                                        <p className="text-[11px] font-mono text-slate-500 mt-0.5">{activeSectionPage.path}</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => startNewSection(activeSectionPage)}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-8 gap-1 shadow-xs"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Add Block</span>
                                    </Button>
                                </CardHeader>
                                <CardContent className="p-5 space-y-3">
                                    {activeSectionPage.sections && activeSectionPage.sections.length > 0 ? (
                                        activeSectionPage.sections.map((sec, idx) => {
                                            const c = sec.content || {};
                                            const isMedia = sec.identifier === 'team' || sec.identifier === 'roadmap';
                                            return (
                                                <div
                                                    key={sec.id}
                                                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                                >
                                                    <div className="space-y-1 flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="font-bold text-sm text-slate-900 capitalize">
                                                                {sec.identifier || `Block #${idx + 1}`}
                                                            </span>
                                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono font-semibold">
                                                                {sec.block_type}
                                                            </span>
                                                            {isMedia && (
                                                                <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-semibold flex items-center gap-1">
                                                                    <ImageIcon className="w-2.5 h-2.5" /> Media
                                                                </span>
                                                            )}
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                                sec.is_enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                                                            }`}>
                                                                {sec.is_enabled ? 'Active' : 'Draft'}
                                                            </span>
                                                        </div>

                                                        <p className="text-xs text-slate-700 font-semibold line-clamp-1">
                                                            {c.title || c.badge || 'Clause Title'}
                                                        </p>

                                                        <p className="text-[11px] text-slate-500 line-clamp-1">
                                                            {c.body ? c.body.replace(/[#*\-]/g, '').slice(0, 120) + '...' : c.subtitle || 'No body text'}
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => openSectionModal(sec)}
                                                            className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-8 px-3 font-semibold gap-1 rounded-xl"
                                                        >
                                                            <Edit3 className="w-3.5 h-3.5" />
                                                            <span>Edit Content</span>
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
                                            <p className="text-xs">No section blocks registered for this page.</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                </div>

            </div>

            {/* MODAL: COMPLETE VISUAL SECTION & CLAUSES EDITOR */}
            {editingSection && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setEditingSection(null)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 shadow-2xl p-6 sm:p-8 space-y-6 text-slate-900 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-lg font-bold text-slate-950 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-emerald-600" />
                                    <span>Edit Section: {blockMeta.identifier || 'Clause'}</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Page: <strong className="text-slate-800">{activeSectionPage?.title}</strong> · Type: <code className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{blockMeta.block_type}</code>
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setJsonMode(!jsonMode)}
                                    className="h-8 text-xs font-mono"
                                >
                                    {jsonMode ? 'Visual Form' : 'JSON Mode'}
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

                        {/* Form */}
                        <form onSubmit={saveSectionBlock} className="space-y-6 text-xs">

                            {/* Section Controls */}
                            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
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
                                <div className="flex items-center gap-2 pt-5">
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
                                <div className="space-y-5">

                                    {/* 1. Header, Title & Tag */}
                                    <div className="grid sm:grid-cols-12 gap-4">
                                        <div className="sm:col-span-4 space-y-1.5">
                                            <Label className="text-xs font-semibold">Section Tag / Badge</Label>
                                            <Input
                                                value={blockContent.badge || blockContent.vision_badge || ''}
                                                onChange={(e) => updateNestedField('badge', e.target.value)}
                                                placeholder="e.g. Statutory Governance, Core Security"
                                                className="h-9 text-xs"
                                            />
                                        </div>
                                        <div className="sm:col-span-8 space-y-1.5">
                                            <Label className="text-xs font-semibold">Main Heading / Clause Title *</Label>
                                            <Input
                                                value={blockContent.title || blockContent.vision_title || ''}
                                                onChange={(e) => updateNestedField('title', e.target.value)}
                                                placeholder="e.g. 1. Data Controller vs. Data Processor Mandate"
                                                className="h-9 text-xs font-bold"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* 2. Subtitle / One-line Summary */}
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">Subtitle / Descriptive Summary</Label>
                                        <Input
                                            value={blockContent.subtitle || blockContent.vision_desc || ''}
                                            onChange={(e) => updateNestedField('subtitle', e.target.value)}
                                            placeholder="A short 1-line legal or operational summary under the heading..."
                                            className="h-9 text-xs"
                                        />
                                    </div>

                                    {/* 3. MAIN BODY & CLAUSES EDITOR (WITH FORMATTING TOOLBAR) */}
                                    <div className="space-y-2 p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-emerald-100">
                                            <div className="flex items-center gap-1.5">
                                                <AlignLeft className="w-4 h-4 text-emerald-700" />
                                                <Label className="text-xs font-bold text-emerald-950">Detailed Clauses, Paragraphs & Bullet Points *</Label>
                                            </div>

                                            {/* Formatting Buttons */}
                                            <div className="flex items-center gap-1 bg-white border border-emerald-200 p-1 rounded-xl shadow-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => applyFormat('sec-body-textarea', 'body', 'bold')}
                                                    className="px-2 py-1 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg flex items-center gap-1 font-bold text-[11px]"
                                                    title="Bold Text (**text**)"
                                                >
                                                    <Bold className="w-3.5 h-3.5" />
                                                    <span>Bold</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => applyFormat('sec-body-textarea', 'body', 'heading')}
                                                    className="px-2 py-1 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg flex items-center gap-1 font-bold text-[11px]"
                                                    title="Add Subheading (### Title)"
                                                >
                                                    <Heading2 className="w-3.5 h-3.5" />
                                                    <span>Subheading</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => applyFormat('sec-body-textarea', 'body', 'bullet')}
                                                    className="px-2 py-1 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg flex items-center gap-1 font-bold text-[11px]"
                                                    title="Add Bullet Point (- Point)"
                                                >
                                                    <List className="w-3.5 h-3.5" />
                                                    <span>Bullet Point</span>
                                                </button>
                                            </div>
                                        </div>

                                        <textarea
                                            id="sec-body-textarea"
                                            rows={10}
                                            value={blockContent.body || ''}
                                            onChange={(e) => updateNestedField('body', e.target.value)}
                                            placeholder="Type your deep clauses, legal provisions, and bullet points here. Use the buttons above for bolding (**text**), subheadings (### Title), and bullet lists (- Bullet point)..."
                                            className="w-full p-3.5 rounded-xl border border-slate-200 text-xs font-mono bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                                        />
                                        <p className="text-[11px] text-slate-500">
                                            Tip: Lines starting with <code className="font-mono text-emerald-700">- **Title**: description</code> automatically render as verified green checklist points on the website!
                                        </p>
                                    </div>

                                    {/* 4. Team Members Manager (Only if Team block) */}
                                    {Array.isArray(blockContent.members) && (
                                        <div className="space-y-3 pt-2 border-t border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                                    Team Members ({blockContent.members.length})
                                                </h4>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => {
                                                        const members = [...blockContent.members];
                                                        members.push({
                                                            id: `member-${Date.now()}`,
                                                            name: 'Team Member Name',
                                                            role: 'Architect / Engineer',
                                                            department: 'Engineering',
                                                            shortBio: 'Bio description...',
                                                            avatarUrl: '',
                                                            email: 'team@eduflow.co.ke',
                                                            specialties: ['Engineering'],
                                                        });
                                                        updateNestedField('members', members);
                                                    }}
                                                    className="h-7 text-xs px-2 gap-1"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    <span>Add Member</span>
                                                </Button>
                                            </div>

                                            <div className="space-y-3">
                                                {blockContent.members.map((m: any, mIdx: number) => (
                                                    <div key={mIdx} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="grid sm:grid-cols-2 gap-2 flex-1">
                                                                <Input
                                                                    value={m.name || ''}
                                                                    onChange={(e) => {
                                                                        const members = [...blockContent.members];
                                                                        members[mIdx].name = e.target.value;
                                                                        updateNestedField('members', members);
                                                                    }}
                                                                    placeholder="Full Name"
                                                                    className="h-8 text-xs font-bold bg-white"
                                                                />
                                                                <Input
                                                                    value={m.role || ''}
                                                                    onChange={(e) => {
                                                                        const members = [...blockContent.members];
                                                                        members[mIdx].role = e.target.value;
                                                                        updateNestedField('members', members);
                                                                    }}
                                                                    placeholder="Job Title / Role"
                                                                    className="h-8 text-xs bg-white"
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const members = blockContent.members.filter((_: any, idx: number) => idx !== mIdx);
                                                                    updateNestedField('members', members);
                                                                }}
                                                                className="text-slate-400 hover:text-rose-600 p-1"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        <div className="flex items-center gap-3">
                                                            <div className="w-12 h-12 rounded-xl bg-slate-900 overflow-hidden border border-slate-300 shrink-0 flex items-center justify-center text-white relative">
                                                                {m.avatarUrl ? (
                                                                    <img src={m.avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <User className="w-5 h-5 text-emerald-400" />
                                                                )}
                                                            </div>
                                                            <Input
                                                                value={m.avatarUrl || ''}
                                                                onChange={(e) => {
                                                                    const members = [...blockContent.members];
                                                                    members[mIdx].avatarUrl = e.target.value;
                                                                    updateNestedField('members', members);
                                                                }}
                                                                placeholder="Avatar photo path"
                                                                className="h-8 text-xs font-mono bg-white flex-1"
                                                            />
                                                            <Button
                                                                type="button"
                                                                size="sm"
                                                                variant="outline"
                                                                disabled={uploadingField === `members.${mIdx}.avatarUrl`}
                                                                onClick={() => triggerFieldUpload(`members.${mIdx}.avatarUrl`)}
                                                                className="h-8 text-xs px-2.5 shrink-0"
                                                            >
                                                                {uploadingField === `members.${mIdx}.avatarUrl` ? (
                                                                    <>
                                                                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                                                        Uploading...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <UploadCloud className="w-3.5 h-3.5 mr-1" />
                                                                        Upload Photo
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </div>

                                                        <textarea
                                                            rows={2}
                                                            value={m.shortBio || ''}
                                                            onChange={(e) => {
                                                                const members = [...blockContent.members];
                                                                members[mIdx].shortBio = e.target.value;
                                                                updateNestedField('members', members);
                                                            }}
                                                            placeholder="Short biography..."
                                                            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 5. Sub-Items / Card Grid Manager (If Roadmap or Card blocks) */}
                                    {Array.isArray(blockContent.items) && (
                                        <div className="space-y-3 pt-2 border-t border-slate-100">
                                            <div className="flex items-center justify-between">
                                                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                                                    Item Cards ({blockContent.items.length})
                                                </h4>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => {
                                                        const items = [...blockContent.items];
                                                        items.push({
                                                            title: 'New Item',
                                                            desc: 'Description copy...',
                                                            status: 'Released',
                                                            badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                                                        });
                                                        updateNestedField('items', items);
                                                    }}
                                                    className="h-7 text-xs px-2 gap-1"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                    <span>Add Item</span>
                                                </Button>
                                            </div>

                                            <div className="space-y-3">
                                                {blockContent.items.map((item: any, iIdx: number) => (
                                                    <div key={iIdx} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2.5">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <Input
                                                                value={item.title || item.role || ''}
                                                                onChange={(e) => {
                                                                    const items = [...blockContent.items];
                                                                    items[iIdx].title = e.target.value;
                                                                    updateNestedField('items', items);
                                                                }}
                                                                placeholder="Item Title"
                                                                className="h-8 text-xs font-bold bg-white"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const items = blockContent.items.filter((_: any, idx: number) => idx !== iIdx);
                                                                    updateNestedField('items', items);
                                                                }}
                                                                className="text-slate-400 hover:text-rose-600 p-1"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>

                                                        <textarea
                                                            rows={2}
                                                            value={item.desc || item.summary || ''}
                                                            onChange={(e) => {
                                                                const items = [...blockContent.items];
                                                                items[iIdx].desc = e.target.value;
                                                                updateNestedField('items', items);
                                                            }}
                                                            placeholder="Card description..."
                                                            className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
                                                        />

                                                        {blockMeta.identifier === 'roadmap' && (
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    value={item.mediaUrl || ''}
                                                                    onChange={(e) => {
                                                                        const items = [...blockContent.items];
                                                                        items[iIdx].mediaUrl = e.target.value;
                                                                        updateNestedField('items', items);
                                                                    }}
                                                                    placeholder="Media / Video URL"
                                                                    className="h-7 text-[11px] font-mono bg-white flex-1"
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={uploadingField === `items.${iIdx}.mediaUrl`}
                                                                    onClick={() => triggerFieldUpload(`items.${iIdx}.mediaUrl`)}
                                                                    className="h-7 text-xs px-2 shrink-0"
                                                                >
                                                                    <UploadCloud className="w-3 h-3 mr-1" />
                                                                    Upload
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                </div>
                            ) : (
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold font-mono">Raw JSON Payload</Label>
                                    <textarea
                                        rows={14}
                                        value={JSON.stringify(blockContent, null, 2)}
                                        onChange={(e) => {
                                            try {
                                                setBlockContent(JSON.parse(e.target.value));
                                            } catch {}
                                        }}
                                        className="w-full p-3 rounded-2xl border border-slate-300 font-mono text-xs bg-slate-950 text-emerald-400 focus:outline-none"
                                    />
                                </div>
                            )}

                            {/* Modal Footer */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
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
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-9 text-xs gap-1.5 shadow-xs"
                                >
                                    <Save className="w-3.5 h-3.5" />
                                    <span>Save & Publish</span>
                                </Button>
                            </div>

                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: PAGE SEO */}
            {editingPage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
                    onClick={() => setEditingPage(null)}
                >
                    <div
                        className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 text-sm">Page Settings & SEO Metadata</h3>
                            <button onClick={() => setEditingPage(null)} className="p-1 text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={submitPage} className="space-y-4 text-xs">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Page Title *</Label>
                                <Input
                                    value={pageForm.data.title}
                                    onChange={(e) => pageForm.setData('title', e.target.value)}
                                    className="h-9 text-xs"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Path *</Label>
                                    <Input
                                        value={pageForm.data.path}
                                        onChange={(e) => pageForm.setData('path', e.target.value)}
                                        className="h-9 text-xs font-mono"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-semibold">Status *</Label>
                                    <select
                                        value={pageForm.data.status}
                                        onChange={(e) => pageForm.setData('status', e.target.value as any)}
                                        className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-white"
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
                                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setEditingPage(null)} className="h-8 text-xs">Cancel</Button>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-semibold">Save Page</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </AppLayout>
    );
}