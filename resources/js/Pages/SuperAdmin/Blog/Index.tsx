import AppLayout from '@/Layouts/AppLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { FormEvent, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Newspaper, Plus, Edit3, Trash2, ExternalLink, Search,
    Clock, User, CheckCircle2, Save, X, Eye, UploadCloud,
    Bold, Heading2, List, PlayCircle, Image as ImageIcon, Video as VideoIcon,
    Loader2, Link2, BookOpen
} from 'lucide-react';

interface BlogPostItem {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    body: string;
    category: string;
    featured_image?: string | null;
    gallery_images?: string[] | null;
    video_url?: string | null;
    media_type?: 'image' | 'video';
    author_name?: string | null;
    source_name?: string | null;
    source_url?: string | null;
    status: 'draft' | 'published' | 'archived';
    is_featured: boolean;
    read_time_minutes: number | null;
    created_at: string;
    published_at?: string | null;
}

interface Props {
    posts: {
        data: BlogPostItem[];
        total?: number;
    } | BlogPostItem[];
    categories?: string[];
    filters?: {
        search?: string;
    };
}

export default function BlogIndex({ posts, categories = [], filters = {} }: Props) {
    const rawPosts: BlogPostItem[] = Array.isArray(posts)
        ? posts
        : ((posts as any)?.data && Array.isArray((posts as any).data)
            ? (posts as any).data
            : []);

    const [search, setSearch] = useState(filters?.search || '');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [editing, setEditing] = useState<BlogPostItem | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadTarget, setUploadTarget] = useState<'featured' | 'gallery'>('featured');
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm({
        title: '',
        category: 'CBC Academics',
        excerpt: '',
        body: '',
        author_name: 'EduFlow Editorial Team',
        source_name: '',
        source_url: '',
        featured_image: '',
        gallery_images: [] as string[],
        video_url: '',
        media_type: 'image' as 'image' | 'video',
        status: 'published' as 'draft' | 'published' | 'archived',
        is_featured: false,
        read_time_minutes: 5,
    });

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get('/super-admin/blogs', { search }, { preserveState: true, replace: true });
    };

    const startCreate = () => {
        setEditing(null);
        setIsCreating(true);
        form.setData({
            title: '',
            category: categories[0] || 'CBC Academics',
            excerpt: '',
            body: '',
            author_name: 'EduFlow Editorial Team',
            source_name: '',
            source_url: '',
            featured_image: '',
            gallery_images: [],
            video_url: '',
            media_type: 'image',
            status: 'published',
            is_featured: false,
            read_time_minutes: 5,
        });
        form.clearErrors();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const startEdit = (post: BlogPostItem) => {
        setIsCreating(false);
        setEditing(post);
        form.setData({
            title: post.title,
            category: post.category,
            excerpt: post.excerpt || '',
            body: post.body,
            author_name: post.author_name || '',
            source_name: post.source_name || '',
            source_url: post.source_url || '',
            featured_image: post.featured_image || '',
            gallery_images: Array.isArray(post.gallery_images) ? post.gallery_images : [],
            video_url: post.video_url || '',
            media_type: post.media_type || 'image',
            status: post.status,
            is_featured: Boolean(post.is_featured),
            read_time_minutes: post.read_time_minutes || 5,
        });
        form.clearErrors();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelForm = () => {
        setEditing(null);
        setIsCreating(false);
        form.reset();
    };

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'blog');
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

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                const errorMessage = data.message || (data.errors ? Object.values(data.errors).flat().join(', ') : `HTTP error ${res.status}`);
                throw new Error(errorMessage);
            }
            
            if (data.url) {
                if (uploadTarget === 'featured') {
                    form.setData('featured_image', data.url);
                } else {
                    const currentGallery = [...form.data.gallery_images];
                    currentGallery.push(data.url);
                    form.setData('gallery_images', currentGallery);
                }
            } else {
                throw new Error('Server response did not include a file URL.');
            }
        } catch (err: any) {
            alert('Upload error: ' + (err.message || 'Image upload failed.'));
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    function removeGalleryImage(index: number) {
        const updated = form.data.gallery_images.filter((_, i) => i !== index);
        form.setData('gallery_images', updated);
    }

    function applyFormat(formatType: 'bold' | 'heading' | 'bullet') {
        const textarea = document.getElementById('blog-body-textarea') as HTMLTextAreaElement | null;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const currentText = form.data.body || '';
        const selected = currentText.substring(start, end) || 'Sample Text';

        let replacement = selected;
        if (formatType === 'bold') replacement = `**${selected}**`;
        if (formatType === 'heading') replacement = `\n### ${selected}\n`;
        if (formatType === 'bullet') replacement = `\n- **${selected}**: Description here.`;

        const updated = currentText.substring(0, start) + replacement + currentText.substring(end);
        form.setData('body', updated);
    }

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (editing) {
            form.put(`/super-admin/blogs/${editing.id}`, {
                preserveScroll: true,
                onSuccess: () => cancelForm(),
            });
        } else {
            form.post('/super-admin/blogs', {
                preserveScroll: true,
                onSuccess: () => cancelForm(),
            });
        }
    };

    const handleDelete = (post: BlogPostItem) => {
        if (window.confirm(`Are you sure you want to delete "${post.title}"?`)) {
            router.delete(`/super-admin/blogs/${post.id}`, {
                preserveScroll: true,
            });
        }
    };

    const filteredPosts = rawPosts.filter((p) => {
        if (selectedCategory === 'all') return true;
        return p.category.toLowerCase() === selectedCategory.toLowerCase();
    });

    const uniqueCategories = Array.from(
        new Set(['all', ...categories.filter(Boolean), ...rawPosts.map((p) => p.category).filter(Boolean)])
    );

    return (
        <AppLayout title="Articles & Blog">
            <Head title="Articles & Blog CMS Studio | EduFlow Admin" />

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
            />

            <div className="space-y-6 max-w-7xl mx-auto pb-16">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Newspaper className="h-6 w-6 text-emerald-600" />
                            <span>Articles & Blog CMS Studio</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Publish educational news, CBC tutorials, media-driven spotlights, and source-attributed articles.
                        </p>
                    </div>
                    {!isCreating && !editing && (
                        <Button onClick={startCreate} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 shadow-xs">
                            <Plus className="h-4 w-4" />
                            <span>New Article</span>
                        </Button>
                    )}
                </div>

                {/* Editorial Form Card */}
                {(isCreating || editing) && (
                    <Card className="rounded-3xl border-emerald-200/80 shadow-lg bg-white overflow-hidden">
                        <CardHeader className="pb-4 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                                <Edit3 className="w-4 h-4 text-emerald-600" />
                                <span>{editing ? `Edit Article: ${editing.title}` : 'Compose New Article'}</span>
                            </CardTitle>
                            <Button variant="ghost" size="sm" onClick={cancelForm} className="h-8 w-8 p-0 text-slate-400 hover:text-slate-700">
                                <X className="h-4 w-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6 sm:p-8">
                            <form onSubmit={submit} className="space-y-6 text-xs">

                                {/* Row 1: Title & Category */}
                                <div className="grid sm:grid-cols-12 gap-4">
                                    <div className="sm:col-span-8 space-y-1.5">
                                        <Label className="text-xs font-semibold">Article Title *</Label>
                                        <Input
                                            value={form.data.title}
                                            onChange={(e) => form.setData('title', e.target.value)}
                                            placeholder="e.g. Mastering CBC Rubric Grading: Junior School Guide"
                                            className="h-10 text-xs font-bold rounded-xl"
                                            required
                                        />
                                    </div>

                                    <div className="sm:col-span-4 space-y-1.5">
                                        <Label className="text-xs font-semibold">Category *</Label>
                                        <Input
                                            value={form.data.category}
                                            onChange={(e) => form.setData('category', e.target.value)}
                                            placeholder="e.g. CBC Academics, Finance, Governance"
                                            className="h-10 text-xs rounded-xl"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Row 2: Author, Status, Read Time */}
                                <div className="grid sm:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">Author Name</Label>
                                        <Input
                                            value={form.data.author_name}
                                            onChange={(e) => form.setData('author_name', e.target.value)}
                                            placeholder="e.g. Mark Ochieng Oduor"
                                            className="h-9 text-xs rounded-xl"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">Status *</Label>
                                        <select
                                            value={form.data.status}
                                            onChange={(e) => form.setData('status', e.target.value as any)}
                                            className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                        >
                                            <option value="published">Published</option>
                                            <option value="draft">Draft</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-semibold">Read Time (Minutes)</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={form.data.read_time_minutes}
                                            onChange={(e) => form.setData('read_time_minutes', parseInt(e.target.value, 10) || 5)}
                                            className="h-9 text-xs rounded-xl"
                                        />
                                    </div>
                                </div>

                                {/* Row 3: Media & Multi-Image Gallery Showcase */}
                                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                                            <ImageIcon className="w-4 h-4 text-emerald-600" />
                                            <span>Article Media & Multi-Image Gallery</span>
                                        </Label>
                                        <div className="flex items-center gap-3">
                                            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="media_type"
                                                    value="image"
                                                    checked={form.data.media_type === 'image'}
                                                    onChange={() => form.setData('media_type', 'image')}
                                                    className="text-emerald-600"
                                                />
                                                <span>Image-Led</span>
                                            </label>
                                            <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name="media_type"
                                                    value="video"
                                                    checked={form.data.media_type === 'video'}
                                                    onChange={() => form.setData('media_type', 'video')}
                                                    className="text-emerald-600"
                                                />
                                                <span>Video-Led</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Featured Image */}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-semibold text-slate-700">Primary Cover Image URL</span>
                                            <button
                                                type="button"
                                                disabled={isUploading}
                                                onClick={() => { setUploadTarget('featured'); fileInputRef.current?.click(); }}
                                                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                                            >
                                                {isUploading && uploadTarget === 'featured' ? <Loader2 className="w-3 h-3 animate-spin" /> : <UploadCloud className="w-3 h-3" />}
                                                <span>Upload Cover Photo</span>
                                            </button>
                                        </div>
                                        <Input
                                            value={form.data.featured_image}
                                            onChange={(e) => form.setData('featured_image', e.target.value)}
                                            placeholder="https://... or /storage/media/blog/..."
                                            className="h-8 text-xs font-mono bg-white rounded-xl"
                                        />
                                    </div>

                                    {/* Multi-Image Gallery Upload */}
                                    <div className="space-y-2 pt-2 border-t border-slate-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] font-bold text-slate-800">
                                                Additional Gallery Images ({form.data.gallery_images.length})
                                            </span>
                                            <button
                                                type="button"
                                                disabled={isUploading}
                                                onClick={() => { setUploadTarget('gallery'); fileInputRef.current?.click(); }}
                                                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                                            >
                                                {isUploading && uploadTarget === 'gallery' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                                <span>Upload Gallery Image</span>
                                            </button>
                                        </div>

                                        {form.data.gallery_images.length > 0 ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                                                {form.data.gallery_images.map((imgUrl, gIdx) => (
                                                    <div key={gIdx} className="relative rounded-xl overflow-hidden border border-slate-200 bg-white group aspect-video">
                                                        <img src={imgUrl} alt={`Gallery ${gIdx + 1}`} className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => removeGalleryImage(gIdx)}
                                                            className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-colors"
                                                            title="Remove Image"
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-[11px] text-slate-400 italic">No additional gallery images uploaded yet.</p>
                                        )}
                                    </div>

                                    {/* Video URL */}
                                    <div className="space-y-1.5 pt-2 border-t border-slate-200">
                                        <span className="text-[11px] font-semibold text-slate-700">Video Embed URL (YouTube / MP4)</span>
                                        <Input
                                            value={form.data.video_url}
                                            onChange={(e) => form.setData('video_url', e.target.value)}
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            className="h-8 text-xs font-mono bg-white rounded-xl"
                                        />
                                    </div>
                                </div>

                                {/* Row 4: External Source Attribution */}
                                <div className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-100 space-y-3">
                                    <Label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                                        <Link2 className="w-4 h-4 text-emerald-600" />
                                        <span>Source Attribution & Acknowledgment</span>
                                    </Label>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <span className="text-[11px] font-semibold text-slate-700">Original Publisher / Source Name</span>
                                            <Input
                                                value={form.data.source_name}
                                                onChange={(e) => form.setData('source_name', e.target.value)}
                                                placeholder="e.g. Kenya Institute of Curriculum Development (KICD)"
                                                className="h-8 text-xs bg-white rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[11px] font-semibold text-slate-700">Original Source URL</span>
                                            <Input
                                                value={form.data.source_url}
                                                onChange={(e) => form.setData('source_url', e.target.value)}
                                                placeholder="https://kicd.ac.ke/guidelines/..."
                                                className="h-8 text-xs font-mono bg-white rounded-xl"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Feature Banner Checkbox */}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_featured"
                                        checked={form.data.is_featured}
                                        onChange={(e) => form.setData('is_featured', e.target.checked)}
                                        className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <Label htmlFor="is_featured" className="text-xs font-medium cursor-pointer text-slate-700">
                                        Spotlight this article on the top banner of the public blog
                                    </Label>
                                </div>

                                {/* Excerpt */}
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-semibold">Short Excerpt / Teaser Summary</Label>
                                    <textarea
                                        rows={2}
                                        value={form.data.excerpt}
                                        onChange={(e) => form.setData('excerpt', e.target.value)}
                                        placeholder="A brief 1-2 sentence overview for cards and social previews..."
                                        className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                    />
                                </div>

                                {/* Article Body with Formatting Toolbar */}
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-semibold">Article Content (Markdown supported) *</Label>
                                        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                                            <button
                                                type="button"
                                                onClick={() => applyFormat('bold')}
                                                className="p-1.5 text-slate-600 hover:bg-white rounded"
                                                title="Bold Selection (**text**)"
                                            >
                                                <Bold className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applyFormat('heading')}
                                                className="p-1.5 text-slate-600 hover:bg-white rounded"
                                                title="Add Subheading (### Title)"
                                            >
                                                <Heading2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applyFormat('bullet')}
                                                className="p-1.5 text-slate-600 hover:bg-white rounded"
                                                title="Add Bullet Point (- Point)"
                                            >
                                                <List className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    <textarea
                                        id="blog-body-textarea"
                                        rows={12}
                                        value={form.data.body}
                                        onChange={(e) => form.setData('body', e.target.value)}
                                        placeholder="Write article paragraphs, headings (### Heading), and bullet points (- Point)..."
                                        className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                                        required
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                    <Button type="button" variant="outline" onClick={cancelForm} className="h-9 text-xs">
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={form.processing}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1.5 h-9 text-xs shadow-xs"
                                    >
                                        <Save className="h-3.5 w-3.5" />
                                        <span>{editing ? 'Save Changes' : 'Publish Article'}</span>
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Filter Pills & Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                        {uniqueCategories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all capitalize whitespace-nowrap ${
                                    selectedCategory === cat
                                        ? 'bg-slate-900 text-white shadow-xs'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {cat === 'all' ? `All Articles (${rawPosts.length})` : cat}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search articles or authors..."
                                className="h-9 pl-8 text-xs rounded-xl"
                            />
                        </div>
                        <Button type="submit" variant="secondary" className="h-9 text-xs font-semibold px-3">
                            Filter
                        </Button>
                    </form>
                </div>

                {/* Articles List Card */}
                <Card className="rounded-3xl border-slate-200/80 shadow-xs">
                    <CardHeader className="pb-3 border-b border-slate-100">
                        <CardTitle className="text-sm font-bold flex items-center justify-between">
                            <span>Published Articles & Editorial Drafts</span>
                            <span className="text-xs font-normal text-slate-500">Showing {filteredPosts.length} posts</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {filteredPosts.length === 0 ? (
                            <div className="p-12 text-center space-y-3">
                                <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                                <p className="text-sm font-semibold text-slate-700">No articles found</p>
                                <p className="text-xs text-slate-400">Click &quot;New Article&quot; above to publish your first post.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {filteredPosts.map((post) => (
                                    <div
                                        key={post.id}
                                        className="p-4 sm:p-5 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70"
                                    >
                                        <div className="space-y-1.5 flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-bold text-sm text-slate-900 hover:text-emerald-700 transition-colors">
                                                    {post.title}
                                                </span>
                                                {post.is_featured && (
                                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                                                        Featured
                                                    </span>
                                                )}
                                                {post.video_url && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                                                        <PlayCircle className="w-3 h-3 text-blue-600" />
                                                        Video
                                                    </span>
                                                )}
                                                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                                    {post.category}
                                                </span>
                                                <span
                                                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                                        post.status === 'published'
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}
                                                >
                                                    {post.status}
                                                </span>
                                            </div>

                                            <p className="text-xs text-slate-500 line-clamp-1 max-w-3xl">
                                                {post.excerpt || post.body.slice(0, 140) + '...'}
                                            </p>

                                            <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-0.5 flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <User className="w-3 h-3" />
                                                    {post.author_name || 'EduFlow Editorial'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {post.read_time_minutes || 5} min read
                                                </span>
                                                {post.source_name && (
                                                    <span className="text-emerald-700 font-medium">
                                                        Source: {post.source_name}
                                                    </span>
                                                )}
                                                <span>Slug: /{post.slug}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                            {post.status === 'published' && (
                                                <a
                                                    href={`/blog/${post.slug}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
                                                    title="View Live Article"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </a>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => startEdit(post)}
                                                className="h-8 text-xs font-semibold gap-1 rounded-xl"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                                <span>Edit</span>
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDelete(post)}
                                                className="h-8 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}