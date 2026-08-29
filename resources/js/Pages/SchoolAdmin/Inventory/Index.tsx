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
    Package, Plus, Pencil, Trash2, CheckCircle2, RotateCcw, AlertTriangle, 
    Boxes, ShoppingCart, Tag, Search, Download, Upload, Printer, FileSpreadsheet, AlertCircle
} from 'lucide-react';
import type { PageProps, Staff } from '@/types';

interface CategoryItem {
    id: number;
    name: string;
}

interface InventoryItemData {
    id: number;
    category_id: number;
    name: string;
    unit: string;
    current_stock: number;
    minimum_stock: number;
    description?: string;
    category?: CategoryItem;
}

interface StoreIssueItem {
    id: number;
    item_id: number;
    issued_to_type: string;
    issued_to_name: string;
    quantity: number;
    issue_date: string;
    return_date?: string;
    purpose?: string;
    status: 'issued' | 'consumed' | 'returned';
    notes?: string;
    item?: InventoryItemData;
}

interface PurchaseItem {
    id: number;
    item_id: number;
    vendor?: string;
    purchase_date: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    invoice_no?: string;
    notes?: string;
    item?: InventoryItemData;
}

interface AssetItem {
    id: number;
    name: string;
    asset_code?: string;
    category: string;
    purchase_date: string;
    purchase_price: number;
    current_value: number;
    location?: string;
    status: string;
}

interface Props extends PageProps {
    items: { data: InventoryItemData[]; current_page: number; last_page: number; total?: number };
    issues: { data: StoreIssueItem[]; current_page: number; last_page: number; total?: number };
    purchases: { data: PurchaseItem[]; current_page: number; last_page: number; total?: number };
    assets: { data: AssetItem[]; current_page: number; last_page: number; total?: number };
    categories: CategoryItem[];
    departments: Array<{ id: number; name: string; code?: string }>;
    staffList: Staff[];
    allItems: Array<{ id: number; name: string; unit: string; current_stock: number }>;
    stats: {
        total_items: number;
        low_stock_count: number;
        total_asset_cost: number;
        total_asset_value: number;
        active_store_issues: number;
    };
    filters: { search?: string; category_id?: string; issue_status?: string; asset_search?: string; asset_status?: string };
}

export default function InventoryIndex({
    items,
    issues,
    purchases,
    assets,
    categories = [],
    departments = [],
    staffList = [],
    allItems = [],
    stats,
    filters,
}: Props) {
    const { flash, errors: pageErrors } = usePage<PageProps>().props;
    const [activeTab, setActiveTab] = useState<'stock' | 'issues' | 'purchases' | 'assets' | 'categories'>('stock');

    // Modals
    const [itemModalOpen, setItemModalOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItemData | null>(null);
    const [issueModalOpen, setIssueModalOpen] = useState(false);
    const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
    const [assetModalOpen, setAssetModalOpen] = useState(false);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Item Form
    const itemForm = useForm({
        name: '',
        category_id: categories.length > 0 ? String(categories[0].id) : '',
        unit: 'pcs',
        current_stock: '0',
        minimum_stock: '5',
        description: '',
    });

    // Import Form
    const importForm = useForm<{ file: File | null }>({
        file: null,
    });

    // Category Form
    const categoryForm = useForm({
        name: '',
        description: '',
    });

    function openItemCreate() {
        itemForm.reset();
        if (categories.length > 0) itemForm.setData('category_id', String(categories[0].id));
        setEditingItem(null);
        setItemModalOpen(true);
    }

    function openItemEdit(it: InventoryItemData) {
        setEditingItem(it);
        itemForm.setData({
            name: it.name,
            category_id: String(it.category_id),
            unit: it.unit,
            current_stock: String(it.current_stock),
            minimum_stock: String(it.minimum_stock),
            description: it.description || '',
        });
        setItemModalOpen(true);
    }

    function handleItemSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingItem) {
            itemForm.put(`/school/inventory/items/${editingItem.id}`, {
                onSuccess: () => { setItemModalOpen(false); itemForm.reset(); },
            });
        } else {
            itemForm.post('/school/inventory/items', {
                onSuccess: () => { setItemModalOpen(false); itemForm.reset(); },
            });
        }
    }

    function handleItemDelete(id: number) {
        if (confirm('Are you sure you want to delete this inventory item?')) {
            router.delete(`/school/inventory/items/${id}`);
        }
    }

    function handleImportSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!importForm.data.file) {
            alert('Please select a CSV file.');
            return;
        }

        importForm.post('/school/inventory/items/import', {
            preserveScroll: true,
            onSuccess: () => {
                setImportModalOpen(false);
                importForm.reset();
                if (fileInputRef.current) fileInputRef.current.value = '';
            },
        });
    }

    function handleCategorySubmit(e: React.FormEvent) {
        e.preventDefault();
        categoryForm.post('/school/inventory/categories', {
            onSuccess: () => { setCategoryModalOpen(false); categoryForm.reset(); },
        });
    }

    function triggerPrint() {
        window.print();
    }

    return (
        <AppLayout title="Stores, Inventory & Asset Registry">
            <div className="space-y-6 max-w-7xl mx-auto pb-16">
                
                {/* Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Boxes className="w-5 h-5 text-teal-600" />
                            <span>Stores, Inventory & Asset Registry</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Consumable inventory stock, bulk CSV imports, departmental requisitions, procurement deliveries, and fixed asset valuation ledger.
                        </p>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap items-center gap-2">
                        {activeTab === 'stock' && (
                            <>
                                <a
                                    href="/school/inventory/items/export"
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
                                    <span>Print Inventory</span>
                                </Button>

                                <Button
                                    onClick={openItemCreate}
                                    className="h-9 px-4 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-2xs flex items-center gap-1.5"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Add Store Item</span>
                                </Button>
                            </>
                        )}

                        {activeTab === 'categories' && (
                            <Button
                                onClick={() => setCategoryModalOpen(true)}
                                className="h-9 px-4 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-2xs flex items-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" />
                                <span>New Category</span>
                            </Button>
                        )}
                    </div>
                </div>

                {/* Print Header */}
                <div className="hidden print:block mb-6 border-b pb-4">
                    <h1 className="text-xl font-black text-black">EduFlow Institutional Stores Inventory & Asset Register</h1>
                    <p className="text-xs text-gray-600 mt-1">
                        Export Timestamp: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • Total Registered Items: {stats?.total_items ?? 0} • Low Stock Alert: {stats?.low_stock_count ?? 0}
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
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Catalog Items</span>
                        <p className="text-2xl font-black text-slate-900 mt-1">{stats?.total_items ?? 0}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Low Stock Reorders</span>
                        <p className="text-2xl font-black text-amber-600 mt-1">{stats?.low_stock_count ?? 0}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fixed Asset Valuation</span>
                        <p className="text-2xl font-black text-indigo-600 mt-1">KES {Number(stats?.total_asset_value ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Returnable Issues</span>
                        <p className="text-2xl font-black text-emerald-600 mt-1">{stats?.active_store_issues ?? 0}</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 gap-6 print:hidden">
                    <button
                        onClick={() => setActiveTab('stock')}
                        className={`pb-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'stock' ? 'border-teal-600 text-teal-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        Store Inventory & Stock
                    </button>
                    <button
                        onClick={() => setActiveTab('issues')}
                        className={`pb-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'issues' ? 'border-teal-600 text-teal-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        Store Issues & Requisitions
                    </button>
                    <button
                        onClick={() => setActiveTab('purchases')}
                        className={`pb-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'purchases' ? 'border-teal-600 text-teal-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        Purchases & Restocking Log
                    </button>
                    <button
                        onClick={() => setActiveTab('assets')}
                        className={`pb-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'assets' ? 'border-teal-600 text-teal-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        Fixed Asset Register
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`pb-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'categories' ? 'border-teal-600 text-teal-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        Item Categories
                    </button>
                </div>

                {/* TAB 1: STORE INVENTORY & STOCK */}
                {activeTab === 'stock' && (
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-3 print:hidden">
                            <div className="w-full sm:w-80 relative">
                                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                                <Input
                                    value={filters?.search ?? ''}
                                    onChange={e => router.get('/school/inventory/items', { ...filters, search: e.target.value || undefined }, { preserveState: true })}
                                    placeholder="Search inventory items..."
                                    className="h-9 text-xs pl-8 rounded-xl"
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50/80 border-b border-slate-200">
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Item Name</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Category</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Unit of Measure</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-center">Current Stock</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-center">Min. Threshold</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-center">Stock Status</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-right print:hidden">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="font-medium text-xs divide-y divide-slate-100">
                                    {items.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-16 text-slate-400">
                                                No inventory items registered in the store catalog. Click <strong>Bulk Import</strong> to upload an Excel/CSV file or add items manually.
                                            </TableCell>
                                        </TableRow>
                                    ) : items.data.map(item => {
                                        const isLow = Number(item.current_stock) <= Number(item.minimum_stock);
                                        return (
                                            <TableRow key={item.id} className="hover:bg-slate-50/60 transition-colors">
                                                <TableCell className="py-3 px-4">
                                                    <p className="font-bold text-slate-900">{item.name}</p>
                                                    {item.description && <p className="text-[10px] text-slate-400">{item.description}</p>}
                                                </TableCell>
                                                <TableCell className="py-3 px-4">
                                                    <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 text-slate-700 border-slate-200">
                                                        {item.category?.name || 'General'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-slate-600 font-mono">{item.unit}</TableCell>
                                                <TableCell className="py-3 px-4 font-mono font-bold text-center text-slate-900">{item.current_stock}</TableCell>
                                                <TableCell className="py-3 px-4 font-mono text-center text-slate-500">{item.minimum_stock}</TableCell>
                                                <TableCell className="py-3 px-4 text-center">
                                                    <Badge variant="outline" className={`text-[10px] font-bold ${isLow ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                                                        {isLow ? 'Low Stock' : 'In Stock'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-3 px-4 text-right print:hidden">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button size="sm" variant="outline" onClick={() => openItemEdit(item)} className="h-7 px-2 text-xs font-bold rounded-lg border-slate-200 hover:bg-slate-100">
                                                            <Pencil className="w-3 h-3 mr-1" /> Edit
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={() => handleItemDelete(item.id)} className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                {/* TAB 2: STORE ISSUES */}
                {activeTab === 'issues' && (
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/80 border-b border-slate-200">
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Item Issued</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Issued To</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-center">Quantity</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Issue Date</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="font-medium text-xs divide-y divide-slate-100">
                                {issues.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-16 text-slate-400">
                                            No active store issue records found.
                                        </TableCell>
                                    </TableRow>
                                ) : issues.data.map(iss => (
                                    <TableRow key={iss.id} className="hover:bg-slate-50/50">
                                        <TableCell className="py-3 px-4 font-bold text-slate-900">{iss.item?.name}</TableCell>
                                        <TableCell className="py-3 px-4">{iss.issued_to_name}</TableCell>
                                        <TableCell className="py-3 px-4 text-center font-mono font-bold">{iss.quantity} {iss.item?.unit}</TableCell>
                                        <TableCell className="py-3 px-4 font-mono text-slate-600">{iss.issue_date}</TableCell>
                                        <TableCell className="py-3 px-4 text-center">
                                            <Badge variant="outline" className={`capitalize text-[10px] font-bold ${iss.status === 'returned' ? 'bg-emerald-50 text-emerald-800' : 'bg-indigo-50 text-indigo-800'}`}>
                                                {iss.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* TAB 3: PURCHASES LOG */}
                {activeTab === 'purchases' && (
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/80 border-b border-slate-200">
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Item</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Supplier</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-center">Qty</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Unit Price</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Total Price</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Date</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="font-medium text-xs divide-y divide-slate-100">
                                {purchases.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                                            No store restocking purchases recorded.
                                        </TableCell>
                                    </TableRow>
                                ) : purchases.data.map(p => (
                                    <TableRow key={p.id} className="hover:bg-slate-50/50">
                                        <TableCell className="py-3 px-4 font-bold text-slate-900">{p.item?.name}</TableCell>
                                        <TableCell className="py-3 px-4 text-slate-700">{p.vendor || 'Local Vendor'}</TableCell>
                                        <TableCell className="py-3 px-4 text-center font-mono font-bold">{p.quantity} {p.item?.unit}</TableCell>
                                        <TableCell className="py-3 px-4 font-mono">KES {Number(p.unit_price).toLocaleString()}</TableCell>
                                        <TableCell className="py-3 px-4 font-mono font-bold text-emerald-600">KES {Number(p.total_price).toLocaleString()}</TableCell>
                                        <TableCell className="py-3 px-4 font-mono text-slate-600">{p.purchase_date}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* TAB 4: ASSETS */}
                {activeTab === 'assets' && (
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/80 border-b border-slate-200">
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Asset Name</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Category</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Location</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Cost Price</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Current Value</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="font-medium text-xs divide-y divide-slate-100">
                                {assets.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                                            No fixed institutional assets registered.
                                        </TableCell>
                                    </TableRow>
                                ) : assets.data.map(a => (
                                    <TableRow key={a.id} className="hover:bg-slate-50/50">
                                        <TableCell className="py-3 px-4 font-bold text-slate-900">{a.name}</TableCell>
                                        <TableCell className="py-3 px-4"><Badge variant="outline" className="text-[10px]">{a.category}</Badge></TableCell>
                                        <TableCell className="py-3 px-4 text-slate-600">{a.location || 'Main Campus'}</TableCell>
                                        <TableCell className="py-3 px-4 font-mono">KES {Number(a.purchase_price).toLocaleString()}</TableCell>
                                        <TableCell className="py-3 px-4 font-mono font-bold text-indigo-600">KES {Number(a.current_value).toLocaleString()}</TableCell>
                                        <TableCell className="py-3 px-4 text-center">
                                            <Badge variant="outline" className="capitalize text-[10px] font-bold bg-emerald-50 text-emerald-800 border-emerald-200">
                                                {a.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* TAB 5: CATEGORIES */}
                {activeTab === 'categories' && (
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50/80 border-b border-slate-200">
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Category Name</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="font-medium text-xs divide-y divide-slate-100">
                                {categories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center py-16 text-slate-400">No categories created yet.</TableCell>
                                    </TableRow>
                                ) : categories.map(c => (
                                    <TableRow key={c.id} className="hover:bg-slate-50/50">
                                        <TableCell className="py-3 px-4 font-bold text-slate-900">{c.name}</TableCell>
                                        <TableCell className="py-3 px-4 text-right">
                                            <Button size="sm" variant="ghost" onClick={() => router.delete(`/school/inventory/categories/${c.id}`)} className="h-7 w-7 p-0 text-red-500 hover:text-red-700">
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* MODAL 1: ADD/EDIT STORE ITEM */}
            <Dialog open={itemModalOpen} onOpenChange={setItemModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold text-slate-900">{editingItem ? 'Edit Store Item' : 'Add Store Inventory Item'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleItemSubmit} className="space-y-4 pt-2">
                        <div>
                            <Label className="text-xs font-bold">Item Name *</Label>
                            <Input value={itemForm.data.name} onChange={e => itemForm.setData('name', e.target.value)} placeholder="e.g. A4 Printing Paper" className="h-9 text-xs mt-1" required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Category *</Label>
                                <Select value={itemForm.data.category_id} onValueChange={v => itemForm.setData('category_id', v)}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                                    <SelectContent>
                                        {categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Unit of Measure *</Label>
                                <Input value={itemForm.data.unit} onChange={e => itemForm.setData('unit', e.target.value)} placeholder="e.g. reams, pcs, boxes" className="h-9 text-xs mt-1" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Current Stock</Label>
                                <Input type="number" step="0.01" value={itemForm.data.current_stock} onChange={e => itemForm.setData('current_stock', e.target.value)} className="h-9 text-xs mt-1 font-mono" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Minimum Stock Alert *</Label>
                                <Input type="number" step="0.01" value={itemForm.data.minimum_stock} onChange={e => itemForm.setData('minimum_stock', e.target.value)} className="h-9 text-xs mt-1 font-mono" required />
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs font-bold">Description / Notes</Label>
                            <Textarea value={itemForm.data.description} onChange={e => itemForm.setData('description', e.target.value)} placeholder="Specification or storage location..." className="text-xs resize-none mt-1" rows={2} />
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setItemModalOpen(false)} className="h-9 text-xs rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={itemForm.processing} className="h-9 text-xs font-bold px-5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl">Save Item</Button>
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
                            <span>Bulk Import Store Inventory</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            Upload a CSV file of stationery, laboratory supplies, sports equipment, or maintenance items.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleImportSubmit} className="space-y-4 pt-2">
                        <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-3 flex items-start justify-between gap-3">
                            <div className="space-y-0.5">
                                <span className="text-xs font-bold text-teal-900 block">Download Starter Template</span>
                                <span className="text-[11px] text-teal-700 block">Pre-formatted template with standard school store items.</span>
                            </div>
                            <a
                                href="/school/inventory/items/template"
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
                                <li>New categories in the CSV file will be automatically registered.</li>
                                <li>Matching item names will replenish and add to current stock balances.</li>
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

            {/* MODAL 3: NEW CATEGORY */}
            <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
                <DialogContent className="sm:max-w-sm rounded-2xl">
                    <DialogHeader><DialogTitle className="text-base font-bold text-slate-900">New Item Category</DialogTitle></DialogHeader>
                    <form onSubmit={handleCategorySubmit} className="space-y-4 pt-2">
                        <div>
                            <Label className="text-xs font-bold">Category Name *</Label>
                            <Input value={categoryForm.data.name} onChange={e => categoryForm.setData('name', e.target.value)} placeholder="e.g. Science Lab Supplies" className="h-9 text-xs mt-1" required />
                        </div>
                        <div>
                            <Label className="text-xs font-bold">Description</Label>
                            <Input value={categoryForm.data.description} onChange={e => categoryForm.setData('description', e.target.value)} placeholder="e.g. Chemicals and glassware" className="h-9 text-xs mt-1" />
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setCategoryModalOpen(false)} className="h-9 text-xs rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={categoryForm.processing} className="h-9 text-xs font-bold px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl">Create Category</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}