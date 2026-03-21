import React, { useState } from 'react';
import { X, Plus, Trash2, Package, Check } from 'lucide-react';
import { PurchaseOrderItem } from "@vignesh-erp/shared-kernel";

interface LotDistributionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (lotData: { lotNumber: string; totalCost: number; totalQty: number; items: any[] }) => void;
}

const LotDistributionModal: React.FC<LotDistributionModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [lotData, setLotData] = useState({
        lotNumber: '',
        totalCost: 0,
        totalQty: 0,
        items: [] as any[]
    });

    if (!isOpen) return null;

    const handleAddSubItem = () => {
        setLotData({
            ...lotData,
            items: [...lotData.items, { id: Math.random(), product_name: '', quantity: 0 }]
        });
    };

    const handleConfirm = () => {
        if (!lotData.lotNumber || !lotData.totalCost || !lotData.totalQty) return;
        onConfirm(lotData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-[var(--erp-bg)]/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[var(--erp-bg)] w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-default overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-slate-50 dark:border-default flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-main dark:text-main uppercase tracking-tight">Lot Intelligence</h2>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Aggregated Cost Distribution</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-2xl hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-[var(--erp-card)] text-muted transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">Lot Serial #</label>
                            <input
                                type="text"
                                placeholder="LOT-2024-X"
                                className="w-full px-5 py-4 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border-none rounded-2xl font-bold text-sm"
                                value={lotData.lotNumber}
                                onChange={(e) => setLotData({ ...lotData, lotNumber: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">Aggregated Cost</label>
                            <input
                                type="number"
                                className="w-full px-5 py-4 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border-none rounded-2xl font-bold text-sm"
                                value={lotData.totalCost}
                                onChange={(e) => setLotData({ ...lotData, totalCost: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest px-1">Total Unit Count</label>
                            <input
                                type="number"
                                className="w-full px-5 py-4 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border-none rounded-2xl font-bold text-sm"
                                value={lotData.totalQty}
                                onChange={(e) => setLotData({ ...lotData, totalQty: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest">Package Composition</label>
                            <button
                                onClick={handleAddSubItem}
                                className="p-1 px-3 rounded-xl bg-indigo-500/10 text-indigo-500 text-[9px] font-black uppercase tracking-tighter"
                            >
                                + Add Variant
                            </button>
                        </div>
                        
                        <div className="space-y-3">
                            {lotData.items.map((item, i) => (
                                <div key={item.id} className="flex gap-3 animate-in slide-in-from-left-2 duration-300">
                                    <input
                                        type="text"
                                        placeholder="Sub-item name..."
                                        className="flex-[2] px-5 py-3 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border-none rounded-2xl font-bold text-xs"
                                        value={item.product_name}
                                        onChange={(e) => {
                                            const items = [...lotData.items];
                                            items[i].product_name = e.target.value;
                                            setLotData({ ...lotData, items });
                                        }}
                                    />
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        className="flex-1 px-5 py-3 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)]/50 border-none rounded-2xl font-bold text-xs text-center"
                                        value={item.quantity}
                                        onChange={(e) => {
                                            const items = [...lotData.items];
                                            items[i].quantity = parseFloat(e.target.value) || 0;
                                            setLotData({ ...lotData, items });
                                        }}
                                    />
                                    <button
                                        onClick={() => setLotData({ ...lotData, items: lotData.items.filter((_, idx) => idx !== i) })}
                                        className="p-3 rounded-2xl hover:bg-rose-50 hover:text-rose-500 text-slate-200 transition-all"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-slate-50 dark:border-default bg-[var(--erp-bg-sunken)]/50 dark:bg-[var(--erp-card)]/20 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-8 py-4 bg-white dark:bg-[var(--erp-bg)] text-muted rounded-2xl font-black text-sm border-2 border-slate-100 dark:border-default hover:bg-[var(--erp-bg-sunken)] transition-all"
                    >
                        Discard Lot
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!lotData.lotNumber || lotData.totalCost <= 0 || lotData.totalQty <= 0}
                        className="flex-[2] px-8 py-4 bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-3"
                    >
                        <Check className="w-5 h-5" /> Confirm Distribution
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LotDistributionModal;
