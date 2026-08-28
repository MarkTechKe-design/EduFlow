import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UploadCloud, Image as ImageIcon, Video, Trash2, Loader2 } from 'lucide-react';

interface MediaFieldPickerProps {
    label: string;
    value: string;
    onChange: (url: string) => void;
    folder?: string;
    acceptVideo?: boolean;
    helperText?: string;
}

export function MediaFieldPicker({
    label,
    value,
    onChange,
    folder = 'website',
    acceptVideo = false,
    helperText,
}: MediaFieldPickerProps) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isVideo = Boolean(value && (value.endsWith('.mp4') || value.endsWith('.webm') || value.includes('youtube') || value.includes('vimeo')));

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
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

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.message || `Upload failed with HTTP ${res.status}`);
            }

            const data = await res.json();
            if (data.url) {
                onChange(data.url);
            }
        } catch (err: any) {
            alert('Upload error: ' + (err.message || 'Failed to upload media.'));
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }

    return (
        <div className="space-y-3 p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 bg-slate-50/70 shadow-xs">
            <div className="flex items-center justify-between gap-2">
                <Label className="text-xs font-bold text-slate-900 truncate">{label}</Label>
                {value && (
                    <button
                        type="button"
                        onClick={() => onChange('')}
                        className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-semibold shrink-0"
                    >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                )}
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept={acceptVideo ? 'image/*,video/mp4,video/webm' : 'image/*'}
                className="hidden"
            />

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4">
                {/* Visual Preview Box */}
                <div className="w-full sm:w-24 h-28 sm:h-24 rounded-2xl bg-slate-950 border border-slate-300 overflow-hidden shrink-0 flex items-center justify-center relative shadow-xs">
                    {value ? (
                        isVideo ? (
                            <div className="flex flex-col items-center justify-center text-emerald-400 p-2 text-center">
                                <Video className="w-6 h-6 mb-1" />
                                <span className="text-[9px] font-mono leading-none">Video File</span>
                            </div>
                        ) : (
                            <img src={value} alt="Preview" className="w-full h-full object-cover" />
                        )
                    ) : (
                        <div className="text-slate-400 flex flex-col items-center">
                            <ImageIcon className="w-6 h-6 mb-1 text-slate-500" />
                            <span className="text-[10px] font-medium">No Media Selected</span>
                        </div>
                    )}
                </div>

                {/* Input & Direct Upload Controls */}
                <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <Input
                            value={value || ''}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="Image/video URL or upload..."
                            className="h-9 text-xs font-mono bg-white flex-1 min-w-0"
                        />
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={uploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="h-9 text-xs px-4 font-semibold gap-1.5 shadow-xs bg-white border border-slate-200 hover:bg-slate-100 shrink-0"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                                    <span>Uploading...</span>
                                </>
                            ) : (
                                <>
                                    <UploadCloud className="w-4 h-4 text-emerald-600" />
                                    <span>Upload Media</span>
                                </>
                            )}
                        </Button>
                    </div>

                    {helperText ? (
                        <p className="text-[11px] text-slate-500 leading-snug">
                            {helperText}
                        </p>
                    ) : (
                        <p className="text-[11px] text-slate-400 leading-snug">
                            Supports PNG, JPG, WebP, SVG{acceptVideo ? ', MP4, and WebM videos' : ''}.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}