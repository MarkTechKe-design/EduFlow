import { useState, useRef } from 'react';
import { usePage, useForm, Link, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
    BookOpen, Plus, Pencil, Trash2, CheckCircle2, ShieldAlert, 
    Search, RotateCcw, AlertTriangle, Download, Upload, Printer, 
    FileSpreadsheet, FileText, AlertCircle 
} from 'lucide-react';
import type { PageProps, Student, Staff } from '@/types';

interface BookItem {
    id: number;
    title: string;
    author: string;
    isbn?: string;
    category: string;
    publisher?: string;
    publication_year?: number;
    location?: string;
    total_copies: number;
    available_copies: number;
    price?: number;
}

interface IssueItem {
    id: number;
    book_id: number;
    member_type: 'student' | 'staff';
    member_id: number;
    member_name?: string;
    member_class?: string;
    issued_date: string;
    due_date: string;
    returned_date?: string;
    fine: number;
    fine_per_day: number;
    fine_status: 'none' | 'unpaid' | 'paid' | 'waived';
    replacement_charge: number;
    status: 'issued' | 'returned' | 'lost';
    note?: string;
    book?: BookItem;
}

interface Props extends PageProps {
    books: { data: BookItem[]; current_page: number; last_page: number; total?: number };
    issues: { data: IssueItem[]; current_page: number; last_page: number; total?: number };
    categories: string[];
    students: Student[];
    staffList: Staff[];
    stats: {
        total_titles: number;
        total_copies: number;
        available_copies: number;
        currently_issued: number;
        overdue_count: number;
        lost_unpaid: number;
    };
    filters: { search?: string; category?: string; status?: string };
}

export default function LibraryIndex({
    books,
    issues,
    categories = [],
    students = [],
    staffList = [],
    stats,
    filters,
}: Props) {
    const { flash, errors: pageErrors } = usePage<PageProps>().props;
    const [activeTab, setActiveTab] = useState<'catalog' | 'circulation' | 'clearance'>('catalog');

    // Modals
    const [bookModalOpen, setBookModalOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [editingBook, setEditingBook] = useState<BookItem | null>(null);
    const [issueModalOpen, setIssueModalOpen] = useState(false);
    const [returnModalOpen, setReturnModalOpen] = useState<IssueItem | null>(null);
    const [lostModalOpen, setLostModalOpen] = useState<IssueItem | null>(null);

    // Clearance verification state
    const [selectedStudentForClearance, setSelectedStudentForClearance] = useState<string>('');
    const [clearanceResult, setClearanceResult] = useState<any>(null);
    const [clearanceLoading, setClearanceLoading] = useState(false);

    // File Upload Ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Book Form
    const bookForm = useForm({
        title: '',
        author: '',
        isbn: '',
        category: 'Textbook',
        publisher: '',
        edition: '',
        publication_year: String(new Date().getFullYear()),
        location: '',
        price: '',
        total_copies: 1,
    });

    // Import Form
    const importForm = useForm<{ file: File | null }>({
        file: null,
    });

    // Issue Form
    const issueForm = useForm({
        book_id: '',
        member_type: 'student' as 'student' | 'staff',
        member_id: '',
        issued_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        note: '',
    });

    // Return Form
    const returnForm = useForm({
        returned_date: new Date().toISOString().split('T')[0],
        charge_fine: false,
        late_fine: '0',
    });

    // Lost Form
    const lostForm = useForm({
        replacement_charge: '1200',
        note: '',
    });

    function openBookCreate() {
        bookForm.reset();
        setEditingBook(null);
        setBookModalOpen(true);
    }

    function openBookEdit(b: BookItem) {
        setEditingBook(b);
        bookForm.setData({
            title: b.title,
            author: b.author,
            isbn: b.isbn || '',
            category: b.category || 'Textbook',
            publisher: b.publisher || '',
            edition: (b as any).edition || '',
            publication_year: String(b.publication_year || new Date().getFullYear()),
            location: b.location || '',
            price: b.price ? String(b.price) : '',
            total_copies: b.total_copies,
        });
        setBookModalOpen(true);
    }

    function handleBookSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingBook) {
            bookForm.put(`/school/library/books/${editingBook.id}`, {
                onSuccess: () => { setBookModalOpen(false); bookForm.reset(); },
            });
        } else {
            bookForm.post('/school/library/books', {
                onSuccess: () => { setBookModalOpen(false); bookForm.reset(); },
            });
        }
    }

    function handleBookDelete(id: number) {
        if (confirm('Are you sure you want to remove this book title from catalog?')) {
            router.delete(`/school/library/books/${id}`);
        }
    }

    function handleImportSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!importForm.data.file) {
            alert('Please choose a CSV file to upload.');
            return;
        }

        importForm.post('/school/library/books/import', {
            preserveScroll: true,
            onSuccess: () => {
                setImportModalOpen(false);
                importForm.reset();
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    }

    function handleIssueSubmit(e: React.FormEvent) {
        e.preventDefault();
        issueForm.post('/school/library/issues', {
            preserveScroll: true,
            onSuccess: () => { setIssueModalOpen(false); issueForm.reset(); },
        });
    }

    function handleReturnSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!returnModalOpen) return;
        returnForm.put(`/school/library/issues/${returnModalOpen.id}/return`, {
            preserveScroll: true,
            onSuccess: () => { setReturnModalOpen(null); returnForm.reset(); },
        });
    }

    function handleLostSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!lostModalOpen) return;
        lostForm.put(`/school/library/lost/${lostModalOpen.id}`, {
            preserveScroll: true,
            onSuccess: () => { setLostModalOpen(null); lostForm.reset(); },
        });
    }

    function handleClearFine(issueId: number) {
        if (confirm('Confirm that the student has paid the replacement fee or replaced the copy?')) {
            router.post(`/school/library/clear-fine/${issueId}`);
        }
    }

    function verifyClearance(studentId: string) {
        setSelectedStudentForClearance(studentId);
        if (!studentId) {
            setClearanceResult(null);
            return;
        }
        setClearanceLoading(true);
        fetch(`/school/library/clearance-check/${studentId}`)
            .then(res => res.json())
            .then(data => {
                setClearanceResult(data);
                setClearanceLoading(false);
            })
            .catch(() => setClearanceLoading(false));
    }

    function triggerPrint() {
        window.print();
    }

    return (
        <AppLayout title="Library Management & Circulation">
            <div className="space-y-6 max-w-7xl mx-auto pb-16">
                
                {/* Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-teal-600" />
                            <span>Library & Resource Center</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Curriculum textbook catalog, batch inventory import/export, circulation tracking, and student clearance verification.
                        </p>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center gap-2">
                        {activeTab === 'catalog' && (
                            <>
                                <a
                                    href="/school/library/books/export"
                                    className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl shadow-2xs transition-colors"
                                >
                                    <Download className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Export CSV</span>
                                </a>
                                
                                <Button 
                                    onClick={() => setImportModalOpen(true)}
                                    variant="outline" 
                                    className="h-9 px-3.5 text-xs font-bold border-teal-200 bg-teal-50/50 hover:bg-teal-50 text-teal-800 rounded-xl shadow-2xs flex items-center gap-1.5"
                                >
                                    <Upload className="w-3.5 h-3.5 text-teal-600" /> 
                                    <span>Bulk Import</span>
                                </Button>

                                <Button 
                                    onClick={triggerPrint}
                                    variant="outline" 
                                    className="h-9 px-3.5 text-xs font-bold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl shadow-2xs flex items-center gap-1.5"
                                >
                                    <Printer className="w-3.5 h-3.5 text-slate-500" /> 
                                    <span>Print Catalog</span>
                                </Button>

                                <Button 
                                    onClick={openBookCreate} 
                                    className="h-9 px-4 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-2xs flex items-center gap-1.5"
                                >
                                    <Plus className="w-4 h-4" /> 
                                    <span>Add Book Title</span>
                                </Button>
                            </>
                        )}

                        {activeTab === 'circulation' && (
                            <Button 
                                onClick={() => { issueForm.reset(); setIssueModalOpen(true); }} 
                                className="h-9 px-4 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-2xs flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Issue Book
                            </Button>
                        )}
                    </div>
                </div>

                {/* Print Header */}
                <div className="hidden print:block mb-6 border-b pb-4">
                    <h1 className="text-xl font-black text-black">EduFlow Institutional Library Catalog & Inventory Register</h1>
                    <p className="text-xs text-gray-600 mt-1">
                        Export Timestamp: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • Total Titles: {stats?.total_titles ?? 0} • Total Copies: {stats?.total_copies ?? 0}
                    </p>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-800 font-medium flex items-center gap-2 print:hidden shadow-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {pageErrors?.file && (
                    <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-xs text-rose-800 font-medium flex items-center gap-2 print:hidden shadow-xs">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{pageErrors.file}</span>
                    </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 print:hidden">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Book Inventory</span>
                        <p className="text-2xl font-black text-slate-900 mt-1">{stats?.total_copies ?? 0} <span className="text-xs font-normal text-slate-400">copies</span></p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Available on Shelves</span>
                        <p className="text-2xl font-black text-teal-600 mt-1">{stats?.available_copies ?? 0}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Currently Borrowed</span>
                        <p className="text-2xl font-black text-indigo-600 mt-1">{stats?.currently_issued ?? 0}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Overdue & Lost Fines</span>
                        <p className="text-2xl font-black text-red-600 mt-1">{stats?.overdue_count ?? 0} <span className="text-xs font-normal text-slate-400">overdue</span></p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 gap-6 print:hidden">
                    <button
                        onClick={() => setActiveTab('catalog')}
                        className={`pb-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'catalog' ? 'border-teal-600 text-teal-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        Book Catalog & Inventory
                    </button>
                    <button
                        onClick={() => setActiveTab('circulation')}
                        className={`pb-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'circulation' ? 'border-teal-600 text-teal-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        Circulation & Issue Register
                    </button>
                    <button
                        onClick={() => setActiveTab('clearance')}
                        className={`pb-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'clearance' ? 'border-teal-600 text-teal-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        End-of-Term Clearance Verifier
                    </button>
                </div>

                {/* TAB 1: CATALOG */}
                {activeTab === 'catalog' && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3 print:hidden">
                            <div className="w-full sm:w-80 relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                                <Input
                                    value={filters?.search ?? ''}
                                    onChange={e => router.get('/school/library/books', { ...filters, search: e.target.value || undefined }, { preserveState: true })}
                                    placeholder="Search title, author, ISBN, category..."
                                    className="h-9 text-xs pl-8 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/80 border-b border-slate-200">
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Title & Publisher</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Author</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Category</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">ISBN / Shelf</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-center">Total</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-center">Available</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-right print:hidden">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="font-medium text-xs divide-y divide-slate-100">
                                    {books.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-16 text-slate-400">
                                                No books found in the library catalog. You can add titles individually or click <strong>Bulk Import</strong> to upload an Excel/CSV catalog.
                                            </TableCell>
                                        </TableRow>
                                    ) : books.data.map(b => (
                                        <TableRow key={b.id} className="hover:bg-slate-50/60 transition-colors">
                                            <TableCell className="py-3 px-4">
                                                <p className="font-bold text-slate-900">{b.title}</p>
                                                <p className="text-[10px] text-slate-400">{b.publisher ?? 'Standard Edition'} {b.publication_year ? `• ${b.publication_year}` : ''}</p>
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-slate-700">{b.author}</TableCell>
                                            <TableCell className="py-3 px-4">
                                                <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 text-slate-700 border-slate-200 rounded-md">
                                                    {b.category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-3 px-4 font-mono text-slate-600">
                                                <div>{b.isbn || '—'}</div>
                                                <div className="text-[10px] text-slate-400 font-sans">Shelf: {b.location || 'Main Shelf'}</div>
                                            </TableCell>
                                            <TableCell className="py-3 px-4 font-mono font-bold text-center text-slate-800">{b.total_copies}</TableCell>
                                            <TableCell className="py-3 px-4 font-mono font-bold text-center text-teal-600">{b.available_copies}</TableCell>
                                            <TableCell className="py-3 px-4 text-right print:hidden">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button size="sm" variant="outline" onClick={() => openBookEdit(b)} className="h-7 px-2 text-xs font-bold rounded-lg border-slate-200 hover:bg-slate-100">
                                                        <Pencil className="w-3 h-3 mr-1" /> Edit
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => handleBookDelete(b.id)} className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                {/* TAB 2: CIRCULATION LOG */}
                {activeTab === 'circulation' && (
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/80 border-b border-slate-200">
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Book Title</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Borrower</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Issued & Due Date</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Status</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Fine / Replacement</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-right">Circulation Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="font-medium text-xs divide-y divide-slate-100">
                                {issues.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                                            No active or historical book circulation records found.
                                        </TableCell>
                                    </TableRow>
                                ) : issues.data.map(i => (
                                    <TableRow key={i.id} className="hover:bg-slate-50/50">
                                        <TableCell className="py-3 px-4">
                                            <p className="font-bold text-slate-900">{i.book?.title}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">ISBN: {i.book?.isbn || '—'}</p>
                                        </TableCell>
                                        <TableCell className="py-3 px-4">
                                            <p className="font-bold text-slate-900">{i.member_name}</p>
                                            <p className="text-[10px] text-slate-400">{i.member_class}</p>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 font-mono text-slate-600">
                                            <div>Issued: {i.issued_date}</div>
                                            <div className={i.status === 'issued' && new Date(i.due_date) < new Date() ? 'text-red-600 font-bold' : ''}>
                                                Due: {i.due_date}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3 px-4">
                                            <Badge variant="outline" className={`capitalize text-[10px] font-bold ${i.status === 'returned' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : i.status === 'lost' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-indigo-50 text-indigo-800 border-indigo-200'}`}>
                                                {i.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-3 px-4 font-mono">
                                            {i.status === 'lost' ? (
                                                <div>
                                                    <span className="font-bold text-red-600">KES {Number(i.replacement_charge).toLocaleString()}</span>
                                                    <Badge variant="outline" className={`ml-2 text-[9px] uppercase font-bold ${i.fine_status === 'paid' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
                                                        {i.fine_status}
                                                    </Badge>
                                                </div>
                                            ) : Number(i.fine) > 0 ? (
                                                <span>KES {Number(i.fine).toLocaleString()}</span>
                                            ) : (
                                                <span className="text-slate-400">None</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-3 px-4 text-right">
                                            {i.status === 'issued' && (
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Button size="sm" variant="outline" onClick={() => setReturnModalOpen(i)} className="h-7 px-2 text-xs font-bold rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                                                        <RotateCcw className="w-3 h-3 mr-1" /> Return
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => setLostModalOpen(i)} className="h-7 px-2 text-xs font-bold rounded-lg border-red-200 text-red-600 hover:bg-red-50">
                                                        <AlertTriangle className="w-3 h-3 mr-1" /> Mark Lost
                                                    </Button>
                                                </div>
                                            )}
                                            {i.status === 'lost' && i.fine_status === 'unpaid' && (
                                                <Button size="sm" variant="outline" onClick={() => handleClearFine(i.id)} className="h-7 px-2 text-xs font-bold rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                                                    Clear Liability
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* TAB 3: END-OF-TERM CLEARANCE VERIFIER */}
                {activeTab === 'clearance' && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-6">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Student Library Clearance Verifier</h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Verify whether a candidate or departing student has returned all curriculum textbooks and cleared all lost-book replacement liabilities before signing off clearance forms.
                            </p>
                        </div>

                        <div className="max-w-md">
                            <Label className="text-xs font-bold">Select Student *</Label>
                            <Select value={selectedStudentForClearance} onValueChange={verifyClearance}>
                                <SelectTrigger className="h-9 text-xs mt-1.5"><SelectValue placeholder="Search / Select student..." /></SelectTrigger>
                                <SelectContent>
                                    {students.map(s => (
                                        <SelectItem key={s.id} value={String(s.id)}>
                                            {s.first_name} {s.last_name} ({s.admission_no})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {clearanceLoading && (
                            <div className="text-xs text-slate-500 py-4">Verifying library registry...</div>
                        )}

                        {clearanceResult && !clearanceLoading && (
                            <div className="space-y-4 pt-2 border-t border-slate-100">
                                <div className={`p-4 rounded-xl border flex items-center gap-3 ${clearanceResult.cleared ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'}`}>
                                    {clearanceResult.cleared ? (
                                        <>
                                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                            <div>
                                                <h3 className="text-sm font-bold">Library Clearance Approved</h3>
                                                <p className="text-xs text-emerald-700 mt-0.5">Student has no outstanding books or unpaid replacement fines. Ready for clearance certificate sign-off.</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                                            <div>
                                                <h3 className="text-sm font-bold">Clearance Blocked — Outstanding Liabilities</h3>
                                                <p className="text-xs text-red-700 mt-0.5">Student has unreturned books or unpaid lost book fines that must be resolved first.</p>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* MODAL 1: ADD/EDIT BOOK */}
            <Dialog open={bookModalOpen} onOpenChange={setBookModalOpen}>
                <DialogContent className="sm:max-w-lg rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900">{editingBook ? 'Edit Book Title' : 'Add Book Title to Catalog'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleBookSubmit} className="space-y-4 pt-2">
                        <div>
                            <Label className="text-xs font-bold">Book Title *</Label>
                            <Input value={bookForm.data.title} onChange={e => bookForm.setData('title', e.target.value)} placeholder="e.g. Blossoms of the Savannah" className="h-9 text-xs mt-1" required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Author *</Label>
                                <Input value={bookForm.data.author} onChange={e => bookForm.setData('author', e.target.value)} placeholder="e.g. Henry Ole Kulet" className="h-9 text-xs mt-1" required />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Category *</Label>
                                <Input value={bookForm.data.category} onChange={e => bookForm.setData('category', e.target.value)} placeholder="e.g. Setbooks, Sciences, CBC" className="h-9 text-xs mt-1" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">ISBN</Label>
                                <Input value={bookForm.data.isbn} onChange={e => bookForm.setData('isbn', e.target.value)} placeholder="978-..." className="h-9 text-xs mt-1 font-mono" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Shelf / Location</Label>
                                <Input value={bookForm.data.location} onChange={e => bookForm.setData('location', e.target.value)} placeholder="e.g. Section A-1" className="h-9 text-xs mt-1" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Publisher</Label>
                                <Input value={bookForm.data.publisher} onChange={e => bookForm.setData('publisher', e.target.value)} placeholder="KLB, Oxford" className="h-9 text-xs mt-1" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Unit Price (KES)</Label>
                                <Input type="number" step="0.01" value={bookForm.data.price} onChange={e => bookForm.setData('price', e.target.value)} placeholder="850" className="h-9 text-xs mt-1 font-mono" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Total Copies *</Label>
                                <Input type="number" value={bookForm.data.total_copies} onChange={e => bookForm.setData('total_copies', Number(e.target.value))} className="h-9 text-xs mt-1 font-mono" min={1} required />
                            </div>
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setBookModalOpen(false)} className="h-9 text-xs rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={bookForm.processing} className="h-9 text-xs font-bold px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl">Save Title</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 2: BULK CSV IMPORT */}
            <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-teal-600" />
                            <span>Bulk Import Book Catalog</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Upload a CSV or Excel-exported file containing your school's library inventory.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleImportSubmit} className="space-y-4 pt-2">
                        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3 flex items-start justify-between gap-3">
                            <div className="space-y-0.5">
                                <span className="text-xs font-bold text-teal-900 block">Need the standard column format?</span>
                                <span className="text-[11px] text-teal-700 block">Download our pre-formatted template with sample textbook rows.</span>
                            </div>
                            <a
                                href="/school/library/books/template"
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] shrink-0 transition-colors shadow-2xs"
                            >
                                <Download className="w-3 h-3" />
                                <span>Get Template</span>
                            </a>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-slate-700">Select CSV File *</Label>
                            <Input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,text/csv,application/vnd.ms-excel"
                                onChange={e => importForm.setData('file', e.target.files?.[0] || null)}
                                className="h-10 text-xs file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                                required
                            />
                        </div>

                        <div className="text-[11px] text-slate-500 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                            <p className="font-semibold text-slate-700">Import Notes:</p>
                            <ul className="list-disc pl-4 space-y-0.5">
                                <li>Matching titles/ISBNs will automatically increment existing copy counts.</li>
                                <li>New titles will be created with available copies equal to total copies.</li>
                            </ul>
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setImportModalOpen(false)} className="h-9 text-xs rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={importForm.processing} className="h-9 text-xs font-bold px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl">
                                {importForm.processing ? 'Importing...' : 'Start Import'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 3: ISSUE BOOK */}
            <Dialog open={issueModalOpen} onOpenChange={setIssueModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader><DialogTitle className="text-base font-bold text-slate-900">Issue Book to Borrower</DialogTitle></DialogHeader>
                    <form onSubmit={handleIssueSubmit} className="space-y-4 pt-2">
                        <div>
                            <Label className="text-xs font-bold">Select Book *</Label>
                            <Select value={issueForm.data.book_id} onValueChange={v => issueForm.setData('book_id', v)}>
                                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select available book..." /></SelectTrigger>
                                <SelectContent>
                                    {books.data.filter(b => b.available_copies > 0).map(b => (
                                        <SelectItem key={b.id} value={String(b.id)}>
                                            {b.title} ({b.available_copies} available)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Borrower Type *</Label>
                                <Select value={issueForm.data.member_type} onValueChange={(v: any) => issueForm.setData(p => ({ ...p, member_type: v, member_id: '' }))}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="student">Student</SelectItem>
                                        <SelectItem value="staff">Staff Member</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Select Borrower *</Label>
                                <Select value={issueForm.data.member_id} onValueChange={v => issueForm.setData('member_id', v)}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                                    <SelectContent>
                                        {issueForm.data.member_type === 'student' ? (
                                            students.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.first_name} {s.last_name} ({s.admission_no})</SelectItem>)
                                        ) : (
                                            staffList.map(st => <SelectItem key={st.id} value={String(st.id)}>{st.first_name} {st.last_name}</SelectItem>)
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Issued Date *</Label>
                                <Input type="date" value={issueForm.data.issued_date} onChange={e => issueForm.setData('issued_date', e.target.value)} className="h-9 text-xs mt-1 font-mono" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Due Date *</Label>
                                <Input type="date" value={issueForm.data.due_date} onChange={e => issueForm.setData('due_date', e.target.value)} className="h-9 text-xs mt-1 font-mono" />
                            </div>
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setIssueModalOpen(false)} className="h-9 text-xs rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={issueForm.processing} className="h-9 text-xs font-bold px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl">Issue Book</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 4: RETURN BOOK */}
            <Dialog open={!!returnModalOpen} onOpenChange={() => setReturnModalOpen(null)}>
                <DialogContent className="sm:max-w-sm rounded-2xl">
                    <DialogHeader><DialogTitle className="text-base font-bold text-slate-900">Record Book Return</DialogTitle></DialogHeader>
                    <form onSubmit={handleReturnSubmit} className="space-y-4 pt-2">
                        <div className="rounded-xl bg-slate-50 p-3 text-xs">
                            <p className="font-bold text-slate-900">{returnModalOpen?.book?.title}</p>
                            <p className="text-slate-500 mt-0.5">Borrower: {returnModalOpen?.member_name}</p>
                        </div>
                        <div>
                            <Label className="text-xs font-bold">Return Date *</Label>
                            <Input type="date" value={returnForm.data.returned_date} onChange={e => returnForm.setData('returned_date', e.target.value)} className="h-9 text-xs mt-1 font-mono" />
                        </div>
                        <div className="space-y-2 pt-1">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="charge_fine"
                                    checked={returnForm.data.charge_fine}
                                    onChange={e => returnForm.setData('charge_fine', e.target.checked)}
                                    className="rounded border-slate-300"
                                />
                                <Label htmlFor="charge_fine" className="text-xs">Charge late return fee</Label>
                            </div>
                            {returnForm.data.charge_fine && (
                                <div>
                                    <Label className="text-xs font-bold">Late Fine Amount (KES)</Label>
                                    <Input type="number" step="0.01" value={returnForm.data.late_fine} onChange={e => returnForm.setData('late_fine', e.target.value)} className="h-9 text-xs mt-1 font-mono" />
                                </div>
                            )}
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setReturnModalOpen(null)} className="h-9 text-xs rounded-xl">Cancel</Button>
                            <Button type="submit" className="h-9 text-xs font-bold px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl">Confirm Return</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 5: MARK AS LOST */}
            <Dialog open={!!lostModalOpen} onOpenChange={() => setLostModalOpen(null)}>
                <DialogContent className="sm:max-w-sm rounded-2xl">
                    <DialogHeader><DialogTitle className="text-base font-bold text-slate-900">Mark Book as Lost</DialogTitle></DialogHeader>
                    <form onSubmit={handleLostSubmit} className="space-y-4 pt-2">
                        <div className="rounded-xl bg-red-50 p-3 text-xs text-red-900 border border-red-200">
                            <p className="font-bold">{lostModalOpen?.book?.title}</p>
                            <p className="text-red-700 mt-0.5">Borrower: {lostModalOpen?.member_name}</p>
                        </div>
                        <div>
                            <Label className="text-xs font-bold">Replacement Charge / Fine (KES) *</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={lostForm.data.replacement_charge}
                                onChange={e => lostForm.setData('replacement_charge', e.target.value)}
                                placeholder="1200"
                                className="h-9 text-xs mt-1 font-mono"
                            />
                        </div>
                        <div>
                            <Label className="text-xs font-bold">Notes</Label>
                            <Textarea
                                rows={2}
                                value={lostForm.data.note}
                                onChange={e => lostForm.setData('note', e.target.value)}
                                placeholder="Circumstances of loss..."
                                className="text-xs resize-none mt-1"
                            />
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setLostModalOpen(null)} className="h-9 text-xs rounded-xl">Cancel</Button>
                            <Button type="submit" className="h-9 text-xs font-bold px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl">Assess Replacement Fee</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}