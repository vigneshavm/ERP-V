import React, { useMemo } from 'react';
import { 
    ArrowLeft, Printer, Filter, Book, 
    RefreshCw, Search, Download,
    ShieldCheck, CreditCard
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { suppliers, MockSupplier } from '../../data/index';
import Layout from '../../components/shared/Layout/index';

const SupplierLedgerMockUI: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const supplierId = searchParams.get('id');
    
    const activeSupplier = useMemo<MockSupplier>(() => {
        return (suppliers.find(s => s.id === supplierId) || suppliers[0]) as MockSupplier;
    }, [supplierId]);

    const transactions = useMemo(() => [
        { date: '2026-05-12', type: 'Purchase Bill', ref: 'BILL-8821', desc: 'Raw Material Batch A-42', debit: 42500, credit: 0, balance: 142500 },
        { date: '2026-05-10', type: 'Bank Payment', ref: 'PAY-0992', desc: 'Vendor Settlement', debit: 0, credit: 50000, balance: 100000 },
        { date: '2026-05-05', type: 'Purchase Bill', ref: 'BILL-8710', desc: 'Electronic Components', debit: 85000, credit: 0, balance: 150000 },
        { date: '2026-04-28', type: 'Debit Note', ref: 'DN-042', desc: 'Quality Return - Batch B', debit: 0, credit: 15000, balance: 65000 },
        { date: '2026-04-20', type: 'Bank Payment', ref: 'PAY-0821', desc: 'Monthly Installment', debit: 0, credit: 40000, balance: 80000 }
    ], []);

    const metrics = useMemo(() => [
        { label: 'Total Purchases', val: `₹${(activeSupplier.balance + 90000).toLocaleString()}`, sub: 'LIFETIME', icon: Book, bg: 'bg-primary/10', color: 'text-primary' },
        { label: 'Total Settled', val: '₹90,000', sub: 'LIFETIME', icon: ShieldCheck, bg: 'bg-emerald-500/10', color: 'text-emerald-500' },
        { label: 'Net Payable', val: `₹${activeSupplier.balance.toLocaleString()}`, sub: 'CURRENT', icon: CreditCard, bg: 'bg-rose-500/10', color: 'text-rose-500' }
    ], [activeSupplier]);

    return (
        <Layout>
            <div className="p-8 space-y-8 h-full flex flex-col text-main animate-fade-in relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={() => navigate('/suppliers')}
                            className="p-3 rounded-sm bg-neutral-50 dark:bg-neutral-950 hover:bg-primary hover:text-white border border-neutral-200 dark:border-neutral-800 transition-all shadow-sm"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-display font-black tracking-tighter text-neutral-900 dark:text-white flex items-center gap-3">
                                Supplier <span className="text-primary">Ledger</span>
                            </h1>
                            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-neutral-500 dark:text-neutral-400 mt-1">
                                {activeSupplier.name} // {activeSupplier.id} // GSTIN: {activeSupplier.gst_number}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white font-bold text-xs tracking-widest rounded-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all flex items-center gap-3 uppercase">
                            <Printer className="w-4 h-4 text-primary" /> Print Statement
                        </button>
                        <button className="h-12 px-8 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-sm transition-all shadow-lg shadow-primary/20 flex items-center gap-3 hover:opacity-90">
                            <Download className="w-4 h-4" /> Export Dataset
                        </button>
                    </div>
                </div>

                {/* Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {metrics.map((card, i) => (
                        <div key={i} className="bg-white dark:bg-neutral-900 p-6 rounded-sm border border-neutral-200 dark:border-neutral-800 flex flex-col gap-4 group hover:border-primary/50 transition-all cursor-pointer shadow-sm relative overflow-hidden">
                            <div className="flex justify-between items-start relative z-10">
                                <div className={`p-4 rounded-sm ${card.bg} ${card.color} border border-current/10`}>
                                    <card.icon className="w-5 h-5" />
                                </div>
                                <span className="text-[9px] font-black text-neutral-400 group-hover:text-primary uppercase tracking-[0.2em] transition-colors">{card.sub}</span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest leading-none mb-2">{card.label}</p>
                                <p className="text-2xl font-display font-black tracking-tighter text-neutral-900 dark:text-white tabular-nums">{card.val}</p>
                            </div>
                            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                        </div>
                    ))}
                </div>

                {/* Ledger Section */}
                <div className="flex-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm flex flex-col overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex flex-col lg:flex-row justify-between items-center gap-4">
                        <div className="flex gap-4 w-full lg:w-auto">
                            <div className="relative flex-1 lg:w-80">
                                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
                                <input 
                                    type="text" 
                                    placeholder="SEARCH VOUCHER / REF / DESC..." 
                                    className="w-full bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm py-3.5 pl-12 pr-6 text-xs font-bold tracking-widest focus:border-primary outline-none transition-all text-neutral-900 dark:text-white shadow-inner" 
                                />
                            </div>
                            <button className="h-12 px-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-sm text-[10px] font-black uppercase tracking-widest text-neutral-500 dark:text-neutral-400 flex items-center gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all">
                                <Filter className="w-4 h-4" /> Filter Protocol
                            </button>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-1">Current Ledger Exposure</p>
                                <span className="px-5 py-2 bg-rose-500/5 border border-rose-500/10 text-rose-500 rounded-sm text-sm font-black tracking-tight shadow-sm">₹{activeSupplier.balance.toLocaleString()}</span>
                            </div>
                            <button className="p-3 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-sm shadow-sm hover:text-primary transition-all">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-neutral-50 dark:bg-neutral-950/80 sticky top-0 z-20 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-800">
                                <tr className="text-neutral-500 dark:text-neutral-400 text-[9px] font-black uppercase tracking-[0.2em]">
                                    <th className="px-8 py-5">Temporal Entry</th>
                                    <th className="px-8 py-5">Voucher Protocol</th>
                                    <th className="px-8 py-5">Audit Ref</th>
                                    <th className="px-8 py-5">Description</th>
                                    <th className="px-8 py-5 text-right">Debit (₹)</th>
                                    <th className="px-8 py-5 text-right">Credit (₹)</th>
                                    <th className="px-8 py-5 text-right">Running Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {transactions.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-primary/[0.02] transition-all group cursor-pointer">
                                        <td className="px-8 py-5 font-mono text-xs font-black text-neutral-400 uppercase tracking-tighter">{row.date}</td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-sm border text-[9px] font-black uppercase tracking-widest ${
                                                row.type.includes('Payment') ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' :
                                                row.type.includes('Bill') ? 'bg-primary/5 text-primary border-primary/10' :
                                                'bg-amber-500/5 text-amber-500 border-amber-500/10'
                                            }`}>
                                                {row.type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 font-black text-xs text-neutral-700 dark:text-neutral-300 uppercase tracking-tighter">{row.ref}</td>
                                        <td className="px-8 py-5 text-xs font-bold text-neutral-500 italic truncate max-w-[200px]">{row.desc}</td>
                                        <td className="px-8 py-5 text-right font-mono text-xs font-black text-neutral-700 dark:text-neutral-300 tabular-nums">{row.debit > 0 ? row.debit.toLocaleString() : '—'}</td>
                                        <td className="px-8 py-5 text-right font-mono text-xs font-black text-emerald-500 tabular-nums">{row.credit > 0 ? row.credit.toLocaleString() : '—'}</td>
                                        <td className="px-8 py-5 text-right font-mono text-sm font-black text-neutral-900 dark:text-white tabular-nums tracking-tighter">₹{row.balance.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default SupplierLedgerMockUI;
