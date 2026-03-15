import React, { useState, useEffect } from 'react';
import { usePersonalFinance } from "@repo/shared";
import { AddTransactionModal } from '../components/AddTransactionModal';
import { AnalyticsDashboard } from '../components/AnalyticsDashboard';
import { 
    Search, Filter, Plus, Wallet, 
    ArrowUpRight, ArrowDownLeft, 
    Search as SearchIcon, X, MoreHorizontal,
    ChevronLeft, ChevronRight, BarChart2
} from "lucide-react";
import { AccountSummary } from '../components/AccountSummary';
import { SubscriptionTracker } from '../components/SubscriptionTracker';

export const BudgetView = () => {
    const { 
        transactions, categories, monthStartDay, fetchTransactions, 
        fetchCategories, fetchAccounts, loading, updateMonthStartDay,
        getPeriodRange, getNextPeriod, getPrevPeriod
    } = usePersonalFinance();
    
    const [view, setView] = useState<'dashboard' | 'analytics'>('dashboard');
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
    const [showSettings, setShowSettings] = useState(false);

    const [currentDate, setCurrentDate] = useState(new Date());
    const period = getPeriodRange(currentDate, monthStartDay);

    useEffect(() => {
        const startStr = period.start.toISOString().split('T')[0];
        const endStr = period.end.toISOString().split('T')[0];
        fetchTransactions(startStr, endStr);
        fetchCategories();
        fetchAccounts();
    }, [fetchTransactions, fetchCategories, fetchAccounts, monthStartDay, currentDate]);

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = t.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             categories.find(c => c.id === t.category)?.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || t.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="max-w-6xl mx-auto px-6 py-10 min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">My Finances</h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-xl p-1 shadow-sm">
                            <button 
                                onClick={() => setCurrentDate(getPrevPeriod(period.start, monthStartDay).start)}
                                className="p-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4 text-neutral-400" />
                            </button>
                            <span className="px-3 text-xs font-bold text-neutral-600 dark:text-neutral-300">
                                {period.start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {period.end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                            <button 
                                onClick={() => setCurrentDate(getNextPeriod(period.start, monthStartDay).start)}
                                className="p-1.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                            >
                                <ChevronRight className="h-4 w-4 text-neutral-400" />
                            </button>
                        </div>
                        <button 
                            onClick={() => setShowSettings(!showSettings)}
                            className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-primary transition-colors flex items-center gap-1"
                        >
                            <MoreHorizontal className="h-3 w-3" /> Payday Settings
                        </button>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex p-1 bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-100 dark:border-neutral-800">
                        <button 
                            onClick={() => setView('dashboard')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'dashboard' ? 'bg-neutral-900 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-900'}`}
                        >
                            History
                        </button>
                        <button 
                            onClick={() => setView('analytics')}
                            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${view === 'analytics' ? 'bg-neutral-900 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-900'}`}
                        >
                            Analytics
                        </button>
                    </div>
                    
                    <AddTransactionModal>
                        <button className="h-11 w-11 flex items-center justify-center bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                            <Plus className="h-6 w-6" />
                        </button>
                    </AddTransactionModal>
                </div>
            </div>

            {/* Settings Overlay */}
            {showSettings && (
                <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl p-6 mb-8 animate-in slide-in-from-top-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold">Finance Settings</h3>
                        <button onClick={() => setShowSettings(false)}><X className="h-4 w-4" /></button>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold">Month Start Day</p>
                                <p className="text-xs text-neutral-500">Align your budget with your payday</p>
                            </div>
                            <select 
                                value={monthStartDay}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    updateMonthStartDay(val);
                                }}
                                className="bg-neutral-100 dark:bg-neutral-800 border-none rounded-lg text-sm px-3 py-2"
                            >
                                {[...Array(31)].map((_, i) => (
                                    <option key={i+1} value={i+1}>{i+1}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {view === 'analytics' ? (
                <AnalyticsDashboard />
            ) : (
                <div className="space-y-10">
                    <AccountSummary />

                    {/* Sparkline Strategy */}
                    <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <BarChart2 className="h-4 w-4 text-primary" />
                                <h3 className="font-bold text-sm">Weekly Momentum</h3>
                            </div>
                            <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                                Your spending is <span className="text-emerald-500 font-bold">12% lower</span> than last week. Great job staying within budget!
                            </p>
                        </div>
                        <div className="flex items-end gap-1.5 h-12">
                            {[40, 65, 30, 85, 45, 95, 55].map((h, i) => (
                                <div 
                                    key={i} 
                                    className={`w-2 rounded-full transition-all duration-1000 ${i === 5 ? 'bg-primary' : 'bg-neutral-100 dark:bg-neutral-800'}`}
                                    style={{ height: `${h}%` }}
                                />
                            ))}
                        </div>
                    </div>

                    <SubscriptionTracker />
                    {/* Fast Search & Quick Actions */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1 group">
                            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400 group-focus-within:text-primary transition-colors" />
                            <input 
                                type="text"
                                placeholder="Search transactions, categories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-neutral-900 rounded-2xl border-none pl-12 pr-4 py-4 text-sm font-medium shadow-sm ring-1 ring-neutral-100 dark:ring-neutral-800 focus:ring-2 focus:ring-primary transition-all"
                            />
                        </div>
                        <div className="flex gap-2">
                             {['all', 'income', 'expense'].map((t) => (
                                 <button
                                    key={t}
                                    onClick={() => setFilterType(t as any)}
                                    className={`px-5 py-4 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all ${filterType === t ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xl' : 'bg-white dark:bg-neutral-900 text-neutral-500 ring-1 ring-neutral-100 dark:ring-neutral-800'}`}
                                 >
                                     {t}
                                 </button>
                             ))}
                        </div>
                    </div>

                    {/* Transaction List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-xl font-bold">Recent Activity</h2>
                            <button className="text-neutral-400 hover:text-neutral-900 transition-colors">
                                <Filter className="h-5 w-5" />
                            </button>
                        </div>

                        {loading ? (
                            <div className="h-64 flex items-center justify-center">
                                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                            </div>
                        ) : filteredTransactions.length === 0 ? (
                            <div className="bg-white dark:bg-neutral-900 rounded-[32px] p-12 text-center border-2 border-dashed border-neutral-100 dark:border-neutral-800">
                                <div className="h-16 w-16 bg-neutral-50 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Search className="h-8 w-8 text-neutral-300" />
                                </div>
                                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">No transactions found</h3>
                                <p className="text-neutral-500 text-sm">Try searching for something else or add a new entry.</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {filteredTransactions.map((tx) => {
                                    const cat = categories.find(c => c.id === tx.category);
                                    const isIncome = tx.type === 'income';
                                    
                                    return (
                                        <div 
                                            key={tx.id} 
                                            className="group bg-white dark:bg-neutral-900 p-5 rounded-3xl flex items-center gap-5 shadow-sm border border-neutral-50 dark:border-neutral-800/50 hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer"
                                        >
                                            <div 
                                                className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-inner ${isIncome ? 'bg-green-50 text-green-600 dark:bg-green-950/30' : 'bg-red-50 text-red-600 dark:bg-red-950/30'}`}
                                                style={{ border: `1px solid ${cat?.color}20` }}
                                            >
                                                <span className="text-2xl">{(cat as any)?.emoji || '💰'}</span>
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-neutral-900 dark:text-neutral-100 truncate">{cat?.name || 'Uncategorized'}</h4>
                                                    {tx.isRecurring && (
                                                        <span className="px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-[8px] font-black text-blue-600 uppercase tracking-tighter">Recurring</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs font-medium text-neutral-400">
                                                    <span>{new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                                    <div className="h-1 w-1 rounded-full bg-neutral-200 dark:bg-neutral-700" />
                                                    <span className="truncate">{tx.description || 'No description'}</span>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className={`text-lg font-black ${isIncome ? 'text-green-600' : 'text-neutral-900 dark:text-neutral-100'}`}>
                                                    {isIncome ? '+' : '-'}₹{tx.amount.toLocaleString()}
                                                </p>
                                                <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal className="h-3 w-3" /> Details
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
