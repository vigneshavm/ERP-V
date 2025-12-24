
import React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { Session } from '../../types/sales';

interface POSHeaderProps {
    sessions: Session[];
    activeSessionIndex: number;
    onSwitchSession: (index: number) => void;
    isFullScreen: boolean;
    onToggleFullScreen: () => void;
}

export const POSHeader: React.FC<POSHeaderProps> = ({
    sessions,
    activeSessionIndex,
    onSwitchSession,
    isFullScreen,
    onToggleFullScreen
}) => {
    return (
        <div className="flex gap-4 mb-2 shrink-0 items-end">
            {/* Session Tabs */}
            <div className="flex gap-2 flex-1">
                {sessions.map((session, index) => {
                    const totalQty = session.cart.reduce((acc, item) => acc + item.qty, 0);
                    return (
                        <button
                            key={session.id}
                            onClick={() => onSwitchSession(index)}
                            title={`Switch to ${session.label} (Alt+${index + 1})`}
                            className={`flex-1 py-2 px-4 rounded-t-lg font-bold flex items-center justify-center gap-2 transition-all border-b-2 ${activeSessionIndex === index
                                ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            <span className="text-sm">{session.label}</span>
                            {totalQty > 0 && (
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${activeSessionIndex === index
                                    ? 'bg-indigo-500 text-white'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                    }`}>
                                    {totalQty}
                                </span>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Full Screen Toggle */}
            <button
                onClick={onToggleFullScreen}
                className="p-2.5 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg shadow-sm border-b-2 border-transparent transition-all"
                title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
            >
                {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
        </div>
    );
};
