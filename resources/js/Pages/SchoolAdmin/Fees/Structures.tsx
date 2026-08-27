import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps, PaginatedData } from '@/Types';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import {
    Layers,
    Plus,
    Trash2
} from 'lucide-react';

interface VoteHead {
    id: number;
    name: string;
    category: string;
}

interface FeeStructureItem {
    id: number;
    title: string;
    term: string;
    total_amount: string | number;
    student_category: string;
    school_class?: { name: string } | null;
    academic_year?: { name: string } | null;
    items?: Array<{ id: number; amount: string | number; vote_head?: { name: string } | null }>;
}

interface Props extends PageProps {
    structures: PaginatedData<FeeStructureItem>;
    voteHeads: VoteHead[];
    classes: Array<{ id: number; name: string }>;
    academicYears: Array<{ id: number; name: string }>;
}

export default function FeeStructuresIndex({ auth, structures, voteHeads = [], classes = [], academicYears = [] }: Props) {
    const [showModal, setShowModal] = useState(false);
    const [classId, setClassId] = useState('');
    const [yearId, setYearId] = useState(academicYears[0]?.id?.toString() || '');
    const [term, setTerm] = useState('Term 1');
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    
    const [items, setItems] = useState<Array<{ vote_head_id: string; amount: string }>>([
        { vote_head_id: voteHeads[0]?.id?.toString() || '', amount: '20000' }
    ]);

    const handleAddItem = () => {
        setItems([...items, { vote_head_id: voteHeads[0]?.id?.toString() || '', amount: '' }]);
    };

    const handleRemoveItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: 'vote_head_id' | 'amount', value: string) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const totalCalculated = items.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/school/fees/structures', {
            academic_year_id: yearId,
            class_id: classId,
            term,
            title: title || `${classes.find(c => c.id.toString() === classId)?.name || 'Class'} ${term} Fee Schedule`,
            due_date: dueDate,
            items: items.map(item => ({
                fee_vote_head_id: item.vote_head_id,
                amount: parseFloat(item.amount) || 0
            }))
        }, {
            onSuccess: () => {
                setShowModal(false);
                setItems([{ vote_head_id: voteHeads[0]?.id?.toString() || '', amount: '20000' }]);
            }
        });
    };

    return (
        <AppLayout header="Fee Structures & Term Pricing Rules">
            <Head title="Fee Structures - EduFlow" />

            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Layers className="w-5 h-5 text-indigo-600" />
                            Fee Structures Master
                        </h1>
                        <p className="text-xs text-slate-500">
                            Configure term fees across vote heads (Tuition, Meals, Transport, CBC Materials) per grade.
                        </p>
                    </div>

                    <Button onClick={() => setShowModal(true)} size="sm" className="h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold">
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Create Fee Structure
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {structures.data && structures.data.length > 0 ? (
                        structures.data.map((struct) => (
                            <div key={struct.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
                                <div className="flex justify-between items-start border-b pb-3">
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{struct.title}</h3>
                                        <div className="text-xs text-slate-500">{struct.school_class?.name} &bull; {struct.term}</div>
                                    </div>
                                    <span className="text-xs font-mono font-bold text-indigo-600">
                                        KSh {Number(struct.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>

                                <div className="space-y-1.5 text-xs">
                                    {struct.items?.map((it) => (
                                        <div key={it.id} className="flex justify-between text-slate-600 dark:text-slate-400">
                                            <span>{it.vote_head?.name || 'Item'}</span>
                                            <span className="font-mono">KSh {Number(it.amount).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="sm:col-span-3 p-12 text-center bg-white dark:bg-slate-900 rounded-xl border text-xs text-slate-500">
                            No fee structures configured yet. Click "Create Fee Structure" to define term fee rules.
                        </div>
                    )}
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h3 className="font-bold text-slate-900 dark:text-white">Create Fee Structure</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="font-bold block mb-1">Target Class:</label>
                                    <Select value={classId} onValueChange={setClassId}>
                                        <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Select Class" /></SelectTrigger>
                                        <SelectContent>
                                            {classes.map((c) => (
                                                <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="font-bold block mb-1">Term:</label>
                                    <Select value={term} onValueChange={setTerm}>
                                        <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Term 1">Term 1</SelectItem>
                                            <SelectItem value="Term 2">Term 2</SelectItem>
                                            <SelectItem value="Term 3">Term 3</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2 border-t">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold">Vote Head Breakdown</span>
                                    <button type="button" onClick={handleAddItem} className="text-indigo-600 text-xs font-bold hover:underline">+ Add Item</button>
                                </div>

                                {items.map((item, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                        <div className="flex-1">
                                            <Select value={item.vote_head_id} onValueChange={(v) => handleItemChange(idx, 'vote_head_id', v)}>
                                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {voteHeads.map((vh) => (
                                                        <SelectItem key={vh.id} value={vh.id.toString()}>{vh.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="w-28">
                                            <Input
                                                type="number"
                                                placeholder="Amount"
                                                value={item.amount}
                                                onChange={(e) => handleItemChange(idx, 'amount', e.target.value)}
                                                className="h-8 text-xs"
                                            />
                                        </div>
                                        {items.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveItem(idx)} className="text-rose-500 hover:text-rose-700">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                <div className="text-right font-bold text-slate-900 dark:text-white pt-2">
                                    Total Structure Amount: <span className="font-mono text-indigo-600">KSh {totalCalculated.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-3 border-t">
                                <Button type="button" variant="outline" onClick={() => setShowModal(false)} size="sm">Cancel</Button>
                                <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold">Save Fee Structure</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}