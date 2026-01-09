import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
    QrCode,
    Barcode,
    Printer,
    Download,
    Package,
    DollarSign,
    Tag,
    Hash,
    Image,
    Plus,
    Minus,
    Check,
    Search,
    FileText,
    Eye,
    Settings2,
    RefreshCw,
    CheckSquare,
    Square,
    Loader2
} from 'lucide-react';

type BarcodeType = 'CODE128' | 'EAN13' | 'QR' | 'UPC';
type PaperSize = 'A4' | 'A5' | 'LABEL';

interface BarcodeItem {
    id: string;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    barcodeType: BarcodeType;
    selected?: boolean;
}

const BarcodeGenerator: React.FC = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const { tenants } = useSelector((state: RootState) => state.tenant);

    const activeTenant = tenants.find(t => t.id === user?.tenantId);

    const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    // Single barcode state
    const [itemName, setItemName] = useState('');
    const [sku, setSku] = useState('');
    const [price, setPrice] = useState('');
    const [barcodeType, setBarcodeType] = useState<BarcodeType>('CODE128');
    const [quantity, setQuantity] = useState(1);
    const [paperSize, setPaperSize] = useState<PaperSize>('A4');

    // Print options
    const [includeItemName, setIncludeItemName] = useState(true);
    const [includePrice, setIncludePrice] = useState(true);
    const [includeSku, setIncludeSku] = useState(true);
    const [includeLogo, setIncludeLogo] = useState(false);

    // Bulk mode state
    const [searchQuery, setSearchQuery] = useState('');
    const [bulkItems, setBulkItems] = useState<BarcodeItem[]>([
        { id: 'p1', name: 'Organic Wheat Flour 5kg', sku: '8901234567001', price: 245.00, quantity: 10, barcodeType: 'EAN13' },
        { id: 'p2', name: 'Basmati Rice Premium 1kg', sku: '8901234567002', price: 185.00, quantity: 10, barcodeType: 'EAN13' },
        { id: 'p3', name: 'Cold Pressed Coconut Oil 1L', sku: '8901234567003', price: 320.00, quantity: 5, barcodeType: 'EAN13' },
        { id: 'p4', name: 'Jaggery Powder 500g', sku: '8901234567004', price: 95.00, quantity: 8, barcodeType: 'EAN13' },
        { id: 'p5', name: 'Turmeric Powder 200g', sku: '8901234567005', price: 65.00, quantity: 15, barcodeType: 'EAN13' },
        { id: 'p6', name: 'Red Chilli Powder 250g', sku: '8901234567006', price: 78.00, quantity: 12, barcodeType: 'EAN13' }
    ]);

    const filteredItems = bulkItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.includes(searchQuery)
    );

    const selectedItems = bulkItems.filter(item => item.selected);
    const totalLabels = activeTab === 'single' ? quantity : selectedItems.reduce((sum, i) => sum + i.quantity, 0);

    const toggleItemSelection = (id: string) => {
        setBulkItems(items => items.map(item =>
            item.id === id ? { ...item, selected: !item.selected } : item
        ));
    };

    const updateItemQuantity = (id: string, delta: number) => {
        setBulkItems(items => items.map(item =>
            item.id === id ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
        ));
    };

    const selectAll = () => {
        const allSelected = filteredItems.every(i => i.selected);
        setBulkItems(items => items.map(item =>
            filteredItems.find(f => f.id === item.id) ? { ...item, selected: !allSelected } : item
        ));
    };

    const handleGenerate = () => {
        setIsGenerating(true);
        setTimeout(() => setIsGenerating(false), 1500);
    };

    const handlePrint = () => {
        setIsPrinting(true);
        setTimeout(() => setIsPrinting(false), 2000);
    };

    const getBarcodeTypeName = (type: BarcodeType) => {
        const names: Record<BarcodeType, string> = {
            CODE128: 'Code 128',
            EAN13: 'EAN-13',
            QR: 'QR Code',
            UPC: 'UPC-A'
        };
        return names[type];
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white">Barcode Generator</h1>
                    <p className="text-slate-500 mt-1">Generate, preview, and print barcodes for your products.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
                        Generate Barcode
                    </button>
                    <button
                        onClick={() => { }}
                        className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" /> Download PDF
                    </button>
                    <button
                        onClick={handlePrint}
                        disabled={isPrinting}
                        className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                        Print
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('single')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'single' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Barcode className="w-4 h-4" /> Single Item
                </button>
                <button
                    onClick={() => setActiveTab('bulk')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'bulk' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Package className="w-4 h-4" /> Bulk Generate
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Panel - Input */}
                <div className="lg:col-span-2 space-y-6">
                    {activeTab === 'single' ? (
                        <>
                            {/* Barcode Details */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-6">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">Barcode Details</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                            <Package className="w-4 h-4 inline mr-2" /> Item Name
                                        </label>
                                        <input
                                            type="text"
                                            value={itemName}
                                            onChange={(e) => setItemName(e.target.value)}
                                            placeholder="e.g. Organic Wheat Flour 5kg"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                            <Hash className="w-4 h-4 inline mr-2" /> SKU / Barcode Number
                                        </label>
                                        <input
                                            type="text"
                                            value={sku}
                                            onChange={(e) => setSku(e.target.value)}
                                            placeholder="e.g. 8901234567890"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                            <DollarSign className="w-4 h-4 inline mr-2" /> Price
                                        </label>
                                        <input
                                            type="text"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            placeholder="e.g. 245.00"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                            <Tag className="w-4 h-4 inline mr-2" /> Barcode Type
                                        </label>
                                        <select
                                            value={barcodeType}
                                            onChange={(e) => setBarcodeType(e.target.value as BarcodeType)}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="CODE128">Code 128</option>
                                            <option value="EAN13">EAN-13</option>
                                            <option value="QR">QR Code</option>
                                            <option value="UPC">UPC-A</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                            Quantity
                                        </label>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="text-xl font-black text-slate-900 dark:text-white w-16 text-center">{quantity}</span>
                                            <button
                                                onClick={() => setQuantity(quantity + 1)}
                                                className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                            <FileText className="w-4 h-4 inline mr-2" /> Paper Size
                                        </label>
                                        <select
                                            value={paperSize}
                                            onChange={(e) => setPaperSize(e.target.value as PaperSize)}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="A4">A4</option>
                                            <option value="A5">A5</option>
                                            <option value="LABEL">Label Sheet</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Print Options */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-4">
                                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">Print Options</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: 'Item Name', checked: includeItemName, onChange: setIncludeItemName },
                                        { label: 'Price', checked: includePrice, onChange: setIncludePrice },
                                        { label: 'SKU', checked: includeSku, onChange: setIncludeSku },
                                        { label: 'Logo', checked: includeLogo, onChange: setIncludeLogo }
                                    ].map((opt) => (
                                        <button
                                            key={opt.label}
                                            onClick={() => opt.onChange(!opt.checked)}
                                            className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${opt.checked ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700'}`}
                                        >
                                            {opt.checked ? <Check className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5 text-slate-300" />}
                                            <span className={`font-bold text-sm ${opt.checked ? 'text-indigo-600' : 'text-slate-500'}`}>{opt.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Bulk Mode */
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-white">Select Products from Inventory</h3>
                                    <button
                                        onClick={selectAll}
                                        className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
                                    >
                                        <CheckSquare className="w-4 h-4" /> Select All
                                    </button>
                                </div>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search by name or SKU..."
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                {filteredItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`p-4 border-b border-slate-50 dark:border-slate-800/50 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${item.selected ? 'bg-indigo-50 dark:bg-indigo-900/10' : ''}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => toggleItemSelection(item.id)}
                                                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${item.selected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'}`}
                                            >
                                                {item.selected && <Check className="w-4 h-4 text-white" />}
                                            </button>
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                                                <p className="text-xs text-slate-500">SKU: {item.sku} • ₹{item.price.toFixed(2)}</p>
                                            </div>
                                        </div>
                                        {item.selected && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => updateItemQuantity(item.id, -1)}
                                                    className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-200"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="font-bold text-sm w-8 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateItemQuantity(item.id, 1)}
                                                    className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center hover:bg-slate-200"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                                <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                                    {selectedItems.length} items selected • {totalLabels} labels to print
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel - Live Preview */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Live Preview</h3>
                            <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-[10px] font-black uppercase">
                                <Eye className="w-3 h-3 inline mr-1" /> Live
                            </span>
                        </div>

                        {/* Preview Label */}
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
                            {includeLogo && (
                                <div className="mb-3">
                                    <div className="w-16 h-8 bg-slate-100 rounded mx-auto flex items-center justify-center text-[10px] font-bold text-slate-400">
                                        LOGO
                                    </div>
                                </div>
                            )}

                            {includeItemName && (
                                <p className="font-bold text-sm text-slate-900 mb-2">
                                    {activeTab === 'single' ? (itemName || 'Item Name') : (selectedItems[0]?.name || 'Item Name')}
                                </p>
                            )}

                            {/* Barcode Visual */}
                            <div className="my-4">
                                {barcodeType === 'QR' ? (
                                    <div className="w-24 h-24 bg-slate-100 mx-auto rounded flex items-center justify-center">
                                        <QrCode className="w-16 h-16 text-slate-400" />
                                    </div>
                                ) : (
                                    <div className="mx-auto">
                                        <div className="flex items-end justify-center gap-px h-16">
                                            {Array.from({ length: 40 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="bg-slate-900"
                                                    style={{
                                                        width: Math.random() > 0.5 ? 2 : 1,
                                                        height: `${60 + Math.random() * 20}%`
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {includeSku && (
                                <p className="text-xs font-mono text-slate-600 mb-1">
                                    {activeTab === 'single' ? (sku || '8901234567890') : (selectedItems[0]?.sku || '8901234567890')}
                                </p>
                            )}

                            {includePrice && (
                                <p className="text-lg font-black text-slate-900">
                                    ₹{activeTab === 'single' ? (price || '0.00') : (selectedItems[0]?.price.toFixed(2) || '0.00')}
                                </p>
                            )}
                        </div>

                        <div className="mt-6 space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">Barcode Type</span>
                                <span className="font-bold">{getBarcodeTypeName(barcodeType)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">Paper Size</span>
                                <span className="font-bold">{paperSize}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">Labels to Print</span>
                                <span className="font-bold text-indigo-600">{totalLabels}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Info */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-6">
                        <h4 className="font-bold text-indigo-900 dark:text-indigo-200 mb-2">Tip: ERP Integration</h4>
                        <p className="text-sm text-indigo-700 dark:text-indigo-300">
                            Barcodes are mapped to your product inventory. Scanning in POS will automatically find the product, add it to cart, and update stock.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BarcodeGenerator;
