import React, { useState } from 'react';
import { Search, Filter, Plus, Box, AlertTriangle, TrendingUp, TrendingDown, MoreVertical, Layers, Zap } from 'lucide-react';

// --- Types & Mock Data ---
interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    stock: number;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
    price: string;
    trend: 'up' | 'down';
    image: string;
}

const MOCK_INVENTORY: Product[] = [
    { id: '1', name: 'Neural Link Interconnect', sku: 'NL-X1-992', category: 'Hardware', stock: 42, status: 'In Stock', price: '₹12,499', trend: 'up', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&q=80' },
    { id: '2', name: 'Quantum Logic Board v4', sku: 'QLB-400X', category: 'Components', stock: 8, status: 'Low Stock', price: '₹45,999', trend: 'down', image: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=100&q=80' },
    { id: '3', name: 'Cyber-Carbon Chassis', sku: 'CC-CHAS-01', category: 'Enclosures', stock: 0, status: 'Out of Stock', price: '₹8,999', trend: 'up', image: 'https://images.unsplash.com/photo-1591488320449-011701bb6704?w=100&q=80' },
    { id: '4', name: 'Optic Fiber Spool (50m)', sku: 'OFS-50M-G2', category: 'Networking', stock: 156, status: 'In Stock', price: '₹2,499', trend: 'up', image: 'https://images.unsplash.com/photo-1544717685-6447c20c0211?w=100&q=80' },
    { id: '5', name: 'Haptic Feedback Matrix', sku: 'HFM-PRO-X', category: 'Peripherals', stock: 12, status: 'Low Stock', price: '₹18,500', trend: 'up', image: 'https://images.unsplash.com/photo-1618424181497-157f25b6ce5e?w=100&q=80' },
];

const InventoryMockUI: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="min-h-screen bg-app text-main font-sans selection:bg-emerald-500/30">
            {/* Background Ambient Glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px]" />
                <div className="absolute top-[40%] -right-[10%] w-[40%] h-[60%] bg-blue-600/10 rounded-full blur-[140px]" />
            </div>

            {/* Main Layout */}
            <div className="relative z-10 flex h-screen overflow-hidden">
                
                {/* Minimalist Sidebar */}
                <aside className="w-20 lg:w-64 border-r border-white/5 bg-input backdrop-blur-xl flex flex-col items-center lg:items-start py-8">
                    <div className="w-12 h-12 lg:w-auto lg:h-auto lg:px-6 mb-12 flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Layers className="w-5 h-5 text-main" />
                        </div>
                        <span className="hidden lg:block font-black text-xl tracking-tighter">BizzAI.</span>
                    </div>
                    
                    <nav className="w-full px-4 space-y-4">
                        {[
                            { icon: Box, label: 'Inventory', active: true },
                            { icon: AlertTriangle, label: 'Alerts', active: false },
                            { icon: TrendingUp, label: 'Analytics', active: false },
                        ].map((item, idx) => (
                            <button key={idx} className={`w-full flex items-center justify-center lg:justify-start gap-3 p-3 rounded-xl transition-all ${item.active ? 'bg-white/10 text-emerald-400 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]' : 'text-zinc-500 hover:text-main hover:bg-white/5'}`}>
                                <item.icon className="w-5 h-5" />
                                <span className="hidden lg:block font-bold text-sm tracking-wide">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* Top Nav */}
                    <header className="h-20 border-b border-white/5 bg-card backdrop-blur-md flex items-center justify-between px-8">
                        <div>
                            <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
                                Inventory Matrix
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase tracking-widest font-black">Live</span>
                            </h1>
                            <p className="text-xs text-zinc-500 font-medium tracking-wide mt-1">Manage core system assets and structural components.</p>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                                <input 
                                    type="text" 
                                    placeholder="Search by SKU or Name..." 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-64 bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium placeholder:text-zinc-600"
                                />
                            </div>
                            <button className="h-10 px-6 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center gap-2">
                                <Plus className="w-4 h-4" /> Initialize Item
                            </button>
                        </div>
                    </header>

                    {/* Dashboard Metrics */}
                    <div className="px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { label: 'Total Value', value: '₹14.2M', trend: '+2.4%', icon: TrendingUp, color: 'emerald' },
                            { label: 'Critical Stock', value: '24', trend: '-5', icon: AlertTriangle, color: 'orange' },
                            { label: 'System Active Items', value: '1,204', trend: '+12', icon: Zap, color: 'blue' },
                        ].map((stat, idx) => (
                            <div key={idx} className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 relative overflow-hidden group hover:bg-white/[0.04] transition-colors">
                                <div className={`absolute top-0 right-0 w-32 h-32 bg-${stat.color}-500/10 blur-[50px] -mr-10 -mt-10 group-hover:bg-${stat.color}-500/20 transition-colors`} />
                                <div className="flex justify-between items-start mb-4 relative z-10">
                                    <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 text-${stat.color}-400`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-bold px-2 py-1 bg-white/5 rounded-lg text-zinc-400">{stat.trend}</span>
                                </div>
                                <h3 className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1 relative z-10">{stat.label}</h3>
                                <p className="text-4xl font-black tracking-tighter relative z-10">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    {/* Data Grid */}
                    <div className="flex-1 px-8 pb-8 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">Inventory Registry</h2>
                            <button className="p-2 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-main transition-colors">
                                <Filter className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 bg-white/[0.01] border border-white/5 rounded-[2rem] overflow-hidden flex flex-col">
                            {/* Grid Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/5 bg-input text-xs font-black uppercase tracking-widest text-zinc-500">
                                <div className="col-span-5">Asset Descriptor</div>
                                <div className="col-span-2">Category</div>
                                <div className="col-span-2">Status</div>
                                <div className="col-span-2 text-right">Valuation</div>
                                <div className="col-span-1"></div>
                            </div>

                            {/* Grid Body */}
                            <div className="flex-1 overflow-y-auto">
                                {MOCK_INVENTORY.map((item) => (
                                    <div key={item.id} className="grid grid-cols-12 gap-4 px-6 py-4 border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors items-center group">
                                        <div className="col-span-5 flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 overflow-hidden relative">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm tracking-wide text-zinc-200 group-hover:text-main transition-colors">{item.name}</h3>
                                                <p className="text-xs font-mono text-zinc-600 mt-0.5">{item.sku}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="col-span-2 flex items-center">
                                            <span className="px-3 py-1 bg-white/5 rounded-lg text-xs font-medium text-zinc-400 border border-white/5">{item.category}</span>
                                        </div>
                                        
                                        <div className="col-span-2 flex items-center">
                                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2
                                                ${item.status === 'In Stock' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 
                                                  item.status === 'Low Stock' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 
                                                  'bg-red-500/10 border-red-500/20 text-red-400'}`}
                                            >
                                                <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'In Stock' ? 'bg-emerald-400' : item.status === 'Low Stock' ? 'bg-orange-400' : 'bg-red-400'} animate-pulse`} />
                                                {item.status} ({item.stock})
                                            </div>
                                        </div>

                                        <div className="col-span-2 flex items-center justify-end font-mono font-bold text-sm">
                                            {item.price}
                                        </div>

                                        <div className="col-span-1 flex justify-end">
                                            <button className="p-2 text-zinc-600 hover:text-main hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default InventoryMockUI;
