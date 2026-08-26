import React from 'react';
import { ShoppingCart, Car, Home, Smartphone, Zap, Pizza, MoreVertical } from 'lucide-react';

interface ExpenseListItemProps {
    category: string;
    amount: number;
    description: string;
    date: string;
}

const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
        case 'shopping': return <ShoppingCart className="w-5 h-5 text-blue-400" />;
        case 'transportation': return <Car className="w-5 h-5 text-yellow-400" />;
        case 'living':
        case 'rent': return <Home className="w-5 h-5 text-success" />;
        case 'mobile':
        case 'internet': return <Smartphone className="w-5 h-5 text-accent" />;
        case 'utilities': return <Zap className="w-5 h-5 text-warning" />;
        case 'food': return <Pizza className="w-5 h-5 text-danger" />;
        default: return <ShoppingCart className="w-5 h-5 text-neutral-400" />;
    }
};

const ExpenseListItem: React.FC<ExpenseListItemProps> = ({ category, amount, description, date }) => {
    return (
        <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-sm hover:bg-white/10 transition-all hover:translate-x-1 group">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-sm bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                    {getCategoryIcon(category)}
                </div>
                <div>
                    <h4 className="text-sm font-bold text-white mb-0.5">{category}</h4>
                    <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-wider">{description || 'No description'}</p>
                </div>
            </div>
            <div className="text-right flex items-center gap-4">
                <div>
                    <p className="text-sm font-bold text-white tabular-nums">₹{amount.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-neutral-500 font-medium text-right">{new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                </div>
                <button className="p-2 hover:bg-white/5 rounded-full text-neutral-500 hover:text-white transition-colors">
                    <MoreVertical className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default ExpenseListItem;
