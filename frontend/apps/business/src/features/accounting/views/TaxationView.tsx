"use client";

import React, { useState } from 'react';
import { FileText, Upload, CheckCircle, AlertTriangle, XCircle, Search, Calendar } from 'lucide-react';
import { Button } from "@repo/ui";

const TaxationView = () => {
    const [period, setPeriod] = useState('2026-03');
    const [activeTab, setActiveTab] = useState<'MATCHED' | 'MISMATCH' | 'MISSING'>('MISMATCH');

    // Mock Data ported from GSTReconciliation.tsx
    const stats = {
        matched: 124,
        mismatch: 5,
        missingGSTR: 12,
        missingSystem: 3
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-neutral-900 dark:text-white">
                        Taxation & GST
                    </h1>
                    <p className="text-neutral-500 font-medium mt-1">
                        GSTR-2B Reconciliation // Input Tax Credit Tracking
                    </p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <input
                        type="month"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold">
                        <Upload className="w-4 h-4 mr-2" />
                        Import GSTR-2B
                    </Button>
                </div>
            </header>

            {/* Stats ported from original logic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-6 rounded-3xl group hover:scale-[1.02] transition-transform">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <h3 className="text-[10px] font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-widest">Matched</h3>
                    </div>
                    <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 tabular-nums">{stats.matched}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-6 rounded-3xl group hover:scale-[1.02] transition-transform">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <h3 className="text-[10px] font-black text-amber-900 dark:text-amber-400 uppercase tracking-widest">Mismatch</h3>
                    </div>
                    <p className="text-3xl font-black text-amber-700 dark:text-amber-300 tabular-nums">{stats.mismatch}</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 p-6 rounded-3xl group hover:scale-[1.02] transition-transform">
                    <div className="flex items-center gap-3 mb-2">
                        <XCircle className="w-5 h-5 text-rose-600" />
                        <h3 className="text-[10px] font-black text-rose-900 dark:text-rose-400 uppercase tracking-widest">Missing GSTR</h3>
                    </div>
                    <p className="text-3xl font-black text-rose-700 dark:text-rose-300 tabular-nums">{stats.missingGSTR}</p>
                </div>
                <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 rounded-3xl group hover:scale-[1.02] transition-transform">
                    <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-neutral-400" />
                        <h3 className="text-[10px] font-black text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">Not in System</h3>
                    </div>
                    <p className="text-3xl font-black text-neutral-900 dark:text-white tabular-nums">{stats.missingSystem}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[2.5rem] p-8 shadow-sm">
                <div className="flex gap-4 border-b border-neutral-100 dark:border-neutral-700 pb-6 mb-8 overflow-x-auto">
                    {['MATCHED', 'MISMATCH', 'MISSING'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`whitespace-nowrap text-xs font-black uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all ${activeTab === tab
                                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                                : 'text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                                }`}
                        >
                            {tab} Records
                        </button>
                    ))}
                </div>

                {/* Record List View ported from original architecture */}
                <div className="space-y-4">
                    <div className="p-6 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl flex flex-wrap items-center justify-between gap-6 border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700 transition-all">
                        <div className="min-w-[150px]">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Supplier</p>
                            <p className="font-bold text-neutral-900 dark:text-white">Alpha Tech Solutions</p>
                        </div>
                        <div className="min-w-[120px]">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Invoice</p>
                            <p className="font-mono font-bold text-neutral-900 dark:text-white">INV-2024-001</p>
                        </div>
                        <div className="min-w-[150px]">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">GSTIN</p>
                            <p className="font-mono font-bold text-neutral-900 dark:text-white">33ABCDE1234F1Z5</p>
                        </div>
                        <div className="min-w-[100px] text-right">
                            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">Diff Amount</p>
                            <p className="font-mono font-black text-rose-500">₹ 1,240.00</p>
                        </div>
                        <span className="px-3 py-1 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-200 dark:border-rose-800">
                            Tax Mismatch
                        </span>
                        <Button variant="secondary" size="sm" className="font-bold">Resolve</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaxationView;
