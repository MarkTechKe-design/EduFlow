import { Link, InertiaLinkProps } from '@inertiajs/react';
import React from 'react';

interface NavLinkProps extends InertiaLinkProps {
    active?: boolean;
    className?: string;
    children: React.ReactNode;
}

export default function NavLink({
    href,
    active = false,
    className = '',
    children,
    ...props
}: NavLinkProps) {
    return (
        <Link
            href={href}
            prefetch={['hover', 'mount']}
            cacheFor="1m"
            className={`inline-flex items-center transition-all duration-150 ease-out hover:translate-y-[-1px] active:translate-y-0 ${
                active
                    ? 'border-b-2 border-indigo-500 font-semibold text-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            } ${className}`}
            {...props}
        >
            {children}
        </Link>
    );
}