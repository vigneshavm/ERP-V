
import React, { useState, useEffect } from 'react';
import { Sector, Branch } from '../types/common';
import { ScannedInvoice, FinalizedPurchaseItem } from '../types/purchase';
import { LayoutTemplate, Table, FileText, Save, CheckCircle2, X, IndianRupee, Plus, Barcode } from 'lucide-react';

import { Vendor } from '../types/vendor';

interface InvoiceResultProps {
    initialData: ScannedInvoice;
    file: File | null;
    sector: Sector;
    branch: Branch;
    vendors: Vendor[];
    onSave: (items: FinalizedPurchaseItem[], vendorId: string | null) => void;
    onCancel: () => void;
}

interface EditableItem {
    id: string; // Internal UUID
    sku: string;
    name: string;
    productType: string;
    category: string;
    qty: number;
    cost: number;
    margin: number;
    sellingPrice: number;
    barcode: string | null;
}

const CATEGORIES_BY_SECTOR: Record<Sector, string[]> = {
    General: ['General'],
    Pharmacy: ['Tablets', 'Syrup', 'Injections', 'Surgicals', 'H&B'],
    Electronics: ['Mobiles', 'Laptops', 'Accessories', 'Home Appliances'],
    Grocery: ['Vegetables', 'Fruits', 'Rice', 'Spices', 'Dal', 'Oil', 'Snacks'],
    Supermarket: ['Grocery', 'Beverages', 'Snacks', 'Household', 'Personal Care', 'Dairy', 'Frozen'],
    Textile: ['Saree', 'Kurta', 'Shirt', 'Trousers', 'Fabric', 'Accessories', 'Kids Wear'],
    'Mobile Shop': ['Smartphones', 'Accessories', 'Tablets', 'Audio', 'Chargers', 'Wearables'],
    Services: ['Installation', 'Repair', 'Maintenance', 'Consulting'],
    FMCG: ['Biscuits', 'Snacks', 'Beverages', 'Personal Care', 'Dairy']
};



const Previewer: React.FC<{ file: File | null; fileUrl: string | null }> = ({ file, fileUrl }) => {
    if (!file) return <div className="flex items-center justify-center h-full text-slate-500">No file uploaded</div>;

    if (file.type.startsWith('image/')) {
        return (
            <div className="h-full w-full overflow-auto bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-2">
                <img src={fileUrl!} alt="Invoice Preview" className="max-w-full h-auto mx-auto" />
            </div>
        );
    } else if (file.type === 'application/pdf') {
        return (
            <iframe src={fileUrl!} className="w-full h-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white" title="Invoice PDF" />
        );
    }
    return <div className="flex items-center justify-center h-full text-slate-500">Preview not supported for this file type</div>;
};

interface DataGridProps {
    items: EditableItem[];
    sector: Sector;
    onItemChange: (id: string, field: keyof EditableItem, value: string | number) => void;
    onAddItem: () => void;
    onDeleteItem: (id: string) => void;
}

const DataGrid: React.FC<DataGridProps> = ({ items, sector, onItemChange, onAddItem, onDeleteItem }) => (
    <div className="overflow-x-auto h-full flex flex-col">
        <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase font-bold sticky top-0 z-10 shadow-md">
                    <tr>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Barcode</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 w-20">Qty</th>
                        <th className="p-3 w-28">Cost</th>
                        <th className="p-3 w-24">Margin %</th>
                        <th className="p-3 w-32">Sell Price</th>
                        <th className="p-3 w-10"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900/50">
                    {items.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="p-2">
                                <input
                                    type="text"
                                    value={item.sku}
                                    onChange={(e) => onItemChange(item.id, 'sku', e.target.value)}
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 w-24 text-slate-900 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
                                />
                            </td>
                            <td className="p-2">
                                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded px-2 py-1">
                                    <Barcode className="w-3 h-3 text-slate-400" />
                                    <input
                                        type="text"
                                        value={item.barcode || ''}
                                        onChange={(e) => onItemChange(item.id, 'barcode', e.target.value)}
                                        className="bg-transparent w-24 text-xs font-mono outline-none text-slate-600 dark:text-slate-300"
                                        placeholder="Auto-gen"
                                    />
                                </div>
                            </td>
                            <td className="p-2">
                                <input
                                    type="text"
                                    value={item.name}
                                    onChange={(e) => onItemChange(item.id, 'name', e.target.value)}
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 w-full min-w-[150px] text-slate-900 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
                                />
                            </td>
                            <td className="p-2">
                                <input
                                    type="text"
                                    value={item.productType}
                                    onChange={(e) => onItemChange(item.id, 'productType', e.target.value)}
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 w-24 text-slate-900 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
                                    placeholder="Type"
                                />
                            </td>
                            <td className="p-2">
                                <div className="relative">
                                    <input
                                        list={`cat-${item.id}`}
                                        value={item.category}
                                        onChange={(e) => onItemChange(item.id, 'category', e.target.value)}
                                        className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 w-28 text-slate-900 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
                                        placeholder="Select..."
                                    />
                                    <datalist id={`cat-${item.id}`}>
                                        {CATEGORIES_BY_SECTOR[sector].map(c => <option key={c} value={c} />)}
                                    </datalist>
                                </div>
                            </td>
                            <td className="p-2">
                                <input
                                    type="number"
                                    value={item.qty}
                                    onChange={(e) => onItemChange(item.id, 'qty', parseInt(e.target.value))}
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 w-16 text-center text-slate-900 dark:text-slate-200 focus:border-indigo-500 focus:outline-none"
                                />
                            </td>
                            <td className="p-2 text-slate-400">
                                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded px-2 py-1">
                                    <IndianRupee className="w-3 h-3" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={item.cost}
                                        onChange={(e) => onItemChange(item.id, 'cost', parseFloat(e.target.value))}
                                        className="bg-transparent w-16 outline-none text-slate-600 dark:text-slate-400"
                                    />
                                </div>
                            </td>
                            <td className="p-2">
                                <div className="relative flex items-center">
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={item.margin}
                                        onChange={(e) => onItemChange(item.id, 'margin', parseFloat(e.target.value))}
                                        className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded px-2 py-1 w-16 pr-5 text-right text-emerald-600 dark:text-emerald-400 font-medium focus:border-emerald-500 focus:outline-none"
                                    />
                                    <span className="absolute right-2 text-xs text-slate-500">%</span>
                                </div>
                            </td>
                            <td className="p-2">
                                <div className="relative flex items-center">
                                    <span className="absolute left-2 text-slate-500"><IndianRupee className="w-3 h-3" /></span>
                                    <input
                                        type="number"
                                        value={item.sellingPrice}
                                        onChange={(e) => onItemChange(item.id, 'sellingPrice', parseFloat(e.target.value))}
                                        className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded pl-5 pr-2 py-1 w-20 text-right text-indigo-600 dark:text-indigo-400 font-bold focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </td>
                            <td className="p-2">
                                <button
                                    onClick={() => onDeleteItem(item.id)}
                                    className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <button
                onClick={onAddItem}
                className="w-full py-2 border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-lg hover:border-indigo-500 hover:text-indigo-600 dark:hover:border-indigo-400 dark:hover:text-indigo-300 transition-colors flex items-center justify-center gap-2 font-bold text-sm"
            >
                <Plus className="w-4 h-4" /> Add Line Item
            </button>
        </div>
    </div>
);

const InvoiceResult: React.FC<InvoiceResultProps> = ({ initialData, file, sector, branch, vendors, onSave, onCancel }) => {
    // --- Logic ---
    const generateItems = (data: ScannedInvoice, sec: Sector): EditableItem[] => {
        return data.items.map(i => {
            const cost = i.cost || 0;
            const defaultMargin = 20; // 20% default
            const sellingPrice = Math.round(cost * (1 + defaultMargin / 100));

            return {
                id: crypto.randomUUID(),
                sku: i.sku || `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
                name: i.name,
                productType: i.productType || 'General',
                category: CATEGORIES_BY_SECTOR[sec]?.[0] || 'Uncategorized',
                qty: i.qty,
                cost: cost,
                margin: defaultMargin,
                sellingPrice: sellingPrice,
                barcode: Math.floor(100000000000 + Math.random() * 900000000000).toString() // Generate unique 12-digit barcode immediately
            };
        });
    };

    // --- State ---
    const [viewMode, setViewMode] = useState<'SPLIT' | 'DETAILS' | 'PREVIEW'>('SPLIT');
    const [items, setItems] = useState<EditableItem[]>(() => generateItems(initialData, sector));
    const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);
    const [fileUrl, setFileUrl] = useState<string | null>(null);

    // Try to auto-match vendor by name from Gemini
    useEffect(() => {
        if (initialData.vendor && vendors.length > 0) {
            const match = vendors.find(v => v.name.toLowerCase().includes(initialData.vendor!.toLowerCase()));
            if (match) setSelectedVendorId(match.id);
        }
    }, [initialData.vendor, vendors]);

    // --- Initialization ---
    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFileUrl(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [file]);

    // Initial data transformation is now handled in useState initializer to avoid set-state-in-effect


    // --- Logic ---
    const handleItemChange = (id: string, field: keyof EditableItem, value: string | number) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item;

            const updated = { ...item, [field]: value };

            // Bidirectional Pricing
            if (field === 'margin') {
                // Recalculate Price: Cost * (1 + Margin/100)
                // Keep precise for calc, but round for display in UI logic is handled by input value usually.
                // Spec says "Round the Selling Price to the nearest integer for UI display"
                const rawPrice = updated.cost * (1 + Number(value) / 100);
                updated.sellingPrice = Math.round(rawPrice);
            } else if (field === 'sellingPrice') {
                // Recalculate Margin: ((Price / Cost) - 1) * 100
                if (updated.cost > 0) {
                    const rawMargin = ((Number(value) / updated.cost) - 1) * 100;
                    updated.margin = parseFloat(rawMargin.toFixed(2));
                }
            }

            return updated;
        }));
    };

    const handleAddItem = () => {
        const newItem: EditableItem = {
            id: crypto.randomUUID(),
            sku: `SKU-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            name: '',
            productType: 'General',
            category: CATEGORIES_BY_SECTOR[sector]?.[0] || 'Uncategorized',
            qty: 1,
            cost: 0,
            margin: 20,
            sellingPrice: 0,
            barcode: Math.floor(100000000000 + Math.random() * 900000000000).toString() // Generate unique 12-digit barcode
        };
        setItems(prev => [...prev, newItem]);
    };

    const handleDeleteItem = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const handleSave = () => {
        // Final mapping to ensure compatibility with PurchaseManager and Redux actions
        const finalItems = items.map((item, index) => {
            // Ensure barcode exists
            const barcode = item.barcode || Math.floor(100000000000 + Math.random() * 900000000000).toString();

            // Uniquify SKU if duplicate exists in this batch to force separate items
            let finalSku = item.sku;
            const isDuplicateSku = items.some((other, idx) => other.sku === item.sku && idx !== index);

            if (isDuplicateSku) {
                finalSku = `${item.sku}-${index + 1}`;
            }

            // Return object matching fields needed by addStockBulk payload
            // Note: PurchaseManager expects specific fields to build the Product object
            return {
                sku: finalSku,
                name: item.name,
                productType: item.productType,
                category: item.category,
                qty: item.qty,
                cost: item.cost,
                sellingPrice: item.sellingPrice, // Used as 'price' in inventory
                barcode: barcode
            };
        });

        // Update local state to reflect finalized values (UI feedback)
        setItems(prev => prev.map((p, i) => ({ ...p, sku: finalItems[i].sku, barcode: finalItems[i].barcode })));
        setIsSaved(true);

        // Trigger callback
        setTimeout(() => {
            onSave(finalItems, selectedVendorId);
        }, 1000);
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white">Review Extracted Data</h3>
                        <div className="flex items-center gap-2">
                            <p className="text-xs text-slate-500">{items.length} items found • {sector} ({branch})</p>
                            <span className="text-slate-300">|</span>
                            <select
                                value={selectedVendorId || ''}
                                onChange={(e) => setSelectedVendorId(e.target.value || null)}
                                className="text-xs bg-transparent border-none focus:ring-0 font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer p-0"
                            >
                                <option value="">Select Vendor...</option>
                                {vendors.map(v => (
                                    <option key={v.id} value={v.id}>{v.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* View Toggles */}
                <div className="flex bg-slate-200 dark:bg-slate-700 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('SPLIT')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'SPLIT' ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}
                        title="Split View"
                    >
                        <LayoutTemplate className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('DETAILS')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'DETAILS' ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}
                        title="Data Only"
                    >
                        <Table className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode('PREVIEW')}
                        className={`p-2 rounded-md transition-all ${viewMode === 'PREVIEW' ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}
                        title="Original Invoice"
                    >
                        <FileText className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaved || items.length === 0}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
                    >
                        {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {isSaved ? 'Saved' : 'Confirm & Add Stock'}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {viewMode === 'SPLIT' && (
                    <div className="flex h-full">
                        <div className="w-1/2 border-r border-slate-200 dark:border-slate-700 h-full bg-slate-100 dark:bg-slate-900/50 p-4">
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Original Document</h4>
                            <Previewer file={file} fileUrl={fileUrl} />
                        </div>
                        <div className="w-1/2 h-full flex flex-col">
                            <DataGrid
                                items={items}
                                sector={sector}
                                onItemChange={handleItemChange}
                                onAddItem={handleAddItem}
                                onDeleteItem={handleDeleteItem}
                            />
                        </div>
                    </div>
                )}

                {viewMode === 'DETAILS' && (
                    <div className="h-full flex flex-col">
                        <DataGrid
                            items={items}
                            sector={sector}
                            onItemChange={handleItemChange}
                            onAddItem={handleAddItem}
                            onDeleteItem={handleDeleteItem}
                        />
                    </div>
                )}

                {viewMode === 'PREVIEW' && (
                    <div className="h-full bg-slate-100 dark:bg-slate-900/50 p-4">
                        <Previewer file={file} fileUrl={fileUrl} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvoiceResult;
