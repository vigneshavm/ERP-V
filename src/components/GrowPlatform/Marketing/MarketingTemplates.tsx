
import React, { useState } from 'react';
import {
    Palette,
    Search,
    Filter,
    Layout,
    Zap,
    CheckCircle2,
    Star,
    ArrowRight,
    Eye,
    Download,
    Layers,
    Sparkles,
    Calendar,
    Users,
    Heart,
    LayoutDashboard
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setActiveTab } from '../../../store';

const MarketingTemplates: React.FC = () => {
    const dispatch = useDispatch();
    const [selectedCategory, setSelectedCategory] = useState<'All' | 'Sales' | 'Festival' | 'Loyalty' | 'Social'>('All');

    const categories = ['All', 'Sales', 'Festival', 'Loyalty', 'Social'];

    const templates = [
        {
            id: 't1',
            name: 'Summer Flash Sale',
            category: 'Sales',
            type: 'FLYER',
            usage: 1240,
            roi: '5.2x',
            popularity: 'High',
            preview: 'bg-gradient-to-br from-orange-400 to-rose-400'
        },
        {
            id: 't2',
            name: 'Diwali Greetings',
            category: 'Festival',
            type: 'BANNER',
            usage: 3500,
            roi: '4.8x',
            popularity: 'Trending',
            preview: 'bg-gradient-to-br from-amber-400 to-indigo-900'
        },
        {
            id: 't3',
            name: 'Exclusive VIP Offer',
            category: 'Loyalty',
            type: 'OFFER_CARD',
            usage: 850,
            roi: '6.5x',
            popularity: 'Premium',
            preview: 'bg-gradient-to-br from-slate-700 to-black'
        },
        {
            id: 't4',
            name: 'Instagram Story Sale',
            category: 'Social',
            type: 'SQUARE',
            usage: 5200,
            roi: '3.8x',
            popularity: 'Popular',
            preview: 'bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500'
        },
        {
            id: 't5',
            name: 'Weekend Store Event',
            category: 'Sales',
            type: 'FLYER',
            usage: 2100,
            roi: '4.2x',
            popularity: 'New',
            preview: 'bg-gradient-to-br from-blue-500 to-indigo-600'
        },
        {
            id: 't6',
            name: 'Customer Appreciation',
            category: 'Loyalty',
            type: 'EMAIL',
            usage: 640,
            roi: '7.1x',
            popularity: 'High',
            preview: 'bg-gradient-to-br from-emerald-400 to-teal-600'
        }
    ];

    const filteredTemplates = selectedCategory === 'All'
        ? templates
        : templates.filter(t => t.category === selectedCategory);

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
            {/* Premium Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 border border-indigo-500/20">
                        <Sparkles className="w-3 h-3" /> Template Intelligence
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tighter italic">
                        Marketing <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Templates</span>
                    </h1>
                    <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-xl">
                        High-converting designs pre-optimized for your business growth. Browse our AI-curated library.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            className="pl-11 pr-6 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold w-full md:w-80 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => dispatch(setActiveTab('GROW_DASHBOARD'))}
                        className="flex items-center gap-2 px-6 py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl transition-all text-sm font-black shadow-sm"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Dashboard
                    </button>
                </div>
            </div>

            {/* Insight Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                    <Star className="w-8 h-8 mb-4 fill-white/20" />
                    <h4 className="text-sm font-black uppercase tracking-widest mb-1 opacity-80">Highest ROI Template</h4>
                    <p className="text-2xl font-black mb-2">Customer Appreciation</p>
                    <div className="flex items-center gap-2 text-xs font-bold bg-white/20 w-fit px-3 py-1 rounded-full">
                        <Zap className="w-3 h-3 fill-current" /> 7.1x Return
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-700 shadow-sm relative group">
                    <Users className="w-8 h-8 mb-4 text-emerald-500" />
                    <h4 className="text-sm font-black uppercase tracking-widest mb-1 text-slate-400">Total Utilization</h4>
                    <p className="text-2xl font-black mb-2 text-slate-900 dark:text-white">12,450 Campaigns</p>
                    <p className="text-xs font-bold text-emerald-500">+12% from last month</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-700 shadow-sm relative group">
                    <Calendar className="w-8 h-8 mb-4 text-amber-500" />
                    <h4 className="text-sm font-black uppercase tracking-widest mb-1 text-slate-400">Upcoming Festival</h4>
                    <p className="text-2xl font-black mb-2 text-slate-900 dark:text-white">Republic Day 2026</p>
                    <p className="text-xs font-bold text-slate-500">4 templates available</p>
                </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap items-center gap-3">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat as any)}
                        className={`px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all ${selectedCategory === cat
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-lg scale-105'
                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-500'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Template Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {filteredTemplates.map((template) => (
                    <div
                        key={template.id}
                        className="group bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-200 dark:border-slate-700 p-6 hover:shadow-[0_20px_50px_rgba(79,70,229,0.15)] hover:border-indigo-500 transition-all duration-500 cursor-pointer relative"
                    >
                        {/* Status Tags */}
                        <div className="absolute top-10 right-10 z-10 flex flex-col gap-2 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all">
                            <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2 rounded-xl text-slate-500 hover:text-indigo-600 shadow-lg">
                                <Heart className="w-4 h-4" />
                            </span>
                            <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-2 rounded-xl text-slate-500 hover:text-indigo-600 shadow-lg">
                                <Download className="w-4 h-4" />
                            </span>
                        </div>

                        {/* Preview Area */}
                        <div className={`aspect-[4/5] rounded-[2.5rem] mb-6 relative overflow-hidden flex flex-col items-center justify-center ${template.preview} shadow-inner`}>
                            <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                <button className="bg-white text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                                    Quick Preview <Eye className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Decorative Paper Elements */}
                            <div className="w-[60%] h-[70%] bg-white/20 backdrop-blur-md rounded-2xl border border-white/30 flex flex-col p-4">
                                <div className="w-8 h-8 bg-white/40 rounded-lg mb-4" />
                                <div className="w-full h-2 bg-white/40 rounded-full mb-2" />
                                <div className="w-[80%] h-2 bg-white/40 rounded-full mb-6" />
                                <div className="mt-auto w-full h-20 bg-white/30 rounded-xl" />
                            </div>
                        </div>

                        {/* Info Area */}
                        <div className="px-2">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-indigo-500">{template.category}</span>
                                <span className="text-[10px] font-black bg-emerald-100 text-emerald-600 dark:bg-emerald-400/10 px-2 py-1 rounded-lg">ROI: {template.roi}</span>
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 leading-tight group-hover:text-indigo-600 transition-colors">{template.name}</h3>
                            <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{template.usage.toLocaleString()} Used</span>
                                </div>
                                <button
                                    onClick={() => dispatch(setActiveTab('GROW_MARKETING_CAMPAIGNS'))}
                                    className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white hover:text-indigo-500 transition-colors"
                                >
                                    Use Template <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Custom Request Banner */}
            <div className="bg-slate-900 dark:bg-black rounded-[4rem] p-12 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] -mr-48 -mt-48" />
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
                    <div className="max-w-xl text-center md:text-left">
                        <h2 className="text-3xl font-black tracking-tight mb-4 leading-tight">Need a custom brand template?</h2>
                        <p className="text-slate-400 font-medium">Our design intelligence engine can generate brand-locked templates for your specific promotions in seconds.</p>
                    </div>
                    <button className="px-10 py-5 bg-white text-black rounded-3xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-3">
                        <Palette className="w-4 h-4" /> Generate Brand Version
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MarketingTemplates;
