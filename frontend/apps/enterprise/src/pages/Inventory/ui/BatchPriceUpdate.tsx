import { logger } from '@/shared/lib/logger';
import React, { useState, useRef, useEffect } from 'react';
import { Search, Save, AlertCircle, CheckCircle, Package, ArrowRight, Printer } from 'lucide-react';
import api from '@/shared/api/api';
import { toast } from 'react-toastify';
import { useConfig } from "@/app/providers/ConfigContext";

interface Item {
    _id: string;
    name: string;
    sku: string;
    sellingPrice: number;
    stockQty: number;
    category: string;
}

const BatchPriceUpdate: React.FC = () => {
    const { tenantId } = useConfig();
    const [sku, setSku] = useState('');
    const [item, setItem] = useState<Item | null>(null);
    const [newPrice, setNewPrice] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [updating, setUpdating] = useState(false);

    const skuInputRef = useRef<HTMLInputElement>(null);
    const priceInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus SKU input on mount
    useEffect(() => {
        skuInputRef.current?.focus();
    }, []);

    const handleScan = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!sku.trim()) return;

        setLoading(true);
        setItem(null);
        setNewPrice('');

        try {
            const res = await api.get(`/v1/inventory?search=${encodeURIComponent(sku)}&limit=1`);

            if (res.data.items && res.data.items.length > 0) {
                const found = res.data.items.find((i: Item) => i.sku.toLowerCase() === sku.toLowerCase()) || res.data.items[0];
                setItem(found);

                // Focus price input
                setTimeout(() => priceInputRef.current?.focus(), 100);
            } else {
                toast.error('Item not found');
                setItem(null);
            }
        } catch (err) {
            logger.error('Scan Error:', err);
            toast.error('Error fetching item');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!item || !newPrice) return;

        setUpdating(true);
        try {
            const res = await api.post('/v1/inventory/batch-price-update', {
                sku: item.sku,
                newPrice: parseFloat(newPrice)
            });

            toast.success(res.data.message);

            // Reset for next scan
            setSku('');
            setItem(null);
            setNewPrice('');
            skuInputRef.current?.focus();

        } catch (err: any) {
            logger.error('Update Error:', err);
            toast.error(err.response?.data?.message || 'Error updating price');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-main dark:text-main flex items-center gap-2">
                    <Printer className="w-8 h-8 text-emerald-500" />
                    Batch Price Update
                </h1>
                <p className="text-muted dark:text-muted mt-1">
                    Scan a barcode, update the price, and automatically queue labels for reprinting.
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {/* Scan Section */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-default dark:border-default">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Scan Barcode / Enter SKU
                    </label>
                    <form onSubmit={handleScan} className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted w-5 h-5" />
                            <input
                                ref={skuInputRef}
                                type="text"
                                value={sku}
                                onChange={(e) => setSku(e.target.value)}
                                placeholder="Scan or type SKU..."
                                className="w-full pl-10 pr-4 py-3 bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)] border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {loading ? 'Scanning...' : (
                                <>
                                    Find Item <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Item Details & Update Section */}
                {item && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-2 border-emerald-500/20 animation-fade-in">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-main">{item.name}</h3>
                                <p className="text-sm text-muted dark:text-muted mt-1">
                                    SKU: <span className="font-mono bg-[var(--erp-bg-sunken)] dark:bg-gray-700 px-2 py-0.5 rounded">{item.sku}</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-muted dark:text-muted">Current Stock</div>
                                <div className="text-2xl font-bold text-main dark:text-main flex items-center justify-end gap-2">
                                    <Package className="w-5 h-5 text-emerald-500" />
                                    {item.stockQty}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end bg-[var(--erp-bg-sunken)] dark:bg-[var(--erp-bg)]/50 p-6 rounded-xl">
                            <div>
                                <label className="block text-sm font-medium text-muted dark:text-muted mb-1">
                                    Current Selling Price
                                </label>
                                <div className="text-2xl font-bold text-muted line-through">
                                    ₹{item.sellingPrice}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                                    New Selling Price (₹)
                                </label>
                                <input
                                    ref={priceInputRef}
                                    type="number"
                                    value={newPrice}
                                    onChange={(e) => setNewPrice(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUpdate()}
                                    placeholder="0.00"
                                    className="w-full text-2xl font-bold text-main bg-white dark:bg-gray-800 border-2 border-emerald-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-4">
                            <button
                                onClick={() => {
                                    setItem(null);
                                    setSku('');
                                    setNewPrice('');
                                    skuInputRef.current?.focus();
                                }}
                                className="px-6 py-3 text-secondary dark:text-gray-300 hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={updating || !newPrice}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {updating ? 'Updating...' : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Update Price & Queue Reprint
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            This will update the global price for this item and add all {item.stockQty} units to the label reprint queue.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BatchPriceUpdate;
