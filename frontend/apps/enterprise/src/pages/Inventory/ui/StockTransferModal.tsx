import React, { useState } from 'react';
import { X, ArrowRightLeft, Warehouse, Layers, Save, AlertCircle } from 'lucide-react';

interface StockTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTransfer: (transferData: any) => Promise<void>;
    isLoading?: boolean;
    items?: any[];
}

const StockTransferModal: React.FC<StockTransferModalProps> = ({ isOpen, onClose, onTransfer, isLoading, items = [] }) => {
    const [formData, setFormData] = useState({
        itemId: '',
        sourceNode: 'Main Warehouse',
        destinationNode: '',
        quantity: 0,
        remarks: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.itemId || !formData.destinationNode || formData.quantity <= 0) {
            alert("Please fill all required fields");
            return;
        }
        await onTransfer(formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'quantity' ? parseFloat(value) || 0 : value
        }));
    };

    const selectedItem = items.find(i => i._id === formData.itemId);

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[var(--erp-card)] w-full max-w-xl rounded-3xl border border-default dark:border-default shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-8 py-6 border-b border-default dark:border-default flex justify-between items-center bg-[var(--erp-bg-sunken)]/50 dark:bg-neutral-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600/10 text-indigo-600 rounded-xl">
                            <ArrowRightLeft className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black italic text-neutral-900 dark:text-neutral-100">
                                Stock Transfer Protocol
                            </h3>
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-0.5">
                                Inter-Node Movement Authorization
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-neutral-700 text-neutral-400 hover:text-rose-600 rounded-full transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
                    <div className="space-y-4">
                        {/* SKU Selection */}
                        <div>
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 block px-1">Select SKU to Transfer</label>
                            <select
                                name="itemId"
                                value={formData.itemId}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50 border border-default dark:border-default rounded-xl text-xs font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                            >
                                <option value="">-- Choose Item --</option>
                                {items.map(item => (
                                    <option key={item._id} value={item._id}>{item.name} ({item.sku}) - Qty: {item.stockQty}</option>
                                ))}
                            </select>
                        </div>

                        {/* Node Selection */}
                        <div className="grid grid-cols-2 gap-4 items-center">
                            <div>
                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 block px-1">Source Node</label>
                                <div className="px-4 py-3 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-card)] border border-default dark:border-default rounded-xl text-xs font-black text-neutral-500 flex items-center gap-2">
                                    <Warehouse className="w-4 h-4" /> {formData.sourceNode}
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 block px-1">Destination Node</label>
                                <select
                                    name="destinationNode"
                                    value={formData.destinationNode}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50 border border-default dark:border-default rounded-xl text-xs font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                                >
                                    <option value="">-- Choose Node --</option>
                                    <option value="Branch A">Coimbatore Branch</option>
                                    <option value="Branch B">Chennai Warehouse</option>
                                    <option value="Showroom">Main Showroom</option>
                                </select>
                            </div>
                        </div>

                        {/* Quantity and Validation */}
                        <div>
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 block px-1">Transfer Quantity</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    name="quantity"
                                    value={formData.quantity}
                                    onChange={handleChange}
                                    required
                                    max={selectedItem?.stockQty || 0}
                                    className="w-full px-4 py-3 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50 border border-default dark:border-default rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    placeholder="0"
                                />
                                {selectedItem && (
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-neutral-400">
                                        / {selectedItem.stockQty} AVAILABLE
                                    </div>
                                )}
                            </div>
                            {selectedItem && formData.quantity > selectedItem.stockQty && (
                                <p className="mt-2 text-[10px] font-bold text-rose-500 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Insufficient stock for transfer
                                </p>
                            )}
                        </div>

                        {/* Remarks */}
                        <div>
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 block px-1">Authorization Remarks</label>
                            <textarea
                                name="remarks"
                                value={formData.remarks}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-3 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50 border border-default dark:border-default rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                                placeholder="Purpose of movement..."
                            />
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-default dark:border-default bg-[var(--erp-bg-sunken)]/50 dark:bg-neutral-700/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-white dark:bg-[var(--erp-card)] border border-default dark:border-default text-neutral-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-neutral-700 transition-all"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !formData.itemId || !formData.destinationNode || formData.quantity <= 0 || (selectedItem && formData.quantity > selectedItem.stockQty)}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        Execute Transfer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StockTransferModal;
