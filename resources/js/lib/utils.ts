import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats any date string, ISO timestamp, or Date instance into clean human-readable date.
 * Example: '2026-01-08T00:00:00.000000Z' => '08 Jan 2026' or '08/01/2026'
 */
export function formatDate(date: string | Date | null | undefined, format: 'standard' | 'human' | 'iso' = 'human'): string {
    if (!date) return '-';
    
    // Extract YYYY-MM-DD directly if ISO string to avoid UTC timezone shifts
    const str = String(date);
    const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    
    if (match) {
        const [, year, month, day] = match;
        if (format === 'iso') return `${year}-${month}-${day}`;
        if (format === 'standard') return `${day}/${month}/${year}`;
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const mIdx = parseInt(month, 10) - 1;
        return `${day} ${monthNames[mIdx] || month} ${year}`;
    }

    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);

    if (format === 'iso') {
        return d.toISOString().split('T')[0];
    }

    if (format === 'standard') {
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}/${d.getFullYear()}`;
    }

    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

/**
 * Safely normalizes date values to YYYY-MM-DD for HTML5 <input type="date" />
 */
export function toInputDate(date: string | Date | null | undefined): string {
    if (!date) return '';
    const str = String(date);
    const match = str.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : '';
}
