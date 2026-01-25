import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../../types/product';
import { X, ShoppingCart } from 'lucide-react';

interface POSVariantSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    baseProduct: Product;
    allVariants: Product[];
    onConfirm: (selectedVariants: { product: Product; qty: number }[]) => void;
}

export const POSVariantSelectionModal: React.FC<POSVariantSelectionModalProps> = ({
    isOpen,
    onClose,
    baseProduct,
    allVariants,
    onConfirm,
}) => {
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    // Reset quantities when modal opens with a new product
    useEffect(() => {
        if (isOpen) {
            setQuantities({});
        }
    }, [isOpen, baseProduct.id]);

    // Extract unique sizes and colors
    const { uniqueSizes, uniqueColors, matrix } = useMemo(() => {
        const sizes = Array.from(new Set(allVariants.map(p => p.size || 'N/A'))).sort();
        const colors = Array.from(new Set(allVariants.map(p => p.color || 'N/A'))).sort();

        const map: { [key: string]: Product } = {}; // key: "Color-Size"
        allVariants.forEach(p => {
            const key = `${p.color || 'N/A'}-${p.size || 'N/A'}`;
            map[key] = p;
        });

        return { uniqueSizes: sizes, uniqueColors: colors, matrix: map };
    }, [allVariants]);

    const handleQtyChange = (productId: string, qty: number) => {
        setQuantities(prev => ({
            ...prev,
            [productId]: Math.max(0, qty)
        }));
    };

    const handleBatchAdd = () => {
        const toAdd = (Object.entries(quantities) as [string, number][])
            .filter(([_, qty]) => qty > 0)
            .map(([id, qty]) => {
                const product = allVariants.find(p => p.id === id);
                return product ? { product, qty } : null;
            })
            .filter(Boolean) as { product: Product; qty: number }[];

        if (toAdd.length > 0) {
            onConfirm(toAdd);
            onClose();
        }
    };

    if (!isOpen) return null;

    const totalQty = (Object.values(quantities) as number[]).reduce((a, b) => a + b, 0);
    const totalAmount = (Object.entries(quantities) as [string, number][]).reduce((acc, [id, qty]) => {
        const p = allVariants.find(v => v.id === id);
        return acc + (p ? p.price * qty : 0);
    }, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-4 border-b border-neutral-100 dark:border-neutral-700 flex justify-between items-center bg-neutral-50 dark:bg-neutral-900/50">
                    <div>
                        <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">{baseProduct.name}</h2>
                        <p className="text-sm text-neutral-500">Select Variants to Add</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>

                {/* Matrix Grid */}
                <div className="p-6 overflow-auto flex-1">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr>
                                <th className="p-2 text-left text-sm font-bold text-neutral-500">Color \ Size</th>
                                {uniqueSizes.map(size => (
                                    <th key={size} className="p-2 text-center text-sm font-bold text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 border dark:border-neutral-700 min-w-[80px]">
                                        {size}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {uniqueColors.map(color => (
                                <tr key={color}>
                                    <td className="p-3 text-sm font-bold text-neutral-700 dark:text-neutral-300 border dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 sticky left-0">
                                        {color}
                                    </td>
                                    {uniqueSizes.map(size => {
                                        const key = `${color}-${size}`;
                                        const product = matrix[key];
                                        const qty = product ? (quantities[product.id] || 0) : 0;

                                        if (!product) {
                                            return (
                                                <td key={size} className="p-2 border dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-900/20">
                                                    <div className="h-8 w-full flex items-center justify-center text-neutral-300 text-xs">-</div>
                                                </td>
                                            );
                                        }

                                        const isOutOfStock = product.stock <= 0;

                                        return (
                                            <td key={size} className={`p-2 border dark:border-neutral-700 ${qty > 0 ? 'bg-primary/10 dark:bg-primary/20' : ''}`}>
                                                <div className="flex flex-col gap-1 items-center">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={product.stock}
                                                        value={qty || ''}
                                                        onChange={(e) => handleQtyChange(product.id, parseInt(e.target.value) || 0)}
                                                        disabled={isOutOfStock}
                                                        className={`w-16 h-8 text-center border rounded-md text-sm font-bold focus:ring-2 focus:ring-primary focus:outline-none 
                                                            ${isOutOfStock
                                                                ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed border-neutral-200'
                                                                : 'border-neutral-300 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white'
                                                            } 
                                                            ${qty > 0 ? 'border-primary ring-1 ring-primary' : ''}
                                                        `}
                                                        placeholder={isOutOfStock ? "0" : "0"}
                                                    />
                                                    <div className="flex items-center gap-1">
                                                        <span className={`text-[10px] font-mono ${isOutOfStock ? 'text-error' : 'text-neutral-400'}`}>
                                                            {isOutOfStock ? 'Out' : `${product.stock} left`}
                                                        </span>
                                                        {product.price !== baseProduct.price && (
                                                            <span className="text-[10px] text-success font-bold bg-success/10 px-1 rounded border border-success/20">
                                                                ₹{product.price}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 flex justify-between items-center">
                    <div className="flex gap-4 items-center">
                        <div className="flex flex-col">
                            <span className="text-xs text-neutral-500 uppercase font-bold">Total Items</span>
                            <span className="text-xl font-bold text-neutral-800 dark:text-neutral-100">{totalQty}</span>
                        </div>
                        <div className="w-px h-8 bg-neutral-300 dark:bg-neutral-600"></div>
                        <div className="flex flex-col">
                            <span className="text-xs text-neutral-500 uppercase font-bold">Total Value</span>
                            <span className="text-xl font-bold text-success">₹{totalAmount.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-neutral-600 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg font-medium transition-colors"
                        >
                            Cancel (Esc)
                        </button>
                        <button
                            onClick={handleBatchAdd}
                            disabled={totalQty === 0}
                            className="px-6 py-2 bg-primary hover:bg-primary/90 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 disabled:text-neutral-400 disabled:cursor-not-allowed text-white rounded-lg font-bold shadow-lg shadow-primary/20 flex items-center gap-2 transition-all"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
