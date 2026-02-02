import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setActiveTab } from "../../../../redux/slices/uiSlice";
import { RootState, AppDispatch } from "../../../../redux/store";
import {
    Search,
    ArrowRight,
    MessageSquarePlus,
    ArrowLeft,
    Download,
    Calendar,
    Filter,
    Cpu,
    Sparkles,
    Lock
} from 'lucide-react';
import { REPORT_CATALOG, ReportItem } from './ReportData';

import BusinessReportsHub from '../BusinessReportsHub';
import { ReportType } from "../../../../hooks/useBusinessReports";

const ReportsModule: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user, role } = useSelector((state: RootState) => state.auth);
    const { activeTab: globalActiveTab } = useSelector((state: RootState) => state.ui);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTabLocal] = useState<string>('transactions');
    const [selectedReportSlug, setSelectedReportSlug] = useState<string | null>(null);

    // Sync active tab with global state if needed
    useEffect(() => {
        if (globalActiveTab.includes('SALES')) setActiveTabLocal('transactions');
        else if (globalActiveTab.includes('CUSTOMER')) setActiveTabLocal('customer');
        else if (globalActiveTab.includes('ROI')) setActiveTabLocal('marketing');
    }, [globalActiveTab]);

    // Access Control: Owner, Admin, and specific Finance roles
    const canAccessFinanceReports = role === 'Owner' || role === 'Manager' || user?.systemRole === 'Owner' || user?.systemRole === 'Manager';

    const currentReport = selectedReportSlug ? REPORT_CATALOG.flatMap(c => c.reports).find(r => r.slug === selectedReportSlug) : null;

    const getMappedReportType = (slug: string): ReportType | null => {
        if (slug === 'sales') return 'REPORT_SALES';
        if (slug === 'purchase') return 'REPORT_PURCHASE';
        if (['inventory', 'low-stock', 'dead-stock'].includes(slug)) return 'REPORT_INVENTORY';
        if (slug === 'profit-loss') return 'PROFIT_LOSS';
        if (slug === 'balance-sheet') return 'BALANCE_SHEET';
        if (slug === 'trial-balance') return 'TRIAL_BALANCE';
        if (slug === 'daybook') return 'DAY_BOOK';
        if (['cash-flow', 'all-transactions'].includes(slug)) return 'REPORT_FINANCIAL';
        if (['all-parties', 'sales-party', 'party-statement'].includes(slug)) return 'REPORT_CUSTOMER';
        if (['purchase-party'].includes(slug)) return 'REPORT_SUPPLIER';
        if (['gstr1', 'gstr2', 'gstr3b', 'gstr9'].includes(slug)) return 'REPORT_TAX';
        return null;
    };

    if (currentReport) {
        const mappedType = getMappedReportType(currentReport.slug);

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
                <button
                    onClick={() => setSelectedReportSlug(null)}
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors text-xs font-black uppercase tracking-widest group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Catalog
                </button>

                {mappedType ? (
                    <BusinessReportsHub view={mappedType} />
                ) : (
                    <>
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-slate-800 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm">
                            <div className="flex items-start gap-5">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                    <currentReport.icon className="w-7 h-7" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{currentReport.name}</h1>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">{currentReport.description}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all">
                                    <Calendar className="w-4 h-4" />
                                    Date Range
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all">
                                    <Download className="w-4 h-4" />
                                    Export Data
                                </button>
                            </div>
                        </div>

                        {/* Data View Placeholder for non-mapped reports */}
                        <div className="min-h-[400px] bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-400">
                            <Filter className="w-12 h-12 mb-4 opacity-10" />
                            <p className="font-bold text-sm uppercase tracking-[0.2em] opacity-40">Initializing Engine...</p>
                            <p className="text-xs mt-2 opacity-30 italic">Aggregating {currentReport.name} dimensions for {user?.tenantId || 'Active Tenant'}</p>
                        </div>
                    </>
                )}
            </div>
        );
    }

    const TABS = [
        ...REPORT_CATALOG.map(c => ({ id: c.id, title: c.title, count: c.reports.length })),
        { id: 'custom', title: 'Custom Reports', count: 1 }
    ];

    const activeCategoryData = REPORT_CATALOG.find(cat => cat.id === activeTab);

    // Filter reports within the active category
    const filteredReports = activeCategoryData
        ? activeCategoryData.reports.filter(report => {
            const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                report.description.toLowerCase().includes(searchQuery.toLowerCase());

            const isRestricted = ['profit-loss', 'balance-sheet', 'trial-balance', 'bill-wise-profit', 'gstr9'].includes(report.slug);
            const hasPermission = !isRestricted || canAccessFinanceReports;

            return matchesSearch && hasPermission;
        })
        : [];

    const ReportCard = ({ report, categoryId }: { report: ReportItem, categoryId: string, key?: string }) => (
        <div
            className="group relative bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col h-full cursor-pointer animate-in fade-in zoom-in-95"
            onClick={() => setSelectedReportSlug(report.slug)}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300 group-hover:scale-110">
                    <report.icon className="w-6 h-6" />
                </div>
                <div className="opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                    <ArrowRight className="w-5 h-5 text-indigo-500" />
                </div>
            </div>

            <h3 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {report.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6 flex-1">
                {report.description}
            </p>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                View detailed report
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
                        Business Intelligence
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">Complete structured catalog of financial & operational analytics.</p>
                </div>

                {activeTab !== 'custom' && (
                    <div className="flex items-center gap-3">
                        <div className="relative group flex-1 lg:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search reports..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-sm transition-all shadow-sm"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTabLocal(tab.id)}
                        className={`group relative flex items-center gap-2 px-6 py-4 text-sm font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                            ? 'text-indigo-600'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        {tab.title}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 animate-in fade-in slide-in-from-bottom-1" />
                        )}
                        <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-colors ${activeTab === tab.id
                            ? 'bg-indigo-50 text-indigo-600'
                            : 'bg-slate-100 dark:bg-slate-800'
                            }`}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Catalog Content (Tab Panel) */}
            <div className="min-h-[400px]">
                {activeTab === 'custom' ? (
                    <div className="animate-in fade-in zoom-in-95 duration-700">
                        <div className="relative overflow-hidden rounded-[3rem] bg-slate-900 border border-slate-800 p-8 lg:p-16 text-white shadow-2xl">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full -mr-64 -mt-64" />
                            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full -ml-40 -mb-40" />

                            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                                <div className="max-w-2xl text-center lg:text-left">
                                    <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                                        <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
                                            <Cpu className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400">Development Lab</span>
                                    </div>

                                    <h2 className="text-4xl lg:text-5xl font-black mb-6 tracking-tight leading-[1.1]">
                                        Need <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Custom Reports?</span>
                                    </h2>

                                    <p className="text-slate-400 text-lg lg:text-xl font-medium leading-relaxed max-w-xl">
                                        Our engineers can build specialized reports tailored to your unique business requirements.
                                        From custom GST calculations to complex supply chain analytics.
                                    </p>

                                    <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-4">
                                        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/40 rounded-2xl border border-slate-700/50 text-xs font-bold text-slate-300 backdrop-blur-sm">
                                            <Sparkles className="w-3 h-3 text-indigo-400" />
                                            Tailored KPIs
                                        </div>
                                        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/40 rounded-2xl border border-slate-700/50 text-xs font-bold text-slate-300 backdrop-blur-sm">
                                            <Download className="w-3 h-3 text-indigo-400" />
                                            Automated Exports
                                        </div>
                                        <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/40 rounded-2xl border border-slate-700/50 text-xs font-bold text-slate-300 backdrop-blur-sm">
                                            <Lock className="w-3 h-3 text-indigo-400" />
                                            Role-Based Access
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-shrink-0">
                                    <button className="px-12 py-6 bg-white text-slate-900 rounded-[2.5rem] font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-indigo-500/10 flex items-center gap-4 group">
                                        Request Report
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Enterprise Trust Badges */}
                        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 opacity-40 grayscale group-hover:grayscale-0 transition-all">
                            {['Data Integrity', 'GDPR Compliant', 'Real-time Sync', 'Audit Ready'].map(badge => (
                                <div key={badge} className="flex items-center justify-center gap-2 p-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{badge}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : filteredReports.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
                        {filteredReports.map((report) => (
                            <ReportCard key={report.id} report={report} categoryId={activeTab} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50/50 dark:bg-slate-800/30 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <Search className="w-12 h-12 mb-4 opacity-10" />
                        <p className="font-bold text-sm uppercase tracking-widest opacity-40">No reports matching your search</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsModule;
