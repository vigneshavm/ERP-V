import React from 'react';
import { ChevronLeft, ChevronRight, Calculator, CalendarDays, Wallet, AlertCircle } from 'lucide-react';
import { formatCurrency } from "../../utils/helpers";
import { Employee } from "../../types/hr";

interface LaborStatsProps {
    selectedLaborer: Employee;
    currentMonthName: string;
    onMonthChange: (delta: number) => void;
    stats: {
        days: number;
        full: number;
        half: number;
        quarter: number;
        absent: number;
        earned: number;
        paid: number;
        balance: number;
        totalPaid: number;
    };
}

const LaborStats: React.FC<LaborStatsProps> = ({ selectedLaborer, currentMonthName, onMonthChange, stats }) => {
    return (
        <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                    <h1 className="page-title text-slate-900">{selectedLaborer.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded uppercase tracking-wide">
                            {selectedLaborer.role}
                        </span>
                        <span className="text-sm text-slate-500">
                            Daily Wage: <span className="font-medium text-slate-700">{formatCurrency(selectedLaborer.dailyRate)}</span>
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-200">
                    <button onClick={() => onMonthChange(-1)} className="p-1.5 hover:bg-white hover:text-primary hover:shadow-sm rounded-md text-slate-500 transition-all"><ChevronLeft size={18} /></button>
                    <span className="min-w-[140px] text-center text-sm font-semibold text-slate-800 select-none">{currentMonthName}</span>
                    <button onClick={() => onMonthChange(1)} className="p-1.5 hover:bg-white hover:text-primary hover:shadow-sm rounded-md text-slate-500 transition-all"><ChevronRight size={18} /></button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Work Stats Card */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-primary/30 hover:shadow-sm transition-all group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-primary-soft text-primary rounded-lg group-hover:scale-110 transition-transform">
                            <CalendarDays size={18} />
                        </div>
                        <span className="text-2xl font-bold text-slate-900">{stats.days}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Work Days</p>
                    <div className="flex gap-1">
                        {stats.full > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-success-soft text-success rounded font-bold">F:{stats.full}</span>}
                        {stats.half > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-warning-soft text-warning rounded font-bold">H:{stats.half}</span>}
                        {stats.absent > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-danger-soft text-danger rounded font-bold">A:{stats.absent}</span>}
                    </div>
                </div>

                {/* Month Earnings */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-success-line hover:shadow-sm transition-all group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-success-soft text-success rounded-lg group-hover:scale-110 transition-transform">
                            <Calculator size={18} />
                        </div>
                        <span className="text-2xl font-bold text-slate-900">{formatCurrency(stats.earned)}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Month Earnings</p>
                    <p className="text-[10px] text-slate-400 mt-1">Based on attendance</p>
                </div>

                {/* Total Paid */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-warning-line hover:shadow-sm transition-all group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-warning-soft text-warning rounded-lg group-hover:scale-110 transition-transform">
                            <Wallet size={18} />
                        </div>
                        <span className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalPaid)}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Paid</p>
                    <p className="text-[10px] text-slate-400 mt-1">Lifecycle payments</p>
                </div>

                {/* Net Payable */}
                <div className={`p-4 rounded-xl border transition-all group relative overflow-hidden ${stats.balance < 0
                        ? 'bg-danger/50 border-danger-line'
                        : 'bg-primary/50 border-primary/30'
                    }`}>
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <div className={`p-2 rounded-lg group-hover:scale-110 transition-transform ${stats.balance < 0 ? 'bg-danger-soft text-danger' : 'bg-primary-soft text-primary'
                            }`}>
                            <AlertCircle size={18} />
                        </div>
                        <span className={`text-2xl font-bold ${stats.balance < 0 ? 'text-danger' : 'text-primary'
                            }`}>
                            {formatCurrency(Math.abs(stats.balance))}
                        </span>
                    </div>
                    <p className={`text-xs font-bold uppercase tracking-wide relative z-10 ${stats.balance < 0 ? 'text-danger' : 'text-primary'
                        }`}>
                        {stats.balance < 0 ? 'Due Payment' : 'Credit Balance'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 relative z-10">Net Payable</p>
                </div>
            </div>
        </div>
    );
};

export default LaborStats;
