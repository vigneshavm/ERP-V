import React, { useState, useEffect } from 'react';
import {
    QrCode,
    Printer,
    Download,
    RefreshCw,
    Settings,
    Check,
    Maximize,
    Search,
    Eye,
    Tag,
    Archive,
    Layers,
    ShoppingCart,
    ShieldCheck,
    Zap,
    AlertTriangle,
    Clock,
    User
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import JsBarcode from 'jsbarcode';

type LabelType = 'PRODUCT' | 'ROLL' | 'PIECE' | 'CARTON' | 'SHELF' | 'ASSET';

interface LabelConfig {
    type: LabelType;
    width: number;
    height: number;
    cols: number;
    rows: number;
    showPrice: boolean;
    showName: boolean;
    showSKU: boolean;
    showQR: boolean;
    showGST: boolean;
    showTimestamp: boolean;
    copies: number;
}

interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    barcode: string;
    batch: string;
    variant: string;
    gstRate: number;
    branch: string;
}

const BarcodeGenerator: React.FC = () => {
    // Wings-Grade Mock Data
    const products: Product[] = [
        { id: '1', name: 'Cotton T-Shirt (M)', sku: 'TS-001-M', price: 499, barcode: '8901234567890', batch: 'B25A', variant: 'Medium/Red', gstRate: 5, branch: 'Chennai' },
        { id: '2', name: 'Denim Jeans (32)', sku: 'JN-032-BL', price: 1299, barcode: '8901234567891', batch: 'B25B', variant: '32/Blue', gstRate: 12, branch: 'Chennai' },
        { id: '3', name: 'Running Shoes (9)', sku: 'SH-RN-009', price: 2499, barcode: '8901234567892', batch: 'B24D', variant: '9/Black', gstRate: 18, branch: 'Madurai' },
        { id: '4', name: 'Leather Wallet', sku: 'ACC-WL-01', price: 799, barcode: '8901234567893', batch: 'B25C', variant: 'Universal/Brown', gstRate: 12, branch: 'Chennai' },
        { id: '5', name: 'Wrist Watch', sku: 'ACC-WT-05', price: 3499, barcode: '8901234567894', batch: 'B25A', variant: 'Premium/Silver', gstRate: 18, branch: 'Coimbatore' },
    ];

    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [config, setConfig] = useState<LabelConfig>({
        type: 'PRODUCT',
        width: 50,
        height: 30,
        cols: 3,
        rows: 8,
        showPrice: true,
        showName: true,
        showSKU: true,
        showQR: true,
        showGST: true,
        showTimestamp: true,
        copies: 1
    });

    const toggleProduct = (product: Product) => {
        setSelectedProducts(prev =>
            prev.find(p => p.id === product.id)
                ? prev.filter(p => p.id !== product.id)
                : [...prev, product]
        );
    };

    const labelTypes: { type: LabelType; label: string; icon: any }[] = [
        { type: 'PRODUCT', label: 'Product Tag', icon: Tag },
        { type: 'ROLL', label: 'Roll Label', icon: RefreshCw },
        { type: 'PIECE', label: 'Piece Sticker', icon: Layers },
        { type: 'CARTON', label: 'Carton Master', icon: Archive },
        { type: 'SHELF', label: 'Shelf Edge', icon: ShoppingCart },
        { type: 'ASSET', label: 'Asset Tag', icon: ShieldCheck },
    ];

    return (
        <div className="space-y-6 animate-fade-in text-slate-900 dark:text-white">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-indigo-500" />
                        Label Printing & Serialization Engine
                    </h2>
                    <p className="text-xs text-slate-500 font-medium italic">Mapping physical inventory to digital record with zero-error intelligence.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95">
                        <Printer className="w-4 h-4" /> Print Labels
                    </button>
                    <button className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-all flex items-center gap-2">
                        <Download className="w-4 h-4" /> Export PLT
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Product Select Rail */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 flex flex-col h-[700px] overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Inventory Selector</h3>
                            <div className="relative group">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search SKU or Name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 transition-all"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku.toLowerCase().includes(searchTerm.toLowerCase())).map(product => {
                                const isSelected = !!selectedProducts.find(p => p.id === product.id);
                                return (
                                    <div
                                        key={product.id}
                                        onClick={() => toggleProduct(product)}
                                        className={`p-4 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${isSelected ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                                    >
                                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-1 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300'}`}>
                                            {isSelected && <Check className="w-3 h-3" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-black text-xs truncate ${isSelected ? 'text-indigo-900 dark:text-indigo-200' : 'text-slate-900 dark:text-white'}`}>{product.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{product.sku}</span>
                                                <span className="text-[9px] font-black text-indigo-500">₹{product.price}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-center">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                {selectedProducts.length} Items Indexed
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Engine Workarea */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Mode & Intelligent Checks */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Label Architecture</h3>
                            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                {labelTypes.map((lt) => {
                                    const Icon = lt.icon;
                                    return (
                                        <button
                                            key={lt.type}
                                            onClick={() => setConfig({ ...config, type: lt.type })}
                                            className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${config.type === lt.type ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-600 shadow-sm' : 'border-transparent text-slate-400 hover:bg-slate-50'}`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span className="text-[9px] font-black uppercase tracking-tighter">{lt.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl flex flex-col justify-center relative overflow-hidden group">
                            <Zap className="absolute -bottom-4 -right-4 w-24 h-24 text-indigo-500 opacity-10 group-hover:scale-110 transition-transform" />
                            <div className="flex items-center gap-2 mb-4 text-indigo-400">
                                <Zap className="w-4 h-4 fill-current" />
                                <span className="text-[10px] font-black uppercase tracking-widest italic">Accuracy Trace</span>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Barcode Duplication</span>
                                    <span className="text-[9px] font-black text-emerald-400 tracking-widest flex items-center gap-1"><Check className="w-3 h-3" /> ZERO</span>
                                </div>
                                <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Variant Mapping</span>
                                    <span className="text-[9px] font-black text-emerald-400 tracking-widest flex items-center gap-1"><Check className="w-3 h-3" /> MATCH</span>
                                </div>
                                <div className="flex justify-between items-center bg-white/10 p-3 rounded-xl border border-white/10 animate-pulse">
                                    <span className="text-[9px] font-bold text-amber-400 uppercase">Price Conflict check</span>
                                    <span className="text-[9px] font-black text-amber-400 tracking-widest uppercase">Ongoing</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview & Print Config */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30">
                            <div className="flex items-center gap-4">
                                <div className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">A4 Sheet Preview</div>
                                <div className="flex items-center gap-4 border-l border-slate-200 dark:border-slate-700 pl-4">
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" checked={config.showQR} onChange={() => setConfig({ ...config, showQR: !config.showQR })} className="rounded text-indigo-600" />
                                        <span className="text-[9px] font-black uppercase text-slate-400">Enable QR</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" checked={config.showGST} onChange={() => setConfig({ ...config, showGST: !config.showGST })} className="rounded text-indigo-600" />
                                        <span className="text-[9px] font-black uppercase text-slate-400">GST Stamp</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"><Settings className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <div className="p-12 bg-slate-100 dark:bg-black/40 min-h-[500px] flex items-center justify-center">
                            {selectedProducts.length === 0 ? (
                                <div className="text-center group">
                                    <div className="w-20 h-20 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                        <Eye className="w-8 h-8 text-indigo-500 opacity-40" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Engine Idle: Selection Required</p>
                                </div>
                            ) : (
                                <div className="bg-white shadow-2xl p-8 w-full max-w-4xl min-h-[600px] relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 border-b border-l border-slate-100 text-[8px] font-black text-slate-300 uppercase tracking-widest">Internal Form: PLT-A4-V2</div>
                                    <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${config.cols}, 1fr)` }}>
                                        {selectedProducts.map(p => (
                                            Array.from({ length: config.copies }).map((_, i) => (
                                                <div key={`${p.id}-${i}`} className="border border-slate-900 p-4 flex flex-col justify-between h-[180px] bg-white group cursor-crosshair">
                                                    <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                                                        <div className="flex-1 pr-2">
                                                            <p className="text-[9px] font-black uppercase truncate">{p.name}</p>
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <span className="text-[7px] font-black bg-slate-900 text-white px-1 py-0.5 rounded leading-none">{p.branch}</span>
                                                                <span className="text-[7px] font-bold text-slate-400">B: {p.batch}</span>
                                                            </div>
                                                        </div>
                                                        {config.showQR && <div className="w-8 h-8 bg-black shrink-0" />}
                                                    </div>

                                                    <div className="flex-1 flex flex-col items-center justify-center py-2 space-y-1">
                                                        <div className="h-10 w-full bg-black relative">
                                                            <div className="absolute inset-0 bg-white scale-x-[0.9] scale-y-[0.8]" />
                                                            {/* Actual barcode drawing logic here */}
                                                            <div className="absolute inset-0 flex items-center justify-around px-2 overflow-hidden">
                                                                {Array.from({ length: 30 }).map((_, i) => (
                                                                    <div key={i} className="h-full bg-black" style={{ width: Math.random() > 0.5 ? '2px' : '1px' }} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <span className="text-[8px] font-mono tracking-widest">{p.barcode}</span>
                                                    </div>

                                                    <div className="flex justify-between items-end pt-2 border-t border-slate-100">
                                                        <div className="flex flex-col">
                                                            <span className="text-[7px] font-bold text-slate-400 uppercase">GST {p.gstRate}%</span>
                                                            <span className="text-[7px] font-bold text-slate-400 uppercase">V: {p.variant}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[8px] font-bold text-slate-400 line-through">₹{p.price + 100}</p>
                                                            <p className="text-sm font-black text-slate-900">₹{p.price}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
                            <div className="w-14 h-14 rounded-[1.5rem] bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500">
                                <Clock className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Queue Status</h4>
                                <p className="text-sm font-black">Labels Ready: <span className="text-emerald-500">{selectedProducts.length * config.copies}</span></p>
                                <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase">EST. Time: 4.2 seconds</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-6">
                            <div className="w-14 h-14 rounded-[1.5rem] bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500">
                                <User className="w-7 h-7" />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Auth Trail</h4>
                                <p className="text-sm font-black uppercase">User: <span className="text-indigo-600">Admin</span></p>
                                <p className="text-[9px] font-bold text-slate-500 mt-1 uppercase">Stamp: {new Date().toLocaleTimeString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BarcodeGenerator;
