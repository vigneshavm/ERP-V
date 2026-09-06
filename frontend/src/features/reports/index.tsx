import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import {
    Search,
    ArrowRight,
    ArrowLeft,
    Download,
    Calendar,
    Filter,
    Cpu,
    Sparkles,
    Lock
} from 'lucide-react';
import { REPORT_CATALOG, ReportItem } from './ReportData';

import BusinessReportsHub from './BusinessReportsHub';
import { ReportType } from "../../hooks/useBusinessReports";

const ReportsModule: React.FC = () => {
    const _dispatch = useDispatch<AppDispatch>();
    const { user, role } = useSelector((state: RootState) => state.auth);
    const { activeTab: globalActiveTab } = useSelector((state: RootState) => state.ui);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTabLocal] = useState<string>('transactions');
    const [selectedReportSlug, setSelectedReportSlug] = useState<string | null>(null);

    // Sync active tab with global state
    useEffect(() => {
        switch (globalActiveTab) {
            case 'REPORT_SALES':
                setActiveTabLocal('transactions');
                setSelectedReportSlug('sales');
                break;
            case 'REPORT_PURCHASE':
                setActiveTabLocal('transactions');
                setSelectedReportSlug('purchase');
                break;
            case 'REPORT_INVENTORY':
                setActiveTabLocal('inventory');
                setSelectedReportSlug('inventory');
                break;
            case 'REPORT_CUSTOMER':
                setActiveTabLocal('parties');
                setSelectedReportSlug('sales-party');
                break;
            case 'REPORT_SUPPLIER':
                setActiveTabLocal('parties');
                setSelectedReportSlug('purchase-party');
                break;
            case 'REPORT_TAX':
                setActiveTabLocal('gst');
                setSelectedReportSlug('gstr3b');
                break;
            case 'REPORT_FINANCIAL':
                setActiveTabLocal('transactions');
                setSelectedReportSlug('all-transactions');
                break;
            case 'DAY_BOOK':
                setActiveTabLocal('transactions');
                setSelectedReportSlug('daybook');
                break;
            case 'TRIAL_BALANCE':
                setActiveTabLocal('transactions');
                setSelectedReportSlug('trial-balance');
                break;
            case 'PROFIT_LOSS':
                setActiveTabLocal('transactions');
                setSelectedReportSlug('profit-loss');
                break;
            case 'BALANCE_SHEET':
                setActiveTabLocal('transactions');
                setSelectedReportSlug('balance-sheet');
                break;
            case 'CASH_FLOW':
                setActiveTabLocal('transactions');
                setSelectedReportSlug('cash-flow');
                break;
            case 'REPORTS':
                // Reset to catalog view
                setActiveTabLocal('transactions');
                setSelectedReportSlug(null);
                break;
            default:
                if (globalActiveTab.includes('SALES')) setActiveTabLocal('transactions');
                else if (globalActiveTab.includes('CUSTOMER')) setActiveTabLocal('parties');
                else if (globalActiveTab.includes('ROI')) setActiveTabLocal('marketing');
                break;
        }
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
        if (slug === 'brand-wise-sales') return 'REPORT_BRAND_WISE';
        if (slug === 'category-wise-sales') return 'REPORT_CATEGORY_WISE';
        if (slug === 'counter-wise-sales') return 'REPORT_COUNTER_WISE';
        if (slug === 'hourly-billing') return 'REPORT_HOURLY_BILLING';
        if (slug === 'city-wise-stock') return 'REPORT_CITY_WISE_STOCK';
        if (slug === 'rack-wise-stock') return 'REPORT_RACK_WISE_STOCK';
        return null;
    };

    if (currentReport) {
        const mappedType = getMappedReportType(currentReport.slug);

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
                <button
                    onClick={() => setSelectedReportSlug(null)}
                    className="flex items-center gap-2 text-neutral-500 hover:text-primary transition-colors text-xs font-black uppercase tracking-widest group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Catalog
                </button>

                {mappedType ? (
                    <BusinessReportsHub view={mappedType} />
                ) : (
                    <>
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-neutral-900 p-8 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-sm">
                            <div className="flex items-start gap-5">
                                <div className="w-14 h-14 rounded-sm bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                    <currentReport.icon className="w-7 h-7" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">{currentReport.name}</h1>
                                    <p className="text-neutral-500 dark:text-neutral-400 font-medium">{currentReport.description}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <button className="flex items-center gap-2 px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl text-xs font-bold transition-all">
                                    <Calendar className="w-4 h-4" />
                                    Date Range
                                </button>
                                <button className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 transition-all">
                                    <Download className="w-4 h-4" />
                                    Export Data
                                </button>
                            </div>
                        </div>

                        {/* Data View Placeholder for non-mapped reports */}
                        <div className="min-h-[400px] bg-neutral-50 dark:bg-neutral-900/50 rounded-[2rem] border-2 border-dashed border-neutral-200 dark:border-neutral-800 flex flex-col items-center justify-center text-neutral-400">
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

    // Reports mapped to one of these types are backed by real, live-fetched data (see
    // BusinessReportsHub.tsx lines rendering BrandWiseSalesReport/CategoryWiseSalesReport/
    // CounterWiseSalesReport/HourlyBillingReport/CityWiseStockReport/RackWiseStockReport).
    // Every other report in the catalog -- sales/purchase/inventory/customer/supplier overviews,
    // P&L, balance sheet, trial balance, day book, tax -- currently renders fabricated numbers
    // from useBusinessReports.ts (hardcoded objects behind a fake "network delay"), so those get
    // a visible "Sample data" badge rather than being presented as if they were real figures.
    const LIVE_DATA_TYPES: ReportType[] = [
        'REPORT_BRAND_WISE', 'REPORT_CATEGORY_WISE', 'REPORT_COUNTER_WISE',
        'REPORT_HOURLY_BILLING', 'REPORT_CITY_WISE_STOCK', 'REPORT_RACK_WISE_STOCK'
    ];

    const ReportCard = ({ report, categoryId: __categoryId }: { report: ReportItem, categoryId: string, key?: string }) => {
        const mappedType = getMappedReportType(report.slug);
        const isLive = mappedType !== null && LIVE_DATA_TYPES.includes(mappedType);

        return (
            <div
                className="group relative bg-white dark:bg-neutral-900 rounded-sm p-6 border border-neutral-200 dark:border-neutral-800 hover:border-primary dark:hover:border-primary hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 flex flex-col h-full cursor-pointer animate-in fade-in zoom-in-95"
                onClick={() => setSelectedReportSlug(report.slug)}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 group-hover:bg-primary group-hover:text-white transition-all duration-300 group-hover:scale-110">
                        <report.icon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                        {!isLive && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" title="Not yet wired to live data -- shown for preview only">
                                Sample data
                            </span>
                        )}
                        <div className="opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                            <ArrowRight className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                </div>

                <h3 className="font-bold text-neutral-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                    {report.name}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed mb-6 flex-1">
                    {report.description}
                </p>

                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center text-[10px] font-black uppercase tracking-widest text-primary group-hover:translate-x-1 transition-transform">
                    View detailed report
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-neutral-900 to-neutral-500 dark:from-white dark:to-neutral-400">
                        Business Intelligence
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-2 font-medium">Complete structured catalog of financial & operational analytics.</p>
                </div>

                {activeTab !== 'custom' && (
                    <div className="flex items-center gap-3">
                        <div className="relative group flex-1 lg:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search reports..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white dark:bg-neutral-900 border-none ring-1 ring-neutral-200 dark:ring-neutral-800 focus:ring-2 focus:ring-primary rounded-xl py-2.5 pl-10 pr-4 text-sm transition-all shadow-sm text-neutral-900 dark:text-white"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-px">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTabLocal(tab.id)}
                        className={`group relative flex items-center gap-2 px-6 py-4 text-sm font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                            ? 'text-primary'
                            : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                            }`}
                    >
                        {tab.title}
                        {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in slide-in-from-bottom-1" />
                        )}
                        <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-colors ${activeTab === tab.id
                            ? 'bg-primary/10 text-primary'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
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
                        <div className="relative overflow-hidden rounded-[3rem] bg-neutral-900 border border-neutral-800 p-8 lg:p-16 text-white shadow-2xl">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full -mr-64 -mt-64" />
                            <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 blur-[100px] rounded-full -ml-40 -mb-40" />

                            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                                <div className="max-w-2xl text-center lg:text-left">
                                    <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                                        <div className="p-2 bg-primary/20 rounded-lg border border-primary/30">
                                            <Cpu className="w-5 h-5 text-primary" />
                                        </div>
                                        <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">Development Lab</span>
                                    </div>

                                    <h2 className="text-4xl lg:text-5xl font-black mb-6 tracking-tight leading-[1.1]">
                                        Need <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">Custom Reports?</span>
                                    </h2>

                                    <p className="text-neutral-400 text-lg lg:text-xl font-medium leading-relaxed max-w-xl">
                                        Our engineers can build specialized reports tailored to your unique business requirements.
                                        From custom GST calculations to complex supply chain analytics.
                                    </p>

                                    <div className="mt-10 flex flex-wrap justify-center lg:justify-start gap-4">
                                        <div className="flex items-center gap-2 px-5 py-2.5 bg-neutral-800/40 rounded-sm border border-neutral-700/50 text-xs font-bold text-neutral-300 backdrop-blur-sm">
                                            <Sparkles className="w-3 h-3 text-primary" />
                                            Tailored KPIs
                                        </div>
                                        <div className="flex items-center gap-2 px-5 py-2.5 bg-neutral-800/40 rounded-sm border border-neutral-700/50 text-xs font-bold text-neutral-300 backdrop-blur-sm">
                                            <Download className="w-3 h-3 text-primary" />
                                            Automated Exports
                                        </div>
                                        <div className="flex items-center gap-2 px-5 py-2.5 bg-neutral-800/40 rounded-sm border border-neutral-700/50 text-xs font-bold text-neutral-300 backdrop-blur-sm">
                                            <Lock className="w-3 h-3 text-primary" />
                                            Role-Based Access
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-shrink-0">
                                    <button className="px-12 py-6 bg-white text-neutral-900 rounded-[2.5rem] font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-primary/10 flex items-center gap-4 group">
                                        Request Report
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Enterprise Trust Badges */}
                        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 opacity-40 grayscale group-hover:grayscale-0 transition-all">
                            {['Data Integrity', 'GDPR Compliant', 'Real-time Sync', 'Audit Ready'].map(badge => (
                                <div key={badge} className="flex items-center justify-center gap-2 p-4 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
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
                    <div className="flex flex-col items-center justify-center py-20 text-neutral-400 bg-neutral-50/50 dark:bg-neutral-800/30 rounded-[2rem] border-2 border-dashed border-neutral-200 dark:border-neutral-800">
                        <Search className="w-12 h-12 mb-4 opacity-10" />
                        <p className="font-bold text-sm uppercase tracking-widest opacity-40">No reports matching your search</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsModule;
