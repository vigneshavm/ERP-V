"use client";

import React, { useState } from 'react';
import { ProfitLossReport, BalanceSheetReport } from '../components/ReportComponents';
import { FileText, Calendar, Download, Printer } from 'lucide-react';
import { Button } from "@repo/ui";

const FinancialStatementsView = () => {
    const [activeReport, setActiveReport] = useState<'PL' | 'BS'>('PL');

    // Mock data based on BusinessReportsHub expectations
    const mockPLData = {
        revenue: { total: 4500000, breakdown: [{ category: 'Product Sales', amount: 3800000 }, { category: 'Service Income', amount: 700000 }] },
        cogs: { total: 2100000, material: 1800000, labor: 200000, freight: 100000 },
        gross_profit: 2400000,
        ebitda: 1800000,
        ratios: { net_margin: 24.5 },
        expenses: { total: 600000, breakdown: [{ category: 'Rent', amount: 200000 }, { category: 'Utilities', amount: 50000 }, { category: 'Marketing', amount: 350000 }] },
        ebit: 1800000,
        interest: 50000,
        tax: 350000,
        net_profit: 1400000
    };

    const mockBSData = {
        assets: { 
            total: 12500000, 
            current: [{ name: 'Cash & Bank', amount: 4500000 }, { name: 'Inventory', amount: 2000000 }, { name: 'Receivables', amount: 1500000 }],
            fixed: [{ name: 'Machinery', amount: 3000000 }, { name: 'Buildings', amount: 1500000 }]
        },
        liabilities: { 
            total: 5000000, 
            current: [{ name: 'Accounts Payable', amount: 1200000 }, { name: 'Short-term Loans', amount: 800000 }],
            long_term: [{ name: 'Mortgages', amount: 3000000 }]
        },
        equity: { 
            total: 7500000, 
            capital: 5000000, 
            retained_earnings: 1100000, 
            current_profit: 1400000 
        },
        ratios: { debt_equity: '0.67', working_capital: 4500000 }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-neutral-900 dark:text-white">
                        Financial Statements
                    </h1>
                    <p className="text-neutral-500 font-medium mt-1">
                        Fiscal Year 2026 // Real-time Audit Ready Reporing
                    </p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="secondary" className="flex-1 md:flex-none">
                        <Download className="w-4 h-4 mr-2" />
                        Export PDF
                    </Button>
                    <Button variant="secondary" className="flex-1 md:flex-none">
                        <Printer className="w-4 h-4 mr-2" />
                        Print
                    </Button>
                </div>
            </header>

            {/* Tab Controls */}
            <div className="flex p-1.5 bg-neutral-100 dark:bg-neutral-900 rounded-2xl w-full max-w-md">
                <button
                    onClick={() => setActiveReport('PL')}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeReport === 'PL' ? 'bg-white dark:bg-neutral-800 text-indigo-600 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
                >
                    Profit & Loss
                </button>
                <button
                    onClick={() => setActiveReport('BS')}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeReport === 'BS' ? 'bg-white dark:bg-neutral-800 text-indigo-600 shadow-sm' : 'text-neutral-400 hover:text-neutral-600'}`}
                >
                    Balance Sheet
                </button>
            </div>

            {/* Report Selector & Date Filter */}
            <div className="flex flex-wrap items-center gap-4 py-4 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-600">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    Apr 01, 2025 - Mar 31, 2026
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 text-xs font-bold text-neutral-600">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Consolidated Entity
                </div>
            </div>

            {/* Report Rendering */}
            <div className="min-h-[500px]">
                {activeReport === 'PL' ? (
                    <ProfitLossReport data={mockPLData} />
                ) : (
                    <BalanceSheetReport data={mockBSData} />
                )}
            </div>
        </div>
    );
};

export default FinancialStatementsView;
