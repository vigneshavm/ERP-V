import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, addToCart } from '../../store';
import { ShoppingBag, Search, Filter, Star, Heart, ShoppingCart } from 'lucide-react';
import { Product } from '../../types';

const Storefront: React.FC = () => {
  const dispatch = useDispatch();
  const { products } = useSelector((state: RootState) => state.inventory);
  const { currentSector, currentBranch } = useSelector((state: RootState) => state.auth);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Filter products based on sector, branch, search, and category
  const filteredProducts = products.filter(p => {
    const matchesSector = p.sector === currentSector;
    const matchesBranch = currentBranch === 'All' || p.branch === currentBranch;
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSector && matchesBranch && matchesSearch && matchesCategory;
  });

  // Safe derivation of categories with explicit typing to avoid 'unknown' type error
  const categoryList: string[] = products
    .filter(p => p.sector === currentSector)
    .map((p): string => p.category);
  const uniqueCategories = Array.from(new Set(categoryList));
  const categories: string[] = ['All', ...uniqueCategories];

  // Helper to get a relevant image based on sector/category
  const getProductImage = (product: Product) => {
    // In a real application, this would use product.imageUrl
    // Using a reliable placeholder for demo purposes
    return `https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Hero / Header Section */}
      <div className="bg-indigo-600 dark:bg-indigo-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10">
            <h1 className="text-4xl font-extrabold mb-2 tracking-tight">
                {currentSector === 'Textile' ? 'Fashion Collection' : 
                 currentSector === 'Supermarket' ? 'Fresh Groceries' : 
                 currentSector === 'Mobile Shop' ? 'Tech Store' : 'Store Catalog'}
            </h1>
            <p className="text-indigo-100 font-medium opacity-90 max-w-lg">
                Browse our complete inventory across {currentBranch === 'All' ? 'all branches' : `${currentBranch} branch`}. 
                Top quality items at the best prices.
            </p>
        </div>
        <ShoppingBag className="absolute right-[-20px] bottom-[-40px] w-64 h-64 text-indigo-500/30 rotate-12" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-20 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-md py-4 transition-all">
        {/* Categories */}
        <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 w-full md:w-auto no-scrollbar">
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                        selectedCategory === cat 
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' 
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
            <input 
                type="text" 
                placeholder="Search products..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
            <div key={product.id} className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full">
                {/* Image Area */}
                <div className="aspect-square bg-slate-100 dark:bg-slate-700 relative overflow-hidden">
                    <img 
                        src={getProductImage(product)} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-full shadow-sm cursor-pointer hover:text-red-500 transition-colors">
                        <Heart className="w-4 h-4" />
                    </div>
                    {product.stock < 10 && (
                        <div className="absolute bottom-3 left-3 px-2 py-1 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider rounded">
                            Low Stock
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">{product.category}</span>
                        <div className="flex items-center gap-1 text-amber-400 text-xs">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-slate-500 dark:text-slate-400 font-medium">4.5</span>
                        </div>
                    </div>
                    
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1 leading-tight">{product.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">High quality {product.productType} available at {product.branch} branch.</p>
                    
                    <div className="mt-auto flex items-center justify-between">
                        <div>
                            <span className="block text-2xl font-bold text-slate-900 dark:text-white">₹{product.price.toLocaleString()}</span>
                            <span className="text-xs text-slate-400 line-through">₹{(product.price * 1.2).toFixed(0)}</span>
                        </div>
                        <button 
                            onClick={() => dispatch(addToCart({ ...product, qty: 1 }))}
                            disabled={product.stock <= 0}
                            className="p-3 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-500 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                        >
                            <ShoppingCart className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        ))}
        {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 text-center text-slate-400">
                <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">No products found.</p>
                <p className="text-sm">Try adjusting your search or filters.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Storefront;