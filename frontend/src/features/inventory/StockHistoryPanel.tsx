import React from 'react';
import { X, History, TrendingUp, TrendingDown, RefreshCcw, ShoppingCart, Truck, Database } from 'lucide-react';

interface StockLog {
    _id: string;
    type: 'ADD' | 'SUBTRACT' | 'SET' | 'SALE' | 'PURCHASE' | 'INIT';
    delta: number;
    finalQty: number;
    reason?: string;
    performedBy: {
        name: string;
    } | string;
    createdAt: string;
}

interface StockHistoryDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    itemName: string;
    history: StockLog[];
    isLoading: boolean;
}

const getLogIcon = (type: string) => {
    switch (type) {
        case 'ADD': return <TrendingUp className="w-4 h-4 text-success" />;
        case 'SUBTRACT': return <TrendingDown className="w-4 h-4 text-danger" />;
        case 'SET': return <RefreshCcw className="w-4 h-4 text-primary" />;
        case 'SALE': return <ShoppingCart className="w-4 h-4 text-warning" />;
        case 'PURCHASE': return <Truck className="w-4 h-4 text-blue-500" />;
        case 'INIT': return <Database className="w-4 h-4 text-neutral-500" />;
        default: return <History className="w-4 h-4 text-neutral-400" />;
    }
};

const getLogLabel = (type: string) => {
    switch (type) {
        case 'ADD': return 'Stock Added';
        case 'SUBTRACT': return 'Stock Removed';
        case 'SET': return 'Manual Reset';
        case 'SALE': return 'Sale Deduction';
        case 'PURCHASE': return 'Purchase Inward';
        case 'INIT': return 'Initial Stock';
        default: return 'System Adjustment';
    }
};

export const StockHistoryDrawer: React.FC<StockHistoryDrawerProps> = ({ isOpen, onClose, itemName, history, isLoading }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex justify-end animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-neutral-950/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-full max-w-lg bg-white dark:bg-neutral-800 h-full shadow-2xl border-l border-neutral-200 dark:border-neutral-700 flex flex-col animate-in slide-in-from-right duration-500">
                <div className="px-8 py-6 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center bg-neutral-50/50 dark:bg-neutral-700/50">
                    <div>
                        <h3 className="text-lg font-black italic flex items-center gap-3 uppercase tracking-tight">
                            <History className="w-5 h-5 text-primary" /> Stock Movement Log
                        </h3>
                        <p className="text-[10px] text-neutral-400 font-bold uppercase mt-1 tracking-widest truncate max-w-[300px]">{itemName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400 rounded-full transition-all">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {isLoading ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-50">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mb-4"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest">Fetching Audit Trail...</p>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-900 rounded-full flex items-center justify-center mb-4 border border-neutral-200 dark:border-neutral-700">
                                <Database className="w-8 h-8 text-neutral-300" />
                            </div>
                            <h4 className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight italic">No Records Found</h4>
                            <p className="text-[10px] text-neutral-400 font-bold mt-1">This item hasn't had any recorded stock movements yet.</p>
                        </div>
                    ) : (
                        <div className="relative space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-neutral-100 dark:before:bg-neutral-700">
                            {history.map((log) => (
                                <div key={log._id} className="relative pl-10 group">
                                    <div className="absolute left-0 top-1 w-6 h-6 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center z-10 shadow-sm group-hover:border-primary transition-all">
                                        {getLogIcon(log.type)}
                                    </div>
                                    <div className="flex flex-col">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-800 dark:text-white">{getLogLabel(log.type)}</span>
                                            <span className="text-[9px] font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2 py-0.5 rounded uppercase">
                                                {new Date(log.createdAt).toLocaleString('en-IN', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })}
                                            </span>
                                        </div>
                                        <div className="mt-2 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-700">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1">
                                                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight">Quantity Change</p>
                                                    <p className={`text-sm font-black italic ${log.type === 'ADD' || log.type === 'INIT' || log.type === 'PURCHASE' ? 'text-success' : log.type === 'SUBTRACT' || log.type === 'SALE' ? 'text-danger' : 'text-primary'}`}>
                                                        {log.type === 'ADD' || log.type === 'PURCHASE' || log.type === 'INIT' ? '+' : ''}{log.delta} Units
                                                    </p>
                                                </div>
                                                <div className="w-px h-8 bg-neutral-200 dark:bg-neutral-700"></div>
                                                <div className="flex-1 text-right">
                                                    <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-tight">Balance</p>
                                                    <p className="text-sm font-black italic text-neutral-900 dark:text-neutral-100">{log.finalQty} Units</p>
                                                </div>
                                            </div>
                                            {log.reason && (
                                                <div className="mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-700">
                                                    <p className="text-[10px] text-neutral-500 font-bold italic line-clamp-1">"{log.reason}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="p-8 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-700/50">
                    <button onClick={onClose} className="w-full py-4 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-xl">
                        Dismiss Audit Panel
                    </button>
                </div>
            </div>
        </div>
    );
};
