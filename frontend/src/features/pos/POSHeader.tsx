
import React, { useEffect, useMemo } from 'react';
import { useSalesperson } from '../../hooks/useSalesperson';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Maximize2, Minimize2, Wifi, WifiOff, Plus, X, Languages } from 'lucide-react';
import { Session } from "../../types/sales";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { useLanguage } from "../../contexts/LanguageContext";
import { Button } from '@/components/shared/Button';


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
    const { language, setLanguage, t } = useLanguage();

    const navigate = useNavigate();
    // Salespeople = the shop's staff list (Textilesoft employee master). A missing/unreadable list just hides the selector.
    const [salesperson, setSalesperson] = useSalesperson();
    const { data: staff } = useQuery({
        queryKey: ['pos-salespeople'],
        queryFn: async () => ((await api.get('/api/hr/employees')).data?.data ?? []) as { code: string; name: string }[],
        staleTime: 5 * 60 * 1000,
        retry: false,
    });
    // A remembered salesperson who is no longer in the staff list would make the server refuse the bill: forget them.
    useEffect(() => {
        if (staff && salesperson && !staff.some(e => e.code === salesperson)) setSalesperson('');
    }, [staff, salesperson, setSalesperson]);
    const currentBranchData = branches?.find(b => b.id === currentBranch);
    // With a store picked, its counters; with "All Stores", every store's counters (labelled with the
    // store), so a till can always pick its counter -- checkout is blocked until one is selected.
    // The 'All' entry is a placeholder branch from the initial state, not a real store.
    // In SQL mode the counters are Textilesoft's own (dbo.countername via /api/pos/counters), so ERP
    // bills use the same counter names as the shop database; otherwise the ERP store counters.
    const { data: counterSource } = useQuery({
        queryKey: ['pos-counters'],
        queryFn: async () => (await api.get('/api/pos/counters')).data as { source: 'sql' | 'erp'; counters: { id: string; name: string }[] },
        staleTime: 5 * 60 * 1000,
    });
    const isSqlCounters = counterSource?.source === 'sql';
    const availableCounters: { id: string; name: string; branchName?: string }[] = useMemo(() => {
        if (isSqlCounters) return counterSource?.counters ?? [];
        return currentBranchData && currentBranchData.id !== 'All'
            ? (currentBranchData.counters || [])
            : (branches || []).filter((b: any) => b.id !== 'All')
                .flatMap((b: any) => (b.counters || []).map((c: any) => ({ ...c, branchName: b.name })));
    }, [isSqlCounters, counterSource, currentBranchData, branches]);
    const counterKnown = !!activeCounterId && availableCounters.some(c => c.id === activeCounterId);

    // One counter only: select it automatically. A remembered counter that no longer exists is cleared,
    // so checkout asks for a real one instead of numbering bills with a deleted counter.
    useEffect(() => {
        if (availableCounters.length === 0) return;
        if (!activeCounterId && availableCounters.length === 1) onSwitchCounter(availableCounters[0].id);
        else if (activeCounterId && !counterKnown) onSwitchCounter('');
    }, [availableCounters, activeCounterId, counterKnown, onSwitchCounter]);

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
                                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">{session.label}</span>
                                    {totalQty > 0 && (
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${activeSessionIndex === index
                                            ? 'bg-white/20 text-white'
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
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
                                        : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-error'
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
                        className="p-3 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-slate-50 dark:hover:bg-slate-700 rounded-t-lg transition-all border-b-2 border-transparent self-end"
                        title="Add New Billing Tab"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Store / Branch Selector */}
            <div className="hidden lg:flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">{t('storeLocation')}</label>
                <select
                    value={currentBranch || ''}
                    onChange={() => {}} // TODO: wire up branch-switch dispatch
                    className="bg-white dark:bg-slate-800 border-b-2 border-primary px-3 py-2 rounded-t-lg text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-2 ring-primary/20"
                >
                    <option value="">{t('allStores')}</option>
                    {(branches || []).map((b: any) => (
                        <option key={b.id || b._id} value={b.id || b._id}>
                            {b.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Counter Selector -- always shown (also on small screens): checkout needs a counter. */}
            {availableCounters.length === 0 ? (
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">{t('terminal')}</label>
                    {isSqlCounters ? (
                        <span
                            title="dbo.countername in the shop database has no counters"
                            className="border-b-2 border-danger px-3 py-2 rounded-t-lg text-sm font-bold text-danger bg-white dark:bg-slate-800"
                        >
                            No counters in shop DB
                        </span>
                    ) : (
                        <button
                            type="button"
                            onClick={() => navigate('/settings/branches')}
                            title="No billing counters are set up for this shop yet"
                            className="border-b-2 border-danger px-3 py-2 rounded-t-lg text-sm font-bold text-danger bg-white dark:bg-slate-800 hover:bg-danger/5"
                        >
                            No counters — set up
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">{t('terminal')}</label>
                    <select
                        value={counterKnown ? activeCounterId : ''}
                        onChange={(e) => onSwitchCounter(e.target.value)}
                        className={`bg-white dark:bg-slate-800 border-b-2 px-3 py-2 rounded-t-lg text-sm font-bold outline-none focus:ring-2 ring-primary/20 ${counterKnown ? 'border-primary text-slate-700 dark:text-white' : 'border-danger text-danger'}`}
                    >
                        {!counterKnown && <option value="" disabled>Select counter</option>}
                        {availableCounters.map((c) => (
                            <option key={`${c.branchName ?? ''}-${c.id}`} value={c.id}>
                                {c.name === c.id ? c.id : `${c.id} - ${c.name}`}{c.branchName ? ` (${c.branchName})` : ''}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {staff && staff.length > 0 && (
                <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Salesperson</label>
                    <select
                        value={staff.some(e => e.code === salesperson) ? salesperson : ''}
                        onChange={(e) => setSalesperson(e.target.value)}
                        className="bg-white dark:bg-slate-800 border-b-2 border-primary px-3 py-2 rounded-t-lg text-sm font-bold outline-none focus:ring-2 ring-primary/20 text-slate-700 dark:text-white"
                    >
                        <option value="">—</option>
                        {staff.map(e => <option key={e.code} value={e.code}>{e.name}</option>)}
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
                    {isOnline ? t('online') : t('offline')}
                </div>

                <button
                    onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
                    className="hidden sm:flex items-center gap-1.5 px-2.5 py-2.5 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-slate-700 rounded-lg shadow-sm border-b-2 border-transparent transition-all text-xs font-bold"
                    title={language === 'en' ? 'Switch to Tamil' : 'ஆங்கிலத்திற்கு மாற்று'}
                >
                    <Languages className="w-4 h-4" />
                    {language === 'en' ? 'தமிழ்' : 'EN'}
                </button>

                <button
                    onClick={onToggleFullScreen}
                    className="hidden sm:block p-2.5 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-slate-700 rounded-lg shadow-sm border-b-2 border-transparent transition-all"
                    title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                >
                    {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
};
