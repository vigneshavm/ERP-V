
import React from 'react';
import { Maximize2, Minimize2, Wifi, WifiOff, Plus, X, Sparkles, Terminal } from 'lucide-react';
import { Session } from "@repo/shared";
import { useNetworkStatus } from '@/shared/lib/hooks/useNetworkStatus';

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
                                className={`flex flex-col items-center justify-center p-2 rounded-xl font-bold transition-all border gap-1 pr-8 ${activeSessionIndex === index
                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]'
                                    : 'premium-card text-muted hover:text-muted'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles className={`w-3.5 h-3.5 ${activeSessionIndex === index ? 'text-white' : 'text-indigo-400'}`} />
                                    <span className="text-sm font-black tracking-tight">{session.label}</span>
                                    {totalQty > 0 && (
                                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-black ${activeSessionIndex === index
                                            ? 'bg-white/20 text-white'
                                            : 'bg-indigo-500/10 text-indigo-400'
                                            }`}>
                                            {totalQty}
                                        </span>
                                    )}
                                </div>
                                <kbd className={`text-[8px] opacity-40 font-mono tracking-tighter uppercase ${activeSessionIndex === index ? 'text-white' : ''}`}>Alt+{index + 1}</kbd>
                            </button>
                            {sessions.length > 1 && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveSession(index);
                                    }}
                                    className={`absolute top-1 right-1 p-0.5 rounded-md transition-colors ${activeSessionIndex === index
                                        ? 'text-primary hover:bg-white/10 hover:text-main'
                                        : 'text-neutral-400 hover:bg-[var(--erp-bg-sunken)] dark:hover:bg-neutral-700 hover:text-error'
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
                        className="p-3 erp-card text-muted hover:text-indigo-400 rounded-xl transition-all self-end"
                        title="Add New Billing Tab"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Counter Selector */}
            {availableCounters.length > 0 && (
                <div className="hidden lg:flex flex-col gap-1">
                    <div className="relative group">
                        <label className="text-[10px] font-black text-neutral-400 uppercase ml-1 flex items-center gap-2 mb-1">
                            <Terminal className="w-3 h-3 text-indigo-400" /> Terminal
                        </label>
                        <select
                            value={activeCounterId}
                            onChange={(e) => onSwitchCounter(e.target.value)}
                            className="bg-white dark:bg-neutral-900 border border-default px-4 py-2 rounded-2xl text-sm font-black text-muted outline-none focus:ring-2 ring-indigo-500/20 transition-all appearance-none cursor-pointer pr-10"
                        >
                            {availableCounters.map((c: any) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-3 bottom-2.5 pointer-events-none opacity-40">
                             <div className="border-t-2 border-r-2 border-muted w-1.5 h-1.5 rotate-45" />
                        </div>
                    </div>
                </div>
            )}

            {/* Network Status & Full Screen */}
            <div className="flex gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${isOnline
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                    {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                    {isOnline ? 'Active' : 'Offline'}
                </div>

                <button
                    onClick={onToggleFullScreen}
                    className="hidden sm:block p-2.5 erp-card text-muted hover:text-indigo-400 rounded-xl transition-all"
                    title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                >
                    {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
};

