import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';

export default function BrandingSync() {
    const { branding } = usePage<any>().props;
    useEffect(() => {
        const root = document.documentElement;
        const values = branding || {};
        Object.entries(values).forEach(([key, value]) => root.style.setProperty(`--brand-${key.replaceAll('_', '-')}`, String(value)));
        if (values.primary) root.style.setProperty('--primary', String(values.primary));
        if (values.background) root.style.setProperty('--background', String(values.background));
    }, [branding]);
    return null;
}
