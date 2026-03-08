import React, { useState } from 'react';
import Layout from "../../../components/shared/Layout";
import PageHeader from "../../../components/shared/Layout/PageHeader";
import { FileText, Upload, CheckCircle, AlertTriangle, XCircle, Search, RefreshCw } from 'lucide-react';

const GSTReconciliation: React.FC = () => {
    const [period, setPeriod] = useState('2024-02');
    const [isReconciling, setIsReconciling] = useState(false);
    // Mock Data for UI Visualization
    const [stats, setStats] = useState({
        matched: 124,
        mismatch: 5,
        missingGSTR: 12,
        missingSystem: 3
    });

    const [activeTab, setActiveTab] = useState<'MATCHED' | 'MISMATCH' | 'MISSING'>('MISMATCH');

    const handleSimulateReconcile = () => {
        setIsReconciling(true);
        setTimeout(() => {
            setIsReconciling(false);
            setStats(prev => ({
                ...prev,
                matched: prev.matched + 2,
                mismatch: prev.mismatch - 2
            }));
            alert("Reconciliation Cycle Complete: 2 Records matched via fuzzy logic.");
        }, 2000);
    };

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
                        <button 
                            onClick={handleSimulateReconcile}
                            disabled={isReconciling}
                            className={`flex items-center gap-2 px-4 py-2 border-2 border-indigo-600 rounded-xl text-sm font-black transition-all ${isReconciling ? 'bg-indigo-50 text-indigo-400 border-indigo-200' : 'bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white'}`}
                        >
                            {isReconciling ? <Search className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            {isReconciling ? 'Matching...' : 'Run Auto-Matching'}
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20">
                            <Upload className="w-4 h-4" /> Import GSTR-2B JSON
                        </button>
                    </div>
                }
            />

            <div className="grid grid-cols-4 gap-6 mb-8 mt-6">
                <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 p-6 rounded-3xl group hover:scale-105 transition-all cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                        <CheckCircle className="w-5 h-5 text-emerald-600" />
                        <h3 className="text-sm font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-wider">Matched</h3>
                    </div>
                    <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300">{stats.matched}</p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 p-6 rounded-3xl group hover:scale-105 transition-all cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <h3 className="text-sm font-black text-amber-900 dark:text-amber-400 uppercase tracking-wider">Mismatch</h3>
                    </div>
                    <p className="text-3xl font-black text-amber-700 dark:text-amber-300">{stats.mismatch}</p>
                </div>
                <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 p-6 rounded-3xl group hover:scale-105 transition-all cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                        <XCircle className="w-5 h-5 text-rose-600" />
                        <h3 className="text-sm font-black text-rose-900 dark:text-rose-400 uppercase tracking-wider">Missing in GSTR</h3>
                    </div>
                    <p className="text-3xl font-black text-rose-700 dark:text-rose-300">{stats.missingGSTR}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-3xl group hover:scale-105 transition-all cursor-pointer">
                    <div className="flex items-center gap-3 mb-2">
                        <FileText className="w-5 h-5 text-slate-500" />
                        <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Not in System</h3>
                    </div>
                    <p className="text-3xl font-black text-slate-700 dark:text-white">{stats.missingSystem}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-6">
                    <div className="flex gap-4">
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
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Portal Sync Active
                    </div>
                </div>

                {/* Records List */}
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-center justify-between border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center font-black text-indigo-600 shadow-sm border border-slate-100 dark:border-slate-700">
                                    {i}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Supplier</p>
                                    <p className="text-sm font-black text-slate-800 dark:text-white">Alpha Tech {i === 1 ? 'Solutions' : i === 2 ? 'Global' : 'Systems'}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Invoice</p>
                                <p className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">INV-2024-00{i}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Amount Diff</p>
                                <p className={`font-mono text-xs font-black ${i === 1 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {i === 1 ? '₹ 1,240.00' : i === 2 ? '₹ 0.00' : '₹ 450.00'}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                    i === 1 ? 'bg-rose-100 text-rose-700' : i === 2 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                    {i === 1 ? 'Tax Mismatch' : i === 2 ? 'Fully Matched' : 'Partial Match'}
                                </span>
                                <button className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-400 hover:text-indigo-600 transition-all opacity-0 group-hover:opacity-100">
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Layout>
    );
};

export default GSTReconciliation;
