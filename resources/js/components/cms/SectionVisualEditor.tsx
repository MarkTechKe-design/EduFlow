import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MediaFieldPicker } from './MediaFieldPicker';
import { 
    Plus, 
    Trash2, 
    Bold, 
    Heading2, 
    List, 
    AlignLeft, 
    Table, 
    Sparkles, 
    Layers, 
    Users, 
    HelpCircle
} from 'lucide-react';

interface SectionVisualEditorProps {
    identifier: string;
    blockType: string;
    content: Record<string, any>;
    updateField: (path: string, value: any) => void;
    applyFormat: (textareaId: string, pathStr: string, formatType: 'bold' | 'heading' | 'bullet') => void;
}

export function SectionVisualEditor({
    identifier,
    blockType,
    content,
    updateField,
    applyFormat,
}: SectionVisualEditorProps) {

    // 1. HERO BANNERS
    if (identifier === 'hero' || identifier === 'about-hero' || blockType === 'hero') {
        return (
            <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Hero Eyebrow / Tag</Label>
                        <Input
                            value={content.badge || content.eyebrow || ''}
                            onChange={(e) => updateField('badge', e.target.value)}
                            placeholder="e.g. Built for Kenyan Schools"
                            className="h-9 text-xs"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Hero Headline *</Label>
                        <Input
                            value={content.title || ''}
                            onChange={(e) => updateField('title', e.target.value)}
                            placeholder="Hero main headline..."
                            className="h-9 text-xs font-extrabold"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Hero Body Paragraph / Subtitle</Label>
                    <textarea
                        rows={3}
                        value={content.subtitle || content.body || ''}
                        onChange={(e) => {
                            updateField('subtitle', e.target.value);
                            updateField('body', e.target.value);
                        }}
                        placeholder="Descriptive copy introducing the system..."
                        className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none leading-relaxed"
                    />
                </div>

                <MediaFieldPicker
                    label="Hero Showcase Asset (Image or Walkthrough MP4 Video)"
                    value={content.media_url || content.image_url || ''}
                    onChange={(url) => {
                        updateField('media_url', url);
                        updateField('image_url', url);
                    }}
                    acceptVideo={true}
                    helperText="Upload a product mockup image or MP4 walkthrough video."
                />
            </div>
        );
    }

    // 2. ACTION BANNERS & CTA
    if (identifier === 'home-action-banner' || identifier === 'about-cta' || blockType === 'cta' || identifier === 'next-step') {
        return (
            <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Banner Badge</Label>
                        <Input
                            value={content.badge || ''}
                            onChange={(e) => updateField('badge', e.target.value)}
                            placeholder="e.g. Get Started"
                            className="h-9 text-xs"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Banner Headline *</Label>
                        <Input
                            value={content.title || content.heading || ''}
                            onChange={(e) => {
                                updateField('title', e.target.value);
                                updateField('heading', e.target.value);
                            }}
                            placeholder="Ready to take control of your school?"
                            className="h-9 text-xs font-bold"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Banner Subtitle / Description</Label>
                    <textarea
                        rows={3}
                        value={content.subtitle || content.body || ''}
                        onChange={(e) => {
                            updateField('subtitle', e.target.value);
                            updateField('body', e.target.value);
                        }}
                        placeholder="CTA supporting narrative..."
                        className="w-full p-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-emerald-950">Primary Button Label</Label>
                        <Input
                            value={content.primary_btn || content.button_label || content.button_text || ''}
                            onChange={(e) => {
                                updateField('primary_btn', e.target.value);
                                updateField('button_label', e.target.value);
                                updateField('button_text', e.target.value);
                            }}
                            placeholder="Start Free Now"
                            className="h-9 text-xs bg-white"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-emerald-950">Primary Button URL</Label>
                        <Input
                            value={content.primary_url || content.button_url || ''}
                            onChange={(e) => {
                                updateField('primary_url', e.target.value);
                                updateField('button_url', e.target.value);
                            }}
                            placeholder="/contact"
                            className="h-9 text-xs bg-white font-mono"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-emerald-950">Demo Button Label (Optional)</Label>
                        <Input
                            value={content.demo_btn || ''}
                            onChange={(e) => updateField('demo_btn', e.target.value)}
                            placeholder="Book a Demo"
                            className="h-9 text-xs bg-white"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-emerald-950">Demo Button URL (Optional)</Label>
                        <Input
                            value={content.demo_url || ''}
                            onChange={(e) => updateField('demo_url', e.target.value)}
                            placeholder="/contact"
                            className="h-9 text-xs bg-white font-mono"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-emerald-950">WhatsApp Phone (International)</Label>
                        <Input
                            value={content.whatsapp || ''}
                            onChange={(e) => updateField('whatsapp', e.target.value)}
                            placeholder="254700000000"
                            className="h-9 text-xs bg-white font-mono"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-emerald-950">Footer Micro-Note</Label>
                        <Input
                            value={content.footer_note || ''}
                            onChange={(e) => updateField('footer_note', e.target.value)}
                            placeholder="Used by schools across Nairobi..."
                            className="h-9 text-xs bg-white"
                        />
                    </div>
                </div>

                <MediaFieldPicker
                    label="Banner Background / Illustration Asset"
                    value={content.image_url || ''}
                    onChange={(url) => updateField('image_url', url)}
                    helperText="Upload an optional background graphic or illustration."
                />
            </div>
        );
    }

    // 3. EFFICIENCY COMPARISON MATRIX
    if (identifier === 'home-efficiency-matrix') {
        const rows = Array.isArray(content.rows) ? content.rows : [];
        return (
            <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Section Badge</Label>
                        <Input
                            value={content.badge || ''}
                            onChange={(e) => updateField('badge', e.target.value)}
                            placeholder="Efficiency Matters"
                            className="h-9 text-xs"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Section Title *</Label>
                        <Input
                            value={content.title || ''}
                            onChange={(e) => updateField('title', e.target.value)}
                            placeholder="Why Schools Are Moving to EduFlow"
                            className="h-9 text-xs font-bold"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Section Subtitle</Label>
                    <Input
                        value={content.subtitle || ''}
                        onChange={(e) => updateField('subtitle', e.target.value)}
                        placeholder="Comparative narrative..."
                        className="h-9 text-xs"
                    />
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            <Table className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Comparison Matrix Rows ({rows.length})</span>
                        </Label>
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                                const copy = [...rows, { feature: 'New Feature Area', digital: 'Digital automated capability', manual: 'Manual bottleneck' }];
                                updateField('rows', copy);
                            }}
                            className="h-8 text-xs px-3 gap-1 self-start sm:self-auto"
                        >
                            <Plus className="w-3.5 h-3.5" /> Add Row
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {rows.map((row: any, idx: number) => (
                            <div key={idx} className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase text-slate-700 font-mono">Row #{idx + 1}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const copy = rows.filter((_: any, i: number) => i !== idx);
                                            updateField('rows', copy);
                                        }}
                                        className="text-slate-400 hover:text-rose-600 p-1"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-semibold text-slate-600">Feature</Label>
                                        <Input
                                            value={row.feature || ''}
                                            onChange={(e) => {
                                                const copy = [...rows];
                                                copy[idx].feature = e.target.value;
                                                updateField('rows', copy);
                                            }}
                                            placeholder="e.g. Fee Tracking"
                                            className="h-8 text-xs font-bold bg-white"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-semibold text-emerald-700">EduFlow (Digital)</Label>
                                        <Input
                                            value={row.digital || ''}
                                            onChange={(e) => {
                                                const copy = [...rows];
                                                copy[idx].digital = e.target.value;
                                                updateField('rows', copy);
                                            }}
                                            placeholder="Automated digital capability..."
                                            className="h-8 text-xs bg-white text-emerald-900"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[11px] font-semibold text-slate-500">Manual Systems</Label>
                                        <Input
                                            value={row.manual || ''}
                                            onChange={(e) => {
                                                const copy = [...rows];
                                                copy[idx].manual = e.target.value;
                                                updateField('rows', copy);
                                            }}
                                            placeholder="Paper bottleneck..."
                                            className="h-8 text-xs bg-white text-slate-600"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // 4. ABOUT: THE SWITCH (BEFORE & AFTER COMPARISON)
    if (identifier === 'about-the-switch') {
        const before = Array.isArray(content.before) ? content.before : [];
        const after = Array.isArray(content.after) ? content.after : [];
        return (
            <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Section Badge</Label>
                        <Input
                            value={content.badge || ''}
                            onChange={(e) => updateField('badge', e.target.value)}
                            placeholder="The Switch"
                            className="h-9 text-xs"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Section Title *</Label>
                        <Input
                            value={content.title || ''}
                            onChange={(e) => updateField('title', e.target.value)}
                            placeholder="From fragmented tasks to a unified workspace"
                            className="h-9 text-xs font-bold"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Section Subtitle</Label>
                    <Input
                        value={content.subtitle || ''}
                        onChange={(e) => updateField('subtitle', e.target.value)}
                        placeholder="Transition summary..."
                        className="h-9 text-xs"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
                    {/* Before Column */}
                    <div className="space-y-3 p-3.5 sm:p-4 rounded-2xl bg-rose-50/50 border border-rose-200">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-rose-900">Before EduFlow (Manual)</Label>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    const copy = [...before, 'New manual friction point'];
                                    updateField('before', copy);
                                }}
                                className="h-7 text-[11px] px-2.5"
                            >
                                <Plus className="w-3 h-3 mr-1" /> Add
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {before.map((item: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <Input
                                        value={item}
                                        onChange={(e) => {
                                            const copy = [...before];
                                            copy[idx] = e.target.value;
                                            updateField('before', copy);
                                        }}
                                        className="h-8 text-xs bg-white text-slate-800 flex-1 min-w-0"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const copy = before.filter((_: any, i: number) => i !== idx);
                                            updateField('before', copy);
                                        }}
                                        className="text-slate-400 hover:text-rose-600 p-1 shrink-0"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* After Column */}
                    <div className="space-y-3 p-3.5 sm:p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-emerald-950">With EduFlow (Digital)</Label>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    const copy = [...after, 'New connected capability'];
                                    updateField('after', copy);
                                }}
                                className="h-7 text-[11px] px-2.5"
                            >
                                <Plus className="w-3 h-3 mr-1" /> Add
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {after.map((item: string, idx: number) => (
                                <div key={idx} className="flex items-center gap-2">
                                    <Input
                                        value={item}
                                        onChange={(e) => {
                                            const copy = [...after];
                                            copy[idx] = e.target.value;
                                            updateField('after', copy);
                                        }}
                                        className="h-8 text-xs bg-white text-emerald-950 font-medium flex-1 min-w-0"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const copy = after.filter((_: any, i: number) => i !== idx);
                                            updateField('after', copy);
                                        }}
                                        className="text-slate-400 hover:text-rose-600 p-1 shrink-0"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 5. ABOUT: TEAM MEMBERS & LEADERSHIP
    if (identifier === 'about-team' || identifier === 'team') {
        const members = Array.isArray(content.members) ? content.members : [];
        return (
            <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Section Badge</Label>
                        <Input
                            value={content.badge || ''}
                            onChange={(e) => updateField('badge', e.target.value)}
                            placeholder="The Team"
                            className="h-9 text-xs"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold">Section Title *</Label>
                        <Input
                            value={content.title || ''}
                            onChange={(e) => updateField('title', e.target.value)}
                            placeholder="Product & Technical Leadership"
                            className="h-9 text-xs font-bold"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Section Subtitle</Label>
                    <Input
                        value={content.subtitle || ''}
                        onChange={(e) => updateField('subtitle', e.target.value)}
                        placeholder="Engineers and educational designers..."
                        className="h-9 text-xs"
                    />
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Team Profiles ({members.length})</span>
                        </Label>
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                                const copy = [...members, { name: 'Full Name', role: 'Role / Position', bio: 'Short bio...', image_url: '', email: '', phone: '' }];
                                updateField('members', copy);
                            }}
                            className="h-8 text-xs px-3 gap-1 self-start sm:self-auto"
                        >
                            <Plus className="w-3.5 h-3.5" /> Add Member
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {members.map((m: any, idx: number) => (
                            <div key={idx} className="p-3.5 sm:p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase text-emerald-800 font-mono">Member #{idx + 1}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const copy = members.filter((_: any, i: number) => i !== idx);
                                            updateField('members', copy);
                                        }}
                                        className="text-slate-400 hover:text-rose-600 p-1"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                                    <Input
                                        value={m.name || ''}
                                        onChange={(e) => {
                                            const copy = [...members];
                                            copy[idx].name = e.target.value;
                                            updateField('members', copy);
                                        }}
                                        placeholder="Full Name"
                                        className="h-8 text-xs font-bold bg-white"
                                    />
                                    <Input
                                        value={m.role || ''}
                                        onChange={(e) => {
                                            const copy = [...members];
                                            copy[idx].role = e.target.value;
                                            updateField('members', copy);
                                        }}
                                        placeholder="Job Role / Discipline"
                                        className="h-8 text-xs bg-white"
                                    />
                                    <Input
                                        value={m.email || ''}
                                        onChange={(e) => {
                                            const copy = [...members];
                                            copy[idx].email = e.target.value;
                                            updateField('members', copy);
                                        }}
                                        placeholder="Email Address"
                                        className="h-8 text-xs bg-white font-mono"
                                    />
                                    <Input
                                        value={m.phone || m.whatsapp || ''}
                                        onChange={(e) => {
                                            const copy = [...members];
                                            copy[idx].phone = e.target.value;
                                            copy[idx].whatsapp = e.target.value;
                                            updateField('members', copy);
                                        }}
                                        placeholder="Phone / WhatsApp"
                                        className="h-8 text-xs bg-white font-mono"
                                    />
                                </div>

                                <textarea
                                    rows={2}
                                    value={m.bio || m.shortBio || ''}
                                    onChange={(e) => {
                                        const copy = [...members];
                                        copy[idx].bio = e.target.value;
                                        copy[idx].shortBio = e.target.value;
                                        updateField('members', copy);
                                    }}
                                    placeholder="Short profile biography..."
                                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none"
                                />

                                <MediaFieldPicker
                                    label="Profile Photo / Avatar"
                                    value={m.image_url || m.avatarUrl || ''}
                                    onChange={(url) => {
                                        const copy = [...members];
                                        copy[idx].image_url = url;
                                        copy[idx].avatarUrl = url;
                                        updateField('members', copy);
                                    }}
                                    helperText="Upload a square headshot photograph."
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // 6. DYNAMIC CARD & LIST MANAGER (ALL REMAINING BLOCKS)
    const arrayKey = [
        'highlights', 'tools', 'metrics', 'guides', 'facts', 'values',
        'points', 'modules', 'features', 'roles', 'steps', 'presets', 'items'
    ].find((k) => Array.isArray(content[k]));

    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4">
                <div className="sm:col-span-4 space-y-1.5">
                    <Label className="text-xs font-semibold">Section Tag / Badge</Label>
                    <Input
                        value={content.badge || content.eyebrow || ''}
                        onChange={(e) => updateField('badge', e.target.value)}
                        placeholder="e.g. Platform Core"
                        className="h-9 text-xs"
                    />
                </div>
                <div className="sm:col-span-8 space-y-1.5">
                    <Label className="text-xs font-semibold">Main Heading *</Label>
                    <Input
                        value={content.title || content.heading || ''}
                        onChange={(e) => {
                            updateField('title', e.target.value);
                            updateField('heading', e.target.value);
                        }}
                        placeholder="Section title..."
                        className="h-9 text-xs font-bold"
                        required
                    />
                </div>
            </div>

            <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Subtitle / Descriptive Summary</Label>
                <Input
                    value={content.subtitle || content.subheading || ''}
                    onChange={(e) => {
                        updateField('subtitle', e.target.value);
                        updateField('subheading', e.target.value);
                    }}
                    placeholder="Short summary under the heading..."
                    className="h-9 text-xs"
                />
            </div>

            {/* Formatted Markdown Body Area */}
            {(content.body !== undefined || !arrayKey) && (
                <div className="space-y-2 p-3.5 sm:p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-emerald-100">
                        <div className="flex items-center gap-1.5">
                            <AlignLeft className="w-4 h-4 text-emerald-700" />
                            <Label className="text-xs font-bold text-emerald-950">Clauses, Paragraphs & Bullet Points</Label>
                        </div>
                        <div className="flex items-center gap-1 bg-white border border-emerald-200 p-1 rounded-xl shadow-xs overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => applyFormat('sec-body-textarea', 'body', 'bold')}
                                className="px-2 py-1 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg flex items-center gap-1 font-bold text-[11px] shrink-0"
                            >
                                <Bold className="w-3.5 h-3.5" /> Bold
                            </button>
                            <button
                                type="button"
                                onClick={() => applyFormat('sec-body-textarea', 'body', 'heading')}
                                className="px-2 py-1 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg flex items-center gap-1 font-bold text-[11px] shrink-0"
                            >
                                <Heading2 className="w-3.5 h-3.5" /> Subheading
                            </button>
                            <button
                                type="button"
                                onClick={() => applyFormat('sec-body-textarea', 'body', 'bullet')}
                                className="px-2 py-1 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 rounded-lg flex items-center gap-1 font-bold text-[11px] shrink-0"
                            >
                                <List className="w-3.5 h-3.5" /> Bullet
                            </button>
                        </div>
                    </div>

                    <textarea
                        id="sec-body-textarea"
                        rows={6}
                        value={content.body || ''}
                        onChange={(e) => updateField('body', e.target.value)}
                        placeholder="Enter text or markdown provisions..."
                        className="w-full p-3 rounded-xl border border-slate-200 text-xs font-mono bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none leading-relaxed"
                    />
                </div>
            )}

            {/* Dynamic Items Builder */}
            {arrayKey && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="capitalize">{arrayKey.replace(/_/g, ' ')} ({content[arrayKey].length})</span>
                        </Label>
                        <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                                const list = [...content[arrayKey]];
                                list.push({
                                    title: 'New Item',
                                    name: 'New Item',
                                    label: 'New Label',
                                    value: '100%',
                                    desc: 'Item description...',
                                    body: 'Item description...',
                                });
                                updateField(arrayKey, list);
                            }}
                            className="h-8 text-xs px-3 gap-1 self-start sm:self-auto"
                        >
                            <Plus className="w-3.5 h-3.5" /> Add Item
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {content[arrayKey].map((item: any, idx: number) => {
                            const isObject = typeof item === 'object' && item !== null;
                            return (
                                <div key={idx} className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 relative">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold uppercase text-emerald-800 font-mono">Item #{idx + 1}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const list = content[arrayKey].filter((_: any, i: number) => i !== idx);
                                                updateField(arrayKey, list);
                                            }}
                                            className="text-slate-400 hover:text-rose-600 p-1"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    {isObject ? (
                                        <div className="space-y-2">
                                            <div className="flex flex-col sm:flex-row gap-2">
                                                {(item.value !== undefined) && (
                                                    <Input
                                                        value={item.value || ''}
                                                        onChange={(e) => {
                                                            const list = [...content[arrayKey]];
                                                            list[idx].value = e.target.value;
                                                            updateField(arrayKey, list);
                                                        }}
                                                        placeholder="Value"
                                                        className="h-8 text-xs font-extrabold sm:w-1/3 bg-white"
                                                    />
                                                )}
                                                <Input
                                                    value={item.title || item.name || item.label || item.role || ''}
                                                    onChange={(e) => {
                                                        const list = [...content[arrayKey]];
                                                        const k = item.title !== undefined ? 'title' : item.name !== undefined ? 'name' : item.label !== undefined ? 'label' : 'role';
                                                        list[idx][k] = e.target.value;
                                                        updateField(arrayKey, list);
                                                    }}
                                                    placeholder="Item Title / Label"
                                                    className="h-8 text-xs font-bold flex-1 bg-white"
                                                />
                                            </div>

                                            {(item.desc !== undefined || item.body !== undefined || item.subtitle !== undefined) && (
                                                <Input
                                                    value={item.desc || item.body || item.subtitle || ''}
                                                    onChange={(e) => {
                                                        const list = [...content[arrayKey]];
                                                        const k = item.desc !== undefined ? 'desc' : item.body !== undefined ? 'body' : 'subtitle';
                                                        list[idx][k] = e.target.value;
                                                        updateField(arrayKey, list);
                                                    }}
                                                    placeholder="Item summary description..."
                                                    className="h-8 text-xs bg-white"
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <Input
                                            value={String(item)}
                                            onChange={(e) => {
                                                const list = [...content[arrayKey]];
                                                list[idx] = e.target.value;
                                                updateField(arrayKey, list);
                                            }}
                                            className="h-8 text-xs bg-white font-medium"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <MediaFieldPicker
                label="Section Media Attachment (Optional)"
                value={content.image_url || content.media_url || ''}
                onChange={(url) => {
                    updateField('image_url', url);
                    updateField('media_url', url);
                }}
                helperText="Attach an image or diagram asset for this section."
            />
        </div>
    );
}