import React from 'react';
import { User, Monitor, Printer, Wallet, Activity, Wifi } from 'lucide-react';

interface POSTerminalInfoProps {
    cashierName?: string;
    counterName?: string;
    counterId?: string;
}

export const POSTerminalInfo: React.FC<POSTerminalInfoProps> = ({
    cashierName,
    counterName,
    counterId
}) => {
    return (
        <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-1 shadow-sm">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 group cursor-help">
                    <div className="p-1.5 bg-indigo-50 dark:bg-slate-800 rounded-lg group-hover:bg-indigo-100 transition-colors">
                        <User className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Cashier</span>
                        <span className="text-[10px] font-black text-slate-900 dark:text-white mt-0.5">
                            {cashierName || 'Guest'}
                        </span>
                    </div>
                </div>

                <div className="w-px h-6 bg-slate-100 dark:bg-slate-800" />

                <div className="flex items-center gap-2 group cursor-help">
                    <div className="p-1.5 bg-indigo-50 dark:bg-slate-800 rounded-lg group-hover:bg-indigo-100 transition-colors">
                        <Monitor className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">Terminal</span>
                        <span className="text-[10px] font-black text-slate-900 dark:text-white mt-0.5">
                            {counterId ? `${counterId} • ${counterName || 'Counter'}` : 'N/A'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Health Indicators */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-3 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-100 dark:border-slate-700/50">
                    <div className="flex items-center gap-1.5" title="Printer Connected">
                        <Printer className="w-3 h-3 text-emerald-500" />
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
                    <div className="flex items-center gap-1.5" title="Cash Drawer Linked">
                        <Wallet className="w-3 h-3 text-emerald-500" />
                        <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <div className="w-px h-3 bg-slate-200 dark:bg-slate-700" />
                    <div className="flex items-center gap-2" title="Cloud Sync Latency">
                        <div className="flex items-center gap-1">
                            <Wifi className="w-3 h-3 text-blue-500" />
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">8ms</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
