import DOMPurify from 'dompurify';
import { useMemo } from 'react';

interface Props {
    html: string | null | undefined;
    className?: string;
    as?: 'div' | 'span' | 'p' | 'article';
}

/**
 * Enterprise-hardened HTML renderer.
 * Automatically strips all malicious scripts, event handlers (onload/onerror),
 * and unsafe DOM attributes before mounting.
 */
export default function SafeHtml({ html, className = '', as: Component = 'div' }: Props) {
    const cleanHtml = useMemo(() => {
        if (!html) return '';
        return DOMPurify.sanitize(html, {
            USE_PROFILES: { html: true },
            FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form'],
            FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus'],
        });
    }, [html]);

    if (!cleanHtml) return null;

    return <Component className={className} dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
}