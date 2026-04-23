import React, { useState } from 'react';
import { Search, ScanLine, ShoppingCart, CreditCard, Banknote, User, Trash2, Plus, Minus, Tag, ArrowRight } from 'lucide-react';

interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    image: string;
    stock: number;
}

const PRODUCTS: Product[] = [
    { id: '1', name: 'Neural Link Gen 3', price: 12500, category: 'Hardware', stock: 15, image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&q=80' },
    { id: '2', name: 'Quantum Processor', price: 45000, category: 'Components', stock: 4, image: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=200&q=80' },
    { id: '3', name: 'Cyber Chassis', price: 8900, category: 'Enclosures', stock: 8, image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=200&q=80' },
    { id: '4', name: 'Optic Cable 50m', price: 2500, category: 'Networking', stock: 42, image: 'https://images.unsplash.com/photo-1544717685-6447c20c0211?w=200&q=80' },
    { id: '5', name: 'Haptic Gloves', price: 18000, category: 'Peripherals', stock: 12, image: 'https://images.unsplash.com/photo-1618424181497-157f25b6ce5e?w=200&q=80' },
    { id: '6', name: 'Memory Module X', price: 6500, category: 'Components', stock: 30, image: 'https://images.unsplash.com/photo-1563208293-1627c293779e?w=200&q=80' },
];

const POSMockUI: React.FC = () => {
    const [cart, setCart] = useState<{product: Product, qty: number}[]>([
        { product: PRODUCTS[0], qty: 1 },
        { product: PRODUCTS[3], qty: 2 },
    ]);

    const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.qty), 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    return (
        <div className="min-h-screen bg-app text-main font-sans selection:bg-cyan-500/30 flex overflow-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[150px]" />
            </div>

            {/* Left Side: Product Grid */}
            <div className="flex-1 flex flex-col relative z-10 border-r border-default bg-input backdrop-blur-md">
                {/* Header */}
                <header className="h-20 px-8 flex items-center justify-between border-b border-default">
                    <div className="flex items-center gap-6">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                            <ShoppingCart className="w-5 h-5 text-black" />
                        </div>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-secondary" />
                            <input 
                                type="text" 
                                placeholder="Search products or scan barcode..." 
                                className="w-96 glass-panel border border-default rounded-xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-main placeholder:text-slate-600"
                            />
                        </div>
                    </div>
                    <button className="h-10 px-4 bg-card hover:bg-card border border-default rounded-xl flex items-center gap-2 transition-colors">
                        <ScanLine className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm font-bold">Scanner Active</span>
                    </button>
                </header>

                {/* Categories */}
                <div className="px-8 py-4 flex gap-3 overflow-x-auto no-scrollbar border-b border-default">
                    {['All Items', 'Hardware', 'Components', 'Enclosures', 'Networking', 'Peripherals'].map((cat, idx) => (
                        <button key={cat} className={`whitespace-nowrap px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${idx === 0 ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'glass-panel text-muted border border-default hover:bg-card'}`}>
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Products Grid */}
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {PRODUCTS.map(product => (
                            <div key={product.id} className="group bg-slate-900/30 border border-default rounded-2xl overflow-hidden hover:border-cyan-500/50 hover:glass-panel transition-all cursor-pointer">
                                <div className="h-40 overflow-hidden relative">
                                    <img src={product.image} alt={product.name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                                    <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-white/10 text-[10px] font-bold text-main">
                                        {product.stock} left
                                    </div>
                                </div>
                                <div className="p-4">
                                    <p className="text-xs text-secondary uppercase tracking-widest font-bold mb-1">{product.category}</p>
                                    <h3 className="font-bold text-main mb-2 truncate">{product.name}</h3>
                                    <div className="flex justify-between items-center">
                                        <p className="text-cyan-400 font-mono font-bold">₹{product.price.toLocaleString()}</p>
                                        <button className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Side: Cart */}
            <div className="w-[450px] bg-app backdrop-blur-xl border-l border-default flex flex-col relative z-10 shadow-[-20px_0_40px_rgba(0,0,0,0.5)]">
                {/* Customer Select */}
                <div className="p-6 border-b border-default">
                    <button className="w-full h-12 bg-input border border-default hover:border-cyan-500/50 rounded-xl flex items-center justify-between px-4 transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center">
                                <User className="w-4 h-4 text-muted" />
                            </div>
                            <span className="text-sm font-bold text-main group-hover:text-cyan-400 transition-colors">Select Customer</span>
                        </div>
                        <Plus className="w-4 h-4 text-secondary" />
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {cart.map((item, idx) => (
                        <div key={idx} className="bg-black/30 border border-default rounded-xl p-4 flex gap-4">
                            <img src={item.product.image} className="w-16 h-16 rounded-lg object-cover border border-default" alt="" />
                            <div className="flex-1 flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-sm font-bold text-main line-clamp-2">{item.product.name}</h4>
                                    <button className="text-slate-600 hover:text-red-400 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-cyan-400 font-mono font-bold text-sm">₹{(item.product.price * item.qty).toLocaleString()}</p>
                                    <div className="flex items-center gap-3 bg-slate-900 border border-default rounded-lg p-1">
                                        <button className="w-6 h-6 flex items-center justify-center hover:bg-card rounded text-muted">
                                            <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                                        <button className="w-6 h-6 flex items-center justify-center hover:bg-card rounded text-muted">
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Cart Summary */}
                <div className="p-6 bg-black/60 border-t border-default mt-auto">
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-sm text-muted">
                            <span>Subtotal</span>
                            <span className="font-mono">₹{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted">
                            <span>Tax (18% GST)</span>
                            <span className="font-mono">₹{tax.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted">
                            <span className="flex items-center gap-1"><Tag className="w-3 h-3"/> Discount</span>
                            <span className="font-mono text-emerald-400">- ₹0.00</span>
                        </div>
                        <div className="h-px w-full bg-card my-2" />
                        <div className="flex justify-between items-end">
                            <span className="text-xs font-black uppercase tracking-widest text-secondary">Total Due</span>
                            <span className="text-3xl font-black text-main font-mono tracking-tighter">₹{total.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button className="h-14 bg-card hover:bg-card text-main rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-default">
                            <Banknote className="w-5 h-5" /> Cash
                        </button>
                        <button className="h-14 bg-card hover:bg-card text-main rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-default">
                            <CreditCard className="w-5 h-5" /> Card / UPI
                        </button>
                        <button className="col-span-2 h-16 bg-cyan-600 hover:bg-cyan-500 text-black rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(8,145,178,0.4)] hover:shadow-[0_0_30px_rgba(8,145,178,0.6)]">
                            Process Payment <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default POSMockUI;
