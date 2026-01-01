import React from 'react';
import { Pencil, Image as ImageIcon } from 'lucide-react';
import { useInventoryLogic } from '../../hooks/useInventoryLogic';

type InventoryLogic = ReturnType<typeof useInventoryLogic>;

export const InventoryMobileCardTemplate: React.FC<InventoryLogic> = ({
    displayedProducts,
    handleEdit,
    isOwner
}) => {
    return (
        <div className="md:hidden animate-fade-in">
            {displayedProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No products found matching criteria.</div>
            ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                    {displayedProducts.map(product => (
                        <div key={product.id} className="p-4 flex gap-4 bg-white dark:bg-slate-800">
                            {/* Image */}
                            <div className="shrink-0">
                                {product.image ? (
                                    <img src={product.image} alt="Prod" className="w-16 h-16 rounded-lg object-cover border border-slate-200 dark:border-slate-600" />
                                ) : (
                                    <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                        <ImageIcon className="w-8 h-8 text-slate-400" />
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-slate-900 dark:text-white truncate pr-2">{product.name}</h3>
                                    <button
                                        onClick={() => handleEdit(product)}
                                        className="p-2 -mr-2 -mt-2 text-slate-400 active:text-indigo-600"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2 mb-2">
                                    <span className="text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-400">{product.category}</span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${product.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                        {product.stock} {product.unit === 'Meter' ? 'm' : ''} in stock
                                    </span>
                                </div>

                                <div className="flex justify-between items-end mt-2">
                                    <div>
                                        <p className="text-xs text-slate-500 font-mono">{product.sku}</p>
                                        {isOwner && <p className="text-xs text-slate-400">Cost: ₹{product.cost}</p>}
                                    </div>
                                    <p className="font-bold text-indigo-600 dark:text-indigo-400">₹{product.price.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
