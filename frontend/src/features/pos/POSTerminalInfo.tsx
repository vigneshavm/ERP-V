
import React from 'react';
import { User, Monitor } from 'lucide-react';

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
        <div className="flex items-center gap-4 px-3 py-1.5 bg-indigo-50 dark:bg-slate-900 border-b border-indigo-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Cashier:</span>
                <span className="text-[10px] font-black text-slate-900 dark:text-white truncate max-w-[80px]">
                    {cashierName || 'Guest'}
                </span>
            </div>
            <div className="w-px h-3 bg-indigo-200 dark:bg-slate-700" />
            <div className="flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Terminal:</span>
                <span className="text-[10px] font-black text-slate-900 dark:text-white">
                    {counterId ? `${counterId} - ${counterName || 'Counter'}` : 'N/A'}
                </span>
            </div>
        </div>
    );
};
