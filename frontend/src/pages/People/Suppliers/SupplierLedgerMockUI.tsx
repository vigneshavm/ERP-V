import React, { useState } from 'react';
import { 
    ArrowLeft, Printer, Filter, Calendar, Book, 
    RefreshCw, FileText, Search, ArrowUpRight, ArrowDownLeft,
    Building2, MoreHorizontal, Download, ChevronRight
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const MOCK_TRANSACTIONS = [
    { date: '2026-04-20', type: 'Purchase Bill', ref: 'BILL-4452', desc: 'Raw Materials Batch #401', debit: 45000, credit: 0, balance: 1245000 },
    { date: '2026-04-18', type: 'Payment Out', ref: 'PAY-8821', desc: 'Electronic Clearing Service', debit: 0, credit: 50000, balance: 1200000 },
    { date: '2026-04-15', type: 'Purchase Bill', ref: 'BILL-4420', desc: 'Inventory Restock', debit: 82000, credit: 0, balance: 1250000 },
    { date: '2026-04-10', type: 'Debit Note', ref: 'RET-102', desc: 'Damaged Goods Return', debit: 0, credit: 15000, balance: 1168000 },
    { date: '2026-04-05', type: 'Payment Out', ref: 'PAY-8805', desc: 'Advance Payment', debit: 0, credit: 100000, balance: 1183000 },
];

const SupplierLedgerMockUI: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const supplierId = searchParams.get('id') || 'SUP-001';

    return (
        <div className="p-6 space-y-6 h-full flex flex-col text-main animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/suppliers')}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-main/60 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
                            Supplier Ledger
                        </h1>
                        <p className="text-sm text-main/60 mt-1 font-medium">Global Raw Materials Inc. • {supplierId}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-sm font-bold">
                        <Printer className="w-4 h-4" /> Print Statement
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)] transition-all text-sm font-bold">
                        <Download className="w-4 h-4" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: 'Opening Balance', val: '₹11,83,000', sub: 'As of Apr 01, 2026', icon: Book, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                    { label: 'Total Purchases', val: '₹1,27,000', sub: '2 Bills this month', icon: ArrowUpRight, color: 'text-pink-400', bg: 'bg-pink-500/10' },
                    { label: 'Total Payments', val: '₹65,000', sub: '1 Payment settled', icon: ArrowDownLeft, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                ].map((card, i) => (
                    <div key={i} className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col gap-3 group hover:bg-white/[0.04] transition-all cursor-pointer">
                        <div className="flex justify-between items-start">
                            <div className={`p-2.5 rounded-xl ${card.bg} ${card.color}`}>
                                <card.icon className="w-5 h-5" />
                            </div>
                            <span className="text-[10px] font-bold text-main/20 group-hover:text-main/40 uppercase tracking-widest">{card.sub}</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-main/40 uppercase tracking-widest">{card.label}</p>
                            <p className="text-xl font-black tracking-tight text-main">{card.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Ledger Table */}
            <div className="flex-1 glass-panel rounded-3xl border border-white/5 flex flex-col overflow-hidden bg-white/[0.01]">
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <div className="flex gap-4">
                        <div className="relative">
                            <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-main/30" />
                            <input 
                                type="text" 
                                readOnly
                                value="Apr 01, 2026 - Apr 30, 2026"
                                className="w-64 bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs font-bold transition-all text-main cursor-default" 
                            />
                        </div>
                        <button className="h-10 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-main/60 flex items-center gap-2 transition-all">
                            <Filter className="w-4 h-4" /> Filter by Type
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-main/40">Closing Balance:</span>
                        <span className="px-3 py-1 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-lg text-sm font-black tracking-tight">₹12,45,000 Dr</span>
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-black/40 sticky top-0 z-20 backdrop-blur-md">
                            <tr className="text-main/40 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                                <th className="px-8 py-4">Transaction Date</th>
                                <th className="px-8 py-4">Voucher Type</th>
                                <th className="px-8 py-4">Reference No.</th>
                                <th className="px-8 py-4">Description</th>
                                <th className="px-8 py-4 text-right">Debit (₹)</th>
                                <th className="px-8 py-4 text-right">Credit (₹)</th>
                                <th className="px-8 py-4 text-right">Balance (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {MOCK_TRANSACTIONS.map((row, idx) => (
                                <tr key={idx} className="hover:bg-white/[0.04] transition-colors group cursor-pointer">
                                    <td className="px-8 py-4 font-mono text-xs text-main/60">{row.date}</td>
                                    <td className="px-8 py-4">
                                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-tighter ${
                                            row.type.includes('Payment') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                            row.type.includes('Bill') ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                        }`}>
                                            {row.type}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 font-bold text-main/80">{row.ref}</td>
                                    <td className="px-8 py-4 text-sm text-main/40">{row.desc}</td>
                                    <td className="px-8 py-4 text-right font-mono text-sm text-main/90">{row.debit > 0 ? row.debit.toLocaleString() : '-'}</td>
                                    <td className="px-8 py-4 text-right font-mono text-sm text-emerald-400/80">{row.credit > 0 ? row.credit.toLocaleString() : '-'}</td>
                                    <td className="px-8 py-4 text-right font-mono text-sm font-bold text-main">{row.balance.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SupplierLedgerMockUI;
