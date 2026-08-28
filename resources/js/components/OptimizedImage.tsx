import { useState, ImgHTMLAttributes } from 'react';

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    className?: string;
    priority?: boolean;
}

export default function OptimizedImage({
    src,
    alt,
    className = '',
    priority = false,
    ...props
}: OptimizedImageProps) {
    const [loaded, setLoaded] = useState(false);

    return (
        <div className={`relative overflow-hidden ${className}`}>
            <img
                src={src}
                alt={alt}
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                onLoad={() => setLoaded(true)}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                    loaded ? 'opacity-100' : 'opacity-0'
                } ${className}`}
                {...props}
            />
            {!loaded && (
                <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 animate-pulse" />
            )}
        </div>
    );
}