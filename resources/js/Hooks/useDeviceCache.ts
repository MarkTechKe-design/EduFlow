import { useEffect, useState } from 'react';

export function useDeviceCache<T>(key: string, initialData: T): [T, (val: T) => void] {
    const storageKey = `eduflow_cache_${key}`;

    const [state, setState] = useState<T>(() => {
        try {
            const cached = localStorage.getItem(storageKey);
            return cached ? JSON.parse(cached) : initialData;
        } catch {
            return initialData;
        }
    });

    useEffect(() => {
        if (initialData !== undefined && initialData !== null) {
            try {
                localStorage.setItem(storageKey, JSON.stringify(initialData));
                setState(initialData);
            } catch (e) {
                console.warn('LocalStorage quota exceeded', e);
            }
        }
    }, [initialData, storageKey]);

    const updateCache = (val: T) => {
        setState(val);
        try {
            localStorage.setItem(storageKey, JSON.stringify(val));
        } catch (e) {
            console.warn('LocalStorage write failed', e);
        }
    };

    return [state, updateCache];
}