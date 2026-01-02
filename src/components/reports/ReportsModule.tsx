import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { BarChart3, TrendingUp, Users, Calendar, Download, Tag, Award, Clock } from 'lucide-react';
import CounterWiseSalesReport from './CounterWiseSalesReport';
import CategoryWiseSalesReport from './CategoryWiseSalesReport';
import BrandWiseSalesReport from './BrandWiseSalesReport';
import HourlyBillingReport from './HourlyBillingReport';

const ReportsModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'SALES' | 'CATEGORY' | 'BRAND' | 'HOURLY' | 'INVENTORY' | 'STAFF'>('SALES');
    const [timeRange, setTimeRange] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM'>('WEEK');

    const tabs = [
        { id: 'SALES', label: 'Counter Sales', icon: BarChart3 },
        { id: 'CATEGORY', label: 'Category Analytics', icon: Tag },
        { id: 'BRAND', label: 'Brand Analytics', icon: Award },
        { id: 'HOURLY', label: 'Hourly Pattern', icon: Clock },
        { id: 'INVENTORY', label: 'Stock Reports', icon: TrendingUp },
        { id: 'STAFF', label: 'Performance', icon: Users },
    ];

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Business Intelligence</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Deep insights and data analytics for your enterprise.</p>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center px-3 py-1.5 border-r border-slate-200 dark:border-slate-700 text-slate-400">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span className="text-xs font-bold uppercase tracking-wider">Period</span>
                    </div>
                    {(['TODAY', 'WEEK', 'MONTH', 'CUSTOM'] as const).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-lg transition-all ${timeRange === range
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-px">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`group flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === tab.id
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300'
                            }`}
                    >
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0">
                {activeTab === 'SALES' && <CounterWiseSalesReport timeRange={timeRange} />}
                {activeTab === 'CATEGORY' && <CategoryWiseSalesReport timeRange={timeRange} />}
                {activeTab === 'BRAND' && <BrandWiseSalesReport timeRange={timeRange} />}
                {activeTab === 'HOURLY' && <HourlyBillingReport timeRange={timeRange} />}
                {activeTab === 'INVENTORY' && (
                    <div className="flex flex-col items-center justify-center h-64 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
                        <TrendingUp className="w-12 h-12 mb-3 opacity-20" />
                        <p className="font-medium">Inventory Insights arriving soon</p>
                    </div>
                )}
                {activeTab === 'STAFF' && (
                    <div className="flex flex-col items-center justify-center h-64 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
                        <Users className="w-12 h-12 mb-3 opacity-20" />
                        <p className="font-medium">Staff Performance metrics arriving soon</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportsModule;
