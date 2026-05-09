import React from 'react';
import { Activity, Clock, ShieldCheck, DollarSign } from 'lucide-react';
import cashDrawerIntelligenceData from '../../mockData/cashDrawerIntelligenceData.json';

const IconMap: Record<string, React.ElementType> = {
    Activity, Clock, ShieldCheck, DollarSign
};

const CashDrawerIntelligenceMockUI: React.FC = () => {
    return (
        <div className="p-6 space-y-6 h-full flex flex-col text-main animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
                        Cash Drawer Intelligence
                    </h1>
                    <p className="text-sm text-main/60 mt-1">POS Operations Dashboard</p>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {cashDrawerIntelligenceData.metrics.map((kpi, idx) => {
                    const Icon = IconMap[kpi.icon];
                    return (
                        <div key={idx} className="glass-panel p-5 rounded-xl border border-white/5 flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color}`}>
                                {Icon && <Icon className="w-6 h-6" />}
                            </div>
                            <div>
                                <p className="text-xs text-main/50 uppercase tracking-wider font-semibold">{kpi.title}</p>
                                <p className="text-2xl font-bold mt-1 text-main/90">{kpi.value}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Dashboard Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
                <div className="glass-panel rounded-xl border border-white/5 p-6">
                    <h2 className="text-lg font-semibold mb-4">Live Shift Status</h2>
                    <div className="space-y-4">
                        {cashDrawerIntelligenceData.shifts.map((shift, i) => (
                            <div key={i} className="flex justify-between items-center p-4 bg-black/20 rounded-lg border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                    <div>
                                        <p className="font-medium">{shift.terminal}</p>
                                        <p className="text-xs text-main/50">Cashier: {shift.cashier}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-teal-400">{shift.status}</p>
                                    <p className="text-xs text-main/50">{shift.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="glass-panel rounded-xl border border-white/5 p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 rounded-full border-4 border-dashed border-white/10 flex items-center justify-center mb-4">
                        <DollarSign className="w-8 h-8 text-main/30" />
                    </div>
                    <h2 className="text-lg font-semibold mb-2">Drawer Analytics</h2>
                    <p className="text-sm text-main/60 max-w-sm">Detailed breakdown of cash variances, drops, and payouts will appear here after the end of shift.</p>
                </div>
            </div>
        </div>
    );
};

export default CashDrawerIntelligenceMockUI;
