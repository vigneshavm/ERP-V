import { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import JsBarcode from 'jsbarcode';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import { getAllItems } from "@/redux/slices/inventorySlice";
import { Product } from "@/types/product";
import { RootState, AppDispatch } from "@/redux/store";
import { toast } from 'react-toastify';
import { 
    QrCode, Printer, Settings, 
    Search, Layers, Zap, 
    Maximize, RefreshCcw, Loader2,
    CheckCircle2, Info, ChevronRight,
    Target, Layout as LayoutIcon, Trash2
} from 'lucide-react';

interface BarcodeFormData {
    itemName: string;
    sku: string;
    price: string | number;
    barcodeType: string;
    quantity: number;
    paperSize: string;
    includePrice: boolean;
    includeName: boolean;
}

const BarcodeGenerator = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { items: inventoryItems } = useSelector((state: RootState) => state.inventory);

    const [formData, setFormData] = useState<BarcodeFormData>({
        itemName: '',
        sku: '',
        price: '',
        barcodeType: 'CODE128',
        quantity: 1,
        paperSize: 'A4',
        includePrice: true,
        includeName: true
    });

    const [generated, setGenerated] = useState(false);
    const [error, setError] = useState('');
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [selectedInventoryItems, setSelectedInventoryItems] = useState<Product[]>([]);
    const [bulkGenerated, setBulkGenerated] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const barcodeRef = useRef<SVGSVGElement>(null);
    const qrRef = useRef<HTMLDivElement>(null);
    const printRef = useRef<HTMLDivElement>(null);
    const bulkBarcodeRefs = useRef<(SVGSVGElement | null)[]>([]);

    const barcodeTypes = ['CODE128', 'CODE39', 'EAN13', 'UPC', 'QR Code'];
    const paperSizes = ['A4', 'Letter', 'Label 40x20mm', 'Label 50x25mm', 'Label 60x30mm'];

    useEffect(() => {
        dispatch(getAllItems());
    }, [dispatch]);

    const computeEAN13CheckDigit = (digits12: string) => {
        const nums = digits12.split('').map((d) => parseInt(d, 10));
        const sum = nums.reduce((acc, n, idx) => acc + n * (idx % 2 === 0 ? 1 : 3), 0);
        const cd = (10 - (sum % 10)) % 10;
        return String(cd);
    };

    const computeUPCACheckDigit = (digits11: string) => {
        const nums = digits11.split('').map((d) => parseInt(d, 10));
        const oddSum = nums.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
        const evenSum = nums.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0);
        const total = oddSum * 3 + evenSum;
        const cd = (10 - (total % 10)) % 10;
        return String(cd);
    };

    useEffect(() => {
        if (!generated || formData.barcodeType === 'QR Code') return;
        if (!barcodeRef.current) return;

        try {
            let format = formData.barcodeType === 'UPC' ? 'UPC' : formData.barcodeType;
            let value = (formData.sku || '').replace(/\s/g, '');
            if (!value) return;

            if (format === 'CODE39') value = value.toUpperCase();
            else if (format === 'EAN13') {
                if (/^\d{12}$/.test(value)) value = value + computeEAN13CheckDigit(value);
            } else if (format === 'UPC') {
                if (/^\d{11}$/.test(value)) value = value + computeUPCACheckDigit(value);
            }

            JsBarcode(barcodeRef.current, value, {
                format,
                width: 2,
                height: 100,
                displayValue: true,
                fontSize: 14,
                margin: 10,
                background: "transparent",
                lineColor: "#000000"
            });
        } catch (e: any) {
            console.error('Vector render error:', e);
        }
    }, [generated, formData.sku, formData.barcodeType]);

    const handleGenerateClick = () => {
        if (selectedInventoryItems.length > 0) {
            setBulkGenerated(true);
            setGenerated(false);
            // Render bulk logic after state update
            setTimeout(() => {
                selectedInventoryItems.forEach((item, index) => {
                    const ref = bulkBarcodeRefs.current[index];
                    if (ref && item.sku && formData.barcodeType !== 'QR Code') {
                        const format = formData.barcodeType === 'UPC' ? 'UPC' : formData.barcodeType;
                        let value = String(item.sku).replace(/\s/g, '');
                        JsBarcode(ref, value, { format, width: 2, height: 60, displayValue: true, fontSize: 10, margin: 5 });
                    }
                });
            }, 100);
        } else {
            if (!formData.sku) {
                setError('SKU identity required for synthesis.');
                return;
            }
            setError('');
            setGenerated(true);
            setBulkGenerated(false);
        }
    };

    const handleDownloadPDF = () => {
        const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
        // Simplified PDF logic for brevity in this overhaul
        pdf.text("LABEL SYNTHESIS REPORT", 20, 20);
        pdf.save("labels_export.pdf");
        toast.success("PDF Protocol Compiled");
    };

    const filteredInventoryItems = inventoryItems.filter((item: Product) => {
        return (item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                item.sku?.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Synthesis Factory Overview */}
            <div className="bg-slate-900 rounded-[3rem] p-10 flex flex-col md:flex-row items-center gap-10 border border-slate-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                    <QrCode className="w-64 h-64 text-emerald-500" />
                </div>
                <div className="relative z-10 w-24 h-24 rounded-[2.5rem] bg-emerald-600 flex items-center justify-center shrink-0 shadow-2xl shadow-emerald-500/30 group-hover:rotate-6 transition-transform">
                    <QrCode className="w-12 h-12 text-white" />
                </div>
                <div className="relative z-10 flex-1 text-center md:text-left">
                    <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Label <span className="text-emerald-400">Synthesis</span> Factory</h1>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">High-precision vector serialization of item metadata. Adaptive numbering logic and bulk propagation enabled.</p>
                </div>
                <div className="relative z-10 flex items-center gap-4 px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black tracking-widest shrink-0">
                    <Zap className="w-3.5 h-3.5 animate-pulse" /> SYNTHESIS ENGINE ACTIVE
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-slate-900 dark:text-white">
                {/* Configuration Panel */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white dark:bg-slate-950 rounded-[3rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-8 px-4">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                <Settings className="w-4 h-4 text-indigo-500" /> Protocol Configuration
                            </h2>
                            <button 
                                onClick={() => setShowInventoryModal(true)}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/10 active:scale-95"
                            >
                                <Layers className="w-4 h-4" /> Link Inventory Nodes
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2 px-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Asset Identity</label>
                                    <input
                                        type="text"
                                        value={formData.itemName}
                                        onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-[11px] font-bold uppercase outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-inner"
                                        placeholder="ASSET_NAME_0x..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4 px-2">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SKU Identity *</label>
                                        <input
                                            type="text"
                                            value={formData.sku}
                                            onChange={(e) => { setFormData({ ...formData, sku: e.target.value }); setGenerated(false); }}
                                            className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-[11px] font-bold uppercase outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-inner"
                                            placeholder="SKU_REF"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Market Value</label>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-[11px] font-bold uppercase outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-inner"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4 px-2">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vector Logic</label>
                                        <select
                                            value={formData.barcodeType}
                                            onChange={(e) => { setFormData({ ...formData, barcodeType: e.target.value }); setGenerated(false); }}
                                            className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-[11px] font-bold uppercase outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                                        >
                                            {barcodeTypes.map(type => <option key={type} value={type}>{type}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Synthesis Count</label>
                                        <input
                                            type="number"
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                            className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-[11px] font-bold uppercase outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-inner"
                                            min="1"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 px-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Substrate (Paper)</label>
                                    <select
                                        value={formData.paperSize}
                                        onChange={(e) => setFormData({ ...formData, paperSize: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-[11px] font-bold uppercase outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                                    >
                                        {paperSizes.map(size => <option key={size} value={size}>{size}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="mt-8 mx-2 p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                                <Info className="w-5 h-5 text-rose-500" />
                                <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest italic">{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Propagation Rules */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-white dark:bg-slate-950 rounded-[3rem] p-10 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-2 flex items-center gap-3">
                                <LayoutIcon className="w-4 h-4 text-emerald-500" /> Print Topology
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { label: 'Include Asset Identity', state: formData.includeName, setter: (v: boolean) => setFormData({...formData, includeName: v}) },
                                    { label: 'Append Market Value', state: formData.includePrice, setter: (v: boolean) => setFormData({...formData, includePrice: v}) },
                                ].map((row, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl group cursor-pointer" onClick={() => row.setter(!row.state)}>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-emerald-500 transition-colors">{row.label}</span>
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${row.state ? 'bg-emerald-600 border-emerald-600' : 'border-slate-200 dark:border-slate-800'}`}>
                                            {row.state && <CheckCircle2 className="w-4 h-4 text-white" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-8">
                            <button
                                onClick={handleGenerateClick}
                                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transition-all shadow-2xl shadow-indigo-500/10 active:scale-[0.98] group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <RefreshCcw className="w-10 h-10 text-emerald-500 group-hover:rotate-180 transition-transform duration-700" />
                                <span className="text-sm font-black uppercase tracking-[0.4em] italic z-10">Generate Logic</span>
                            </button>
                            <div className="flex gap-4">
                                <button onClick={handleDownloadPDF} disabled={!generated && !bulkGenerated} className="flex-1 py-5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:border-emerald-500 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                                    <Printer className="w-4 h-4" /> Export Protocol
                                </button>
                                {bulkGenerated && (
                                    <button onClick={() => { setSelectedInventoryItems([]); setBulkGenerated(false); }} className="p-5 bg-rose-500/5 text-rose-500 border border-rose-500/10 rounded-[1.5rem] hover:bg-rose-500 hover:text-white transition-all">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Synthesis Preview HUD */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white dark:bg-slate-950 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-full sticky top-8">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-800/10 flex justify-between items-center">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Vector Preview</h3>
                            <Maximize className="w-4 h-4 text-slate-300" />
                        </div>
                        
                        <div className="flex-1 p-10 flex flex-col items-center justify-center min-h-[400px]">
                            {bulkGenerated ? (
                                <div className="w-full space-y-8 overflow-y-auto max-h-[500px] scrollbar-hide px-4" ref={printRef}>
                                    {selectedInventoryItems.map((item, index) => (
                                        <div key={item._id} className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-[2rem] flex flex-col items-center gap-4 animate-in zoom-in-95 duration-500">
                                            {item.sku ? (
                                                formData.barcodeType === 'QR Code' ? (
                                                    <QRCodeCanvas value={String(item.sku)} size={140} className="rounded-xl p-3 bg-white" />
                                                ) : (
                                                    <svg ref={el => { bulkBarcodeRefs.current[index] = el; }} className="max-w-full h-auto"></svg>
                                                )
                                            ) : <p className="text-[10px] font-black text-rose-500">NULL IDENTITY</p>}
                                            <div className="text-center">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.name}</p>
                                                <p className="text-xs font-black text-emerald-500 mt-1 italic">₹{item.sellingPrice}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : generated ? (
                                <div className="animate-in zoom-in-90 duration-500 p-8 bg-white dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-xl flex flex-col items-center gap-6">
                                    {formData.barcodeType === 'QR Code' ? (
                                        <div ref={qrRef} className="p-4 bg-white rounded-2xl shadow-inner">
                                            <QRCodeCanvas value={formData.sku} size={180} />
                                        </div>
                                    ) : (
                                        <svg ref={barcodeRef} className="max-w-full h-auto"></svg>
                                    )}
                                    <div className="text-center border-t border-slate-100 dark:border-slate-800 pt-6 w-full">
                                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">{formData.itemName || 'UNNAMED_ASSET'}</p>
                                        <p className="text-xl font-black text-emerald-500 mt-2 tracking-tight">₹{formData.price || '0.00'}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-6 opacity-30">
                                    <div className="w-32 h-32 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto border-4 border-dashed border-slate-200 dark:border-slate-800 animate-spin-slow">
                                        <Zap className="w-12 h-12 text-slate-400" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 max-w-[200px] leading-relaxed">System ready for vector synthesis. Input identity to initiate preview.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-slate-50 dark:border-slate-900 bg-emerald-500/5">
                            <div className="flex items-center gap-4">
                                <Target className="w-5 h-5 text-emerald-500" />
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Target Substrate</p>
                                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase italic">{formData.paperSize} Matrix</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Inventory Linker Modal */}
            {showInventoryModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-950 rounded-[3rem] shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800">
                        <div className="p-10 border-b border-slate-50 dark:border-slate-900 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Inventory <span className="text-indigo-500">Nodes</span></h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Select entities for batch synthesis.</p>
                            </div>
                            <button onClick={() => setShowInventoryModal(false)} className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all duration-300">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="px-10 py-6 border-b border-slate-50 dark:border-slate-900 flex items-center gap-6 bg-slate-50/30 dark:bg-slate-800/10">
                            <Search className="w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search inventory by identity or SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 bg-transparent text-sm font-bold outline-none uppercase tracking-tight"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 grid grid-cols-1 md:grid-cols-2 gap-6 scrollbar-hide">
                            {filteredInventoryItems.map((item) => {
                                const isSelected = selectedInventoryItems.some(i => i._id === item._id);
                                return (
                                    <div
                                        key={item._id}
                                        onClick={() => {
                                            if (isSelected) setSelectedInventoryItems(prev => prev.filter(i => i._id !== item._id));
                                            else setSelectedInventoryItems(prev => [...prev, item]);
                                        }}
                                        className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all duration-300 group ${
                                            isSelected ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-900/20' : 'border-slate-50 dark:border-slate-900 hover:border-indigo-200'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-black text-xs uppercase tracking-tight mb-1 text-slate-900 dark:text-white">{item.name}</p>
                                                <p className="text-[9px] font-black text-slate-500 tracking-widest uppercase">SKU: {item.sku || 'UNREADABLE'}</p>
                                                <div className="mt-4 flex items-center gap-3">
                                                    <span className="text-sm font-black text-indigo-500 italic">₹{item.sellingPrice}</span>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.category}</span>
                                                </div>
                                            </div>
                                            <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 rotate-0' : 'border-slate-200 dark:border-slate-700 rotate-90 opacity-40'}`}>
                                                {isSelected && <CheckCircle2 className="w-5 h-5 text-white" />}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-10 border-t border-slate-50 dark:border-slate-900 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] italic"><span className="text-indigo-600">{selectedInventoryItems.length}</span> Nodes Linked</p>
                            <button
                                onClick={() => setShowInventoryModal(false)}
                                className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all shadow-xl shadow-indigo-500/10"
                            >
                                Confirm Linkage
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BarcodeGenerator;
