import { useState } from 'react';
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
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    Package, Plus, Pencil, Trash2, CheckCircle2, RotateCcw, AlertTriangle, Boxes, ShoppingCart, Tag, Search
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
    purpose: string;
    status: 'issued' | 'consumed' | 'returned';
    notes?: string;
    item?: InventoryItemData;
}

interface PurchaseItem {
    id: number;
    item_id: number;
    vendor: string;
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
    asset_code: string;
    category: string;
    purchase_date: string;
    purchase_price: number;
    current_value: number;
    depreciation_method?: string;
    depreciation_rate?: number;
    location: string;
    assigned_to?: string;
    status: 'active' | 'in_maintenance' | 'disposed';
    description?: string;
}

interface Props extends PageProps {
    items: { data: InventoryItemData[]; current_page: number; last_page: number };
    issues: { data: StoreIssueItem[]; current_page: number; last_page: number };
    purchases: { data: PurchaseItem[]; current_page: number; last_page: number };
    assets: { data: AssetItem[]; current_page: number; last_page: number };
    categories: CategoryItem[];
    departments: { id: number; name: string; code?: string }[];
    staffList: Staff[];
    allItems: InventoryItemData[];
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
    const { flash } = usePage<PageProps>().props;
    const [activeTab, setActiveTab] = useState<'items' | 'issues' | 'purchases' | 'assets' | 'categories'>('items');

    // Modals
    const [itemModalOpen, setItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItemData | null>(null);
    const [issueModalOpen, setIssueModalOpen] = useState(false);
    const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
    const [assetModalOpen, setAssetModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<AssetItem | null>(null);
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);
    const [returnModalOpen, setReturnModalOpen] = useState<StoreIssueItem | null>(null);

    // Item Form
    const itemForm = useForm({
        category_id: categories.length > 0 ? String(categories[0].id) : '',
        name: '',
        unit: 'reams',
        current_stock: 0,
        minimum_stock: 5,
        description: '',
    });

    // Issue Form
    const issueForm = useForm({
        item_id: allItems.length > 0 ? String(allItems[0].id) : '',
        issued_to_type: 'staff' as 'staff' | 'department' | 'student',
        issued_to_id: '',
        issued_to_name: '',
        quantity: 1,
        issue_date: new Date().toISOString().split('T')[0],
        return_date: '',
        purpose: 'Teaching & Classroom Supplies',
        status: 'consumed' as 'issued' | 'consumed' | 'returned',
        notes: '',
    });

    // Purchase Form
    const purchaseForm = useForm({
        item_id: allItems.length > 0 ? String(allItems[0].id) : '',
        vendor: '',
        purchase_date: new Date().toISOString().split('T')[0],
        quantity: 10,
        unit_price: '500',
        invoice_no: '',
        notes: '',
    });

    // Asset Form
    const assetForm = useForm({
        name: '',
        asset_code: `AST-${Math.floor(1000 + Math.random() * 9000)}`,
        category: 'Electronics',
        purchase_date: new Date().toISOString().split('T')[0],
        purchase_price: '0',
        current_value: '0',
        depreciation_method: 'Straight Line',
        depreciation_rate: '10',
        location: 'Main Administration Block',
        assigned_to: '',
        status: 'active' as 'active' | 'in_maintenance' | 'disposed',
        description: '',
    });

    // Category Form
    const categoryForm = useForm({
        name: '',
        description: '',
    });

    // Return Form
    const returnForm = useForm({
        return_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    // Item actions
    function openItemCreate() {
        itemForm.reset();
        setEditingItem(null);
        setItemModalOpen(true);
    }

    function openItemEdit(item: InventoryItemData) {
        setEditingItem(item);
        itemForm.setData({
            category_id: String(item.category_id),
            name: item.name,
            unit: item.unit,
            current_stock: item.current_stock,
            minimum_stock: item.minimum_stock,
            description: item.description || '',
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
        if (confirm('Are you sure you want to remove this item from the catalog?')) {
            router.delete(`/school/inventory/items/${id}`);
        }
    }

    // Issue actions
    function handleIssueSubmit(e: React.FormEvent) {
        e.preventDefault();
        issueForm.post('/school/inventory/issues', {
            preserveScroll: true,
            onSuccess: () => { setIssueModalOpen(false); issueForm.reset(); },
        });
    }

    function handleReturnSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!returnModalOpen) return;
        returnForm.put(`/school/inventory/issues/${returnModalOpen.id}/return`, {
            preserveScroll: true,
            onSuccess: () => { setReturnModalOpen(null); returnForm.reset(); },
        });
    }

    // Purchase actions
    function handlePurchaseSubmit(e: React.FormEvent) {
        e.preventDefault();
        purchaseForm.post('/school/inventory/purchases', {
            preserveScroll: true,
            onSuccess: () => { setPurchaseModalOpen(false); purchaseForm.reset(); },
        });
    }

    // Asset actions
    function openAssetCreate() {
        assetForm.reset();
        setEditingAsset(null);
        setAssetModalOpen(true);
    }

    function openAssetEdit(asset: AssetItem) {
        setEditingAsset(asset);
        assetForm.setData({
            name: asset.name,
            asset_code: asset.asset_code,
            category: asset.category,
            purchase_date: asset.purchase_date,
            purchase_price: String(asset.purchase_price),
            current_value: String(asset.current_value),
            depreciation_method: asset.depreciation_method || 'Straight Line',
            depreciation_rate: String(asset.depreciation_rate || 10),
            location: asset.location,
            assigned_to: asset.assigned_to || '',
            status: asset.status,
            description: asset.description || '',
        });
        setAssetModalOpen(true);
    }

    function handleAssetSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (editingAsset) {
            assetForm.put(`/school/inventory/assets/${editingAsset.id}`, {
                onSuccess: () => { setAssetModalOpen(false); assetForm.reset(); },
            });
        } else {
            assetForm.post('/school/inventory/assets', {
                onSuccess: () => { setAssetModalOpen(false); assetForm.reset(); },
            });
        }
    }

    function handleAssetDelete(id: number) {
        if (confirm('Are you sure you want to remove this fixed asset record?')) {
            router.delete(`/school/inventory/assets/${id}`);
        }
    }

    // Category actions
    function handleCategorySubmit(e: React.FormEvent) {
        e.preventDefault();
        categoryForm.post('/school/inventory/categories', {
            preserveScroll: true,
            onSuccess: () => { setCategoryModalOpen(false); categoryForm.reset(); },
        });
    }

    function handleCategoryDelete(id: number) {
        if (confirm('Are you sure you want to delete this category?')) {
            router.delete(`/school/inventory/categories/${id}`);
        }
    }

    return (
        <AppLayout title="Stores, Inventory & Fixed Assets Management">
            <div className="space-y-6 max-w-7xl mx-auto pb-16">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Package className="w-5 h-5 text-indigo-600" />
                            <span>Stores, Inventory & Asset Registry</span>
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Consumable inventory stock, departmental store requisitions, procurement deliveries, and fixed asset valuation ledger.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {activeTab === 'items' && (
                            <Button onClick={openItemCreate} className="h-9 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-2xs flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Add Store Item
                            </Button>
                        )}
                        {activeTab === 'issues' && (
                            <Button onClick={() => { issueForm.reset(); setIssueModalOpen(true); }} className="h-9 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-2xs flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Issue Store Stock
                            </Button>
                        )}
                        {activeTab === 'purchases' && (
                            <Button onClick={() => { purchaseForm.reset(); setPurchaseModalOpen(true); }} className="h-9 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-2xs flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Record Goods Received
                            </Button>
                        )}
                        {activeTab === 'assets' && (
                            <Button onClick={openAssetCreate} className="h-9 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-2xs flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Register Fixed Asset
                            </Button>
                        )}
                        {activeTab === 'categories' && (
                            <Button onClick={() => { categoryForm.reset(); setCategoryModalOpen(true); }} className="h-9 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-2xs flex items-center gap-2">
                                <Plus className="w-4 h-4" /> New Category
                            </Button>
                        )}
                    </div>
                </div>

                {flash?.success && (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-xs text-emerald-800 font-medium flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Catalog Items</span>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.total_items ?? 0}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Low Stock Reorders</span>
                        <p className="text-2xl font-bold text-amber-600 mt-1">{stats?.low_stock_count ?? 0}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Fixed Asset Valuation</span>
                        <p className="text-2xl font-bold text-indigo-600 mt-1">KES {Number(stats?.total_asset_value ?? 0).toLocaleString()}</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Returnable Issues</span>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">{stats?.active_store_issues ?? 0}</p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex border-b border-slate-200 gap-6">
                    <button
                        onClick={() => setActiveTab('items')}
                        className={`pb-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'items' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        Store Inventory & Stock
                    </button>
                    <button
                        onClick={() => setActiveTab('issues')}
                        className={`pb-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'issues' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        Store Issues & Requisitions
                    </button>
                    <button
                        onClick={() => setActiveTab('purchases')}
                        className={`pb-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'purchases' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        Purchases & Restocking Log
                    </button>
                    <button
                        onClick={() => setActiveTab('assets')}
                        className={`pb-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'assets' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        Fixed Asset Register
                    </button>
                    <button
                        onClick={() => setActiveTab('categories')}
                        className={`pb-3 text-xs font-bold border-b-2 transition-colors ${activeTab === 'categories' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'}`}
                    >
                        Item Categories
                    </button>
                </div>

                {/* TAB 1: ITEMS */}
                {activeTab === 'items' && (
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="w-72">
                                <Input
                                    value={filters?.search ?? ''}
                                    onChange={e => router.get('/school/inventory', { ...filters, search: e.target.value || undefined }, { preserveState: true })}
                                    placeholder="Search inventory items..."
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Item Name</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Category</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Unit of Measure</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Current Stock</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Min. Threshold</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Stock Status</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="font-medium text-xs divide-y divide-slate-100">
                                    {items.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-16 text-slate-400">
                                                No inventory items registered in the store catalog.
                                            </TableCell>
                                        </TableRow>
                                    ) : items.data.map(item => {
                                        const isLow = item.current_stock <= item.minimum_stock;
                                        return (
                                            <TableRow key={item.id} className="hover:bg-slate-50/50">
                                                <TableCell className="py-3.5 px-4">
                                                    <p className="font-bold text-slate-900">{item.name}</p>
                                                    {item.description && <p className="text-[10px] text-slate-400">{item.description}</p>}
                                                </TableCell>
                                                <TableCell className="py-3.5 px-4 text-slate-700">{item.category?.name ?? '—'}</TableCell>
                                                <TableCell className="py-3.5 px-4 font-mono text-slate-600">{item.unit}</TableCell>
                                                <TableCell className="py-3.5 px-4 font-mono font-bold text-slate-900">
                                                    {item.current_stock}
                                                </TableCell>
                                                <TableCell className="py-3.5 px-4 font-mono text-slate-500">{item.minimum_stock}</TableCell>
                                                <TableCell className="py-3.5 px-4">
                                                    <Badge variant="outline" className={`text-[10px] font-bold ${isLow ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'}`}>
                                                        {isLow ? 'Low Stock / Reorder' : 'Adequate'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-3.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button size="sm" variant="outline" onClick={() => openItemEdit(item)} className="h-7 px-2 text-xs font-bold rounded-lg border-slate-200">
                                                            <Pencil className="w-3 h-3 mr-1" /> Edit
                                                        </Button>
                                                        <Button size="sm" variant="ghost" onClick={() => handleItemDelete(item.id)} className="h-7 w-7 p-0 text-red-500 hover:text-red-700 rounded-lg">
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
                                <TableRow className="bg-slate-50">
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Item & Quantity</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Issued To</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Purpose</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Dates</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Status</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="font-medium text-xs divide-y divide-slate-100">
                                {issues.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                                            No store issues recorded.
                                        </TableCell>
                                    </TableRow>
                                ) : issues.data.map(issue => (
                                    <TableRow key={issue.id} className="hover:bg-slate-50/50">
                                        <TableCell className="py-3.5 px-4">
                                            <p className="font-bold text-slate-900">{issue.item?.name}</p>
                                            <p className="text-[10px] text-slate-500 font-mono font-bold">{issue.quantity} {issue.item?.unit}</p>
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 text-slate-800 font-medium">
                                            {issue.issued_to_name}
                                            <span className="block text-[10px] text-slate-400 capitalize">{issue.issued_to_type}</span>
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 text-slate-600">{issue.purpose}</TableCell>
                                        <TableCell className="py-3.5 px-4 font-mono text-slate-600">
                                            <div>Issued: {issue.issue_date}</div>
                                            {issue.return_date && <div>Return: {issue.return_date}</div>}
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4">
                                            <Badge variant="outline" className={`capitalize text-[10px] font-bold ${issue.status === 'returned' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : issue.status === 'consumed' ? 'bg-slate-100 text-slate-700' : 'bg-indigo-50 text-indigo-800 border-indigo-200'}`}>
                                                {issue.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-3.5 px-4 text-right">
                                            {issue.status === 'issued' && (
                                                <Button size="sm" variant="outline" onClick={() => setReturnModalOpen(issue)} className="h-7 px-2 text-xs font-bold rounded-lg border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                                                    <RotateCcw className="w-3 h-3 mr-1" /> Mark Returned
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* TAB 3: PURCHASES */}
                {activeTab === 'purchases' && (
                    <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Restocked Item</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Vendor / Supplier</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Invoice / Ref</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Quantity</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Unit Cost (KES)</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-right">Total (KES)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="font-medium text-xs divide-y divide-slate-100">
                                {purchases.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                                            No procurement purchases or goods received recorded.
                                        </TableCell>
                                    </TableRow>
                                ) : purchases.data.map(p => (
                                    <TableRow key={p.id} className="hover:bg-slate-50/50">
                                        <TableCell className="py-3.5 px-4 font-bold text-slate-900">{p.item?.name}</TableCell>
                                        <TableCell className="py-3.5 px-4 text-slate-700">{p.vendor}</TableCell>
                                        <TableCell className="py-3.5 px-4 font-mono text-slate-500">{p.invoice_no || '—'}</TableCell>
                                        <TableCell className="py-3.5 px-4 font-mono font-bold text-slate-900">{p.quantity} {p.item?.unit}</TableCell>
                                        <TableCell className="py-3.5 px-4 font-mono">KES {Number(p.unit_price).toLocaleString()}</TableCell>
                                        <TableCell className="py-3.5 px-4 font-mono font-bold text-emerald-700 text-right">KES {Number(p.total_price).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                {/* TAB 4: ASSETS */}
                {activeTab === 'assets' && (
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <div className="w-72">
                                <Input
                                    value={filters?.asset_search ?? ''}
                                    onChange={e => router.get('/school/inventory', { ...filters, asset_search: e.target.value || undefined }, { preserveState: true })}
                                    placeholder="Search asset name, code, location..."
                                    className="h-9 text-xs"
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-slate-50">
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Asset Name & Tag</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Category</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Location</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Purchase Price</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Current Valuation</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Status</TableHead>
                                        <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="font-medium text-xs divide-y divide-slate-100">
                                    {assets.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-16 text-slate-400">
                                                No fixed assets registered in the school ledger.
                                            </TableCell>
                                        </TableRow>
                                    ) : assets.data.map(asset => (
                                        <TableRow key={asset.id} className="hover:bg-slate-50/50">
                                            <TableCell className="py-3.5 px-4">
                                                <p className="font-bold text-slate-900">{asset.name}</p>
                                                <p className="text-[10px] font-mono text-slate-400">Tag: {asset.asset_code}</p>
                                            </TableCell>
                                            <TableCell className="py-3.5 px-4 text-slate-700">{asset.category}</TableCell>
                                            <TableCell className="py-3.5 px-4 text-slate-600">{asset.location}</TableCell>
                                            <TableCell className="py-3.5 px-4 font-mono">KES {Number(asset.purchase_price).toLocaleString()}</TableCell>
                                            <TableCell className="py-3.5 px-4 font-mono font-bold text-indigo-900">KES {Number(asset.current_value).toLocaleString()}</TableCell>
                                            <TableCell className="py-3.5 px-4">
                                                <Badge variant="outline" className={`capitalize text-[10px] font-bold ${asset.status === 'active' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : asset.status === 'in_maintenance' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-100 text-slate-600'}`}>
                                                    {asset.status.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button size="sm" variant="outline" onClick={() => openAssetEdit(asset)} className="h-7 px-2 text-xs font-bold rounded-lg border-slate-200">
                                                        <Pencil className="w-3 h-3 mr-1" /> Edit
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => handleAssetDelete(asset.id)} className="h-7 w-7 p-0 text-red-500 hover:text-red-700 rounded-lg">
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

                {/* TAB 5: CATEGORIES */}
                {activeTab === 'categories' && (
                    <div className="max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4">Category Name</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-slate-500 py-3 px-4 text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="font-medium text-xs divide-y divide-slate-100">
                                {categories.map(cat => (
                                    <TableRow key={cat.id}>
                                        <TableCell className="py-3.5 px-4 font-bold text-slate-900">{cat.name}</TableCell>
                                        <TableCell className="py-3.5 px-4 text-right">
                                            <Button size="sm" variant="ghost" onClick={() => handleCategoryDelete(cat.id)} className="h-7 w-7 p-0 text-red-500">
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
                            <Input value={itemForm.data.name} onChange={e => itemForm.setData('name', e.target.value)} placeholder="e.g. A4 Ruled Exam Papers" className="h-9 text-xs mt-1" />
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
                                <Input value={itemForm.data.unit} onChange={e => itemForm.setData('unit', e.target.value)} placeholder="reams, boxes, liters" className="h-9 text-xs mt-1" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Initial Current Stock *</Label>
                                <Input type="number" value={itemForm.data.current_stock} onChange={e => itemForm.setData('current_stock', Number(e.target.value))} className="h-9 text-xs mt-1 font-mono" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Minimum Stock Alert *</Label>
                                <Input type="number" value={itemForm.data.minimum_stock} onChange={e => itemForm.setData('minimum_stock', Number(e.target.value))} className="h-9 text-xs mt-1 font-mono" />
                            </div>
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setItemModalOpen(false)} className="h-9 text-xs rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={itemForm.processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">Save Item</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 2: ISSUE STORE STOCK */}
            <Dialog open={issueModalOpen} onOpenChange={setIssueModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader><DialogTitle className="text-base font-bold text-slate-900">Issue Store Requisition</DialogTitle></DialogHeader>
                    <form onSubmit={handleIssueSubmit} className="space-y-4 pt-2">
                        <div>
                            <Label className="text-xs font-bold">Select Item *</Label>
                            <Select value={issueForm.data.item_id} onValueChange={v => issueForm.setData('item_id', v)}>
                                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select item..." /></SelectTrigger>
                                <SelectContent>
                                    {allItems.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.name} ({i.current_stock} {i.unit} in store)</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Recipient Type *</Label>
                                <Select value={issueForm.data.issued_to_type} onValueChange={(v: any) => issueForm.setData('issued_to_type', v)}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="staff">Teaching/Admin Staff</SelectItem>
                                        <SelectItem value="department">Department</SelectItem>
                                        <SelectItem value="student">Student / Prefect</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Recipient Name *</Label>
                                <Input value={issueForm.data.issued_to_name} onChange={e => issueForm.setData('issued_to_name', e.target.value)} placeholder="e.g. Science Dept / Mr. Oduor" className="h-9 text-xs mt-1" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Quantity *</Label>
                                <Input type="number" min="1" value={issueForm.data.quantity} onChange={e => issueForm.setData('quantity', Number(e.target.value))} className="h-9 text-xs mt-1 font-mono" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Issue Status *</Label>
                                <Select value={issueForm.data.status} onValueChange={(v: any) => issueForm.setData('status', v)}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="consumed">Consumed / Non-returnable</SelectItem>
                                        <SelectItem value="issued">Issued / Returnable</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs font-bold">Purpose *</Label>
                            <Input value={issueForm.data.purpose} onChange={e => issueForm.setData('purpose', e.target.value)} placeholder="e.g. End of Term Examination Printing" className="h-9 text-xs mt-1" />
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setIssueModalOpen(false)} className="h-9 text-xs rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={issueForm.processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">Issue Stock</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 3: PURCHASE RESTOCK */}
            <Dialog open={purchaseModalOpen} onOpenChange={setPurchaseModalOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader><DialogTitle className="text-base font-bold text-slate-900">Record Goods Received (Restock)</DialogTitle></DialogHeader>
                    <form onSubmit={handlePurchaseSubmit} className="space-y-4 pt-2">
                        <div>
                            <Label className="text-xs font-bold">Select Item *</Label>
                            <Select value={purchaseForm.data.item_id} onValueChange={v => purchaseForm.setData('item_id', v)}>
                                <SelectTrigger className="h-9 text-xs mt-1"><SelectValue placeholder="Select item to restock..." /></SelectTrigger>
                                <SelectContent>
                                    {allItems.map(i => <SelectItem key={i.id} value={String(i.id)}>{i.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Supplier / Vendor *</Label>
                                <Input value={purchaseForm.data.vendor} onChange={e => purchaseForm.setData('vendor', e.target.value)} placeholder="e.g. Text Book Centre" className="h-9 text-xs mt-1" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Invoice / Delivery No.</Label>
                                <Input value={purchaseForm.data.invoice_no} onChange={e => purchaseForm.setData('invoice_no', e.target.value)} placeholder="INV-2026-..." className="h-9 text-xs mt-1 font-mono" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Quantity Received *</Label>
                                <Input type="number" min="1" value={purchaseForm.data.quantity} onChange={e => purchaseForm.setData('quantity', Number(e.target.value))} className="h-9 text-xs mt-1 font-mono" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Unit Cost (KES) *</Label>
                                <Input type="number" step="0.01" value={purchaseForm.data.unit_price} onChange={e => purchaseForm.setData('unit_price', e.target.value)} className="h-9 text-xs mt-1 font-mono" />
                            </div>
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setPurchaseModalOpen(false)} className="h-9 text-xs rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={purchaseForm.processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">Restock Inventory</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 4: FIXED ASSET */}
            <Dialog open={assetModalOpen} onOpenChange={setAssetModalOpen}>
                <DialogContent className="sm:max-w-lg rounded-2xl">
                    <DialogHeader><DialogTitle className="text-base font-bold text-slate-900">{editingAsset ? 'Edit Fixed Asset' : 'Register Fixed Asset'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleAssetSubmit} className="space-y-4 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Asset Name *</Label>
                                <Input value={assetForm.data.name} onChange={e => assetForm.setData('name', e.target.value)} placeholder="e.g. Science Lab Microscope Set" className="h-9 text-xs mt-1" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Asset Code / Tag *</Label>
                                <Input value={assetForm.data.asset_code} onChange={e => assetForm.setData('asset_code', e.target.value)} className="h-9 text-xs mt-1 font-mono" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Category *</Label>
                                <Input value={assetForm.data.category} onChange={e => assetForm.setData('category', e.target.value)} placeholder="Furniture, Electronics, Vehicle" className="h-9 text-xs mt-1" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Location / Building *</Label>
                                <Input value={assetForm.data.location} onChange={e => assetForm.setData('location', e.target.value)} placeholder="Science Block, Room 10" className="h-9 text-xs mt-1" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Purchase Cost (KES) *</Label>
                                <Input type="number" step="0.01" value={assetForm.data.purchase_price} onChange={e => assetForm.setData('purchase_price', e.target.value)} className="h-9 text-xs mt-1 font-mono" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Current Net Book Value (KES) *</Label>
                                <Input type="number" step="0.01" value={assetForm.data.current_value} onChange={e => assetForm.setData('current_value', e.target.value)} className="h-9 text-xs mt-1 font-mono" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold">Assigned Personnel / Custodian</Label>
                                <Input value={assetForm.data.assigned_to} onChange={e => assetForm.setData('assigned_to', e.target.value)} placeholder="e.g. Lab Technician" className="h-9 text-xs mt-1" />
                            </div>
                            <div>
                                <Label className="text-xs font-bold">Asset Status *</Label>
                                <Select value={assetForm.data.status} onValueChange={(v: any) => assetForm.setData('status', v)}>
                                    <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Active In-Service</SelectItem>
                                        <SelectItem value="in_maintenance">Under Repair / Maintenance</SelectItem>
                                        <SelectItem value="disposed">Disposed / Written Off</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setAssetModalOpen(false)} className="h-9 text-xs rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={assetForm.processing} className="h-9 text-xs font-bold px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">Save Asset Record</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 5: CATEGORY */}
            <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
                <DialogContent className="sm:max-w-sm rounded-2xl">
                    <DialogHeader><DialogTitle className="text-base font-bold text-slate-900">New Inventory Category</DialogTitle></DialogHeader>
                    <form onSubmit={handleCategorySubmit} className="space-y-4 pt-2">
                        <div>
                            <Label className="text-xs font-bold">Category Name *</Label>
                            <Input value={categoryForm.data.name} onChange={e => categoryForm.setData('name', e.target.value)} placeholder="e.g. Boarding Provisions" className="h-9 text-xs mt-1" />
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setCategoryModalOpen(false)} className="h-9 text-xs rounded-xl">Cancel</Button>
                            <Button type="submit" disabled={categoryForm.processing} className="h-9 text-xs font-bold px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">Save Category</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL 6: RETURN ISSUE */}
            <Dialog open={!!returnModalOpen} onOpenChange={() => setReturnModalOpen(null)}>
                <DialogContent className="sm:max-w-sm rounded-2xl">
                    <DialogHeader><DialogTitle className="text-base font-bold text-slate-900">Confirm Store Item Return</DialogTitle></DialogHeader>
                    <form onSubmit={handleReturnSubmit} className="space-y-4 pt-2">
                        <div className="rounded-xl bg-slate-50 p-3 text-xs">
                            <p className="font-bold text-slate-900">{returnModalOpen?.item?.name}</p>
                            <p className="text-slate-500 mt-0.5">Quantity: {returnModalOpen?.quantity} {returnModalOpen?.item?.unit} • Issued to: {returnModalOpen?.issued_to_name}</p>
                        </div>
                        <div>
                            <Label className="text-xs font-bold">Return Date *</Label>
                            <Input type="date" value={returnForm.data.return_date} onChange={e => returnForm.setData('return_date', e.target.value)} className="h-9 text-xs mt-1 font-mono" />
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setReturnModalOpen(null)} className="h-9 text-xs rounded-xl">Cancel</Button>
                            <Button type="submit" className="h-9 text-xs font-bold px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl">Confirm Return & Restock</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}