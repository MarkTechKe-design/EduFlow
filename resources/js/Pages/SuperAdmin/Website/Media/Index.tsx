import AppLayout from '@/Layouts/AppLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEvent, useState, useMemo } from 'react';
import {
    Image as ImageIcon,
    UploadCloud,
    Trash2,
    Edit3,
    Copy,
    Check,
    Search,
    Filter,
    Folder,
    Maximize2,
    X,
    FileText,
    Video as VideoIcon,
    Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MediaItem {
    id: number;
    public_id?: string;
    file_name: string;
    mime_type: string;
    size: number;
    folder?: string | null;
    title?: string | null;
    alt_text?: string | null;
    url: string;
    created_at?: string;
}

interface Props {
    media: { data: MediaItem[]; links: unknown[]; total?: number };
    folders?: string[];
    filters?: { folder?: string; search?: string };
}

export default function MediaIndex({ media, folders = [], filters = {} }: Props) {
    const [selectedFolder, setSelectedFolder] = useState(filters.folder || 'all');
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);
    const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
    const [copiedId, setCopiedId] = useState<number | null>(null);

    // Upload Form
    const uploadForm = useForm<{ file: File | null; folder: string; title: string; alt_text: string }>({
        file: null,
        folder: 'general',
        title: '',
        alt_text: '',
    });

    // Edit Form
    const editForm = useForm({
        title: '',
        alt_text: '',
        folder: 'general',
    });

    function handleUpload(e: FormEvent) {
        e.preventDefault();
        uploadForm.post('/super-admin/website/media', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                uploadForm.reset();
            },
        });
    }

    function startEdit(item: MediaItem) {
        setEditingItem(item);
        editForm.setData({
            title: item.title || item.file_name,
            alt_text: item.alt_text || '',
            folder: item.folder || 'general',
        });
    }

    function handleSaveEdit(e: FormEvent) {
        e.preventDefault();
        if (!editingItem) return;
        editForm.put(`/super-admin/website/media/${editingItem.id}`, {
            preserveScroll: true,
            onSuccess: () => setEditingItem(null),
        });
    }

    function handleDelete(item: MediaItem) {
        if (window.confirm(`Permanently remove "${item.title || item.file_name}" from server disk?`)) {
            router.delete(`/super-admin/website/media/${item.id}`, { preserveScroll: true });
        }
    }

    function copyToClipboard(item: MediaItem) {
        navigator.clipboard.writeText(item.url);
        setCopiedId(item.id);
        setTimeout(() => setCopiedId(null), 2000);
    }

    function applyFilter(folder: string) {
        setSelectedFolder(folder);
        router.get('/super-admin/website/media', {
            folder: folder === 'all' ? undefined : folder,
            search: searchQuery || undefined,
        }, { preserveState: true, replace: true });
    }

    function handleSearch(e: FormEvent) {
        e.preventDefault();
        router.get('/super-admin/website/media', {
            folder: selectedFolder === 'all' ? undefined : selectedFolder,
            search: searchQuery || undefined,
        }, { preserveState: true, replace: true });
    }

    const availableFolders = useMemo(() => {
        const set = new Set(['general', 'branding', 'about', 'blog', ...folders]);
        return Array.from(set);
    }, [folders]);

    return (
        <AppLayout title="Website Media Library">
            <Head title="Website Media Studio | EduFlow SuperAdmin" />

            <div className="space-y-6 max-w-7xl mx-auto pb-16">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                            <ImageIcon className="w-6 h-6 text-emerald-600" />
                            <span>Visual Media Library</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                            Manage, inspect, and copy asset URLs for website pages, blog articles, and branding.
                        </p>
                    </div>
                </div>

                {/* Upload Card */}
                <Card className="rounded-2xl border-slate-200 shadow-xs overflow-hidden">
                    <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-3.5">
                        <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                            <UploadCloud className="w-4 h-4 text-emerald-600" />
                            <span>Upload New Asset</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                        <form onSubmit={handleUpload} className="grid gap-4 sm:grid-cols-12 items-end">
                            <div className="sm:col-span-4 space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">Choose File *</Label>
                                <input
                                    type="file"
                                    required
                                    accept="image/*,video/mp4,video/webm,application/pdf"
                                    onChange={(e) => uploadForm.setData('file', e.target.files?.[0] || null)}
                                    className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                                />
                            </div>

                            <div className="sm:col-span-2 space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">Target Folder</Label>
                                <select
                                    value={uploadForm.data.folder}
                                    onChange={(e) => uploadForm.setData('folder', e.target.value)}
                                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
                                >
                                    {availableFolders.map((f) => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="sm:col-span-3 space-y-1.5">
                                <Label className="text-xs font-semibold text-slate-700">Title</Label>
                                <Input
                                    value={uploadForm.data.title}
                                    onChange={(e) => uploadForm.setData('title', e.target.value)}
                                    placeholder="e.g. Lead Architect Photo"
                                    className="h-9 text-xs"
                                />
                            </div>

                            <div className="sm:col-span-3 flex gap-2">
                                <Button
                                    type="submit"
                                    disabled={uploadForm.processing || !uploadForm.data.file}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 gap-1.5 shadow-xs"
                                >
                                    {uploadForm.processing ? (
                                        <>
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            <span>Uploading...</span>
                                        </>
                                    ) : (
                                        <>
                                            <UploadCloud className="w-3.5 h-3.5" />
                                            <span>Upload Asset</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Search & Folder Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                        <button
                            type="button"
                            onClick={() => applyFilter('all')}
                            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                                selectedFolder === 'all'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            All Assets ({media.total ?? media.data.length})
                        </button>
                        {availableFolders.map((f) => (
                            <button
                                key={f}
                                type="button"
                                onClick={() => applyFilter(f)}
                                className={`px-3 py-1.5 rounded-xl font-semibold capitalize transition-all flex items-center gap-1 ${
                                    selectedFolder === f
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                <Folder className="w-3 h-3 opacity-60" />
                                <span>{f}</span>
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-xs w-full">
                        <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search media..."
                                className="h-8 pl-8 text-xs rounded-xl"
                            />
                        </div>
                        <Button type="submit" size="sm" variant="outline" className="h-8 text-xs">
                            Search
                        </Button>
                    </form>
                </div>

                {/* Media Grid */}
                {media.data.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {media.data.map((item) => {
                            const isImage = item.mime_type?.startsWith('image/');
                            const isVideo = item.mime_type?.startsWith('video/');

                            return (
                                <div
                                    key={item.id}
                                    className="group relative bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all flex flex-col overflow-hidden"
                                >
                                    {/* Thumbnail Box */}
                                    <div
                                        className="aspect-square bg-slate-950 relative overflow-hidden flex items-center justify-center cursor-pointer"
                                        onClick={() => setLightboxItem(item)}
                                    >
                                        {isImage ? (
                                            <img
                                                src={item.url}
                                                alt={item.alt_text || item.title || item.file_name}
                                                onError={(e) => {
                                                    (e.target as HTMLElement).style.display = 'none';
                                                }}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : isVideo ? (
                                            <VideoIcon className="w-10 h-10 text-emerald-400" />
                                        ) : (
                                            <FileText className="w-10 h-10 text-slate-400" />
                                        )}

                                        {/* Hover Overlay Actions */}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); setLightboxItem(item); }}
                                                className="p-1.5 rounded-lg bg-white/90 text-slate-900 hover:bg-white shadow-xs"
                                                title="View Full Size"
                                            >
                                                <Maximize2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); copyToClipboard(item); }}
                                                className="p-1.5 rounded-lg bg-white/90 text-slate-900 hover:bg-white shadow-xs"
                                                title="Copy Public URL"
                                            >
                                                {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={(e) => { e.stopPropagation(); startEdit(item); }}
                                                className="p-1.5 rounded-lg bg-white/90 text-slate-900 hover:bg-white shadow-xs"
                                                title="Edit Metadata"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Asset Information */}
                                    <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <p className="font-bold text-xs text-slate-900 truncate" title={item.title || item.file_name}>
                                                {item.title || item.file_name}
                                            </p>
                                            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                                                <span className="capitalize font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                                                    {item.folder || 'general'}
                                                </span>
                                                <span>{Math.ceil(item.size / 1024)} KB</span>
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(item)}
                                                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
                                            >
                                                {copiedId === item.id ? (
                                                    <span className="text-emerald-700 flex items-center gap-1">
                                                        <Check className="w-3 h-3" /> Copied!
                                                    </span>
                                                ) : (
                                                    <span>Copy URL</span>
                                                )}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(item)}
                                                className="text-slate-400 hover:text-rose-600 p-1"
                                                title="Delete Asset"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-3">
                        <ImageIcon className="w-10 h-10 mx-auto text-slate-300" />
                        <p className="text-sm font-semibold text-slate-700">No media assets found</p>
                        <p className="text-xs text-slate-500">Upload images using the form above or clear your search filters.</p>
                    </div>
                )}

            </div>

            {/* LIGHTBOX MODAL */}
            {lightboxItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
                    onClick={() => setLightboxItem(null)}
                >
                    <div
                        className="max-w-4xl w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 p-4 space-y-4 shadow-2xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between text-white border-b border-slate-800 pb-3 px-2">
                            <span className="font-bold text-sm truncate">{lightboxItem.title || lightboxItem.file_name}</span>
                            <button
                                type="button"
                                onClick={() => setLightboxItem(null)}
                                className="p-1 text-slate-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="rounded-2xl overflow-hidden bg-slate-950 flex items-center justify-center min-h-[350px]">
                            {lightboxItem.mime_type?.startsWith('image/') ? (
                                <img
                                    src={lightboxItem.url}
                                    alt={lightboxItem.title || ''}
                                    className="w-full h-auto max-h-[70vh] object-contain"
                                />
                            ) : (
                                <p className="text-sm text-slate-400">Non-image asset</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-400 px-2">
                            <span className="font-mono">{lightboxItem.url}</span>
                            <Button
                                size="sm"
                                onClick={() => copyToClipboard(lightboxItem)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 gap-1.5"
                            >
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy URL</span>
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT METADATA MODAL */}
            {editingItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in"
                    onClick={() => setEditingItem(null)}
                >
                    <div
                        className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-6 space-y-5 shadow-2xl text-slate-900 relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="font-bold text-sm">Edit Asset Details</h3>
                            <button onClick={() => setEditingItem(null)} className="p-1 text-slate-400 hover:text-slate-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Title *</Label>
                                <Input
                                    value={editForm.data.title}
                                    onChange={(e) => editForm.setData('title', e.target.value)}
                                    className="h-9 text-xs"
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Folder</Label>
                                <select
                                    value={editForm.data.folder}
                                    onChange={(e) => editForm.setData('folder', e.target.value)}
                                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-white"
                                >
                                    {availableFolders.map((f) => (
                                        <option key={f} value={f}>{f}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <Label className="text-xs font-semibold">Alt Text (Accessibility & SEO)</Label>
                                <Input
                                    value={editForm.data.alt_text}
                                    onChange={(e) => editForm.setData('alt_text', e.target.value)}
                                    placeholder="Descriptive image summary"
                                    className="h-9 text-xs"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setEditingItem(null)} className="h-8 text-xs">
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-semibold">
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}