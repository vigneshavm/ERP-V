import React, { useState, useMemo } from 'react';
import { 
    Search, ScanLine, ShoppingCart, CreditCard, Banknote, 
    User, Trash2, Plus, Minus, Tag, ArrowRight, Zap 
} from 'lucide-react';
import { inventory, MockProduct } from '../../data';
import Layout from '../../components/shared/Layout';

const POSMockUI: React.FC = () => {
    const [cart, setCart] = useState<{product: MockProduct, qty: number}[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All Items');

    const categories = useMemo(() => {
        const cats = Array.from(new Set((inventory as MockProduct[]).map(item => item.category)));
        return ['All Items', ...cats];
    }, []);

    const filteredProducts = useMemo(() => {
        return (inventory as MockProduct[]).filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                product.category.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = activeCategory === 'All Items' || product.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchTerm, activeCategory]);

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id);
            if (existing) {
                return prev.map(item => item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item);
            }
            return [...prev, { product, qty: 1 }];
        });
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.product.id !== id));
    };

    const updateQty = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product.id === id) {
                const newQty = Math.max(1, item.qty + delta);
                return { ...item, qty: newQty };
            }
            return item;
        }));
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.product.selling_price * item.qty), 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    return (
        <Layout fullWidth={true}>
            <div className="flex h-[calc(100vh-80px)] -mt-4 -mx-4 lg:-mx-8 overflow-hidden bg-neutral-50 dark:bg-neutral-950">
                {/* Left Side: Product Grid */}
                <div className="flex-1 flex flex-col border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm relative z-10">
                    {/* Header */}
                    <header className="h-20 px-8 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 text-primary rounded-sm flex items-center justify-center border border-primary/20 shadow-lg shadow-primary/10">
                                    <ShoppingCart className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-main uppercase tracking-widest italic">Fast Order</h2>
                                    <p className="text-[9px] text-neutral-400 font-black uppercase tracking-widest opacity-60">Protocol V4 Active</p>
                                </div>
                            </div>
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                                <input 
                                    type="text" 
                                    placeholder="SEARCH CATALOG OR SCAN BARCODE..." 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-[450px] bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm py-3 pl-12 pr-4 text-[10px] font-black tracking-widest focus:outline-none focus:border-primary/50 transition-all text-main uppercase"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="flex h-2 w-2 rounded-full bg-success animate-pulse" />
                            <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Scanner Ready</span>
                        </div>
                    </header>

                    {/* Categories */}
                    <div className="px-8 py-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">
                        {categories.map((cat) => (
                            <button 
                                key={cat} 
                                onClick={() => setActiveCategory(cat)}
                                className={`whitespace-nowrap px-6 py-2 rounded-sm text-[9px] font-black uppercase tracking-widest transition-all border ${activeCategory === cat ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white dark:bg-neutral-900 text-neutral-400 border-neutral-200 dark:border-neutral-800 hover:border-primary/30 hover:text-main'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Products Grid */}
                    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {filteredProducts.map(product => (
                                <div 
                                    key={product.id} 
                                    onClick={() => addToCart(product)}
                                    className="group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm overflow-hidden hover:border-primary/50 transition-all cursor-pointer shadow-sm flex flex-col"
                                >
                                    <div className="h-44 overflow-hidden relative bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                        <Zap className="w-12 h-12 text-neutral-200 dark:text-neutral-700 group-hover:scale-125 transition-transform duration-700" />
                                        <div className="absolute top-2 right-2 px-3 py-1 bg-neutral-900/80 backdrop-blur-md rounded-sm border border-white/10 text-[9px] font-black text-white uppercase tracking-widest">
                                            {product.stock} STOCK
                                        </div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <p className="text-[9px] text-neutral-400 uppercase tracking-widest font-black mb-1 opacity-60">{product.category}</p>
                                            <h3 className="text-sm font-black text-main mb-3 truncate uppercase tracking-tight">{product.name}</h3>
                                        </div>
                                        <div className="flex justify-between items-center mt-auto pt-3 border-t border-neutral-50 dark:border-neutral-800">
                                            <p className="text-lg font-display font-black text-main tracking-tighter">₹{product.selling_price.toLocaleString()}</p>
                                            <div className="w-8 h-8 rounded-sm bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-primary/20">
                                                <Plus className="w-4 h-4" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Cart */}
                <div className="w-[500px] bg-neutral-50 dark:bg-neutral-950 flex flex-col relative z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.05)] border-l border-neutral-200 dark:border-neutral-800">
                    {/* Customer Select */}
                    <div className="p-8 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                        <button className="w-full h-14 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 hover:border-primary/50 rounded-sm flex items-center justify-between px-6 transition-all group shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-8 h-8 rounded-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center group-hover:text-primary transition-colors">
                                    <User className="w-4 h-4 text-neutral-400" />
                                </div>
                                <span className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] group-hover:text-primary transition-colors">Select Client Node</span>
                            </div>
                            <Plus className="w-4 h-4 text-neutral-300" />
                        </button>
                    </div>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale">
                                <ShoppingCart className="w-16 h-16 mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Basket Null</p>
                            </div>
                        ) : (
                            cart.map((item, idx) => (
                                <div key={idx} className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm p-5 flex gap-5 shadow-sm group">
                                    <div className="w-16 h-16 rounded-sm bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center border border-neutral-100 dark:border-neutral-800">
                                        <Zap className="w-6 h-6 text-neutral-300 dark:text-neutral-700" />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div className="flex justify-between items-start gap-4">
                                            <h4 className="text-xs font-black text-main uppercase tracking-tight leading-tight">{item.product.name}</h4>
                                            <button onClick={() => removeFromCart(item.product.id)} className="text-neutral-300 hover:text-danger transition-all p-1">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center mt-4">
                                            <p className="text-lg font-display font-black text-main tracking-tighter">₹{(item.product.selling_price * item.qty).toLocaleString()}</p>
                                            <div className="flex items-center gap-4 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm p-1.5 shadow-inner">
                                                <button onClick={() => updateQty(item.product.id, -1)} className="w-7 h-7 flex items-center justify-center hover:bg-white dark:hover:bg-neutral-900 rounded-sm text-neutral-400 hover:text-primary transition-all">
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="text-xs font-black w-6 text-center tabular-nums">{item.qty}</span>
                                                <button onClick={() => updateQty(item.product.id, 1)} className="w-7 h-7 flex items-center justify-center hover:bg-white dark:hover:bg-neutral-900 rounded-sm text-neutral-400 hover:text-primary transition-all">
                                                    <Plus className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Cart Summary */}
                    <div className="p-8 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Subtotal Throughput</span>
                                <span className="text-sm font-black text-main tabular-nums">₹{subtotal.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">Protocol Tax (18%)</span>
                                <span className="text-sm font-black text-main tabular-nums">₹{tax.toLocaleString()}</span>
                            </div>
                            <div className="h-px w-full bg-neutral-100 dark:bg-neutral-800 my-2" />
                            <div className="flex justify-between items-end">
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 block mb-1">Total Due</span>
                                    <span className="text-4xl font-display font-black text-main tracking-tighter tabular-nums">₹{total.toLocaleString()}</span>
                                </div>
                                <div className="text-right">
                                    <span className="px-3 py-1 bg-success/10 text-success border border-success/30 rounded-sm text-[8px] font-black uppercase tracking-[0.2em]">Validated</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button className="h-16 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-primary/50 text-main rounded-sm font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all shadow-sm">
                                <Banknote className="w-5 h-5 text-primary" /> Cash Node
                            </button>
                            <button className="h-16 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-primary/50 text-main rounded-sm font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all shadow-sm">
                                <CreditCard className="w-5 h-5 text-primary" /> Digital UPI
                            </button>
                            <button className="col-span-2 h-20 bg-primary text-white rounded-sm font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 transition-all shadow-2xl shadow-primary/30 hover:opacity-90">
                                Commit Transaction <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default POSMockUI;
