import { Head, Link } from '@inertiajs/react';
import MarketingLayout from '@/components/marketing/MarketingLayout';
import {
    Clock, User, ArrowLeft, ArrowRight, ExternalLink, PlayCircle,
    BookOpen, Share2, ShieldCheck, CheckCircle2, ChevronRight
} from 'lucide-react';

function formatEmbedUrl(url: string): string {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
        const id = url.split('v=')[1]?.split('&')[0];
        return `https://www.youtube-nocookie.com/embed/${id}`;
    }
    if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube-nocookie.com/embed/${id}`;
    }
    return url;
}

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
    status: 'draft' | 'published';
    is_featured: boolean;
    read_time_minutes: number | null;
    published_at?: string | null;
}

interface Props {
    post: BlogPostItem;
    relatedPosts?: BlogPostItem[];
    navigation?: any[];
    footerNavigation?: any[];
    branding?: any;
}

export default function BlogShow({ post, relatedPosts = [], navigation, footerNavigation, branding }: Props) {
    const formattedDate = post.published_at
        ? new Date(post.published_at).toLocaleDateString('en-KE', { month: 'long', day: 'numeric', year: 'numeric' })
        : 'Recently Published';

    function renderInlineText(text: string) {
        if (!text) return null;
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                const cleanWord = part.slice(2, -2).replace(/\*/g, '');
                return <strong key={i} className="font-semibold text-slate-900">{cleanWord}</strong>;
            }
            return part.replace(/\*\*/g, '').replace(/^\s*-\s*/, '');
        });
    }

    function renderFormattedBody(bodyText: string) {
        if (!bodyText) return null;

        const rawLines = bodyText.replace(/\r\n/g, '\n').split('\n');
        const elements: JSX.Element[] = [];
        let currentList: string[] = [];

        function flushList(keyPrefix: number) {
            if (currentList.length > 0) {
                const listItems = [...currentList];
                currentList = [];
                elements.push(
                    <ul key={`list-${keyPrefix}`} className="space-y-3 my-4 pl-1">
                        {listItems.map((itemText, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-slate-700 font-normal leading-relaxed">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="flex-1">{renderInlineText(itemText)}</span>
                            </li>
                        ))}
                    </ul>
                );
            }
        }

        rawLines.forEach((line, index) => {
            const trimmed = line.trim();
            if (!trimmed) {
                flushList(index);
                return;
            }

            if (trimmed.startsWith('### ')) {
                flushList(index);
                const headingText = trimmed.replace(/^###\s*/, '');
                elements.push(
                    <h3 key={`h3-${index}`} className="text-xl sm:text-2xl font-bold text-slate-950 pt-6 pb-2 border-b border-slate-100">
                        {renderInlineText(headingText)}
                    </h3>
                );
                return;
            }

            if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.includes(' - **')) {
                if (trimmed.includes(' - **')) {
                    const subParts = trimmed.split(' - ').filter(Boolean);
                    subParts.forEach((sp) => currentList.push(sp));
                } else {
                    currentList.push(trimmed.replace(/^[-*]\s+/, ''));
                }
                return;
            }

            flushList(index);
            elements.push(
                <p key={`p-${index}`} className="text-sm sm:text-base text-slate-700 font-normal leading-relaxed my-3">
                    {renderInlineText(trimmed)}
                </p>
            );
        });

        flushList(rawLines.length);
        return elements;
    }

    return (
        <MarketingLayout
            title={post.title}
            navigation={navigation}
            footerNavigation={footerNavigation}
            branding={branding}
            currentPath="/blog"
        >
            <Head title={`${post.title} | EduFlow Blog`} />

            <div className="py-12 sm:py-20 bg-slate-50 min-h-screen">
                <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">

                    {/* Back to Blog */}
                    <div>
                        <Link
                            href="/blog"
                            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-emerald-700 transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>Back to all insights</span>
                        </Link>
                    </div>

                    {/* Article Header */}
                    <div className="space-y-5">
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-800">
                                {((typeof post.category === "object" && post.category !== null) ? ((post.category as any).category || (post.category as any).title || (post.category as any).name || "General") : (post.category || "General"))}
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                {post.read_time_minutes || 5} min read
                            </span>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500">{formattedDate}</span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
                            {post.title}
                        </h1>

                        {post.excerpt && (
                            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
                                {post.excerpt}
                            </p>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-slate-200/80">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                                    {post.author_name?.charAt(0) || 'E'}
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900">{post.author_name || 'EduFlow Editorial Team'}</h4>
                                    <p className="text-[11px] text-slate-500">Education & Technical Desk</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Embedded Media Showcase */}
                    {post.video_url ? (
                        <div className="space-y-2">
                            <div className="rounded-3xl overflow-hidden bg-slate-950 aspect-video shadow-xl border border-slate-800 relative">
                                <iframe
                                    src={formatEmbedUrl(post.video_url)}
                                    title={post.title}
                                    className="w-full h-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                            <p className="text-xs text-slate-500 italic text-center">
                                Video Walkthrough: {post.title}
                            </p>
                        </div>
                    ) : post.featured_image ? (
                        <div className="rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 shadow-md">
                            <img
                                src={post.featured_image}
                                alt={post.title}
                                className="w-full h-auto max-h-[480px] object-cover"
                            />
                        </div>
                    ) : null}

                    {/* Additional Gallery Images Grid */}
                    {Array.isArray(post.gallery_images) && post.gallery_images.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Photo Gallery</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {post.gallery_images.map((gImg, gIdx) => (
                                    <div key={gIdx} className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video shadow-xs">
                                        <img src={gImg} alt={`Gallery Photo ${gIdx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Source Attribution Box */}
                    {post.source_name && (
                        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-slate-800 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                                    <BookOpen className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="font-semibold text-emerald-950">Source Attribution & Citation: </span>
                                    <span>{post.source_name}</span>
                                </div>
                            </div>
                            {post.source_url && (
                                <a
                                    href={post.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-emerald-800 font-bold text-xs hover:bg-emerald-100 transition-colors shrink-0"
                                >
                                    <span>Visit Reference</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            )}
                        </div>
                    )}

                    {/* Article Body with Clean Markdown Parsing */}
                    <div className="bg-white rounded-3xl p-8 sm:p-14 border border-slate-200/80 shadow-xs space-y-4 text-slate-800">
                        {renderFormattedBody(post.body)}
                    </div>

                    {/* Related Articles */}
                    {relatedPosts.length > 0 && (
                        <div className="space-y-6 pt-10 border-t border-slate-200">
                            <h3 className="text-2xl font-extrabold text-slate-950">Recommended Reading</h3>
                            <div className="grid sm:grid-cols-2 gap-6">
                                {relatedPosts.slice(0, 2).map((rel) => (
                                    <Link
                                        key={rel.id}
                                        href={`/blog/${rel.slug}`}
                                        className="p-6 rounded-3xl bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all space-y-3 group"
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                            {((typeof rel.category === "object" && rel.category !== null) ? ((rel.category as any).category || (rel.category as any).title || (rel.category as any).name || "General") : (rel.category || "General"))}
                                        </span>
                                        <h4 className="text-base font-bold text-slate-950 group-hover:text-emerald-700 transition-colors leading-snug">
                                            {rel.title}
                                        </h4>
                                        <p className="text-xs text-slate-500 line-clamp-2">
                                            {rel.excerpt || rel.body.slice(0, 100) + '...'}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                </article>
            </div>
        </MarketingLayout>
    );
}