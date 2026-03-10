import React from 'react';
import { ChevronLeft, ChevronRight, Calculator, CalendarDays, Wallet, AlertCircle } from 'lucide-react';
import { Card } from "../../../components/core/Display/Card";
import { formatCurrency } from "@/shared/lib/utils/helpers";
import { Employee } from "@/entities/people/model/laborSlice";

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-100 pb-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{selectedLaborer.name}</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded uppercase tracking-wide">
                            {selectedLaborer.role}
                        </span>
                        <span className="text-sm text-gray-500">
                            Daily Wage: <span className="font-medium text-gray-700">{formatCurrency(selectedLaborer.dailyRate)}</span>
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
                    <button onClick={() => onMonthChange(-1)} className="p-1.5 hover:bg-white hover:text-indigo-600 hover:shadow-sm rounded-md text-gray-500 transition-all"><ChevronLeft size={18} /></button>
                    <span className="min-w-[140px] text-center text-sm font-semibold text-gray-800 select-none">{currentMonthName}</span>
                    <button onClick={() => onMonthChange(1)} className="p-1.5 hover:bg-white hover:text-indigo-600 hover:shadow-sm rounded-md text-gray-500 transition-all"><ChevronRight size={18} /></button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Work Stats Card */}
                <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-indigo-100 hover:shadow-sm transition-all group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:scale-110 transition-transform">
                            <CalendarDays size={18} />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{stats.days}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Work Days</p>
                    <div className="flex gap-1">
                        {stats.full > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-bold">F:{stats.full}</span>}
                        {stats.half > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-bold">H:{stats.half}</span>}
                        {stats.absent > 0 && <span className="text-[10px] px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded font-bold">A:{stats.absent}</span>}
                    </div>
                </div>

                {/* Month Earnings */}
                <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-emerald-100 hover:shadow-sm transition-all group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-110 transition-transform">
                            <Calculator size={18} />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{formatCurrency(stats.earned)}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Month Earnings</p>
                    <p className="text-[10px] text-gray-400 mt-1">Based on attendance</p>
                </div>

                {/* Total Paid */}
                <div className="p-4 bg-white rounded-xl border border-gray-200 hover:border-amber-100 hover:shadow-sm transition-all group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:scale-110 transition-transform">
                            <Wallet size={18} />
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalPaid)}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Paid</p>
                    <p className="text-[10px] text-gray-400 mt-1">Lifecycle payments</p>
                </div>

                {/* Net Payable */}
                <div className={`p-4 rounded-xl border transition-all group relative overflow-hidden ${stats.balance < 0
                        ? 'bg-rose-50/50 border-rose-100'
                        : 'bg-indigo-50/50 border-indigo-100'
                    }`}>
                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <div className={`p-2 rounded-lg group-hover:scale-110 transition-transform ${stats.balance < 0 ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'
                            }`}>
                            <AlertCircle size={18} />
                        </div>
                        <span className={`text-2xl font-bold ${stats.balance < 0 ? 'text-rose-700' : 'text-indigo-700'
                            }`}>
                            {formatCurrency(Math.abs(stats.balance))}
                        </span>
                    </div>
                    <p className={`text-xs font-bold uppercase tracking-wide relative z-10 ${stats.balance < 0 ? 'text-rose-600' : 'text-indigo-600'
                        }`}>
                        {stats.balance < 0 ? 'Due Payment' : 'Credit Balance'}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1 relative z-10">Net Payable</p>
                </div>
            </div>
        </div>
    );
};

export default LaborStats;
