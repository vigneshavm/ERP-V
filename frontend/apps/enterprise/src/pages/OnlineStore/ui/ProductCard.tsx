import React from 'react';
import { ShoppingCart, Heart } from 'lucide-react';
import { Product } from "@repo/shared";

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
    const getProductImage = (product: Product) => {
        if (product.image) return product.image;
        return `https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80`;
    };

    return (
        <div className="group bg-white dark:bg-[var(--erp-card)] rounded-[2rem] border border-default dark:border-default overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col h-full">
            <div className="aspect-[4/3] bg-[var(--erp-bg-sunken)] dark:bg-slate-700 relative overflow-hidden">
                <img
                    src={getProductImage(product)}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4 p-3 bg-white/90 dark:bg-[var(--erp-bg)]/90 backdrop-blur rounded-full shadow-sm cursor-pointer hover:text-red-500 transition-colors">
                    <Heart className="w-5 h-5 text-muted hover:text-red-500" />
                </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
                <h3 className="font-bold text-main text-lg mb-2 leading-tight line-clamp-2">{product.name}</h3>
                <div className="mt-auto flex items-center justify-between">
                    <span className="block text-2xl font-black text-main">
                        ₹{product.sellingPrice.toLocaleString()}
                    </span>
                    <button
                        onClick={() => onAddToCart(product)}
                        disabled={product.stockQty <= 0}
                        className="p-4 bg-[var(--erp-bg)] dark:bg-[#4F46E5] text-main rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
                        aria-label={`Add ${product.name} to cart`}
                    >
                        <ShoppingCart className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;

