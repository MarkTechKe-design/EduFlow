import React from 'react';
import { User, Check } from 'lucide-react';

export interface ChildProfile {
    id: number | string;
    name: string;
    admission_number: string;
    grade?: string;
    stream?: string;
    photo_url?: string | null;
}

interface Props {
    childrenList: ChildProfile[];
    selectedId: number | string;
    onSelect: (id: number | string) => void;
}

export default function MultiChildSelector({ childrenList = [], selectedId, onSelect }: Props) {
    if (childrenList.length <= 1) return null;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Select Active Learner
            </span>
            <div className="flex flex-wrap gap-2">
                {childrenList.map((child) => {
                    const isSelected = String(child.id) === String(selectedId);
                    return (
                        <button
                            key={child.id}
                            type="button"
                            onClick={() => onSelect(child.id)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2.5 border transition-all ${
                                isSelected
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20'
                                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                        >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                {child.name.charAt(0)}
                            </div>
                            <div className="text-left">
                                <div>{child.name}</div>
                                <div className={`text-[10px] font-normal ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                                    Adm: {child.admission_number} {child.grade ? `· ${child.grade}` : ''}
                                </div>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 ml-1" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}