/**
 * Kenyan Standard Date & Time Formatting Utilities (Africa/Nairobi - EAT)
 */

export function formatKenyanTime(dateStr?: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString('en-KE', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'Africa/Nairobi',
    });
}

export function formatKenyanDate(dateStr?: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Africa/Nairobi',
    });
}

export function formatKenyanDateTime(dateStr?: string | null): string {
    if (!dateStr) return '—';
    return `${formatKenyanDate(dateStr)} at ${formatKenyanTime(dateStr)}`;
}