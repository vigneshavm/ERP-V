
import React from 'react';
import { Maximize2, Minimize2, Wifi, WifiOff, Plus, X } from 'lucide-react';
import { Session } from "../../types/sales";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";

interface POSHeaderProps {
    sessions: Session[];
    activeSessionIndex: number;
    onSwitchSession: (index: number) => void;
    onAddSession: () => void;
    onRemoveSession: (index: number) => void;
    isFullScreen: boolean;
    onToggleFullScreen: () => void;
    activeCounterId?: string;
    onSwitchCounter: (counterId: string) => void;
    branches: any[];
    currentBranch: string;
}

export const POSHeader: React.FC<POSHeaderProps> = ({
    sessions,
    activeSessionIndex,
    onSwitchSession,
    onAddSession,
    onRemoveSession,
    isFullScreen,
    onToggleFullScreen,
    activeCounterId,
    onSwitchCounter,
    branches,
    currentBranch
}) => {
    const isOnline = useNetworkStatus();

    const currentBranchData = branches?.find(b => b.id === currentBranch);
    const availableCounters = currentBranchData?.counters || [];

    return (
        <div className="flex gap-4 mb-2 shrink-0 items-end">
            {/* Session Tabs */}
            <div className="hidden md:flex gap-2 flex-1">
                {sessions.map((session, index) => {
                    const totalQty = session.cart.reduce((acc, item) => acc + item.qty, 0);
                    return (
                        <div key={session.id} className="relative group flex items-end">
                            <button
                                onClick={() => onSwitchSession(index)}
                                title={`Switch to ${session.label} (Alt+${index + 1})`}
                                className={`flex flex-col items-center justify-center p-2 rounded-t-lg font-bold transition-all border-b-2 gap-1 pr-8 ${activeSessionIndex === index
                                    ? 'bg-primary text-white border-primary shadow-sm'
                                    : 'bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border-transparent hover:bg-neutral-50 dark:hover:bg-neutral-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">{session.label}</span>
                                    {totalQty > 0 && (
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${activeSessionIndex === index
                                            ? 'bg-white/20 text-white'
                                            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                                            }`}>
                                            {totalQty}
                                        </span>
                                    )}
                                </div>
                                <kbd className={`text-[9px] opacity-40 font-mono tracking-tighter ${activeSessionIndex === index ? 'text-white' : ''}`}>Alt+{index + 1}</kbd>
                            </button>
                            {sessions.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveSession(index);
                                    }}
                                    className={`absolute top-1 right-1 p-0.5 rounded-md transition-colors ${activeSessionIndex === index
                                        ? 'text-primary hover:bg-white/10 hover:text-white'
                                        : 'text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-error'
                                        }`}
                                    title="Close Tab"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    )
                })}
                {sessions.length < 4 && (
                    <button
                        onClick={onAddSession}
                        className="p-3 bg-white dark:bg-neutral-800 text-neutral-400 hover:text-primary dark:hover:text-primary hover:bg-neutral-50 dark:hover:bg-neutral-700 rounded-t-lg transition-all border-b-2 border-transparent self-end"
                        title="Add New Billing Tab"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Counter Selector */}
            {availableCounters.length > 0 && (
                <div className="hidden lg:flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase ml-1">Terminal</label>
                    <select
                        value={activeCounterId}
                        onChange={(e) => onSwitchCounter(e.target.value)}
                        className="bg-white dark:bg-neutral-800 border-b-2 border-primary px-3 py-2 rounded-t-lg text-sm font-bold text-neutral-700 dark:text-white outline-none focus:ring-2 ring-primary/20"
                    >
                        {availableCounters.map((c: any) => (
                            <option key={c.id} value={c.id}>
                                {c.id} - {c.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Network Status & Full Screen */}
            <div className="flex gap-2">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-lg border text-xs font-bold transition-all ${isOnline
                    ? 'bg-success/10 text-success border-success/20'
                    : 'bg-warning/10 text-warning border-warning/20'
                    }`}>
                    {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                    {isOnline ? 'Online' : 'Offline'}
                </div>

                <button
                    onClick={onToggleFullScreen}
                    className="hidden sm:block p-2.5 bg-white dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-neutral-700 rounded-lg shadow-sm border-b-2 border-transparent transition-all"
                    title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                >
                    {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
};
