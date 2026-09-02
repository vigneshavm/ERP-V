import React, { useState, useEffect } from 'react';
import { X, Save, Box } from 'lucide-react';
import { Product } from '../../types/product';

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (productData: Partial<Product>) => Promise<void>;
    product?: Product | null;
    isLoading?: boolean;
    categories?: string[];
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, onSave, product, isLoading, categories }) => {
    const [isNewCategory, setIsNewCategory] = useState(false);
    const [formData, setFormData] = useState<Partial<Product>>({
        name: '',
        sku: '',
        category: '',
        costPrice: 0,
        sellingPrice: 0,
        stockQty: 0,
        lowStockLimit: 10,
        unit: 'pcs',
        brand: '',
        location: '',
        barcode: ''
    });

    useEffect(() => {
        if (product) {
            setFormData({
                ...product
            });
            // A product whose category isn't in the known list (e.g. legacy data, or a
            // category the catalog no longer has) still needs to be editable as free text.
            setIsNewCategory(!!product.category && !(categories || []).includes(product.category));
        } else {
            setFormData({
                name: '',
                sku: '',
                category: '',
                costPrice: 0,
                sellingPrice: 0,
                stockQty: 0,
                lowStockLimit: 10,
                unit: 'pcs',
                brand: '',
                location: '',
                barcode: ''
            });
            setIsNewCategory(false);
        }
    }, [product, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const NEW_CATEGORY_SENTINEL = '__new_category__';

    const handleCategorySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        if (e.target.value === NEW_CATEGORY_SENTINEL) {
            setIsNewCategory(true);
            setFormData(prev => ({ ...prev, category: '' }));
            return;
        }
        setIsNewCategory(false);
        setFormData(prev => ({ ...prev, category: e.target.value }));
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-neutral-800 w-full max-w-2xl rounded-sm border border-neutral-200 dark:border-neutral-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-8 py-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 text-primary rounded-xl">
                            <Box className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black italic text-neutral-900 dark:text-neutral-100">
                                {product ? 'Update SKU Authority' : 'Register New SKU'}
                            </h3>
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-0.5">
                                Central Metadata Control
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 hover:text-rose-600 rounded-full transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 block px-1">Product Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    placeholder="Blue Sky Filter..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 block px-1">SKU Code</label>
                                    <input
                                        type="text"
                                        name="sku"
                                        value={formData.sku}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="SKU-001"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 block px-1">Barcode</label>
                                    <input
                                        type="text"
                                        name="barcode"
                                        value={formData.barcode}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="123456789"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 block px-1">Category</label>
                                {isNewCategory ? (
                                    <div className="space-y-1.5">
                                        <input
                                            type="text"
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            required
                                            autoFocus
                                            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                            placeholder="New category name"
                                        />
                                        {(categories || []).length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => { setIsNewCategory(false); setFormData(prev => ({ ...prev, category: '' })); }}
                                                className="text-[10px] font-black text-neutral-400 hover:text-primary uppercase tracking-widest px-1"
                                            >
                                                ← Choose existing category instead
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <select
                                        name="category"
                                        value={formData.category || ''}
                                        onChange={handleCategorySelect}
                                        required
                                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                                    >
                                        <option value="" disabled>Select category...</option>
                                        {(categories || []).map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                        <option value={NEW_CATEGORY_SENTINEL}>+ Add new category</option>
                                    </select>
                                )}
                            </div>
                        </div>

                        {/* Pricing and Stock */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 block px-1">Cost Price (₹)</label>
                                    <input
                                        type="number"
                                        name="costPrice"
                                        value={formData.costPrice}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 block px-1">Selling Price (₹)</label>
                                    <input
                                        type="number"
                                        name="sellingPrice"
                                        value={formData.sellingPrice}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 block px-1">Stock OBT</label>
                                    <input
                                        type="number"
                                        name="stockQty"
                                        value={formData.stockQty}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 block px-1">Low Stock Limit</label>
                                    <input
                                        type="number"
                                        name="lowStockLimit"
                                        value={formData.lowStockLimit}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 block px-1">Unit</label>
                                    <select
                                        name="unit"
                                        value={formData.unit}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                                    >
                                        <option value="pcs">Pieces (pcs)</option>
                                        <option value="kg">Kilograms (kg)</option>
                                        <option value="l">Liters (l)</option>
                                        <option value="box">Box</option>
                                        <option value="unit">Unit</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1.5 block px-1">Brand</label>
                                    <input
                                        type="text"
                                        name="brand"
                                        value={formData.brand}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-bold text-main outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                                        placeholder="Zeiss"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-700/50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all"
                    >
                        Discard
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-8 py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:scale-100"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Save className="w-4 h-4" />
                        )}
                        {product ? 'Commit Changes' : 'Initialize SKU'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductModal;
