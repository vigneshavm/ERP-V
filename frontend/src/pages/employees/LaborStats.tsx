import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../../../../src/components/Card';
import { formatCurrency } from '../../../../src/utils/helpers';
import { Employee } from '../../../../src/types/hr';

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
        <Card className="p-4 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                    <h1 className="text-xl font-bold text-slate-800 dark:text-white">{selectedLaborer.name}</h1>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Daily Wage: {formatCurrency(selectedLaborer.dailyRate)}</span>
                </div>

                <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-700 p-0.5 shadow-sm">
                    <button onClick={() => onMonthChange(-1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400"><ChevronLeft size={16} /></button>
                    <span className="min-w-[120px] text-center text-sm font-bold text-slate-700 dark:text-slate-200 select-none">{currentMonthName}</span>
                    <button onClick={() => onMonthChange(1)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400"><ChevronRight size={16} /></button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/50 flex flex-col justify-center min-h-[60px]">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider leading-none mb-0.5">Work Stats</p>
                            <p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none">{stats.days} Days</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 gap-0.5 mt-1.5 w-full">
                        <span title="Full" className="text-center py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded text-[7px] font-bold leading-none">F:{stats.full}</span>
                        <span title="Half" className="text-center py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded text-[7px] font-bold leading-none">H:{stats.half}</span>
                        <span title="Qtr" className="text-center py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded text-[7px] font-bold leading-none">Q:{stats.quarter}</span>
                        <span title="Abs" className="text-center py-0.5 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 rounded text-[7px] font-bold leading-none">A:{stats.absent}</span>
                    </div>
                </div>
                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-900/50 flex flex-col justify-center min-h-[60px]">
                    <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider leading-none mb-0.5">Month Earnings</p>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none">{formatCurrency(stats.earned)}</p>
                </div>
                <div className="p-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-100 dark:border-amber-900/50 flex flex-col justify-center min-h-[60px]">
                    <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider leading-none mb-0.5">Total Paid (All Time)</p>
                    <p className="text-base font-bold text-slate-800 dark:text-slate-100 leading-none">{formatCurrency(stats.totalPaid)}</p>
                </div>
                <div className={`p-1.5 rounded-lg border flex flex-col justify-center min-h-[60px] ${stats.balance < 0 ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50' : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                    <p className={`text-[9px] font-bold uppercase tracking-wider leading-none mb-0.5 ${stats.balance < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}>Net Payable (Due)</p>
                    <p className={`text-base font-bold leading-none ${stats.balance < 0 ? 'text-red-700 dark:text-red-300' : 'text-slate-800 dark:text-slate-100'}`}>
                        {formatCurrency(stats.balance)}
                    </p>
                </div>
            </div>
        </Card>
    );
};

export default LaborStats;
