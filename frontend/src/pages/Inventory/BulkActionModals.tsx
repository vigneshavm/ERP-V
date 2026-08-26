import React, { useState } from 'react';
import { X, Tag, CheckSquare, Upload, AlertTriangle, Box, Save } from 'lucide-react';
import { Product } from '../../types/product';

interface BulkCategoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (category: string) => Promise<void>;
    selectedCount: number;
    categories: string[];
}

export const BulkCategoryModal: React.FC<BulkCategoryModalProps> = ({ isOpen, onClose, onConfirm, selectedCount, categories }) => {
    const [targetCategory, setTargetCategory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (!targetCategory) return;
        setIsSubmitting(true);
        try {
            await onConfirm(targetCategory);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-neutral-800 w-full max-w-md rounded-sm border border-neutral-200 dark:border-neutral-700 shadow-2xl overflow-hidden flex flex-col">
                <div className="px-8 py-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-700/50">
                    <h3 className="text-lg font-black italic flex items-center gap-2 uppercase tracking-tight">
                        <Tag className="w-5 h-5 text-primary" /> Migrate Category
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 rounded-full transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-sm flex items-start gap-4">
                        <AlertTriangle className="w-6 h-6 text-primary shrink-0" />
                        <div>
                            <p className="text-xs font-bold text-main">Batch Update Action</p>
                            <p className="text-[10px] text-neutral-500 font-bold mt-1">You are about to reassign <span className="text-primary font-black underline decoration-2">{selectedCount} items</span> to a new master category.</p>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 block">Target Category</label>
                        <select
                            value={targetCategory}
                            onChange={(e) => setTargetCategory(e.target.value)}
                            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-main"
                        >
                            <option value="">Select Category...</option>
                            {categories.filter(c => c !== 'ALL').map(cat => (
                                <option key={cat} value={cat}>{cat.replace(/_/g, ' ')}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="px-8 py-6 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-700/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-main transition-all">Discard</button>
                    <button
                        onClick={handleConfirm}
                        disabled={!targetCategory || isSubmitting}
                        className="px-6 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? 'Updating...' : 'Commit Batch'}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface BulkAdjustmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (adjustment: number, type: 'ADD' | 'SUBTRACT' | 'SET') => Promise<void>;
    selectedCount: number;
}

export const BulkAdjustmentModal: React.FC<BulkAdjustmentModalProps> = ({ isOpen, onClose, onConfirm, selectedCount }) => {
    const [adjustment, setAdjustment] = useState<number>(0);
    const [type, setType] = useState<'ADD' | 'SUBTRACT' | 'SET'>('ADD');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await onConfirm(adjustment, type);
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white dark:bg-neutral-800 w-full max-w-md rounded-sm border border-neutral-200 dark:border-neutral-700 shadow-2xl overflow-hidden flex flex-col">
                <div className="px-8 py-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-700/50">
                    <h3 className="text-lg font-black italic flex items-center gap-2 uppercase tracking-tight">
                        <CheckSquare className="w-5 h-5 text-emerald-600" /> Stock Audit Adjustment
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 rounded-full transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="p-4 bg-emerald-500/5 border border-success/20 rounded-sm">
                        <p className="text-xs font-bold text-main">Batch Inventory Control</p>
                        <p className="text-[10px] text-neutral-500 font-bold mt-1">Adjusting <span className="text-emerald-600 font-black">{selectedCount} items</span> simultaneously.</p>
                    </div>

                    <div className="flex gap-2">
                        {(['ADD', 'SUBTRACT', 'SET'] as const).map(t => (
                            <button
                                key={t}
                                onClick={() => setType(t)}
                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${type === t ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 block">Adjustment Quantity</label>
                        <input
                            type="number"
                            value={adjustment}
                            onChange={(e) => setAdjustment(parseFloat(e.target.value) || 0)}
                            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-lg font-black outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-main"
                        />
                    </div>
                </div>
                <div className="px-8 py-6 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-700/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-main transition-all">Discard</button>
                    <button
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? 'Processing...' : 'Execute Audit'}
                    </button>
                </div>
            </div>
        </div>
    );
};
