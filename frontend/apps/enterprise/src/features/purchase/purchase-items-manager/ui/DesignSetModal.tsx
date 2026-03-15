import { logger } from '@/shared/lib/logger';
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, LayoutGrid, Check } from 'lucide-react';
import { DesignSet } from '../model/usePurchaseItemsManager';
import api from "@/shared/api/api";

interface DesignSetModalProps {
    isOpen: boolean;
    onClose: () => void;
    onExpand: (designSet: DesignSet) => void;
}

const DesignSetModal: React.FC<DesignSetModalProps> = ({ isOpen, onClose, onExpand }) => {
    const [categories, setCategories] = useState<any[]>([]);
    const [formData, setFormData] = useState<DesignSet>({
        name: '',
        category: null,
        colors: [''],
        sizes: [''],
        rate: 0,
        margin: 0,
        sellingPrice: 0,
        taxPercent: 5
    });

    useEffect(() => {
        if (isOpen) {
            const fetchCategories = async () => {
                try {
                    const { data } = await api.get('/api/inventory/categories');
                    const list = data.data || data;
                    setCategories(Array.isArray(list) ? list : []);
                } catch (err) {
                    logger.error("Failed to fetch categories", err);
                }
            };
            fetchCategories();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleExpand = () => {
        onExpand(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <LayoutGrid className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Expand Design Set</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Procedural Item Generation</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Design Identity</label>
                            <input
                                type="text"
                                placeholder="Basic Tee, Denim Jacket..."
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-indigo-500/10 transition-all"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Strategic Category</label>
                            <select
                                className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-bold text-sm focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none"
                                value={formData.category?.name || ''}
                                onChange={(e) => {
                                    const cat = categories.find(c => c.name === e.target.value);
                                    setFormData({ ...formData, category: cat });
                                }}
                            >
                                <option value="">Select Category</option>
                                {categories.map(c => <option key={c._id || c.name} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chromatic Spectrum</label>
                                <button
                                    onClick={() => setFormData({ ...formData, colors: [...formData.colors, ''] })}
                                    className="p-1 px-2 rounded-lg bg-indigo-500/10 text-indigo-500 text-[9px] font-black uppercase"
                                >
                                    + Add
                                </button>
                            </div>
                            <div className="space-y-2">
                                {formData.colors.map((c, i) => (
                                    <div key={i} className="flex gap-2 group">
                                        <input
                                            type="text"
                                            placeholder="Color..."
                                            className="flex-grow px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl font-bold text-xs"
                                            value={c}
                                            onChange={(e) => {
                                                const newColors = [...formData.colors];
                                                newColors[i] = e.target.value;
                                                setFormData({ ...formData, colors: newColors });
                                            }}
                                        />
                                        <button
                                            onClick={() => setFormData({ ...formData, colors: formData.colors.filter((_, idx) => idx !== i) })}
                                            className="p-2.5 rounded-xl hover:bg-rose-50 hover:text-rose-500 text-slate-200 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dimension Array</label>
                                <button
                                    onClick={() => setFormData({ ...formData, sizes: [...formData.sizes, ''] })}
                                    className="p-1 px-2 rounded-lg bg-indigo-500/10 text-indigo-500 text-[9px] font-black uppercase"
                                >
                                    + Add
                                </button>
                            </div>
                            <div className="space-y-2">
                                {formData.sizes.map((s, i) => (
                                    <div key={i} className="flex gap-2 group">
                                        <input
                                            type="text"
                                            placeholder="Size..."
                                            className="flex-grow px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl font-bold text-xs"
                                            value={s}
                                            onChange={(e) => {
                                                const newSizes = [...formData.sizes];
                                                newSizes[i] = e.target.value;
                                                setFormData({ ...formData, sizes: newSizes });
                                            }}
                                        />
                                        <button
                                            onClick={() => setFormData({ ...formData, sizes: formData.sizes.filter((_, idx) => idx !== i) })}
                                            className="p-2.5 rounded-xl hover:bg-rose-50 hover:text-rose-500 text-slate-200 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6 pt-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Procurement Rate</label>
                            <input
                                type="number"
                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-black text-sm"
                                value={formData.rate}
                                onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tax Engine %</label>
                            <input
                                type="number"
                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-black text-sm"
                                value={formData.taxPercent}
                                onChange={(e) => setFormData({ ...formData, taxPercent: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Strategic Margin %</label>
                            <input
                                type="number"
                                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl font-black text-sm text-emerald-500"
                                value={formData.margin}
                                onChange={(e) => setFormData({ ...formData, margin: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-8 border-t border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-8 py-4 bg-white dark:bg-slate-900 text-slate-400 rounded-2xl font-black text-sm border-2 border-slate-100 dark:border-slate-800 hover:bg-slate-50 transition-all"
                    >
                        Abort Expansion
                    </button>
                    <button
                        onClick={handleExpand}
                        disabled={!formData.name || !formData.category}
                        className="flex-[2] px-8 py-4 bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-3"
                    >
                        <Check className="w-5 h-5" /> Execute Matrix Expansion
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DesignSetModal;
