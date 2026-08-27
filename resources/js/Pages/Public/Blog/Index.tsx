import { Head, Link } from '@inertiajs/react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import { useState, useMemo } from 'react';
import {
    Clock, User, BookOpen, Search, PlayCircle,
    ArrowRight, Filter, Layers
} from 'lucide-react';
import { Input } from '@/components/ui/input';

interface BlogPostItem {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    body: string;
    category: string | { title?: string; category?: string; name?: string };
    featured_image?: string | null;
    gallery_images?: string[] | null;
    video_url?: string | null;
    media_type?: 'image' | 'video';
    author_name?: string | null;
    source_name?: string | null;
    source_url?: string | null;
    status: 'draft' | 'published';
    is_featured: boolean;
    read_time_minutes: number | null;
    published_at?: string | null;
}

interface Props {
    posts: {
        data: BlogPostItem[];
        total?: number;
    } | BlogPostItem[];
    featuredPost?: BlogPostItem | null;
    featuredPosts?: BlogPostItem[];
    categories?: (string | { title?: string; category?: string; name?: string })[];
    navigation?: any[];
    footerNavigation?: any[];
    branding?: any;
}

function getCategoryName(cat: any): string {
    if (!cat) return 'General';
    if (typeof cat === 'string') return cat;
    if (typeof cat === 'object') {
        return cat.category || cat.title || cat.name || 'General';
    }
    return String(cat);
}

export default function BlogIndex({ posts, featuredPost, featuredPosts = [], categories = [], navigation, footerNavigation, branding }: Props) {
    const rawPosts: BlogPostItem[] = useMemo(() => {
        return Array.isArray(posts)
            ? posts
            : ((posts as any)?.data && Array.isArray((posts as any).data)
                ? (posts as any).data
                : []);
    }, [posts]);

    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    const availableCategories = useMemo(() => {
        const set = new Set<string>();
        rawPosts.forEach((p) => {
            const name = getCategoryName(p.category);
            if (name) set.add(name);
        });
        (categories || []).forEach((c) => {
            const name = getCategoryName(c);
            if (name) set.add(name);
        });
        return ['all', ...Array.from(set)];
    }, [rawPosts, categories]);

    const filteredPosts = useMemo(() => {
        return rawPosts.filter((post) => {
            const catName = getCategoryName(post.category);
            const matchesCategory = selectedCategory === 'all' || catName.toLowerCase() === selectedCategory.toLowerCase();
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch = !query ||
                post.title.toLowerCase().includes(query) ||
                (post.excerpt && post.excerpt.toLowerCase().includes(query)) ||
                (post.author_name && post.author_name.toLowerCase().includes(query)) ||
                catName.toLowerCase().includes(query);
            return matchesCategory && matchesSearch;
        });
    }, [rawPosts, selectedCategory, searchQuery]);

    const heroPost = useMemo(() => {
        return featuredPost || featuredPosts[0] || rawPosts.find((p) => p.is_featured) || rawPosts[0] || null;
    }, [featuredPost, featuredPosts, rawPosts]);

    const gridPosts = useMemo(() => {
        if (!heroPost) return filteredPosts;
        return filteredPosts.filter((p) => p.id !== heroPost.id);
    }, [filteredPosts, heroPost]);

    return (
        <MarketingLayout
            title="Insights & Articles"
            navigation={navigation}
            footerNavigation={footerNavigation}
            branding={branding}
            currentPath="/blog"
        >
            <Head title="Insights & Articles | EduFlow Kenya" />

            <div className="py-12 sm:py-20 bg-slate-50 min-h-screen">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">

                    {/* Header */}
                    <div className="text-center max-w-3xl mx-auto space-y-4">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider shadow-xs">
                            <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                            <span>EduFlow Knowledge Hub</span>
                        </div>

                        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
                            Insights, Guides & Operational Analysis
                        </h1>

                        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                            Practical guidance on CBC assessments, school administration, data protection, and education technology in Kenya.
                        </p>
                    </div>

                    {/* Filter Pills & Search */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                            {availableCategories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-2 rounded-2xl font-bold transition-all capitalize whitespace-nowrap shadow-xs ${
                                        selectedCategory === cat
                                            ? 'bg-slate-900 text-white shadow-md'
                                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                >
                                    {cat === 'all' ? `All Articles (${rawPosts.length})` : cat}
                                </button>
                            ))}
                        </div>

                        <div className="relative sm:w-72">
                            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search articles or topics..."
                                className="h-10 pl-9 text-xs rounded-2xl bg-white border-slate-200"
                            />
                        </div>
                    </div>

                    {/* Featured Hero Banner */}
                    {heroPost && selectedCategory === 'all' && !searchQuery && (
                        <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all">
                            <div className="grid lg:grid-cols-12 gap-0">
                                <div className="lg:col-span-7 p-8 sm:p-12 flex flex-col justify-between space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2.5 flex-wrap">
                                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-800">
                                                {getCategoryName(heroPost.category)}
                                            </span>
                                            {heroPost.is_featured && (
                                                <span className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-bold uppercase tracking-wider">
                                                    Featured
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                                                <Clock className="w-3.5 h-3.5" />
                                                {heroPost.read_time_minutes || 5} min read
                                            </span>
                                        </div>

                                        <Link href={`/blog/${heroPost.slug}`}>
                                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 hover:text-emerald-700 transition-colors leading-tight">
                                                {heroPost.title}
                                            </h2>
                                        </Link>

                                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                                            {heroPost.excerpt || (heroPost.body ? heroPost.body.slice(0, 200) + '...' : '')}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                                                {heroPost.author_name?.charAt(0) || 'E'}
                                            </div>
                                            <span className="text-xs font-bold text-slate-800">{heroPost.author_name || 'EduFlow Editorial'}</span>
                                        </div>

                                        <Link
                                            href={`/blog/${heroPost.slug}`}
                                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                                        >
                                            <span>Read Article</span>
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>

                                <div className="lg:col-span-5 bg-slate-900 relative min-h-[260px] lg:min-h-full">
                                    {heroPost.featured_image ? (
                                        <img
                                            src={heroPost.featured_image}
                                            alt={heroPost.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-br from-slate-900 to-slate-800 text-slate-400">
                                            <BookOpen className="w-16 h-16 opacity-30 text-white" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Articles Grid */}
                    {filteredPosts.length > 0 ? (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {(selectedCategory === 'all' && !searchQuery ? gridPosts : filteredPosts).map((post) => (
                                <article
                                    key={post.id}
                                    className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between overflow-hidden group"
                                >
                                    <div>
                                        {post.featured_image && (
                                            <div className="aspect-video w-full overflow-hidden bg-slate-100 relative">
                                                <img
                                                    src={post.featured_image}
                                                    alt={post.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                        )}

                                        <div className="p-6 space-y-4">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800">
                                                    {getCategoryName(post.category)}
                                                </span>
                                                <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
                                                    <Clock className="w-3 h-3" />
                                                    {post.read_time_minutes || 4} min
                                                </span>
                                            </div>

                                            <Link href={`/blog/${post.slug}`} className="block">
                                                <h3 className="text-base sm:text-lg font-bold text-slate-950 group-hover:text-emerald-700 transition-colors leading-snug">
                                                    {post.title}
                                                </h3>
                                            </Link>

                                            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                                                {post.excerpt || (post.body ? post.body.slice(0, 150) + '...' : '')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="p-6 pt-0 border-t border-slate-100/80 mt-4 flex items-center justify-between text-xs">
                                        <span className="text-slate-500 text-[11px]">{post.author_name || 'EduFlow Editorial'}</span>
                                        <Link
                                            href={`/blog/${post.slug}`}
                                            className="text-emerald-700 font-bold hover:text-emerald-800 inline-flex items-center gap-1"
                                        >
                                            <span>Read</span>
                                            <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-4">
                            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                            <p className="text-slate-600 font-semibold text-sm">No articles found matching your criteria</p>
                            <button
                                type="button"
                                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
                                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                            >
                                Reset Filters
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </MarketingLayout>
    );
}