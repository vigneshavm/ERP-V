import React, { useState } from 'react';
import Layout from "../../../components/shared/Layout";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import { FileText, Upload, CheckCircle, AlertTriangle, XCircle, Search } from 'lucide-react';

const GSTReconciliation: React.FC = () => {
    const [period, setPeriod] = useState('2024-02');
    // Mock Data for UI Visualization
    const [stats, setStats] = useState({
        matched: 124,
        mismatch: 5,
        missingGSTR: 12,
        missingSystem: 3
    });

    const [activeTab, setActiveTab] = useState<'MATCHED' | 'MISMATCH' | 'MISSING'>('MISMATCH');

    return (
        <Layout>
            <PageHeader
                title="GST Reconciliation (GSTR-2B)"
                description="Match your Purchase Input Tax Credit with Government Portal Data"
                breadcrumbs={[{ label: 'Finance' }, { label: 'GST' }, { label: 'Reconciliation' }]}
                actions={
                    <div className="flex gap-3">
                        <input
                            type="month"
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 text-sm font-bold"
                        />
                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700">
                            <Upload className="w-4 h-4" /> Import GSTR-2B JSON
                        </button>
                    </div>
                }
            />

            <div className="grid grid-cols-4 gap-6 mb-8 mt-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-wider">Matched</h3>
                    </div>
                    <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{stats.matched}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <h3 className="text-sm font-black text-amber-900 dark:text-amber-400 uppercase tracking-wider">Mismatch</h3>
                    </div>
                    <p className="text-3xl font-black text-amber-700 dark:text-amber-300">{stats.mismatch}</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-2">
                        <XCircle className="w-5 h-5 text-rose-600" />
                        <h3 className="text-sm font-black text-rose-900 dark:text-rose-400 uppercase tracking-wider">Missing in GSTR</h3>
                    </div>
                    <p className="text-3xl font-black text-rose-700 dark:text-rose-300">{stats.missingGSTR}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-3xl">
                    <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-slate-500" />
                        <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Not in System</h3>
                    </div>
                    <p className="text-3xl font-black text-slate-700 dark:text-white">{stats.missingSystem}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6">
                <div className="flex gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                    {['MATCHED', 'MISMATCH', 'MISSING'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${activeTab === tab
                                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                                : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            {tab} Records
                        </button>
                    ))}
                </div>

                {/* Placeholder List */}
                <div className="space-y-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Supplier</p>
                            <p className="font-bold text-slate-800 dark:text-white">Alpha Tech Solutions</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Invoice</p>
                            <p className="font-mono font-bold text-slate-800 dark:text-white">INV-2024-001</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">GSTIN</p>
                            <p className="font-mono font-bold text-slate-800 dark:text-white">33ABCDE1234F1Z5</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Diff Amount</p>
                            <p className="font-mono font-bold text-rose-500">₹ 1,240.00</p>
                        </div>
                        <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-black uppercase">Tax Mismatch</span>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default GSTReconciliation;
