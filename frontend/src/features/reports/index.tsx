import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import type { AppView } from '@/types/common';
import {
    Search,
    ArrowRight,
    ArrowLeft,
    Download,
    Cpu,
    Sparkles,
    Lock
} from 'lucide-react';
import {
    REPORT_CATEGORIES,
    ReportDefinition,
    getReport,
    getReportByAppView,
    getReportsByCategory,
} from './config/reportRegistry';
import PageHeader from '@/components/shared/Layout/PageHeader';
import type { ReportId } from './config/reportRegistry';
import { ReportPageShell } from './components';

import BusinessReportsHub from './BusinessReportsHub';

/**
 * What a global view means for this module: which catalog tab to show and, when the view opens a
 * report directly, which report (null = back to catalog, undefined = leave the selection alone).
 * Which view opens which report lives in the registry.
 */
const resolveGlobalView = (view: AppView): { tab?: string; slug?: string | null } => {
    const report = getReportByAppView(view);
    if (report) return { tab: report.category, slug: report.id };
    if (view === 'REPORTS') return { tab: 'transactions', slug: null };
    if (view.includes('SALES')) return { tab: 'transactions' };
    if (view.includes('CUSTOMER')) return { tab: 'parties' };
    if (view.includes('ROI')) return { tab: 'marketing' };
    return {};
};

const ReportsModule: React.FC = () => {
    const _dispatch = useDispatch<AppDispatch>();
    const { user, role } = useSelector((state: RootState) => state.auth);
    const { activeTab: globalActiveTab } = useSelector((state: RootState) => state.ui);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTabLocal] = useState<string>(() => resolveGlobalView(globalActiveTab).tab ?? 'transactions');
    const [selectedReportSlug, setSelectedReportSlug] = useState<string | null>(() => resolveGlobalView(globalActiveTab).slug ?? null);

    // Follow global navigation: adjust local state during render when the global view changes
    // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes).
    const [syncedGlobalView, setSyncedGlobalView] = useState(globalActiveTab);
    if (syncedGlobalView !== globalActiveTab) {
        setSyncedGlobalView(globalActiveTab);
        const nav = resolveGlobalView(globalActiveTab);
        if (nav.tab !== undefined) setActiveTabLocal(nav.tab);
        if (nav.slug !== undefined) setSelectedReportSlug(nav.slug);
    }

    // Access Control: Owner, Admin, and specific Finance roles
    const canAccessFinanceReports = role === 'Owner' || role === 'Manager' || user?.systemRole === 'Owner' || user?.systemRole === 'Manager';

    const currentReport = selectedReportSlug ? getReport(selectedReportSlug) : null;

    if (currentReport) {
        // Coming-soon reports never render the hub: its views for them are sample figures.
        const hubView = currentReport.implementationStatus === 'coming-soon' ? null : currentReport.hubView;

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
                <button
                    onClick={() => setSelectedReportSlug(null)}
                    className="flex items-center gap-2 text-neutral-500 hover:text-primary transition-colors text-xs font-black uppercase tracking-widest group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Catalog
                </button>

                {hubView ? (
                    <BusinessReportsHub view={hubView} />
                ) : (
                    // Not built yet: the shell renders its header and coming-soon body (no toolbar, no figures).
                    // The id came from a registry lookup, so it is a valid ReportId.
                    <ReportPageShell reportId={currentReport.id as ReportId} />
                )}
            </div>
        );
    }

    const TABS = [
        ...REPORT_CATEGORIES.map(c => ({ id: c.id, title: c.title, count: getReportsByCategory(c.id).length })),
        { id: 'custom', title: 'Custom Reports', count: 1 }
    ];

    const activeCategory = REPORT_CATEGORIES.find(cat => cat.id === activeTab);

    // Filter reports within the active category
    const filteredReports = activeCategory
        ? getReportsByCategory(activeCategory.id).filter(report => {
            const matchesSearch = report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                report.description.toLowerCase().includes(searchQuery.toLowerCase());

            const hasPermission = !report.restricted || canAccessFinanceReports;

            return matchesSearch && hasPermission;
        })
        : [];

    const ReportCard = ({ report }: { report: ReportDefinition, key?: string }) => {
        const status = report.implementationStatus;

        return (
            <div
                className="group relative bg-white dark:bg-neutral-900 rounded-sm p-6 border border-neutral-200 dark:border-neutral-800 hover:border-primary dark:hover:border-primary hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 flex flex-col h-full cursor-pointer animate-in fade-in zoom-in-95"
                onClick={() => setSelectedReportSlug(report.id)}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center text-neutral-600 dark:text-neutral-300 group-hover:bg-primary group-hover:text-white transition-all duration-300 group-hover:scale-110">
                        <report.icon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                        {status === 'coming-soon' && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500" title="Not connected to your shop's data yet">
                                Coming soon
                            </span>
                        )}
                        {status === 'validation' && (
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest bg-warning-soft dark:bg-warning-soft text-warning dark:text-warning" title="Real data wired; figures still being reconciled">
                                Data validation
                            </span>
                        )}
                        <div className="opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                            <ArrowRight className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                </div>

                <h3 className="font-bold text-neutral-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
                    {report.title}
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
            <PageHeader
                title="Business Intelligence"
                description="Complete structured catalog of financial & operational analytics."
                actions={activeTab !== 'custom' ? (
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
                ) : null}
            />

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
                        <div className="relative overflow-hidden rounded-xl bg-neutral-900 border border-neutral-800 p-8 lg:p-16 text-white shadow-2xl">
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full -mr-64 -mt-64" />
                            <div className="absolute bottom-0 left-0 w-80 h-80 bg-primary/10 blur-[100px] rounded-full -ml-40 -mb-40" />

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
                            <ReportCard key={report.id} report={report} />
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
