"use client";

import React, { useState } from 'react';
import { Search, Calendar, Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@repo/ui";

const AccountLedgerView = () => {
    const [selectedAccount, setSelectedAccount] = useState('Petty Cash');
    const [dateRange, setDateRange] = useState({ start: '2026-03-01', end: '2026-03-31' });

    // Mock Data ported from AccountLedger.tsx logic
    const ledgerEntries = [
        { _id: '1', date: '2026-03-05', description: 'Office Supplies Purchase', reference: 'EXP-101', debit: 1250.00, credit: 0, runningBalance: 48750.00, reconciled: true },
        { _id: '2', date: '2026-03-12', description: 'Cash Transfer from Main Bank', reference: 'TX-502', debit: 0, credit: 15000.00, runningBalance: 63750.00, reconciled: false },
        { _id: '3', date: '2026-03-20', description: 'Electricity Bill Payment', reference: 'BILL-445', debit: 4500.00, credit: 0, runningBalance: 59250.00, reconciled: true }
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-neutral-900 dark:text-white">
                        Account Ledger
                    </h1>
                    <p className="text-neutral-500 font-medium mt-1">
                        Granular Transaction Audit // {selectedAccount}
                    </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="secondary">
                        <Download className="w-4 h-4 mr-2" />
                        Download XLS
                    </Button>
                </div>
            </header>

            {/* Filter Bar ported from original logic */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-neutral-800 p-6 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Select Account</label>
                    <select 
                        value={selectedAccount}
                        onChange={(e) => setSelectedAccount(e.target.value)}
                        className="w-full bg-neutral-100 dark:bg-neutral-900 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20"
                    >
                        <option>Petty Cash</option>
                        <option>Main Bank Account</option>
                        <option>Accounts Payable</option>
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Start Date</label>
                    <input 
                        type="date" 
                        value={dateRange.start}
                        onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                        className="w-full bg-neutral-100 dark:bg-neutral-900 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20" 
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">End Date</label>
                    <input 
                        type="date" 
                        value={dateRange.end}
                        onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                        className="w-full bg-neutral-100 dark:bg-neutral-900 border-none rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20" 
                    />
                </div>
                <div className="flex items-end">
                    <Button className="w-full bg-neutral-900 dark:bg-white dark:text-neutral-900 font-black uppercase tracking-widest text-[10px] py-3">
                        Retrieve Registry
                    </Button>
                </div>
            </div>

            {/* Ledger Table ported from original architecture */}
            <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[2.5rem] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-100 dark:border-neutral-700">
                                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-400 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-400 uppercase tracking-widest">Description</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-neutral-400 uppercase tracking-widest">Debit</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-neutral-400 uppercase tracking-widest">Credit</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-neutral-400 uppercase tracking-widest">Balance</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-neutral-400 uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-50 dark:divide-neutral-700/50">
                            {ledgerEntries.map((txn) => (
                                <tr key={txn._id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-neutral-500 tabular-nums">
                                        {txn.date}
                                    </td>
                                    <td className="px-6 py-4 max-w-md">
                                        <p className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight truncate">{txn.description}</p>
                                        <span className="inline-block mt-1 px-2 py-0.5 bg-neutral-100 dark:bg-neutral-900 rounded-md text-[9px] font-black text-neutral-400 uppercase tracking-widest">Ref: {txn.reference}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-red-500 tabular-nums">
                                        {txn.debit > 0 ? `₹${txn.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-black text-emerald-500 tabular-nums">
                                        {txn.credit > 0 ? `₹${txn.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-base font-black text-indigo-600 tabular-nums">
                                        ₹{txn.runningBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`px-3 py-1 text-[9px] font-black rounded-lg uppercase tracking-widest border ${txn.reconciled 
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/10 dark:text-emerald-400 dark:border-emerald-800' 
                                            : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-800'}`}>
                                            {txn.reconciled ? 'Reconciled' : 'Unsettled'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AccountLedgerView;
