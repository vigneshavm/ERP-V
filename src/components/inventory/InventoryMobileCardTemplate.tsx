import React from 'react';
import { Pencil, Image as ImageIcon } from 'lucide-react';
import { useInventoryLogic } from '../../hooks/useInventoryLogic';
import { Product } from '../../types/product';

type InventoryLogic = ReturnType<typeof useInventoryLogic>;

interface InventoryMobileCardProps {
    product: Product;
    handleEdit: (product: Product) => void;
    isOwner: boolean;
}

const InventoryMobileCard = React.memo<InventoryMobileCardProps>(({
    product,
    handleEdit,
    isOwner
}) => {
    return (
        <div className="p-4 flex gap-4 bg-white dark:bg-neutral-800">
            {/* Image */}
            <div className="shrink-0">
                {product.image ? (
                    <img src={product.image} alt="Prod" className="w-16 h-16 rounded-lg object-cover border border-neutral-200 dark:border-neutral-600" />
                ) : (
                    <div className="w-16 h-16 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-neutral-400" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-neutral-900 dark:text-white truncate pr-2">{product.name}</h3>
                    <button
                        onClick={() => handleEdit(product)}
                        className="p-2 -mr-2 -mt-2 text-neutral-400 active:text-primary"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-2">
                    <span className="text-xs px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-700 rounded text-neutral-600 dark:text-neutral-400">{product.category}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${product.stock < 10 ? 'bg-error/10 text-error' : 'bg-success/10 text-success'}`}>
                        {product.stock} {product.unit === 'Meter' ? 'm' : ''} in stock
                    </span>
                </div>

                <div className="flex justify-between items-end mt-2">
                    <div>
                        <p className="text-xs text-neutral-500 font-mono">{product.sku}</p>
                        {isOwner && <p className="text-xs text-neutral-400">Cost: ₹{product.cost}</p>}
                    </div>
                    <p className="font-bold text-primary">₹{product.price.toFixed(2)}</p>
                </div>
            </div>
        </div>
    );
});

InventoryMobileCard.displayName = 'InventoryMobileCard';

export const InventoryMobileCardTemplate: React.FC<InventoryLogic> = ({
    displayedProducts,
    handleEdit,
    isOwner
}) => {
    return (
        <div className="md:hidden animate-fade-in">
            {displayedProducts.length === 0 ? (
                <div className="p-8 text-center text-neutral-500">No products found matching criteria.</div>
            ) : (
                <div className="divide-y divide-neutral-100 dark:divide-neutral-700">
                    {displayedProducts.map(product => (
                        <InventoryMobileCard
                            key={product.id}
                            product={product}
                            handleEdit={handleEdit}
                            isOwner={isOwner}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
