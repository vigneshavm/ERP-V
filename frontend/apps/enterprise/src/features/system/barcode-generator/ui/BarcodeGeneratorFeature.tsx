import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { QRCodeCanvas } from 'qrcode.react';
import { RootState, AppDispatch } from "@/app/store/store";
import { getAllItems } from "@/entities/inventory/model/inventorySlice";
import { Product } from "@vignesh-erp/shared-kernel";
import { useBarcodeGenerator, BarcodeFormData } from '../model/useBarcodeGenerator';
import { Printer, Download, RefreshCw, Layers, Layout, AlertCircle } from 'lucide-react';

export const BarcodeGeneratorFeature: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { items: inventoryItems } = useSelector((state: RootState) => state.inventory);
    const { 
        generated, setGenerated, bulkGenerated, setBulkGenerated, 
        error, setError, barcodeRef, bulkBarcodeRefs, 
        validateBarcode, renderBarcode 
    } = useBarcodeGenerator();

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

    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        dispatch(getAllItems());
    }, [dispatch]);

    useEffect(() => {
        if (generated && formData.barcodeType !== 'QR Code') {
            renderBarcode(barcodeRef.current, formData.sku, formData.barcodeType);
        }
    }, [generated, formData.sku, formData.barcodeType]);

    const handleGenerate = () => {
        const vError = validateBarcode(formData.sku, formData.barcodeType);
        if (vError) {
            setError(vError);
            setGenerated(false);
            return;
        }
        setError('');
        setBulkGenerated(false);
        setGenerated(true);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
                {/* Configuration Card */}
                <div className="bg-white dark:bg-[var(--erp-bg)] rounded-3xl p-8 border border-default dark:border-default shadow-sm transition-all hover:shadow-md">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                            <RefreshCw className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h2 className="text-xl font-black text-main dark:text-main uppercase tracking-tight">Configuration Engine</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Identity (SKU/Barcode) *</label>
                            <input
                                type="text"
                                value={formData.sku}
                                onChange={(e) => { setFormData({ ...formData, sku: e.target.value }); setGenerated(false); }}
                                className="w-full px-5 py-4 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-main dark:text-main"
                                placeholder="E.G. SK-992-BX"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Protocol (Symbol) </label>
                            <select
                                value={formData.barcodeType}
                                onChange={(e) => { setFormData({ ...formData, barcodeType: e.target.value }); setGenerated(false); }}
                                className="w-full px-5 py-4 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-main dark:text-main appearance-none"
                            >
                                {['CODE128', 'CODE39', 'EAN13', 'UPC', 'QR Code'].map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Payload Title (Name)</label>
                            <input
                                type="text"
                                value={formData.itemName}
                                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                                className="w-full px-5 py-4 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-main dark:text-main"
                                placeholder="Product Descriptor"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Valuation (Price)</label>
                            <input
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="w-full px-5 py-4 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-main dark:text-main"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Output Voluem (Qty)</label>
                            <input
                                type="number"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                                className="w-full px-5 py-4 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-main dark:text-main"
                                min="1"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Media Layout (Paper)</label>
                            <select
                                value={formData.paperSize}
                                onChange={(e) => setFormData({ ...formData, paperSize: e.target.value })}
                                className="w-full px-5 py-4 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none transition-all font-bold text-main dark:text-main appearance-none"
                            >
                                {['A4', 'Letter', 'Label 40x20mm', 'Label 50x25mm'].map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Automation & Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-[var(--erp-bg)] rounded-3xl p-8 border border-default dark:border-default shadow-sm">
                         <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
                                <Layers className="w-4 h-4 text-emerald-600" />
                            </div>
                            <h3 className="text-sm font-black text-main dark:text-main uppercase tracking-widest">Automation</h3>
                        </div>
                        <button 
                            onClick={() => setShowInventoryModal(true)}
                            className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
                        >
                            Sync From Registry
                        </button>
                        {selectedItems.length > 0 && (
                            <p className="mt-3 text-[10px] font-black text-emerald-600 uppercase tracking-widest text-center">
                                {selectedItems.length} Entities Indexed for Bulk Processing
                            </p>
                        )}
                    </div>

                    <div className="bg-white dark:bg-[var(--erp-bg)] rounded-3xl p-8 border border-default dark:border-default shadow-sm">
                         <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
                                <Layout className="w-4 h-4 text-indigo-600" />
                            </div>
                            <h3 className="text-sm font-black text-main dark:text-main uppercase tracking-widest">Visibility</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setFormData({...formData, includeName: !formData.includeName})}
                                className={`py-4 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${formData.includeName ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 dark:border-default text-muted'}`}
                            >
                                Name: {formData.includeName ? 'ON' : 'OFF'}
                            </button>
                            <button 
                                onClick={() => setFormData({...formData, includePrice: !formData.includePrice})}
                                className={`py-4 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${formData.includePrice ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 dark:border-default text-muted'}`}
                            >
                                Price: {formData.includePrice ? 'ON' : 'OFF'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-4">
                <div className="bg-[var(--erp-bg)] rounded-[2rem] p-8 sticky top-8 border border-default shadow-2xl">
                    <h3 className="text-xs font-black text-main/40 uppercase tracking-[0.3em] mb-8 text-center">Output Preview</h3>
                    
                    <div className="bg-white rounded-2xl p-8 min-h-[300px] flex flex-col items-center justify-center relative overflow-hidden group shadow-inner">
                        {error && (
                            <div className="absolute inset-0 bg-rose-500/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
                                <AlertCircle className="w-12 h-12 text-main mb-4 animate-bounce" />
                                <p className="text-xs font-black text-main uppercase tracking-widest">{error}</p>
                                <button onClick={() => setError('')} className="mt-4 px-6 py-2 bg-white/20 hover:bg-white/30 text-main rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Dismiss</button>
                            </div>
                        )}

                        {generated ? (
                            <div className="animate-scale-in flex flex-col items-center">
                                {formData.barcodeType === 'QR Code' ? (
                                    <QRCodeCanvas value={formData.sku} size={180} level="M" includeMargin={true} />
                                ) : (
                                    <svg ref={barcodeRef} className="max-w-full h-auto"></svg>
                                )}
                                {formData.includeName && formData.itemName && (
                                    <p className="mt-4 text-xs font-black text-main uppercase tracking-widest text-center">{formData.itemName}</p>
                                )}
                                {formData.includePrice && formData.price && (
                                    <p className="mt-1 text-lg font-black text-indigo-600">₹{formData.price}</p>
                                )}
                            </div>
                        ) : (
                            <div className="text-center space-y-4 opacity-20 group-hover:opacity-30 transition-opacity">
                                <Printer className="w-16 h-16 text-main mx-auto" />
                                <p className="text-[10px] font-black text-main uppercase tracking-tight">System Ready for Generation</p>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 space-y-4">
                        <button 
                            onClick={handleGenerate}
                            className="w-full py-4 bg-white text-main rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-50 active:scale-95 transition-all shadow-xl"
                        >
                            Generate Payload
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                             <button 
                                className="py-4 bg-[var(--erp-bg-sunken)] hover:bg-white/10 text-main rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                                disabled={!generated}
                            >
                                <Printer className="w-3.5 h-3.5" /> Print
                            </button>
                            <button 
                                className="py-4 bg-[var(--erp-bg-sunken)] hover:bg-white/10 text-main rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                                disabled={!generated}
                            >
                                <Download className="w-3.5 h-3.5" /> PDF
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 flex items-center gap-4 p-4 bg-[var(--erp-bg-sunken)] rounded-2xl border border-default">
                         <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                            <RefreshCw className="w-5 h-5 text-indigo-400" />
                         </div>
                         <div>
                             <p className="text-[10px] font-black text-main/60 uppercase tracking-widest">Live Sync Status</p>
                             <p className="text-[9px] font-bold text-indigo-400 uppercase">Awaiting instruction</p>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BarcodeGeneratorFeature;
