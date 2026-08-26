import React, { useState } from 'react';
import Layout from "../../../components/shared/Layout";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import { FileText, Upload, CheckCircle, AlertTriangle, XCircle, Search, Calendar, ChevronRight, Info } from 'lucide-react';

const GSTReconciliation: React.FC = () => {
    const [period, setPeriod] = useState('2024-02');
    // Mock Data for UI Visualization
    const [stats] = useState({
        matched: 124,
        mismatch: 5,
        missingGSTR: 12,
        missingSystem: 3
    });

    const [activeTab, setActiveTab] = useState<'MATCHED' | 'MISMATCH' | 'MISSING'>('MISMATCH');

    return (
        <Layout>
            <div className="pt-8 space-y-10 pb-32">
                <PageHeader
                    title="GST Ledger Reconciliation"
                    description="Match Purchase Input Tax Credit with institutional GSTR-2B portal data."
                    breadcrumbs={[
                        { label: 'Home', link: '/dashboard' },
                        { label: 'Finance', link: '/finance' },
                        { label: 'GST Reconciliation' }
                    ]}
                    actions={
                        <div className="flex gap-4">
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                                <input
                                    type="month"
                                    value={period}
                                    onChange={(e) => setPeriod(e.target.value)}
                                    className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl pl-12 pr-6 py-2.5 text-xs font-black uppercase tracking-widest focus:ring-2 focus:ring-primary/20 transition-all"
                                />
                            </div>
                            <button className="flex items-center gap-3 px-6 py-2.5 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95">
                                <Upload className="w-4 h-4" /> Import GSTR-2B JSON
                            </button>
                        </div>
                    }
                />

                {/* Reconciliation Stats Pulse */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-8 rounded-[2.5rem] group hover:border-success/30 transition-all duration-500">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-white dark:bg-neutral-900 rounded-xl shadow-sm text-success group-hover:scale-110 transition-transform">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                            <h3 className="text-[10px] font-black text-emerald-900/60 dark:text-success uppercase tracking-widest">Matched Nodes</h3>
                        </div>
                        <p className="text-4xl font-black text-emerald-600 dark:text-emerald-300 tracking-tighter tabular-nums">{stats.matched}</p>
                    </div>

                    <div className="bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-8 rounded-[2.5rem] group hover:border-warning/30 transition-all duration-500">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-white dark:bg-neutral-900 rounded-xl shadow-sm text-warning group-hover:scale-110 transition-transform">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <h3 className="text-[10px] font-black text-amber-900/60 dark:text-warning uppercase tracking-widest">Quantum Mismatch</h3>
                        </div>
                        <p className="text-4xl font-black text-amber-600 dark:text-amber-300 tracking-tighter tabular-nums">{stats.mismatch}</p>
                    </div>

                    <div className="bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 p-8 rounded-[2.5rem] group hover:border-danger/30 transition-all duration-500">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-white dark:bg-neutral-900 rounded-xl shadow-sm text-danger group-hover:scale-110 transition-transform">
                                <XCircle className="w-5 h-5" />
                            </div>
                            <h3 className="text-[10px] font-black text-rose-900/60 dark:text-danger uppercase tracking-widest">Missing in GSTR</h3>
                        </div>
                        <p className="text-4xl font-black text-rose-600 dark:text-rose-300 tracking-tighter tabular-nums">{stats.missingGSTR}</p>
                    </div>

                    <div className="bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 p-8 rounded-[2.5rem] group hover:border-primary/30 transition-all duration-500">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-white dark:bg-neutral-900 rounded-xl shadow-sm text-neutral-400 group-hover:scale-110 transition-transform">
                                <FileText className="w-5 h-5" />
                            </div>
                            <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Missing in ERP</h3>
                        </div>
                        <p className="text-4xl font-black text-neutral-900 dark:text-white tracking-tighter tabular-nums">{stats.missingSystem}</p>
                    </div>
                </div>

                {/* Audit Terminal Container */}
                <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[3rem] shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <div className="p-8 border-b border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-3 p-1.5 bg-neutral-50 dark:bg-neutral-900 rounded-sm border border-neutral-100 dark:border-neutral-800 self-start md:self-auto">
                            {(['MATCHED', 'MISMATCH', 'MISSING'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`text-[10px] font-black uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all ${activeTab === tab
                                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xl'
                                        : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200'
                                        }`}
                                >
                                    {tab} Records
                                </button>
                            ))}
                        </div>
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Filter records by supplier or GSTIN..."
                                className="w-full pl-12 pr-6 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-transparent rounded-sm text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Reconciliation Table / List */}
                    <div className="p-8 space-y-4">
                        <div className="grid grid-cols-12 gap-6 px-6 py-2 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                            <div className="col-span-4">Institutional Supplier</div>
                            <div className="col-span-2">Invoice Node</div>
                            <div className="col-span-3">Entity GSTIN</div>
                            <div className="col-span-2 text-right">Variance (INR)</div>
                            <div className="col-span-1"></div>
                        </div>

                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="grid grid-cols-12 gap-6 items-center p-6 bg-neutral-50/50 dark:bg-neutral-900/30 rounded-sm border border-transparent hover:border-neutral-100 dark:hover:border-neutral-800 transition-all group">
                                    <div className="col-span-4">
                                        <p className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tighter group-hover:text-primary transition-colors">Alpha Tech Solutions PVT LTD</p>
                                        <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mt-1">Vendor Node 022</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs font-black text-neutral-600 dark:text-neutral-400 font-mono tracking-tighter uppercase">INV-2024-00{i}</p>
                                    </div>
                                    <div className="col-span-3">
                                        <p className="text-xs font-black text-neutral-500 font-mono tracking-widest">33ABCDE1234F1Z5</p>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <p className="text-sm font-black text-danger tabular-nums">₹ 1,240.00</p>
                                        <p className="text-[9px] font-black text-rose-900/40 dark:text-danger/40 uppercase tracking-widest mt-1 italic">Quantum Excess</p>
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        <button className="p-2.5 text-neutral-300 hover:text-primary transition-all group-hover:translate-x-1">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-10 p-6 bg-neutral-900 dark:bg-neutral-100 rounded-sm flex items-center gap-6 group">
                            <div className="w-12 h-12 rounded-sm bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                                <Info className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-white dark:text-neutral-900 uppercase tracking-widest italic">Intelligence Protocol Active</p>
                                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-bold mt-1 italic leading-relaxed">
                                    Ensure institutional GSTR-2B JSON nodes are synchronized before final ledger commitment.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default GSTReconciliation;
